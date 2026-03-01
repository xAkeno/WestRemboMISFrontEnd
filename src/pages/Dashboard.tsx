import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, FileCheck, Award, Clock, Bell, ArrowRight, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Layout } from "../components/Layout";
import { PendingClearancesModal } from "@/components/PendingClearancesModal";
import axios from "axios";
import { set } from "date-fns";

const statuses = ["All", "Pending", "Released", "Approved", "Rejected"];
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

const Dashboard = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState("month");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [nowServing, setNowServing] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingTypeFilter, setPendingTypeFilter] = useState<string>("All");
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClearanceType, setSelectedClearanceType] = useState<string>("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [latestActivities, setLatestActivities] = useState([]);
  

  const handleTimeFilter = (filter: string) => {
    setTimeFilter(filter);
    setFromDate("");
    setToDate("");
  };

  const fetchData = async () => {
    try {
      const params: any = {
        filter_date: timeFilter,
        status: statusFilter === "All" ? undefined : statusFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
        _: new Date().getTime(),
      };

      const [businessRes, buildingRes, barangayRes, residentRes, certificateRes] = await Promise.all([
        axios.get("https://westrembomis.onrender.com/api/chart/business-clearances", { params, withCredentials: true }),
        axios.get("https://westrembomis.onrender.com/api/chart/building-clearances", { params, withCredentials: true }),
        axios.get("https://westrembomis.onrender.com/api/chart/barangay-clearances", { params, withCredentials: true }),
        axios.get("https://westrembomis.onrender.com/api/chart/residents", { params, withCredentials: true }),
        axios.get("https://westrembomis.onrender.com/api/chart/barangay-certificates", { params, withCredentials: true }),
      ]);

      const businessData = businessRes.data.data || [];
      const buildingData = buildingRes.data.data || [];
      const barangayData = barangayRes.data.data || [];
      const residentData = residentRes.data.data || [];
      const certificateData = certificateRes.data.data || [];

      const periods = Array.from(
        new Set([
          ...businessData.map((d: any) => d.period),
          ...buildingData.map((d: any) => d.period),
          ...barangayData.map((d: any) => d.period),
          ...residentData.map((d: any) => d.period),
          ...certificateData.map((d: any) => d.period),
        ])
      ).sort();

      const combined = periods.map((period) => ({
        period,
        Business: businessData.find((d: any) => d.period === period)?.count || 0,
        Building: buildingData.find((d: any) => d.period === period)?.count || 0,
        Barangay: barangayData.find((d: any) => d.period === period)?.count || 0,
        Resident: residentData.find((d: any) => d.period === period)?.count || 0,
        Certificate: certificateData.find((d: any) => d.period === period)?.count || 0,
      }));

      setChartData(combined);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  // Sort tickets: Pending first, then others; Encoded goes to the back
  const sortedTickets = [...tickets].sort((a, b) => {
    // Priority: PENDING first
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;

    // Encoded goes to the back
    if (a.status === "ENCODED" && b.status !== "ENCODED") return 1;
    if (a.status !== "ENCODED" && b.status === "ENCODED") return -1;

    // Optional: if both same status, sort by priority field (higher priority first)
    const priorityOrder: any = { "High": 1, "Normal": 2, "Low": 3 };
    const aPriority = priorityOrder[a.priority] || 99;
    const bPriority = priorityOrder[b.priority] || 99;

    if (aPriority < bPriority) return -1;
    if (aPriority > bPriority) return 1;

    // Finally, sort by submitted_at (earlier first)
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  // Unified color map for both Pending Requests and Chart
  const serviceColors: Record<string, string> = {
    "Barangay Clearance": "#f59e0b", // yellow / warning
    "Business Clearance": "#22c55e", // green / secondary
    "Building Clearance": "#ef4444", // red / primary
    "Barangay Certificate": "#10b981", // teal / success
    "Resident Registration": "#f97316", // orange / destructive
  };

  // Map chart keys to these same colors
  const serviceChartColors: Record<string, string> = {
    "Business": serviceColors["Business Clearance"],
    "Building": serviceColors["Building Clearance"],
    "Barangay": serviceColors["Barangay Clearance"],
    "Resident": serviceColors["Resident Registration"],
    "Certificate": serviceColors["Barangay Certificate"],
  };




  const fetchPendingRequests = async () => {
    try {
      const params: any = {
        service_type: pendingTypeFilter !== "All" ? pendingTypeFilter : undefined,
        from: pendingDateFrom || undefined,
        to: pendingDateTo || undefined,
        page: 1,
        per_page: 100, // get more if needed
      };

      const res = await axios.get("https://westrembomis.onrender.com/api/tickets/pending", {
        params,
        withCredentials: true,
      });

      const tickets = res.data.data; // Array of ticket object
      setTickets(res.data.data);

      // Count tickets by service type
      const counts: { [key: string]: number } = {};
      tickets.forEach((ticket: any) => {
        counts[ticket.service_type] = (counts[ticket.service_type] || 0) + 1;
      });

      // Map to PendingRequest[]
      const pendingData: PendingRequest[] = Object.keys(counts).map((type) => ({
        type,
        count: counts[type],
        icon: FileCheck,
        color:
          type === "Barangay Clearance"
            ? "bg-[hsl(var(--warning))]"
            : type === "Business Clearance"
            ? "bg-[hsl(var(--secondary))]"
            : type === "Building Clearance"
            ? "bg-[hsl(var(--primary))]"
            : type === "Barangay Certificate"
            ? "bg-[hsl(var(--success))]"
            : "bg-[hsl(var(--accent))]",
      }));

      setPendingRequests(pendingData);

      // Now Serving
      const nowServingRes = await axios.get("https://westrembomis.onrender.com/api/tickets/now-serving", { withCredentials: true });
      setNowServing(nowServingRes.data.ticket_number || null);

      // Notifications
      const notifRes = await axios.get("https://westrembomis.onrender.com/api/notifications", { withCredentials: true });
      const backendNotifications: Notification[] = notifRes.data.data.map((n: any) => ({
        id: n.id,
        message: n.message,
        time: n.created_at,
        type: n.type,
      }));
      setNotifications(backendNotifications);
    } catch (error) {
      console.error("Failed to fetch pending requests or now-serving", error);
    }
  };


  const handleProcessNow = (clearanceType?: string) => {
    if (clearanceType) {
      setSelectedClearanceType(clearanceType);
      setModalOpen(true);
    } else if (nowServing) {
      console.log("Processing request:", nowServing);
      // Optional: call backend to update ticket status
    }
  };

  useEffect(() => {
    fetchData();
    fetchPendingRequests();
  }, [timeFilter, statusFilter, fromDate, toDate, pendingTypeFilter, pendingDateFrom, pendingDateTo]);

  const [totalEncodedToday, setTotalEncodedToday] = useState(0);

  const fetchActivities = async () => {
    try {
      const res = await axios.get("https://westrembomis.onrender.com/api/latest-activities", { withCredentials: true });
      const data = res.data.data;
      const simplified = data.map(item => ({
        name: `${item.first_name || ''} ${item.middle_name || ''} ${item.surname || ''}`.trim(),
        bcert_number: item.bcert_number || null,
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : null
      }));

      const today = new Date().toLocaleDateString();
      const todayActivities = simplified.filter(item => item.date === today);
      setTotalEncodedToday(todayActivities.length);

      setLatestActivities(simplified);
      console.log("Fetched recent activities:", res);
    } catch (error) {
      console.error("Failed to fetch recent activities", error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredPendingRequests = pendingRequests.filter(req => {
    if (pendingTypeFilter !== "All" && req.type !== pendingTypeFilter) return false;
    return true;
  });

  return (
    <Layout>
      
      <PendingClearancesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clearanceType={selectedClearanceType}
        tickets={tickets} // <-- pass the fetched tickets here
      />

      <div className="space-y-6 " >
        {/* Header */}
        {/* <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Staff Management Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Clock className="w-3 h-3 mr-1" />
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div> */}
        <div  style={{ width: `${window.innerWidth - 300}px` }}>
          {/* Now Serving Banner */}
          {tickets.length > 0 && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg rounded-2xl  overflow-hidden">
              <CardContent className="py-6">
                {/* Now Serving */}
                <div className="flex items-center gap-6 mb-6 flex-wrap">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <Clock className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                      Now Serving
                    </p>
                    <p className="text-3xl font-bold text-foreground tracking-tight truncate">
                      {tickets[0]?.ticket_number || nowServing}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {tickets[0]?.service_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total in Queue</p>
                    <p className="text-2xl font-bold text-primary">{tickets.length}</p>
                  </div>
                </div>

                {/* Horizontal Ticket Queue (Full Width, Wrap) */}
                <div className="flex overflow-x-auto gap-4 py-2">
                  {sortedTickets.map((ticket, index) => {
                    let path = "";
                    switch (ticket.service_type) {
                      case "Barangay Clearance":
                        path = `/document-edit/2`;
                        break;
                      case "Business Clearance":
                        path = `/document-edit/3`;
                        break;
                      case "Building Clearance":
                        path = `/document-edit/4`;
                        break;
                      case "Barangay Certificate":
                        path = `/document-edit/1`;
                        break;
                      case "Resident Registration":
                        path = `/document-edit/3`;
                        break;
                      default:
                        path = `/tickets`;
                    }

                    return (
                      <Link
                        key={ticket.id}
                        to={path}
                        state={{ ticket }}
                        className={`flex w-full justify-between px-2   flex items-center gap-3  py-2 rounded-lg border border-border/50 transition-colors 
                          ${index === 0 ? "bg-primary/20 font-semibold" : "bg-card hover:bg-muted/50"}`}
                      >
                        <div className="flex gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-sm">
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm text-foreground truncate">{ticket.ticket_number}</p>
                            <p
                              className="text-xs text-white truncate px-1 rounded-md"
                              style={{ backgroundColor: serviceColors[ticket.service_type] || "#9ca3af" }} // fallback gray-400
                            >
                              {ticket.service_type}
                            </p>

                          </div>
                        </div>
                        <Badge
                          className={`
                              text-xs shrink-0 
                              ${ticket.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : ""}
                              ${ticket.status === "ENCODED" ? "bg-blue-100 text-blue-800" : ""}
                              ${ticket.status === "RELEASED" ? "bg-green-100 text-green-800" : ""}
                              ${ticket.status === "REJECTED" ? "bg-red-100 text-red-800" : ""}
                            `}
                        >
                          {ticket.status}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>





        

        {/* Pending Requests */}
        {/* <Card className="border-warning">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  Pending Requests
                  <Badge variant="destructive" className="ml-2">
                    {filteredPendingRequests.reduce((acc, req) => acc + req.count, 0)} Total
                  </Badge>
                </CardTitle>
                <CardDescription>Applications requiring staff processing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-wrap gap-2 flex-1">
                <Button size="sm" variant={pendingTypeFilter === "All" ? "default" : "outline"} onClick={() => setPendingTypeFilter("All")}>
                  All Types
                </Button>
                {pendingRequests.map((req) => (
                  <Button key={req.type} size="sm" variant={pendingTypeFilter === req.type ? "default" : "outline"} onClick={() => setPendingTypeFilter(req.type)}>
                    {req.type}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="date" className="border rounded px-2 py-1 text-sm" value={pendingDateFrom} onChange={(e) => setPendingDateFrom(e.target.value)} />
                <span className="text-sm text-muted-foreground">to</span>
                <input type="date" className="border rounded px-2 py-1 text-sm" value={pendingDateTo} onChange={(e) => setPendingDateTo(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPendingRequests.map((request) => {
                const Icon = request.icon;
                return (
                  <Card key={request.type} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg ${request.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <Badge variant="secondary" className="text-lg font-bold">{request.count}</Badge>
                      </div>
                      <p className="font-medium text-sm mb-2">{request.type}</p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleProcessNow(request.type)}>
                        <Clock className="w-3 h-3 mr-1" />
                        Process Now
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card> */}


          <div className="flex gap-6">
            {/* Chart - 80% */}
            <Card className="flex-[0_0_78.5%] p-2">
              {/* Chart Filters */}
              <CardContent className="flex flex-wrap gap-4 items-center mt-5">
                {timeFilters.map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={timeFilter === filter ? "default" : "outline"}
                    onClick={() => handleTimeFilter(filter)}
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
              </CardContent>

              {/* Chart Header */}
              <CardHeader>
                <CardTitle>Application Trend</CardTitle>
                <CardDescription>Application trends over time</CardDescription>
              </CardHeader>

              {/* Line Chart */}
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
                      <Line type="monotone" dataKey="Business" stroke={serviceChartColors.Business} strokeWidth={2} />
                      <Line type="monotone" dataKey="Building" stroke={serviceChartColors.Building} strokeWidth={2} />
                      <Line type="monotone" dataKey="Barangay" stroke={serviceChartColors.Barangay} strokeWidth={2} />
                      <Line type="monotone" dataKey="Resident" stroke={serviceChartColors.Resident} strokeWidth={2} />
                      <Line type="monotone" dataKey="Certificate" stroke={serviceChartColors.Certificate} strokeWidth={2} />

                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Actions - 20% */}
            <div className="flex-[0_0_20%] gap-4 flex flex-col">
              <div className="h-[30%]">
                {/* Recent Activity */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>My Total Encoded Today</CardTitle>
                    <CardDescription>All records encoded by you Today</CardDescription>
                  </CardHeader>
                    <CardContent>
                    <div className="space-y-2">
                      {totalEncodedToday > 0 ? (   
                        <div className="text-5xl font-bold text-blue-800 flex items-center justify-center w-full h-full rounded-lg">
                            {totalEncodedToday}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No records encoded today.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="h-[70%]">
                {/* Recent Activity */}
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest records and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {latestActivities.slice(0, 5).map((activity, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 border rounded hover:bg-muted/50 transition-colors rounded-lg"
                        >
                          <p className="text-sm font-medium">
                            {activity.bcert_number}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>



        {/* Chart Filters & Line Chart */}
        

      
      </div>
    </Layout>
  );
};

export default Dashboard;
