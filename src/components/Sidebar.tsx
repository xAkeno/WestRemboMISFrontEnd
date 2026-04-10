import { NavLink } from "@/components/NavLink";
import {
  Users,
  FileCheck,
  Award,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Coins,
  HomeIcon,
  Contact,
  Phone,
  CalendarCog,
  Database,
  Activity,
  LayoutList,
  NotebookTabs,
  UserRoundPen,
  Bell,
} from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE = "http://127.0.0.1:8000/api";

const SOURCES = [
  {
    key: "business",
    label: "Business Clearance",
    url: `${BASE}/business-clearances`,
    nameFields: ["business_name", "full_name", "name", "applicant_name", "owner_name"],
  },
  {
    key: "building",
    label: "Building Clearance",
    url: `${BASE}/building-clearances`,
    nameFields: ["full_name", "applicant_name", "name", "owner_name"],
  },
  {
    key: "barangay",
    label: "Barangay Clearance",
    url: `${BASE}/barangay-clearances`,
    nameFields: ["full_name", "resident_name", "name", "applicant_name"],
  },
  {
    key: "residents",
    label: "Resident",
    url: `${BASE}/residents`,
    nameFields: ["full_name", "name", "first_name"],
  },
  {
    key: "certificates",
    label: "Certificate",
    url: `${BASE}/barangay-certificates`,
    nameFields: ["full_name", "resident_name", "name", "applicant_name"],
  },
];

const DOT_COLORS: Record<string, string> = {
  business: "#378ADD",
  building: "#1D9E75",
  barangay: "#D4537E",
  residents: "#7F77DD",
  certificates: "#BA7517",
};

const PENDING_STATUSES = ["pending", "for review", "new", "encoded"];

interface NotifItem {
  key: string;
  label: string;
  name: string;
  status: string | null;
  date: string | null;
  ts: number;
}

function isPending(status: string | null) {
  if (!status) return true;
  return PENDING_STATUSES.some((s) => status.toLowerCase().includes(s));
}

function extractRows(data: any): any[] {
  // axios passes response.data — API shape: { status, message, data: [...] }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;          // { data: [...] }
  if (Array.isArray(data?.data?.data)) return data.data.data; // paginated
  for (const k of ["records", "items", "results"]) {
    if (Array.isArray(data?.[k])) return data[k];
  }
  return [];
}

function getName(record: any, fields: string[]): string {
  // Build full name from split fields (first_name + surname) common in this API
  if (record.first_name || record.surname) {
    const parts = [record.prefix, record.first_name, record.middle_name, record.surname, record.ext_name]
      .filter(Boolean).join(" ");
    if (parts.trim()) return parts.trim();
  }
  for (const f of fields) {
    if (record[f] && typeof record[f] === "string") return record[f];
  }
  const key = Object.keys(record).find((k) => /(name|fullname|applicant)/i.test(k) && record[k]);
  return key ? String(record[key]) : "—";
}

function getStatus(record: any): string | null {
  const key = Object.keys(record).find((k) => /status/i.test(k));
  return key ? String(record[key]) : null;
}

function pillClass(s: string | null) {
  if (!s) return "bg-blue-100 text-blue-800";
  const l = s.toLowerCase();
  if (l.includes("pending") || l.includes("review")) return "bg-amber-100 text-amber-800";
  if (l.includes("approved") || l.includes("active")) return "bg-green-100 text-green-800";
  if (l.includes("rejected") || l.includes("denied")) return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
}

