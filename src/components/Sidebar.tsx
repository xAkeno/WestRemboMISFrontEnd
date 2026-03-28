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
  PanelsTopLeft,
  CalendarCog,
  Database,
  LayoutPanelTop,
  Activity
} from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { title } from "process";

const allMenuItems = [
  { title: "Dashboard", path: "/dashboard", icon: Users, permission: null }, // accessible to all
  { title: "Resident Records", path: "/residenthome", icon: Users, permission: "resident" },
  { title: "Clearances", path: "/clearancehome", icon: FileCheck, permission: "doc_req" },
  { title: "Certifications", path: "/certificatehome", icon: Award, permission: "certificate" },
  { title: "Cashier", path: "/cashier", icon: Coins, permission: "cashier" },
  { title: "About us", path: "/aboutus-admin", icon: LayoutPanelTop, permission: "settings" },
  { title: "Elected Officials", path: "/elected-officials", icon: Contact, permission: "settings" },
  { title: "Contact", path: "/contact-admin", icon: Phone, permission: "settings" },
  { title: "Events Calendar", path: "/events-calendar", icon: CalendarCog, permission: "settings" },
  { title: "Document Settings", path: "/document-setting", icon: FileCheck, permission: "settings" },
  { title: "Website Settings", path: "/websitesetting", icon: PanelsTopLeft, permission: "settings" }, 
  { title: "Reports", path: "/reports", icon: BarChart3, permission: "reports" },
  { title: "Backup Recovery", path: "/backup-recovery", icon: Database, permission: "settings" },
  { title: "Activity Log", path: "/activity-log", icon: Activity, permission: "settings" },
  { title: "Settings", path: "/settings", icon: Settings, permission: "settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/me", {
          withCredentials: true
        });
        setPermissions(response.data.data.permissions || []);
        console.log("User permissions:", response.data.data);
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

      <nav className="flex-1 p-4 space-y-2">
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

      <div className="p-4 border-t border-sidebar-border">
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

      <div className="p-4 border-t border-sidebar-border">
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
