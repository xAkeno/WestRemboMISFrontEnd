import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Users, FileCheck, Award } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Layout } from "../components/Layout";
import axios from "axios";

const statuses = ["All", "Pending", "Released", "Approved", "Rejected"];
const timeFilters = ["week", "month", "year"];

const Dashboard = () => {
  const [chartData, setChartData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("month");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch dashboard chart data
const fetchData = async () => {
  try {
    const params: any = {
      filter: timeFilter,
      status: statusFilter === "All" ? undefined : statusFilter,
      from: fromDate || undefined,
      to: toDate || undefined,
      _: new Date().getTime(), // <-- cache buster
    };

    const [businessRes, buildingRes, barangayRes, residentRes, certificateRes] = await Promise.all([
      axios.get("http://127.0.0.1:8000/api/chart/business-clearances", { params, withCredentials: true }),
      axios.get("http://127.0.0.1:8000/api/chart/building-clearances", { params, withCredentials: true }),
      axios.get("http://127.0.0.1:8000/api/chart/barangay-clearances", { params, withCredentials: true }),
      axios.get("http://127.0.0.1:8000/api/chart/residents", { params, withCredentials: true }),
      axios.get("http://127.0.0.1:8000/api/chart/barangay-certificates", { params, withCredentials: true }),
    ]);

    const businessData = businessRes.data.data || [];
    const buildingData = buildingRes.data.data|| [];
    const barangayData = barangayRes.data.data || [];
    const residentData = residentRes.data.data || [];
    const certificateData = certificateRes.data.data || [];

    console.log("Business Data:", businessData);
    console.log("Building Data:", buildingData);
    console.log("Barangay Data:", barangayData);
    console.log("Resident Data:", residentData);
    console.log("Certificate Data:", certificateData);

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

    console.log("Combined Chart Data:", combined);

    setChartData(combined);
  } catch (error) {
    console.error("Failed to fetch dashboard data", error);
  }
};



  useEffect(() => {
    fetchData();
  }, [timeFilter, statusFilter, fromDate, toDate]);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter chart by time and status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-center">
            {/* Time filters */}
            {timeFilters.map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? "default" : "outline"}
                onClick={() => setTimeFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}

            {/* Custom date range */}
            <div className="flex items-center gap-2">
              <input type="date" className="border rounded p-1" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span>to</span>
              <input type="date" className="border rounded p-1" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            {/* Status filter */}
            {statuses.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Certificates Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Business" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="Building" stroke="#00C49F" strokeWidth={2} />
                <Line type="monotone" dataKey="Barangay" stroke="#FFBB28" strokeWidth={2} />
                <Line type="monotone" dataKey="Resident" stroke="#FF8042" strokeWidth={2} />
                <Line type="monotone" dataKey="Certificate" stroke="#A28EFF" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/residents/new">
                <Button className="w-full justify-start" variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  New Resident Record
                </Button>
              </Link>
              <Link to="/residents">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  View All Residents
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
                  Issue Certification
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest records and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New resident registered</p>
                    <p className="text-xs text-muted-foreground">REBEL I ALBALADEJO - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Clearance issued</p>
                    <p className="text-xs text-muted-foreground">Juan Dela Cruz - 5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Certification approved</p>
                    <p className="text-xs text-muted-foreground">Maria Santos - 1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
