import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileCheck, Users, Award, Building, FileText, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

const Reports = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [documentType, setDocumentType] = useState<string>("all");

  const [overview, setOverview] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<any[]>([]);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const buildQuery = () => {
    const params: any = {};

    if (dateFrom) params.dateFrom = format(dateFrom, "yyyy-MM-dd");
    if (dateTo) params.dateTo = format(dateTo, "yyyy-MM-dd");
    // if (documentType !== "all") params.documentType = documentType; // already good

    return params;
  };

  const resetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setDocumentType("all");
    fetchAllReports();
  };



  const fetchAllReports = async () => {
    try {
      const query = buildQuery();

      const [
        overviewRes,
        monthlyTrendRes,
        distributionRes,
        statusRes,
        comparisonRes
      ] = await Promise.all([
        api.get("api/reports/overview", { params: query }),
        api.get("api/reports/monthly-trends", { params: query }),
        api.get("api/reports/distribution", { params: query }),
        api.get("api/reports/status-overview", { params: query }),
        api.get("api/reports/monthly-comparison", { params: query })
      ]);

      setOverview(overviewRes.data.data);
      setMonthlyData(monthlyTrendRes.data.data);
      setDistributionData(distributionRes.data.data);
      setStatusData(statusRes.data.data);
      setMonthlyComparison(comparisonRes.data.data);

    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const sheets = {
      Overview: [overview],
      Monthly_Trends: monthlyData,
      Distribution: distributionData,
      Status: statusData,
      Monthly_Comparison: monthlyComparison
    };

    Object.entries(sheets).forEach(([sheetName, data]) => {
      const ws = XLSX.utils.json_to_sheet(data as any);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `Reports_${Date.now()}.xlsx`);
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Statistics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive overview of barangay documents and activities
            </p>
          </div>

          {/* <Button className="gap-2" onClick={exportToExcel}>
            <Download className="w-4 h-4" />
            Export Excel
          </Button> */}
        </div>

        {/* FILTERS */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Customize your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* FROM DATE */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start", !dateFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* TO DATE */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start", !dateTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* DOCUMENT TYPE */}
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button className="flex-1" onClick={fetchAllReports}>
                    Apply Filters
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button className="w-full" onClick={exportToExcel}>
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* STAT CARDS */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Business Clearance" icon={<FileCheck />} value={overview.business} color="text-chart-1" />
            <StatCard title="Building Clearance" icon={<Building />} value={overview.building} color="text-chart-2" />
            <StatCard title="Barangay Clearance" icon={<FileText />} value={overview.barangay_clearance} color="text-chart-3" />
            <StatCard title="Barangay Certificate" icon={<Award />} value={overview.barangay_certificate} color="text-chart-4" />
            <StatCard title="New Residents" icon={<Users />} value={overview.residents} color="text-chart-5" />
          </div>
        )}

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Monthly Document Trends" desc="Document issuance per month">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="business" stroke="hsl(var(--chart-1))" />
                <Line dataKey="building" stroke="hsl(var(--chart-2))" />
                <Line dataKey="barangay_clearance" stroke="hsl(var(--chart-3))" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Document Distribution" desc="Total documents grouped by type">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={distributionData} outerRadius={80} dataKey="value" nameKey="name">
                  {distributionData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Document Status Overview" desc="Approved / Pending / Rejected">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Comparison" desc="All document types compared monthly">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="business" fill="hsl(var(--chart-1))" />
                <Bar dataKey="building" fill="hsl(var(--chart-2))" />
                <Bar dataKey="barangay_clearance" fill="hsl(var(--chart-3))" />
                <Bar dataKey="barangay_certificate" fill="hsl(var(--chart-4))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

      </div>
    </Layout>
  );
};

export default Reports;

// SMALL COMPONENTS

const StatCard = ({ title, icon, value, color }: any) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`w-4 h-4 ${color}`}>{icon}</div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
        <TrendingUp className="w-3 h-3" />
        Auto-updated
      </p>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, desc, children }: any) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{desc}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);
