// ─────────────────────────────────────────────────────────────────
// RejectedIncompleteAnalytics.tsx
// Drop-in section to add inside the Reports page, below the
// existing charts section. Also shows the full updated Reports.tsx
// with the new section integrated.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Download,
  FileCheck,
  Users,
  Award,
  Building,
  FileText,
  TrendingUp,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// ─── Types ────────────────────────────────────────────────────────

interface RejectedIncompleteEntry {
  id: string | number;
  date: string;
  documentType: string;
  resident: string;
  status: "rejected" | "incomplete";
  reason?: string;
}

interface RejectedIncompleteOverview {
  totalRejected: number;
  totalIncomplete: number;
  byType: { name: string; rejected: number; incomplete: number }[];
  trend: { month: string; rejected: number; incomplete: number }[];
  entries: RejectedIncompleteEntry[];
}

// ─── Status badge helper ──────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const isRejected = status === "rejected";
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize font-medium",
        isRejected
          ? "border-destructive text-destructive bg-destructive/10"
          : "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
      )}
    >
      {isRejected ? (
        <XCircle className="w-3 h-3 mr-1" />
      ) : (
        <AlertCircle className="w-3 h-3 mr-1" />
      )}
      {status}
    </Badge>
  );
};

// ─────────────────────────────────────────────────────────────────
// NEW SECTION COMPONENT — paste this just before the closing
// </div> of the main space-y-6 div in your Reports component.
// ─────────────────────────────────────────────────────────────────

interface RejectedIncompleteSectionProps {
  dateFrom?: Date;
  dateTo?: Date;
}

