import { useState, useEffect } from "react";
import axios from "axios";
import { Layout } from "@/components/Layout";
import { AddAccountModal } from "@/components/AddAccountModal";
import {
  Plus, Search, Mail, Phone, Crown,
  ChevronRight, Loader2,
  Clock, Users, UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";
const CDN  = "https://bold-sunset-533d.clarkkentraguhos.workers.dev";

interface Account {
  id: number;
  prefix?: string;
  first_name?: string;
  middle_name?: string;
  surname?: string;
  nickname?: string;
  email?: string;
  contact_number?: string;
  username?: string;
  role?: string;
  status?: string;
  url_photo?: string | null;
  id_url?: string | null;
  is_approved?: boolean | number;
  created_at?: string;
  name?: string;
}

type FilterTab = "all" | "pending" | "approved" | "inactive";

function getInitials(name?: string) {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
}

function buildUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${CDN}${path.startsWith("/") ? "" : "/"}${path}`;
}

function Avatar({ name, url_photo, isPending }: { name?: string; url_photo?: string | null; isPending: boolean }) {
  const photoUrl = buildUrl(url_photo);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ?? "user"}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        style={{ border: `2px solid ${isPending ? "#f59e0b" : "#c8d4ed"}` }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
      style={{ background: isPending ? "#b45309" : NAVY }}
    >
      {getInitials(name)}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border }: {
  label: string; value: number;
  icon: React.ElementType; color: string; bg: string; border: string;
}) {
  return (
    <div className="rounded-sm border p-4 flex items-center gap-4"
      style={{ background: "#fff", borderColor: border, borderLeftWidth: 3, borderLeftColor: color }}>
      <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function Accounts() {
  const [accounts, setAccounts]               = useState<Account[]>([]);
  const [searchQuery, setSearchQuery]         = useState("");
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<FilterTab>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("https://westrembomis.onrender.com/api/getAllUser", { withCredentials: true });
      const raw: Account[] = (res.data?.data || []).map((a: any) => ({
        ...a,
        name: [a.first_name, a.middle_name, a.surname].filter(Boolean).join(" "),
      }));
      setAccounts(raw);
    } catch {
      setError("Failed to fetch accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const pendingCount  = accounts.filter(a => !a.is_approved && a.status !== "inactive").length;
  const approvedCount = accounts.filter(a => a.is_approved === true || a.is_approved === 1).length;
  const inactiveCount = accounts.filter(a => a.status === "inactive").length;
  const adminCount    = accounts.filter(a => a.role === "ADMIN").length;

  const tabFiltered = accounts.filter(a => {
    if (activeTab === "pending")  return !a.is_approved && a.status !== "inactive";
    if (activeTab === "approved") return a.is_approved === true || a.is_approved === 1;
    if (activeTab === "inactive") return a.status === "inactive";
    return true;
  });

  const filtered = tabFiltered.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q) ||
      a.username?.toLowerCase().includes(q)
    );
  });

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all",      label: "All",      count: accounts.length },
    { key: "pending",  label: "Pending",  count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "inactive", label: "Inactive", count: inactiveCount },
  ];

  return (
    <Layout>
      <style>{`
        .acct-row { transition: background 0.12s; }
        .acct-row:hover { background: #f0f4ff !important; }
        .view-btn { transition: all 0.15s; }
        .view-btn:hover { background: #dde8ff !important; }
      `}</style>

      <div className="space-y-6 p-1">

        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 16, height: 2, background: PINK }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: PINK }}>
                System Administration
              </p>
            </div>
            <h1 className="text-2xl font-black" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
              Account Management
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage user accounts and access.
            </p>
          </div>
          <button
            onClick={() => setAddAccountModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-all"
            style={{ background: NAVY, borderRadius: 2 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#1a3d7c")}
            onMouseLeave={e => (e.currentTarget.style.background = NAVY)}>
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Accounts" value={accounts.length} icon={Users}
              color={NAVY} bg="#eef2ff" border="#c8d4ed" />
            <StatCard label="Pending" value={pendingCount} icon={Clock}
              color="#92400e" bg="#fef9c3" border="#fde68a" />
            <StatCard label="Approved" value={approvedCount} icon={UserCheck}
              color="#15803d" bg="#dcfce7" border="#86efac" />
            <StatCard label="Administrators" value={adminCount} icon={Crown}
              color={PINK} bg="#fce7f3" border="#f9a8d4" />
          </div>
        )}

        {/* Table card */}
        <div className="rounded-sm border overflow-hidden" style={{ borderColor: "#dde3ed", background: "#fff" }}>

          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-4 pb-3"
            style={{ borderBottom: "1px solid #e5e7eb" }}>
            <div className="flex items-center gap-1">
              {TABS.map(tab => (
                <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-sm"
                  style={{
                    background: activeTab === tab.key ? NAVY : "transparent",
                    color:      activeTab === tab.key ? "#fff" : "#9ca3af",
                  }}>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-black"
                      style={{
                        background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                        color:      activeTab === tab.key ? "#fff" : "#6b7280",
                      }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="search"
                placeholder="Search accounts…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-sm outline-none transition-colors"
                style={{ borderColor: "#dde3ed", background: "#f8faff", color: NAVY }}
                onFocus={e => (e.currentTarget.style.borderColor = NAVY)}
                onBlur={e  => (e.currentTarget.style.borderColor = "#dde3ed")}
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: NAVY }} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-gray-500">{error}</p>
              <button onClick={fetchAccounts} className="mt-3 text-xs font-bold uppercase tracking-wider px-4 py-2 text-white"
                style={{ background: NAVY, borderRadius: 2 }}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-8 w-8 mb-3 text-gray-300" />
              <p className="text-sm font-semibold text-gray-400">No accounts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: "#f8faff", borderBottom: "1px solid #e5e7eb" }}>
                  <tr>
                    {["User", "Contact", "Role", "Action"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#9ca3af" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(account => {
                    const isPending = !account.is_approved && account.status !== "inactive";

                    return (
                      <tr key={account.id} className="acct-row border-b" style={{ borderColor: "#f0f2f5" }}>

                        {/* User — avatar + name + username */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={account.name}
                              url_photo={account.url_photo}
                              isPending={isPending}
                            />
                            <div>
                              <p className="text-sm font-semibold" style={{ color: NAVY }}>
                                {account.name || "—"}
                              </p>
                              <p className="text-[10px] text-gray-400">{account.username ?? "—"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />{account.email ?? "—"}
                            </span>
                            {account.contact_number && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Phone className="h-3 w-3" />{account.contact_number}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
                            style={{
                              background: account.role === "ADMIN" ? "#fce7f3" : "#eef2ff",
                              color:      account.role === "ADMIN" ? PINK : NAVY,
                              border: `1px solid ${account.role === "ADMIN" ? "#f9a8d4" : "#c8d4ed"}`,
                            }}>
                            {account.role === "ADMIN" && <Crown className="inline h-2.5 w-2.5 mr-1" />}
                            {account.role ?? "STAFF"}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/settings/AccountDetails/${account.id}`)}
                            className="view-btn flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider"
                            style={{ background: "#eef2ff", color: NAVY, border: "1px solid #c8d4ed", borderRadius: 2 }}>
                            <ChevronRight className="h-3 w-3" /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3" style={{ borderTop: "1px solid #f0f2f5" }}>
              <p className="text-[10px] text-gray-400">
                Showing <strong className="text-gray-600">{filtered.length}</strong> of{" "}
                <strong className="text-gray-600">{accounts.length}</strong> accounts
              </p>
            </div>
          )}
        </div>
      </div>

      <AddAccountModal
        open={addAccountModalOpen}
        onOpenChange={setAddAccountModalOpen}
        onAccountAdded={fetchAccounts}
      />
    </Layout>
  );
}