import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, ArrowRight, Play, Search, Sun, Cloud } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Layout } from "../components/Layout";
import axios from "axios";
import { startOfWeek, startOfMonth, format } from "date-fns";

const BASE = "http://127.0.0.1:8000/api";

const statuses    = ["All", "Pending", "Released", "Approved", "Rejected"];
const timeFilters = ["week", "month", "year"];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const toTitleCase = (value: string) => {
  if (!value) return "";
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const serviceColors: Record<string, string> = {
  "Barangay Clearance":    "#f59e0b",
  "Business Clearance":    "#22c55e",
  "Building Clearance":    "#ef4444",
  "Barangay Certificate":  "#10b981",
};

const serviceChartColors: Record<string, string> = {
  Business:    serviceColors["Business Clearance"],
  Building:    serviceColors["Building Clearance"],
  Barangay:    serviceColors["Barangay Clearance"],
  Certificate: serviceColors["Barangay Certificate"],
};

/**
 * Parse "HH:MM:SS" or "HH:MM" string → hour integer, or null.
 */
const parseHour = (timeStr?: string | null): number | null => {
  if (!timeStr) return null;
  const h = parseInt(timeStr.split(":")[0], 10);
  return isNaN(h) ? null : h;
};

/**
 * 0 = Morning  (07:00 – 11:59)
 * 1 = Afternoon (12:00+)
 * 2 = Unknown / no schedule
 */
const getTimeSlot = (hour: number | null): 0 | 1 | 2 => {
  if (hour === null) return 2;
  if (hour >= 7 && hour < 12) return 0;
  return 1;
};

/** "08:00:00" → "8:00 AM" */
const formatTime = (timeStr?: string | null): string => {
  if (!timeStr) return "—";
  const [hStr, mStr = "00"] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${ampm}`;
};

/** ISO → "Apr 22, 2026" */
const formatDate = (iso?: string | null): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch {
    return iso;
  }
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClearanceRecord {
  id:            number;
  docNumber:     string;
  firstName:     string;
  middleName?:   string | null;
  surname:       string;
  status:        string;
  zone?:         string;
  street?:       string;
  /** ISO datetime – when the record was created/submitted */
  createdAt?:    string;
  /** "HH:MM:SS" – from schedule_time field on the clearance record itself */
  scheduleTime?: string | null;
  /** "YYYY-MM-DD" – from schedule_date field on the clearance record itself */
  scheduleDate?: string | null;
  serviceType:   string;
  raw:           any;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  const [chartData,          setChartData]          = useState<any[]>([]);
  const [timeFilter,         setTimeFilter]          = useState("month");
  const [statusFilter,       setStatusFilter]        = useState("All");
  const [fromDate,           setFromDate]            = useState("");
  const [toDate,             setToDate]              = useState("");
  const [allRecords,         setAllRecords]          = useState<ClearanceRecord[]>([]);
  const [latestActivities,   setLatestActivities]    = useState<any[]>([]);
  const [totalReleasedToday, setTotalReleasedToday]  = useState(0);

  const [queueSearch,        setQueueSearch]         = useState("");
  const [queueTypeFilter,    setQueueTypeFilter]     = useState("All");

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchDashboard = async () => {
    try {
      const params: any = {
        filter_date: timeFilter,
        status:      statusFilter === "All" ? undefined : statusFilter,
        from:        fromDate || undefined,
        to:          toDate   || undefined,
        _:           Date.now(),
      };

      const res  = await axios.get(`${BASE}/dashboard`, { params, withCredentials: true });
      const data = res.data.data;

      // ── Chart ──────────────────────────────────────────────────────────────
      const businessData    = data.business_clearances?.data   || [];
      const buildingData    = data.building_clearances?.data   || [];
      const barangayData    = data.barangay_clearances?.data   || [];
      const certificateData = data.barangay_certificates?.data || [];

      const periods = Array.from(new Set([
        ...businessData.map((d: any)    => d.period),
        ...buildingData.map((d: any)    => d.period),
        ...barangayData.map((d: any)    => d.period),
        ...certificateData.map((d: any) => d.period),
      ])).sort() as string[];

      setChartData(periods.map((period) => ({
        period,
        Business:    businessData.find((d: any)    => d.period === period)?.count || 0,
        Building:    buildingData.find((d: any)    => d.period === period)?.count || 0,
        Barangay:    barangayData.find((d: any)    => d.period === period)?.count || 0,
        Certificate: certificateData.find((d: any) => d.period === period)?.count || 0,
      })));

      // ── Merge clearance lists using schedule_time + created_at directly ────
      const merged: ClearanceRecord[] = [];

      const push = (r: any, serviceType: string, docNumber: string) =>
        merged.push({
          id:           r.id,
          docNumber,
          firstName:    r.first_name  ?? "",
          middleName:   r.middle_name ?? null,
          surname:      r.surname     ?? "",
          status:       r.status      ?? "",
          zone:         r.zone        ?? null,
          street:       r.street      ?? null,
          createdAt:    r.created_at  ?? null,   // ISO – submission date
          scheduleTime: r.schedule_time ?? null,  // "HH:MM:SS"
          scheduleDate: r.schedule_date ?? null,  // "YYYY-MM-DD"
          serviceType,
          raw: r,
        });

      (data.barangay_clearances_list   ?? []).forEach((r: any) => push(r, "Barangay Clearance",    r.bcert_number));
      (data.business_clearances_list   ?? []).forEach((r: any) => push(r, "Business Clearance",    r.brgy_business_no));
      (data.building_clearances_list   ?? []).forEach((r: any) => push(r, "Building Clearance",    r.bcert_number));
      (data.barangay_certificates_list ?? []).forEach((r: any) => push(r, "Barangay Certificate",  r.bcert_number));

      // ── Sort: Morning (slot 0) first, then Afternoon (slot 1), then Unknown.
      //          Within each slot, sort by schedule_time ascending.
      merged.sort((a, b) => {
        const slotA = getTimeSlot(parseHour(a.scheduleTime));
        const slotB = getTimeSlot(parseHour(b.scheduleTime));
        if (slotA !== slotB) return slotA - slotB;
        const tA = a.scheduleTime ?? "99:99:99";
        const tB = b.scheduleTime ?? "99:99:99";
        return tA.localeCompare(tB);
      });

      setAllRecords(merged);

      setLatestActivities((data.latest_activities ?? []).map((item: any) => ({
        action:      item.action,
        description: item.description,
        type:        item.type,
        date:        item.created_at ? new Date(item.created_at).toLocaleDateString() : null,
      })));

      setTotalReleasedToday(data.total_released_today ?? 0);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  useEffect(() => { fetchDashboard(); }, [timeFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    const today       = new Date();
    const defaultTo   = format(today, "yyyy-MM-dd");
    const defaultFrom =
      timeFilter === "week"  ? format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
    : timeFilter === "month" ? format(startOfMonth(today), "yyyy-MM-dd")
    : "";
    setFromDate(defaultFrom);
    setToDate(defaultTo);
  }, [timeFilter]);

  // ── Filtered queue ────────────────────────────────────────────────────────

  const filteredRecords = useMemo(() => {
    const q = queueSearch.toLowerCase().trim();
    return allRecords.filter((r) => {
      const matchType   = queueTypeFilter === "All" || r.serviceType === queueTypeFilter;
      const fullName    = `${r.firstName} ${r.middleName ?? ""} ${r.surname}`.toLowerCase();
      const matchSearch =
        !q ||
        fullName.includes(q) ||
        r.docNumber.toLowerCase().includes(q) ||
        (r.zone?.toLowerCase().includes(q)   ?? false) ||
        (r.street?.toLowerCase().includes(q) ?? false);
      return matchType && matchSearch;
    });
  }, [allRecords, queueSearch, queueTypeFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleProcessNow = (record: ClearanceRecord) =>
    navigate("/clearancehome/clearance", {
      state: { record: record.raw, serviceType: record.serviceType },
    });

  const statusClass = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PENDING")  return "bg-yellow-100 text-yellow-800";
    if (s === "RELEASED") return "bg-green-100  text-green-800";
    if (s === "ENCODED")  return "bg-blue-100   text-blue-800";
    if (s === "REJECTED") return "bg-red-100    text-red-800";
    return "bg-gray-100 text-gray-700";
  };

  const nowHour   = new Date().getHours();
  const isMorning = nowHour >= 7 && nowHour < 12;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="space-y-4">

        {/* ── Queue Card ────────────────────────────────────────────────────── */}
        {allRecords.length > 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="py-4 px-5">

              {/* Header */}
              <div className="flex items-center gap-4 mb-3 flex-wrap">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      Now Serving
                    </p>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                      ${isMorning ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}
                    >
                      {isMorning ? <Sun className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
                      {isMorning ? "Morning Queue" : "Afternoon Queue"}
                    </span>
                  </div>
                  {filteredRecords[0] && (
                    <>
                      <p className="text-2xl font-bold text-foreground tracking-tight truncate">
                        {filteredRecords[0].docNumber}
                      </p>
                      <p className="text-xs text-muted-foreground truncate font-medium">
                        {filteredRecords[0].firstName}{" "}
                        {filteredRecords[0].middleName ? filteredRecords[0].middleName + " " : ""}
                        {filteredRecords[0].surname}
                        {" · "}
                        <span style={{ color: serviceColors[filteredRecords[0].serviceType] }}>
                          {filteredRecords[0].serviceType}
                        </span>
                        {filteredRecords[0].scheduleTime && (
                          <> · Sched: <strong>{formatTime(filteredRecords[0].scheduleTime)}</strong></>
                        )}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total in Queue</p>
                    <p className="text-xl font-bold text-primary">{filteredRecords.length}</p>
                  </div>
                  {filteredRecords[0] && (
                    <Button
                      size="sm"
                      className="gap-2 bg-primary hover:bg-primary/90 shadow-md"
                      onClick={() => handleProcessNow(filteredRecords[0])}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Process Now
                    </Button>
                  )}
                </div>
              </div>

              {/* Search + Type Filters */}
              <div className="flex flex-wrap gap-2 items-center mb-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8 h-8 text-xs"
                    placeholder="Search by name, number, zone…"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                  />
                </div>
                {["All", ...Object.keys(serviceColors)].map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={queueTypeFilter === type ? "default" : "outline"}
                    className="h-8 text-xs px-3"
                    onClick={() => setQueueTypeFilter(type)}
                  >
                    {type === "All"
                      ? "All"
                      : type
                          .replace("Barangay Clearance",    "Barangay")
                          .replace("Business Clearance",    "Business")
                          .replace("Building Clearance",    "Building")
                          .replace("Barangay Certificate",  "Certificate")
                          }
                  </Button>
                ))}
              </div>

              {/* Scrollable record cards */}
              <div className="flex overflow-x-auto gap-3 py-1">
                {filteredRecords.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 px-2">No matching records.</p>
                )}

                {filteredRecords.map((record, index) => {
                  const hour = parseHour(record.scheduleTime);
                  const slot = getTimeSlot(hour);

                  return (
                    <div
                      key={`${record.serviceType}-${record.id}`}
                      className={`relative flex-shrink-0 w-52 flex flex-col gap-1.5 p-2.5 rounded-xl border transition-all group
                        ${index === 0
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border/50 bg-card hover:border-primary/40 hover:shadow-sm"
                        }`}
                    >
                      {/* Doc number + status */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold flex-shrink-0
                            ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {index + 1}
                          </span>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {record.docNumber}
                          </p>
                        </div>
                        <Badge className={`text-[9px] px-1.5 py-0 h-4 shrink-0 border-0 ${statusClass(record.status)}`}>
                          {toTitleCase(record.status)}
                        </Badge>
                      </div>

                      {/* Full name of requester */}
                      <p className="text-[11px] font-semibold text-foreground truncate leading-tight">
                        {record.firstName}{" "}
                        {record.middleName ? record.middleName + " " : ""}
                        {record.surname}
                      </p>

                      {/* Service type pill */}
                      <span
                        className="text-[9px] text-white font-medium px-2 py-0.5 rounded-md w-fit max-w-full truncate"
                        style={{ backgroundColor: serviceColors[record.serviceType] || "#9ca3af" }}
                      >
                        {record.serviceType}
                      </span>

                      {/* Morning / Afternoon + scheduled time */}
                      <div className="flex items-center gap-1 text-[9px]">
                        {slot === 0
                          ? <Sun   className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          : <Cloud className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                        <span className={`font-semibold ${slot === 0 ? "text-amber-600" : slot === 1 ? "text-indigo-500" : "text-muted-foreground"}`}>
                          {slot === 0 ? "Morning" : slot === 1 ? "Afternoon" : "No schedule"}
                        </span>
                        {record.scheduleTime && (
                          <span className="ml-auto text-muted-foreground font-medium">
                            {formatTime(record.scheduleTime)}
                          </span>
                        )}
                      </div>

                      {/* Submitted date + schedule date */}
                      <div className="flex flex-col gap-0.5 text-[9px] text-muted-foreground">
                        <span>Submitted: <span className="font-medium text-foreground">{formatDate(record.createdAt)}</span></span>
                        {record.scheduleDate && (
                          <span>Sched date: <span className="font-medium text-foreground">{formatDate(record.scheduleDate)}</span></span>
                        )}
                      </div>

                      {/* Process Now */}
                      <button
                        onClick={() => handleProcessNow(record)}
                        className={`flex items-center justify-center gap-1 w-full py-1 rounded-lg text-[10px] font-semibold transition-all
                          ${index === 0
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100"
                          }`}
                      >
                        <ArrowRight className="w-3 h-3" />
                        Process Now
                      </button>
                    </div>
                  );
                })}
              </div>

            </CardContent>
          </Card>
        )}

        {/* ── Chart + Side Cards ────────────────────────────────────────────── */}
        <div className="flex gap-4 w-full items-start">

          <Card className="flex-1 min-w-0">
            <CardHeader className="pb-2">
              <div>
                <CardTitle>Application Trend</CardTitle>
                <CardDescription>Application trends over time</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 items-center pt-2">
                {timeFilters.map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={timeFilter === filter ? "default" : "outline"}
                    onClick={() => { setTimeFilter(filter); setFromDate(""); setToDate(""); }}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-xs"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-xs"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                {statuses.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
                <Button size="sm" variant="default" onClick={fetchDashboard}>
                  Submit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={460}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="Business"    stroke={serviceChartColors.Business}    strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Building"    stroke={serviceChartColors.Building}    strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Barangay"    stroke={serviceChartColors.Barangay}    strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Certificate" stroke={serviceChartColors.Certificate} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Released Today</CardTitle>
                <CardDescription>All records released today</CardDescription>
              </CardHeader>
              <CardContent>
                {totalReleasedToday > 0 ? (
                  <div className="text-5xl font-bold text-green-600 flex items-center justify-center py-2">
                    {totalReleasedToday}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No records released today.</p>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col" style={{ maxHeight: "420px" }}>
              <CardHeader className="flex-shrink-0 pb-2">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest records and updates</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pr-1 pb-3">
                <div className="space-y-1.5">
                  {latestActivities.map((activity, index) => (
                    <div
                      key={index}
                      className={`flex flex-col gap-0.5 p-2 border rounded-lg hover:bg-muted/50 transition-colors
                        ${activity.type === "status_update" ? "border-l-2 border-l-blue-400"   : ""}
                        ${activity.type === "create"        ? "border-l-2 border-l-green-400"  : ""}
                        ${activity.type === "update"        ? "border-l-2 border-l-yellow-400" : ""}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground leading-tight">
                          {activity.action}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex-shrink-0">
                          {activity.date}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight truncate">
                        {activity.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;