export const RejectedIncompleteSection = ({
  dateFrom,
  dateTo,
}: RejectedIncompleteSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RejectedIncompleteOverview | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "rejected" | "incomplete">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = format(dateFrom, "yyyy-MM-dd");
      if (dateTo) params.dateTo = format(dateTo, "yyyy-MM-dd");

      const [overviewRes, entriesRes] = await Promise.all([
        api.get("api/reports/rejected-incomplete/overview", { params }),
        api.get("api/reports/rejected-incomplete/entries", { params }),
      ]);

      setData({
        ...overviewRes.data.data,
        entries: entriesRes.data.data ?? [],
      });
    } catch (err) {
      console.error("Error fetching rejected/incomplete data:", err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered entries for table
  const filteredEntries = (data?.entries ?? []).filter((e) =>
    statusFilter === "all" ? true : e.status === statusFilter
  );

  const pieData = data
    ? [
        { name: "Rejected", value: data.totalRejected },
        { name: "Incomplete", value: data.totalIncomplete },
      ]
    : [];

  const PIE_COLORS = ["hsl(var(--destructive))", "hsl(40 95% 55%)"];

  return (
    <>
      {/* ── Section divider ── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-destructive" />
          <AlertCircle className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Rejected &amp; Incomplete Requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Track and analyze failed or unfinished document requests
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto gap-1.5"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rejected
              </CardTitle>
              <XCircle className="w-4 h-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {loading ? "—" : (data?.totalRejected ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requests formally denied
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Incomplete
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {loading ? "—" : (data?.totalIncomplete ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requests with missing info or documents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: rejected vs incomplete split */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Proportion of rejected vs. incomplete requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar: monthly trend rejected vs incomplete */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>
              Rejected and incomplete requests over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="rejected"
                  fill="hsl(var(--destructive))"
                  radius={[4, 4, 0, 0]}
                  name="Rejected"
                />
                <Bar
                  dataKey="incomplete"
                  fill="hsl(40 95% 55%)"
                  radius={[4, 4, 0, 0]}
                  name="Incomplete"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar: by document type */}
      <Card>
        <CardHeader>
          <CardTitle>By Document Type</CardTitle>
          <CardDescription>
            Rejected and incomplete counts per document type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.byType ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="rejected"
                fill="hsl(var(--destructive))"
                radius={[0, 4, 4, 0]}
                name="Rejected"
              />
              <Bar
                dataKey="incomplete"
                fill="hsl(40 95% 55%)"
                radius={[0, 4, 4, 0]}
                name="Incomplete"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Detailed Table (collapsible) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Request Breakdown</CardTitle>
              <CardDescription>
                Individual rejected and incomplete entries
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as "all" | "rejected" | "incomplete")
                }
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>

              {/* Toggle table visibility */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTable((p) => !p)}
                className="gap-1.5 text-xs"
              >
                {showTable ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show entries
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {showTable && (
          <CardContent className="pt-0">
            {filteredEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No entries found for the selected filters.
              </p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason / Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(entry.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {entry.resident}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.documentType}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          {entry.reason ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────
// FULL UPDATED Reports.tsx
// (identical to your original + RejectedIncompleteSection wired in)
// ─────────────────────────────────────────────────────────────────

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
      const [overviewRes, monthlyTrendRes, distributionRes, statusRes, comparisonRes] =
        await Promise.all([
          api.get("api/reports/overview", { params: query }),
          api.get("api/reports/monthly-trends", { params: query }),
          api.get("api/reports/distribution", { params: query }),
          api.get("api/reports/status-overview", { params: query }),
          api.get("api/reports/monthly-comparison", { params: query }),
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

  const styleTable = (
    ws: ExcelJS.Worksheet,
    headers: string[],
    startRow: number,
    rows: any[][]
  ) => {
    headers.forEach((h, i) => {
      const cell = ws.getCell(startRow, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A66" } };
    });
    rows.forEach((r, ri) => {
      const rowIndex = startRow + 1 + ri;
      r.forEach((val, ci) => {
        const cell = ws.getCell(rowIndex, ci + 1);
        cell.value = val;
        cell.alignment = { horizontal: ci === 0 ? "left" : "center" };
        if (ri % 2 === 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
        }
      });
    });
    ws.columns = headers.map((_, i) => ({ width: i === 0 ? 30 : 20 }));
  };

  const exportToExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const now = new Date();
    const fromLabel = dateFrom ? format(dateFrom, "MMMM d, yyyy") : "— (no filter applied)";
    const toLabel = dateTo ? format(dateTo, "MMMM d, yyyy") : "— (no filter applied)";
    const typeLabel =
      documentType !== "all"
        ? documentType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "All document types";

    const ws = wb.addWorksheet("Report");
    ws.mergeCells("A1:E1");
    ws.getCell("A1").value = "BARANGAY WEST REMBO";
    ws.getCell("A1").font = { bold: true, size: 12, color: { argb: "FF1F3A66" } };
    ws.mergeCells("A2:E2");
    ws.getCell("A2").value = "DOCUMENT REQUESTS — STATISTICAL REPORT";
    ws.getCell("A2").font = { bold: true, size: 16 };
    ws.mergeCells("A3:E3");
    ws.getCell("A3").value = "Republic of the Philippines · City of Makati";
    ws.getCell("A3").font = { italic: true, size: 10, color: { argb: "FF6B7280" } };
    ws.getRow(4).height = 6;
    ws.getCell("A4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB0436C" } };
    ws.getCell("A6").value = "Generated On:";
    ws.getCell("B6").value = format(now, "MMMM d, yyyy hh:mm a");
    ws.getCell("A7").value = "Prepared By:";
    ws.getCell("B7").value = "System — Barangay Management System";
    ws.mergeCells("A9:E9");
    ws.getCell("A9").value = "REPORT PARAMETERS";
    ws.getCell("A9").font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getCell("A9").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A66" } };
    [
      ["Date Range (From):", fromLabel],
      ["Date Range (To):", toLabel],
      ["Document Type:", typeLabel],
    ].forEach((p, i) => {
      const r = 10 + i;
      ws.getCell(`A${r}`).value = p[0];
      ws.getCell(`B${r}`).value = p[1];
      ws.mergeCells(`B${r}:E${r}`);
    });
    ws.mergeCells("A14:E14");
    ws.getCell("A14").value = "DOCUMENT TOTALS OVERVIEW";
    ws.getCell("A14").font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getCell("A14").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB0436C" } };
    const headerRow = 15;
    ["Document Type", "Total Requests", "% of Total"].forEach((h, i) => {
      const cell = ws.getCell(headerRow, i + 1);
      cell.value = h;
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE3F0" } };
    });
    const totalAll =
      (overview?.business ?? 0) +
      (overview?.building ?? 0) +
      (overview?.barangay_clearance ?? 0) +
      (overview?.barangay_certificate ?? 0) +
      (overview?.residents ?? 0);
    const pct = (n: number) => (totalAll ? `${((n / totalAll) * 100).toFixed(1)}%` : "0.0%");
    const rows = [
      ["Business Clearance", overview?.business ?? 0, pct(overview?.business ?? 0)],
      ["Building Clearance", overview?.building ?? 0, pct(overview?.building ?? 0)],
      ["Barangay Clearance", overview?.barangay_clearance ?? 0, pct(overview?.barangay_clearance ?? 0)],
      ["Barangay Certificate", overview?.barangay_certificate ?? 0, pct(overview?.barangay_certificate ?? 0)],
      ["New Residents", overview?.residents ?? 0, pct(overview?.residents ?? 0)],
    ];
    rows.forEach((r, i) => {
      const rowIndex = headerRow + 1 + i;
      r.forEach((val, j) => {
        const cell = ws.getCell(rowIndex, j + 1);
        cell.value = val;
        cell.alignment = { horizontal: j === 0 ? "left" : "center" };
      });
    });
    const totalRowIndex = headerRow + 1 + rows.length;
    ws.getCell(`A${totalRowIndex}`).value = "TOTAL";
    ws.getCell(`B${totalRowIndex}`).value = totalAll;
    ws.getCell(`C${totalRowIndex}`).value = "100.0%";
    ["A", "B", "C"].forEach((col) => {
      const cell = ws.getCell(`${col}${totalRowIndex}`);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3A66" } };
      cell.alignment = { horizontal: "center" };
    });
    ws.columns = [{ width: 30 }, { width: 25 }, { width: 20 }, { width: 20 }, { width: 20 }];

    // Other sheets (same as original)
    const s1 = wb.addWorksheet("Overview");
    styleTable(s1, ["Document Type", "Total Requests"], 1, [
      ["Business Clearance", overview?.business ?? 0],
      ["Building Clearance", overview?.building ?? 0],
      ["Barangay Clearance", overview?.barangay_clearance ?? 0],
      ["Barangay Certificate", overview?.barangay_certificate ?? 0],
      ["New Residents", overview?.residents ?? 0],
    ]);

    const s2 = wb.addWorksheet("Monthly Trends");
    styleTable(s2, ["Month", "Business", "Building", "Barangay Clearance", "Total"], 1,
      (monthlyData ?? []).map((d) => [
        d.month ?? "", d.business ?? 0, d.building ?? 0,
        d.barangay_clearance ?? 0,
        (d.business ?? 0) + (d.building ?? 0) + (d.barangay_clearance ?? 0),
      ])
    );

    const s3 = wb.addWorksheet("Distribution");
    const distTotal = (distributionData ?? []).reduce((s, d) => s + (d.value ?? 0), 0);
    styleTable(s3, ["Type", "Count", "%"], 1,
      (distributionData ?? []).map((d) => [
        d.name ?? "", d.value ?? 0,
        distTotal ? `${((d.value / distTotal) * 100).toFixed(1)}%` : "0%",
      ])
    );

    const s4 = wb.addWorksheet("Status Overview");
    const stTotal = (statusData ?? []).reduce((s, d) => s + (d.value ?? 0), 0);
    styleTable(s4, ["Status", "Count", "%"], 1,
      (statusData ?? []).map((d) => [
        d.name ?? "", d.value ?? 0,
        stTotal ? `${((d.value / stTotal) * 100).toFixed(1)}%` : "0%",
      ])
    );

    const s5 = wb.addWorksheet("Monthly Comparison");
    styleTable(s5, ["Month", "Business", "Building", "Clearance", "Certificate", "Total"], 1,
      (monthlyComparison ?? []).map((d) => [
        d.month ?? "", d.business ?? 0, d.building ?? 0,
        d.barangay_clearance ?? 0, d.barangay_certificate ?? 0,
        (d.business ?? 0) + (d.building ?? 0) + (d.barangay_clearance ?? 0) + (d.barangay_certificate ?? 0),
      ])
    );

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `BrgyReport_${format(now, "yyyyMMdd_HHmm")}.xlsx`);
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
        </div>

        {/* FILTERS */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Customize your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <Download className="w-4 h-4 mr-2" />
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

        {/* EXISTING CHARTS */}
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

        {/* ══════════════════════════════════════════════════════════
            NEW: Rejected & Incomplete Analytics Section
            Filters (dateFrom / dateTo) are passed down so this
            section automatically respects the same date range.
        ══════════════════════════════════════════════════════════ */}
        <RejectedIncompleteSection dateFrom={dateFrom} dateTo={dateTo} />

      </div>
    </Layout>
  );
};

export default Reports;

// ─── Shared small components (unchanged) ─────────────────────────

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