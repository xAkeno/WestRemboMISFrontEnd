import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Layout } from "../components/Layout";
import axios from "axios";
import { startOfWeek, startOfMonth, format } from "date-fns";

const BASE = "https://westrembomis.onrender.com/api";

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
  createdAt?:    string;
  scheduleTime?: string | null;
  scheduleDate?: string | null;
  serviceType:   string;
  raw:           any;
}

interface RecordCounts {
  [key: string]: {
    total: number;
    released: number;
    incomplete: number;
    rejected: number;
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  const [chartData,          setChartData]          = useState<any[]>([]);
  const [recordsCounts,      setRecordsCounts]      = useState<RecordCounts>({});
  const [timeFilter,         setTimeFilter]         = useState("month");
  const [statusFilter,       setStatusFilter]       = useState("All");
  const [fromDate,           setFromDate]           = useState("");
  const [toDate,             setToDate]             = useState("");
  const [allRecords,         setAllRecords]         = useState<ClearanceRecord[]>([]);
  const [latestActivities,   setLatestActivities]   = useState<any[]>([]);
  const [isLoading,          setIsLoading]          = useState(true);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchDashboard = async () => {
    setIsLoading(true);
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

      // ── Record Counts ──────────────────────────────────────────────────────
      setRecordsCounts(data.records_counts || {});

      // ── Activities ─────────────────────────────────────────────────────────
      setLatestActivities((data.latest_activities ?? []).map((item: any) => ({
        action:      item.action,
        description: item.description,
        type:        item.type,
        date:        item.created_at ? new Date(item.created_at).toLocaleDateString() : null,
      })));

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
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

  // ── Prepare Records Count Chart Data ────────────────────────────────────────
  const recordsCountChartData = useMemo(() => {
    return Object.entries(recordsCounts).map(([service, counts]) => ({
      service: service
        .replace("Barangay Clearance",    "Barangay")
        .replace("Business Clearance",    "Business")
        .replace("Building Clearance",    "Building")
        .replace("Barangay Certificate",  "Certificate"),
      total: counts.total,
      released: counts.released,
      incomplete: counts.incomplete,
      rejected: counts.rejected,
    }));
  }, [recordsCounts]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── Record Count Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(recordsCounts).map(([service, counts]) => {
            const color = serviceColors[service] || "#9ca3af";
            const shortName = service
              .replace("Barangay Clearance",    "Barangay")
              .replace("Business Clearance",    "Business")
              .replace("Building Clearance",    "Building")
              .replace("Barangay Certificate",  "Certificate");

            return (
              <Card key={service} className="border-l-4" style={{ borderLeftColor: color }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {shortName}
                  </CardTitle>
                  <CardDescription className="text-xs">Record Summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Records</p>
                    <p className="text-3xl font-bold" style={{ color }}>
                      {counts.total}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Released</p>
                      <p className="text-lg font-bold text-green-600">{counts.released}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Incomplete</p>
                      <p className="text-lg font-bold text-yellow-600">{counts.incomplete}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Rejected</p>
                      <p className="text-lg font-bold text-red-600">{counts.rejected}</p>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="space-y-1.5 pt-2 border-t text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Released:</span>
                      <span className="font-semibold">{counts.released} ({counts.total > 0 ? Math.round((counts.released / counts.total) * 100) : 0}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Incomplete:</span>
                      <span className="font-semibold">{counts.incomplete} ({counts.total > 0 ? Math.round((counts.incomplete / counts.total) * 100) : 0}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rejected:</span>
                      <span className="font-semibold">{counts.rejected} ({counts.total > 0 ? Math.round((counts.rejected / counts.total) * 100) : 0}%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Application Trend Chart + Status Breakdown ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">

          <Card className="lg:col-span-2">
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
              <ResponsiveContainer width="100%" height={360}>
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

          {/* Status Breakdown Bar Chart */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status Breakdown</CardTitle>
              <CardDescription>Released vs Incomplete vs Rejected</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={recordsCountChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="service" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="released" name="Released" fill="#22c55e" />
                  <Bar dataKey="incomplete" name="Incomplete" fill="#f59e0b" />
                  <Bar dataKey="rejected" name="Rejected" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* ── Recent Activity Card ────────────────────────────────────────────── */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0 pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest records and updates</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-1 pb-3" style={{ maxHeight: "400px" }}>
            <div className="space-y-1.5">
              {latestActivities.length > 0 ? (
                latestActivities.map((activity, index) => (
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
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default Dashboard;