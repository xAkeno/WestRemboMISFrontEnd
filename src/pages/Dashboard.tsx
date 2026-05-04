import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Layout } from "../components/Layout";
import axios from "axios";
import { startOfWeek, startOfMonth, format } from "date-fns";

const BASE = "https://westrembomis.onrender.com/api";

const timeFilters = ["week", "month", "year"];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const toTitleCase = (value: string) => {
  if (!value) return "";
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// Each service gets a fully distinct color
const serviceColors: Record<string, string> = {
  "Barangay Clearance":   "#f59e0b", // amber
  "Business Clearance":   "#3b82f6", // blue
  "Building Clearance":   "#ef4444", // red
  "Barangay Certificate": "#a855f7", // purple
};

// Keys used by recharts Line/Bar dataKeys
const serviceChartColors: Record<string, string> = {
  Barangay:    serviceColors["Barangay Clearance"],
  Business:    serviceColors["Business Clearance"],
  Building:    serviceColors["Building Clearance"],
  Certificate: serviceColors["Barangay Certificate"],
};

// Pie slices in the same order as Object.entries(recordsCounts)
const PIE_COLORS = [
  serviceColors["Barangay Clearance"],
  serviceColors["Business Clearance"],
  serviceColors["Building Clearance"],
  serviceColors["Barangay Certificate"],
];

const shorten = (s: string) =>
  s.replace("Barangay Clearance",   "Barangay")
   .replace("Business Clearance",   "Business")
   .replace("Building Clearance",   "Building")
   .replace("Barangay Certificate", "Certificate");

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecordCounts {
  [key: string]: {
    total: number;
    released: number;
    incomplete: number;
    rejected: number;
  };
}

interface DistributionItem {
  type: string;
  count: number;
  percentage: number;
}

interface MonthlyComparisonItem {
  type: string;
  current_count: number;
  previous_count: number;
  change_percent: number;
  current_period: string;
  previous_period: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [chartData,            setChartData]            = useState<any[]>([]);
  const [recordsCounts,        setRecordsCounts]        = useState<RecordCounts>({});
  const [documentDistribution, setDocumentDistribution] = useState<DistributionItem[]>([]);
  const [monthlyComparison,    setMonthlyComparison]    = useState<MonthlyComparisonItem[]>([]);
  const [timeFilter,           setTimeFilter]           = useState("month");
  const [fromDate,             setFromDate]             = useState("");
  const [toDate,               setToDate]               = useState("");
  const [latestActivities,     setLatestActivities]     = useState<any[]>([]);
  const [isLoading,            setIsLoading]            = useState(true);

  // ── Set default from/to when timeFilter changes ───────────────────────────

  useEffect(() => {
    const today     = new Date();
    const defaultTo = format(today, "yyyy-MM-dd");
    const defaultFrom =
      timeFilter === "week"  ? format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
    : timeFilter === "month" ? format(startOfMonth(today), "yyyy-MM-dd")
    : "";
    setFromDate(defaultFrom);
    setToDate(defaultTo);
  }, [timeFilter]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        filter_date: timeFilter,
        from:        fromDate || undefined,
        to:          toDate   || undefined,
        _:           Date.now(),
      };

      const res  = await axios.get(`${BASE}/dashboard`, { params, withCredentials: true });
      const data = res.data.data;

      // ── Chart periods ────────────────────────────────────────────────────
      const businessData    = data.business_clearances?.data   || [];
      const buildingData    = data.building_clearances?.data   || [];
      const barangayData    = data.barangay_clearances?.data   || [];
      const certificateData = data.barangay_certificates?.data || [];

      const allPeriods = Array.from(new Set([
        ...businessData.map((d: any)    => d.period),
        ...buildingData.map((d: any)    => d.period),
        ...barangayData.map((d: any)    => d.period),
        ...certificateData.map((d: any) => d.period),
      ])).sort() as string[];

      setChartData(allPeriods.map((period) => ({
        period,
        Barangay:    barangayData.find((d: any)    => d.period === period)?.count || 0,
        Business:    businessData.find((d: any)    => d.period === period)?.count || 0,
        Building:    buildingData.find((d: any)    => d.period === period)?.count || 0,
        Certificate: certificateData.find((d: any) => d.period === period)?.count || 0,
      })));

      // ── Record counts ────────────────────────────────────────────────────
      const counts: RecordCounts = data.records_counts || {};
      setRecordsCounts(counts);

      // ── Document Distribution ────────────────────────────────────────────
      if (data.document_distribution?.length) {
        setDocumentDistribution(data.document_distribution);
      } else {
        const grandTotal = Object.values(counts).reduce((s, c) => s + c.total, 0);
        setDocumentDistribution(
          Object.entries(counts).map(([type, c]) => ({
            type,
            count:      c.total,
            percentage: grandTotal > 0
              ? Math.round((c.total / grandTotal) * 10000) / 100
              : 0,
          }))
        );
      }

      // ── Monthly Comparison ───────────────────────────────────────────────
      if (data.monthly_comparison?.length) {
        setMonthlyComparison(data.monthly_comparison);
      } else {
        const currPeriod = allPeriods[allPeriods.length - 1] ?? "";
        const prevPeriod = allPeriods[allPeriods.length - 2] ?? "";

        const getCount = (arr: any[], period: string) =>
          arr.find((d: any) => d.period === period)?.count ?? 0;

        const services = [
          { type: "Barangay Clearance",   arr: barangayData    },
          { type: "Business Clearance",   arr: businessData    },
          { type: "Building Clearance",   arr: buildingData    },
          { type: "Barangay Certificate", arr: certificateData },
        ];

        setMonthlyComparison(
          services.map(({ type, arr }) => {
            const current  = getCount(arr, currPeriod);
            const previous = getCount(arr, prevPeriod);
            const change   = previous > 0
              ? Math.round(((current - previous) / previous) * 10000) / 100
              : current > 0 ? 100 : 0;
            return {
              type,
              current_count:   current,
              previous_count:  previous,
              change_percent:  change,
              current_period:  currPeriod || "Current",
              previous_period: prevPeriod || "Previous",
            };
          })
        );
      }

      // ── Activities ───────────────────────────────────────────────────────
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

  useEffect(() => { fetchDashboard(); }, [timeFilter, fromDate, toDate]);

  // ── Derived chart data ────────────────────────────────────────────────────

  const recordsCountChartData = useMemo(() =>
    Object.entries(recordsCounts).map(([service, counts]) => ({
      service:    shorten(service),
      total:      counts.total,
      released:   counts.released,
      incomplete: counts.incomplete,
      rejected:   counts.rejected,
    })),
  [recordsCounts]);

  const monthlyChartData = useMemo(() =>
    monthlyComparison.map((item) => ({
      type:     shorten(item.type),
      Current:  item.current_count,
      Previous: item.previous_count,
    })),
  [monthlyComparison]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
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

        {/* ══════════════════════════════════════════════════════════════════════
            GLOBAL FILTER BAR
        ══════════════════════════════════════════════════════════════════════ */}
        <Card className="border-2 border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Dashboard Filters</CardTitle>
            <CardDescription className="text-xs">
              All charts, counts, distribution, and comparisons update with these filters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">

              {/* Date Range */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Date Range
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="border rounded-md px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground font-medium">to</span>
                  <input
                    type="date"
                    className="border rounded-md px-2.5 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick Range Presets */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Range
                </span>
                <div className="flex gap-1.5">
                  {timeFilters.map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={timeFilter === filter ? "default" : "outline"}
                      className="h-8 text-xs"
                      onClick={() => setTimeFilter(filter)}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Apply */}
              <div className="flex flex-col justify-end">
                <Button
                  size="sm"
                  className="h-8 px-5 text-xs font-semibold"
                  onClick={fetchDashboard}
                >
                  Apply Filters
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════════
            RECORD COUNT CARDS
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(recordsCounts).map(([service, counts]) => {
            const color = serviceColors[service] || "#9ca3af";
            return (
              <Card key={service} className="border-l-4" style={{ borderLeftColor: color }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{shorten(service)}</CardTitle>
                  <CardDescription className="text-xs">Record Summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Records</p>
                    <p className="text-3xl font-bold" style={{ color }}>{counts.total}</p>
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
                  <div className="space-y-1.5 pt-2 border-t text-[11px]">
                    {[
                      { label: "Released",   value: counts.released,   cls: "text-green-600"  },
                      { label: "Incomplete", value: counts.incomplete, cls: "text-yellow-600" },
                      { label: "Rejected",   value: counts.rejected,   cls: "text-red-600"    },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}:</span>
                        <span className={`font-semibold ${cls}`}>
                          {value} ({counts.total > 0 ? Math.round((value / counts.total) * 100) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            APPLICATION TREND + STATUS BREAKDOWN
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Application Trend</CardTitle>
              <CardDescription>
                Application volume over time
                {fromDate && toDate && (
                  <span className="ml-1 text-primary font-medium">
                    · {fromDate} to {toDate}
                  </span>
                )}
              </CardDescription>
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
                  <Line type="monotone" dataKey="Barangay"    stroke={serviceChartColors.Barangay}    strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Business"    stroke={serviceChartColors.Business}    strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Building"    stroke={serviceChartColors.Building}    strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Certificate" stroke={serviceChartColors.Certificate} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
                  <Bar dataKey="released"   name="Released"   fill="#22c55e" />
                  <Bar dataKey="incomplete" name="Incomplete" fill="#f59e0b" />
                  <Bar dataKey="rejected"   name="Rejected"   fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            DOCUMENT DISTRIBUTION + PERIOD COMPARISON
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Document Distribution — Donut + legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Document Distribution by Type</CardTitle>
              <CardDescription>Share of total documents across all service types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">

                <div className="flex-shrink-0">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={documentDistribution}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {documentDistribution.map((item, i) => (
                          <Cell
                            key={item.type}
                            fill={serviceColors[item.type] || PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                          fontSize: "12px",
                        }}
                        formatter={(value: any, name: any) => [`${value} docs`, shorten(name)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {documentDistribution.map((item, i) => {
                    const color = serviceColors[item.type] || PIE_COLORS[i % PIE_COLORS.length];
                    return (
                      <div key={item.type} className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-xs font-medium truncate">{shorten(item.type)}</span>
                            <span className="text-xs font-bold ml-2 tabular-nums">{item.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%`, backgroundColor: color }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{item.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Period Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Period Comparison</CardTitle>
              <CardDescription>
                {monthlyComparison[0]
                  ? `${monthlyComparison[0].current_period} vs ${monthlyComparison[0].previous_period}`
                  : "Current period vs previous period"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">

              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyChartData} margin={{ top: 4, right: 10, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Current"  name="Current Period"  fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Previous" name="Previous Period" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-2 pt-2 border-t">
                {monthlyComparison.map((item, i) => {
                  const isUp  = item.change_percent >= 0;
                  const color = serviceColors[item.type] || PIE_COLORS[i % PIE_COLORS.length];
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-muted-foreground">{shorten(item.type)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground tabular-nums">
                          {item.previous_count} →{" "}
                          <span className="text-foreground font-semibold">{item.current_count}</span>
                        </span>
                        <span
                          className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${
                            isUp
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {isUp ? "▲" : "▼"} {Math.abs(item.change_percent)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RECENT ACTIVITY
        ══════════════════════════════════════════════════════════════════════ */}
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
                      <p className="text-xs font-semibold text-foreground leading-tight">{activity.action}</p>
                      <p className="text-[10px] text-muted-foreground flex-shrink-0">{activity.date}</p>
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