function NotificationFeed({ collapsed }: { collapsed: boolean }) {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const totalPending = Object.values(counts).reduce((a, b) => a + b, 0);

  const doFetch = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    const newItems: NotifItem[] = [];
    const newCounts: Record<string, number> = {};

    await Promise.allSettled(
      SOURCES.map(async (src) => {
        try {
          const res = await axios.get(src.url, {
            params: { per_page: 100 },
            withCredentials: true,
          });
          const rows = extractRows(res.data);
          const mapped: NotifItem[] = rows.map((r: any) => ({
            key: src.key,
            label: src.label,
            name: getName(r, src.nameFields),
            status: getStatus(r),
            date: r.created_at ?? null,
            ts: r.created_at ? new Date(r.created_at).getTime() : 0,
          }));
          newItems.push(...mapped);
          newCounts[src.key] = mapped.filter((it) => isPending(it.status)).length;
        } catch {
          newCounts[src.key] = 0;
        }
      })
    );

    setItems(newItems);
    setCounts(newCounts);
    setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }));
    if (showSpinner) setLoading(false);
  }, []);

  const fetchAll = useCallback(() => doFetch(true), [doFetch]);

  useEffect(() => {
    doFetch(true); // first load: show spinner
    const interval = setInterval(() => doFetch(false), 30_000); // silent refresh every 30s
    return () => clearInterval(interval);
  }, [doFetch]);

  const pendingItems = items
    .filter((it) => isPending(it.status))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10);

  // Collapsed sidebar: show only a compact bell icon with badge
  if (collapsed) {
    return (
      <div className="flex justify-center py-2 relative">
        <div className="relative">
          <Bell className="w-5 h-5 text-sidebar-foreground" />
          {totalPending > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none animate-pulse">
              {totalPending > 99 ? "99+" : totalPending}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-t border-sidebar-border">
      {/* Section header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between px-4 py-2.5 hover:bg-sidebar-accent transition-colors w-full"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-sidebar-foreground" />
          <span className="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
            Pending Requests
          </span>
          {loading && (
            <span className="w-3 h-3 border-2 border-sidebar-foreground/20 border-t-sidebar-foreground/60 rounded-full animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalPending > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none">
              {totalPending > 99 ? "99+" : totalPending}
            </span>
          )}
          <ChevronLeft
            className={cn(
              "w-3.5 h-3.5 text-sidebar-foreground/50 transition-transform duration-200",
              expanded ? "-rotate-90" : "rotate-90"
            )}
          />
        </div>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="flex flex-col">
          {/* Per-source count pills */}
          <div className="grid grid-cols-2 gap-1.5 px-3 pb-2">
            {SOURCES.map((src) => (
              <div
                key={src.key}
                className="flex items-center justify-between bg-sidebar-accent/60 rounded-md px-2.5 py-1.5"
              >
                <span
                  className="text-[10px] font-medium truncate"
                  style={{ color: DOT_COLORS[src.key] }}
                >
                  {src.label.replace(" Clearance", "").replace("Certificate", "Cert")}
                </span>
                <span className="text-xs font-semibold text-sidebar-foreground ml-1 flex-shrink-0">
                  {loading ? "…" : (counts[src.key] ?? 0)}
                </span>
              </div>
            ))}
          </div>

          {/* Live feed list */}
          <div className="flex flex-col max-h-52 overflow-y-auto mx-2 mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20">
            {loading && pendingItems.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-5 text-xs text-sidebar-foreground/50">
                <span className="w-3 h-3 border-2 border-sidebar-foreground/20 border-t-sidebar-foreground/50 rounded-full animate-spin" />
                Fetching…
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="text-center text-xs text-sidebar-foreground/40 py-5">
                No pending requests
              </div>
            ) : (
              pendingItems.map((it, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-3 py-2 border-b border-sidebar-border/50 last:border-0 hover:bg-sidebar-accent/40 transition-colors"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: DOT_COLORS[it.key] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-sidebar-foreground truncate leading-tight">
                      {it.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wide"
                        style={{ color: DOT_COLORS[it.key] }}
                      >
                        {it.label.replace(" Clearance", "").replace("Certificate", "Cert")}
                      </span>
                      <span className={cn("text-[9px] font-medium rounded-full px-1.5 py-px", pillClass(it.status))}>
                        {it.status ?? "New"}
                      </span>
                    </div>
                  </div>
                  {it.date && (
                    <span className="text-[9px] text-sidebar-foreground/40 flex-shrink-0 mt-0.5">
                      {new Date(it.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <p className="text-[10px] text-sidebar-foreground/30 text-center pb-2">
              Updated {lastUpdated}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Menu items ───────────────────────────────────────────────────────────────

const allMenuItems = [
  { title: "Dashboard", path: "/dashboard", icon: Users, permission: null },
  { title: "Resident Records", path: "/residenthome", icon: Users, permission: "resident" },
  { title: "Clearances", path: "/clearancehome", icon: FileCheck, permission: "doc_req" },
  { title: "Certifications", path: "/certificatehome", icon: Award, permission: "certificate" },
  { title: "Cashier", path: "/cashier", icon: Coins, permission: "cashier" },
  { title: "Elected Officials", path: "/elected-officials", icon: Contact, permission: "settings" },
  { title: "Contact", path: "/contact-admin", icon: Phone, permission: "settings" },
  { title: "Events Calendar", path: "/events-calendar", icon: CalendarCog, permission: "settings" },
  { title: "Document Settings", path: "/document-setting", icon: FileCheck, permission: "settings" },
  { title: "Pricing", path: "/pricing", icon: LayoutList, permission: "settings" },
  { title: "Contact Cms", path: "/contactCms", icon: NotebookTabs, permission: "settings" },
  { title: "Reports", path: "/reports", icon: BarChart3, permission: "reports" },
  { title: "Account Manage", path: "/AccountManage", icon: UserRoundPen, permission: "settings" },
  { title: "Backup Recovery", path: "/backup-recovery", icon: Database, permission: "settings" },
  { title: "Activity Log", path: "/activity-log", icon: Activity, permission: "settings" },
  { title: "Settings", path: "/settings", icon: Settings, permission: "settings" },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/me", {
          withCredentials: true,
        });
        setPermissions(response.data.data.permissions || []);
      } catch (error) {
        console.error("Failed to fetch user permissions", error);
      }
    };
    fetchUser();
  }, []);

  const filteredMenuItems = allMenuItems.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  return (
    <aside
      className={cn(
        "bg-sidebar-background border-r border-sidebar-border transition-all duration-300 flex flex-col relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sidebar-foreground text-sm">West Rembo</h2>
              <p className="text-xs text-muted-foreground">Clearance System</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
      {/* Notification Feed */}
      <NotificationFeed collapsed={collapsed} />

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                "text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center"
              )}
              activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Return Home */}
      <div className="px-4 pb-1">
        <button
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all",
            "text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center"
          )}
          onClick={() => navigate("/home")}
        >
          <HomeIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Return Home</span>}
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 pb-4">
        <button
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all",
            "text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center"
          )}
          onClick={() => navigate("/")}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}