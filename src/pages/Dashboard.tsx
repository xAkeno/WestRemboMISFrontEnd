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
        axios.get("http://127.0.0.1:8000/api/chart/business-clearances", { params, withCredentials: true }),
        axios.get("http://127.0.0.1:8000/api/chart/building-clearances", { params, withCredentials: true }),
        axios.get("http://127.0.0.1:8000/api/chart/barangay-clearances", { params, withCredentials: true }),
        axios.get("http://127.0.0.1:8000/api/chart/residents", { params, withCredentials: true }),
        axios.get("http://127.0.0.1:8000/api/chart/barangay-certificates", { params, withCredentials: true }),
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

const fetchPendingRequests = async () => {
  try {
    const params: any = {
      service_type: pendingTypeFilter !== "All" ? pendingTypeFilter : undefined,
      from: pendingDateFrom || undefined,
      to: pendingDateTo || undefined,
      page: 1,
      per_page: 100, // get more if needed
    };

    const res = await axios.get("http://127.0.0.1:8000/api/tickets/pending", {
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
    const nowServingRes = await axios.get("http://127.0.0.1:8000/api/tickets/now-serving", { withCredentials: true });
    setNowServing(nowServingRes.data.ticket_number || null);

    // Notifications
    const notifRes = await axios.get("http://127.0.0.1:8000/api/notifications", { withCredentials: true });
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
                  {tickets.map((ticket, index) => {
                    console.log("Rendering ticket:", tickets);
                    let path = "";
                    switch (ticket.service_type) {
                      case "Barangay Clearance":
                        path = `/clearancehome/clearance`;
                        break;
                      case "Business Clearance":
                        path = `/clearancehome/bussinessclearance`;
                        break;
                      case "Building Clearance":
                        path = `/clearancehome/buildingclearance`;
                        break;
                      case "Barangay Certificate":
                        path = `/certificatehome/certificate`;
                        break;
                      case "Resident Registration":
                        path = `/residenthome`;
                        break;
                      default:
                        path = `/tickets`;
                    }

                    return (
                      <Link
                        key={ticket.id}
                        to={path}
                        state={{ ticket }}
                        className={`flex-1 min-w-[180px] sm:min-w-[200px] md:min-w-[220px] flex items-center gap-3 px-4 py-2 rounded-lg border border-border/50 transition-colors
                          ${index === 0 ? "bg-primary/20 font-semibold" : "bg-card hover:bg-muted/50"}`}
                      >
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-sm">
                          {index + 1}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm text-foreground truncate">{ticket.ticket_number}</p>
                          <p className="text-xs text-muted-foreground truncate">{ticket.service_type}</p>
                        </div>
                        <Badge
                          variant={ticket.status === "Pending" ? "secondary" : "outline"}
                          className="text-xs shrink-0"
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
                <CardTitle>Certificates Trend</CardTitle>
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
                    <Line type="monotone" dataKey="Business" stroke="hsl(var(--secondary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Building" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Barangay" stroke="hsl(var(--warning))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Resident" stroke="hsl(var(--destructive))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Certificate" stroke="hsl(var(--success))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Actions - 20% */}
            <Card className="flex-[0_0_20%]">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/residents/new">
                  <Button className="w-full justify-start" variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    New Resident
                  </Button>
                </Link>
                <Link to="/residents">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    View Residents
                  </Button>
                </Link>
                <Link to="/clearances">
                  <Button className="w-full justify-start" variant="outline">
                    <FileCheck className="mr-2 h-4 w-4" />
                    Issue Clearance
                  </Button>
                </Link>
                <Link to="/certifications">
                  <Button className="w-full justify-start" variant="outline">
                    <Award className="mr-2 h-4 w-4" />
                    Issue Certificate
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>



        {/* Chart Filters & Line Chart */}
        

        {/* Recent Activity */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest records and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="flex justify-between items-center p-2 border rounded">
                  <p className="text-sm">{notif.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(notif.time).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </Layout>
  );
};

export default Dashboard;
