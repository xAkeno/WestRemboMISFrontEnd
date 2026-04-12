import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Clock, ArrowRight, Play } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Layout } from "../components/Layout";
import { PendingClearancesModal } from "@/components/PendingClearancesModal";
import axios from "axios";
import { startOfWeek, startOfMonth, format } from "date-fns";

const BASE = "http://127.0.0.1:8000/api";

const statuses    = ["All", "Pending", "Released", "Approved", "Rejected"];
const timeFilters = ["week", "month", "year"];

interface PendingRequest {
  type: string;
  count: number;
  icon: any;
  color: string;
}

interface Notification {
  id: number;
  message: string;
  time: string;
  type: "info" | "warning" | "success";
}

const serviceColors: Record<string, string> = {
  "Barangay Clearance":    "#f59e0b",
  "Business Clearance":    "#22c55e",
  "Building Clearance":    "#ef4444",
  "Barangay Certificate":  "#10b981",
  "Resident Registration": "#f97316",
};

const serviceChartColors: Record<string, string> = {
  Business:    serviceColors["Business Clearance"],
  Building:    serviceColors["Building Clearance"],
  Barangay:    serviceColors["Barangay Clearance"],
  Resident:    serviceColors["Resident Registration"],
  Certificate: serviceColors["Barangay Certificate"],
};

