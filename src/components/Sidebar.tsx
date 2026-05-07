import { NavLink } from "@/components/NavLink";
import {
  Users,
  FileCheck,
  Award,
  BarChart3,
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
  Settings,
  Road,
} from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE = "https://westrembomis.onrender.com/api";

// ─── Strictly classified menu sections ───────────────────────────────────────

const menuSections = [
  {
    title: "Dashboard",
    items: [
      { title: "Dashboard", path: "/dashboard", icon: LayoutList, permission: null },
    ],
  },
  {
    title: "Documents",
    items: [
      { title: "Clearances", path: "/clearancehome", icon: FileCheck, permission: "doc_req" },
      { title: "Certifications", path: "/certificatehome", icon: Award, permission: "certificate" },
      { title: "Document Settings", path: "/document-setting", icon: FileCheck, permission: "settings" },
    ],
  },
  {
    title: "Payments",
    items: [
      { title: "Cashier", path: "/cashier", icon: Coins, permission: "cashier" },
    ],
  },
  {
    title: "Content Management",
    items: [
      { title: "Contacts", path: "/contactCms", icon: NotebookTabs, permission: "settings" },
      { title: "Services", path: "/serviceCms", icon: NotebookTabs, permission: "settings" },
      { title: "Streets", path: "/street-cms", icon: NotebookTabs, permission: "settings" },
      { title: "Elected Officials", path: "/elected-officials", icon: Contact, permission: "settings" },
    ],
  },
  {
    title: "User Management",
    items: [
      { title: "Account Management", path: "/AccountManage", icon: UserRoundPen, permission: "settings" },
    ],
  },
  {
    title: "Communications",
    items: [
      { title: "Contact", path: "/contact-admin", icon: Phone, permission: "settings" },
      { title: "Events Calendar", path: "/events-calendar", icon: CalendarCog, permission: "settings" },
    ],
  },
  {
    title: "Analytic",
    items: [
      { title: "Activity Log", path: "/activity-log", icon: Activity, permission: "settings" },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Backup Recovery", path: "/backup-recovery", icon: Database, permission: "settings" },
      { title: "Settings", path: "/settings", icon: Settings, permission: "settings" },
    ],
  },
];

// ─── Section Label Component ─────────────────────────────────────────────────

function SectionLabel({ title, collapsed }: { title: string; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="px-3 py-2">
        <div className="border-t border-sidebar-border/40" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 select-none cursor-default">
        {title}
      </span>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${BASE}/me`, { withCredentials: true })
      .then((res) => setPermissions(res.data.data.permissions || []))
      .catch((err) => console.error("Failed to fetch user permissions", err));
  }, []);

  // Filter sections and their items based on permissions
  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || permissions.includes(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);

  // Render a single menu item
  const renderMenuItem = (item: { title: string; path: string; icon: any }) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg transition-all",
          "text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed && "justify-center px-2"
        )}
        activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-sidebar-background border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* ── Logo / Header ── */}
      <div className="flex-shrink-0 p-6 border-b border-sidebar-border flex items-center justify-between">
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
          className="text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredSections.map((section, index) => (
            <div key={section.title}>
              {/* Only show section label for non-Dashboard sections */}
              {section.title !== "Dashboard" && (
                <SectionLabel title={section.title} collapsed={collapsed} />
              )}
              
              {/* Add divider after Dashboard section */}
              {section.title === "Dashboard" && filteredSections.length > 1 && (
                <div className="px-4 pb-2">
                  <div className="border-t border-sidebar-border/30" />
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => renderMenuItem(item))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Footer buttons ── */}
      <div className="flex-shrink-0 border-t border-sidebar-border">
        <button
          className={cn(
            "flex items-center gap-3 px-6 py-3 w-full transition-all",
            "text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-2"
          )}
          onClick={() => navigate("/home")}
        >
          <HomeIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Return Home</span>}
        </button>

        <button
          className={cn(
            "flex items-center gap-3 px-6 py-3 w-full transition-all",
            "text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-2"
          )}
          onClick={() => navigate("/")}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}