const pathMap: Record<string, string> = {
  "Barangay Clearance":    "/document-edit/2",
  "Business Clearance":    "/document-edit/3",
  "Building Clearance":    "/document-edit/4",
  "Barangay Certificate":  "/document-edit/1",
  "Resident Registration": "/document-edit/3",
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [chartData, setChartData]                   = useState<any[]>([]);
  const [timeFilter, setTimeFilter]                 = useState("month");
  const [statusFilter, setStatusFilter]             = useState("All");
  const [fromDate, setFromDate]                     = useState("");
  const [toDate, setToDate]                         = useState("");
  const [tickets, setTickets]                       = useState<any[]>([]);
  const [nowServing, setNowServing]                 = useState<string | null>(null);
  const [notifications, setNotifications]           = useState<Notification[]>([]);
  const [latestActivities, setLatestActivities]     = useState<any[]>([]);
  const [totalEncodedToday, setTotalEncodedToday]   = useState(0);
  const [pendingRequests, setPendingRequests]       = useState<PendingRequest[]>([]);
  const [modalOpen, setModalOpen]                   = useState(false);
  const [selectedClearanceType, setSelectedClearanceType] = useState("");
  const [processingId, setProcessingId]             = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      const params: any = {
        filter_date: timeFilter,
        status:      statusFilter === "All" ? undefined : statusFilter,
        from:        fromDate || undefined,
        to:          toDate   || undefined,
        _:           new Date().getTime(),
      };

      const res  = await axios.get(`${BASE}/dashboard`, { params, withCredentials: true });
      const data = res.data.data;

      // ── Chart ──────────────────────────────────────────────────
      const businessData    = data.business_clearances?.data   || [];
      const buildingData    = data.building_clearances?.data   || [];
      const barangayData    = data.barangay_clearances?.data   || [];
      const residentData    = data.residents?.data             || [];
      const certificateData = data.barangay_certificates?.data || [];

      const periods = Array.from(new Set([
        ...businessData.map((d: any)    => d.period),
        ...buildingData.map((d: any)    => d.period),
        ...barangayData.map((d: any)    => d.period),
        ...residentData.map((d: any)    => d.period),
        ...certificateData.map((d: any) => d.period),
      ])).sort() as string[];

      setChartData(periods.map((period) => ({
        period,
        Business:    businessData.find((d: any)    => d.period === period)?.count || 0,
        Building:    buildingData.find((d: any)    => d.period === period)?.count || 0,
        Barangay:    barangayData.find((d: any)    => d.period === period)?.count || 0,
        Resident:    residentData.find((d: any)    => d.period === period)?.count || 0,
        Certificate: certificateData.find((d: any) => d.period === period)?.count || 0,
      })));

      // ── Tickets ────────────────────────────────────────────────
      setTickets(data.tickets ?? []);
      setNowServing(data.now_serving?.ticket_number ?? null);

      // ── Pending Requests ───────────────────────────────────────
      const counts: Record<string, number> = data.pending_counts ?? {};
      setPendingRequests(Object.entries(counts).map(([type, count]) => ({
        type, count, icon: FileCheck,
        color:
          type === "Barangay Clearance"   ? "bg-[hsl(var(--warning))]"
        : type === "Business Clearance"   ? "bg-[hsl(var(--secondary))]"
        : type === "Building Clearance"   ? "bg-[hsl(var(--primary))]"
        : type === "Barangay Certificate" ? "bg-[hsl(var(--success))]"
        : "bg-[hsl(var(--accent))]",
      })));

      // ── Notifications ──────────────────────────────────────────
      setNotifications((data.notifications ?? []).map((n: any) => ({
        id: n.id, message: n.message, time: n.created_at, type: n.type,
      })));

      // ── Latest Activities ──────────────────────────────────────
      setLatestActivities((data.latest_activities ?? []).map((item: any) => ({
        action:      item.action,
        description: item.description,
        type:        item.type,
        date:        item.created_at ? new Date(item.created_at).toLocaleDateString() : null,
      })));

      console.log("Latest Activities:", data.latest_activities);

      // ── Total Encoded Today ────────────────────────────────────
      setTotalEncodedToday(data.total_released_today ?? 0);

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  useEffect(() => { fetchDashboard(); }, [timeFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    const today      = new Date();
    const defaultTo  = format(today, "yyyy-MM-dd");
    const defaultFrom =
      timeFilter === "week"  ? format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
    : timeFilter === "month" ? format(startOfMonth(today), "yyyy-MM-dd")
    : "";
    setFromDate(defaultFrom);
    setToDate(defaultTo);
  }, [timeFilter]);

  const sortedTickets = [...tickets].sort((a, b) => {
    if (a.status === "Pending" && b.status !== "Pending") return -1;
    if (a.status !== "Pending" && b.status === "Pending") return 1;
    if (a.status === "Encoded" && b.status !== "Encoded") return 1;
    if (a.status !== "Encoded" && b.status === "Encoded") return -1;
    const priorityOrder: any = { High: 1, Normal: 2, Low: 3 };
    const diff = (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    if (diff !== 0) return diff;
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  const handleProcessNow = (ticket: any) => {
    const path = pathMap[ticket.service_type] ?? "/tickets";
    navigate(path, { state: { ticket } });
  };

  return (
    <Layout>
      <PendingClearancesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clearanceType={selectedClearanceType}
        tickets={tickets}
      />

      <div className="space-y-6">

        {/* ── Now Serving Banner ───────────────────────────────────── */}
        {tickets.length > 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="py-6">

              {/* Header row */}
              <div className="flex items-center gap-6 mb-6 flex-wrap">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <Clock className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    Now Serving
                  </p>
                  <p className="text-3xl font-bold text-foreground tracking-tight truncate">
                    {sortedTickets[0]?.ticket_number || nowServing}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {sortedTickets[0]?.service_type}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total in Queue</p>
                    <p className="text-2xl font-bold text-primary">{tickets.length}</p>
                  </div>
                  {/* Process Now button for the first ticket */}
                  <Button
                    size="sm"
                    className="gap-2 bg-primary hover:bg-primary/90 shadow-md"
                    onClick={() => handleProcessNow(sortedTickets[0])}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Process Now
                  </Button>
                </div>
              </div>

              {/* Ticket Queue */}
              <div className="flex overflow-x-auto gap-3 py-2">
                {sortedTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className={`relative flex-shrink-0 w-52 flex flex-col gap-2 p-3 rounded-xl border transition-all group
                      ${index === 0
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border/50 bg-card hover:border-primary/40 hover:shadow-sm"
                      }`}
                  >
                    {/* Top row: number + ticket number + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0
                            ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {ticket.ticket_number}
                        </p>
                      </div>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 h-4 shrink-0 border-0
                          ${ticket.status === "Pending"  ? "bg-yellow-100 text-yellow-800" : ""}
                          ${ticket.status === "Encoded"  ? "bg-blue-100   text-blue-800"   : ""}
                          ${ticket.status === "Released" ? "bg-green-100  text-green-800"  : ""}
                          ${ticket.status === "Rejected" ? "bg-red-100    text-red-800"    : ""}
                        `}
                      >
                        {ticket.status}
                      </Badge>
                    </div>

                    {/* Service type pill */}
                    <span
                      className="text-[10px] text-white font-medium px-2 py-0.5 rounded-md w-fit max-w-full truncate"
                      style={{ backgroundColor: serviceColors[ticket.service_type] || "#9ca3af" }}
                    >
                      {ticket.service_type}
                    </span>

                    {/* Priority + submitted time */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className={`font-semibold
                        ${ticket.priority === "High"   ? "text-red-500"    : ""}
                        ${ticket.priority === "Normal" ? "text-blue-500"   : ""}
                        ${ticket.priority === "Low"    ? "text-green-500"  : ""}
                      `}>
                        {ticket.priority ?? "Normal"}
                      </span>
                      <span>
                        {ticket.submitted_at
                          ? new Date(ticket.submitted_at).toLocaleTimeString("en-PH", {
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>

                    {/* Process Now button — visible on hover, always visible for first */}
                    <button
                      onClick={() => handleProcessNow(ticket)}
                      className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-semibold transition-all
                        ${index === 0
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100"
                        }`}
                    >
                      <ArrowRight className="w-3 h-3" />
                      Process Now
                    </button>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>
        )}

        {/* ── Chart + Side Cards ───────────────────────────────────── */}
        <div className="flex gap-6">

          {/* Chart */}
          <Card className="flex-[0_0_71%] p-2">
            <CardContent className="flex flex-wrap gap-4 items-center mt-5">
              {timeFilters.map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={timeFilter === filter ? "default" : "outline"}
                  onClick={() => {
                    setTimeFilter(filter);
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <span className="text-sm">to</span>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
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
            </CardContent>

            <CardHeader>
              <CardTitle>Application Trend</CardTitle>
              <CardDescription>Application trends over time</CardDescription>
            </CardHeader>

            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Business"    stroke={serviceChartColors.Business}    strokeWidth={2} />
                  <Line type="monotone" dataKey="Building"    stroke={serviceChartColors.Building}    strokeWidth={2} />
                  <Line type="monotone" dataKey="Barangay"    stroke={serviceChartColors.Barangay}    strokeWidth={2} />
                  <Line type="monotone" dataKey="Resident"    stroke={serviceChartColors.Resident}    strokeWidth={2} />
                  <Line type="monotone" dataKey="Certificate" stroke={serviceChartColors.Certificate} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Side Cards */}
          <div className="flex-[0_0_20%] gap-4 flex flex-col">

            {/* Total Released Today */}
            <div className="h-[30%]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Total Released Today</CardTitle>
                  <CardDescription>All records released today</CardDescription>
                </CardHeader>
                <CardContent>
                  {totalEncodedToday > 0 ? (
                    <div className="text-5xl font-bold text-green-700 flex items-center justify-center w-full h-full rounded-lg">
                      {totalEncodedToday}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No records released today.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="h-[70%]">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0 pb-2">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest records and updates</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {latestActivities.map((activity, index) => (
                      <div
                        key={index}
                        className={`flex flex-col gap-0.5 p-2 border rounded-lg hover:bg-muted/50 transition-colors
                          ${activity.type === "status_update" ? "border-l-2 border-l-blue-400"  : ""}
                          ${activity.type === "create"        ? "border-l-2 border-l-green-400" : ""}
                          ${activity.type === "update"        ? "border-l-2 border-l-yellow-400": ""}
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

      </div>
    </Layout>
  );
};

export default Dashboard;