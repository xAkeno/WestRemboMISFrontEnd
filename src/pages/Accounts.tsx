import { useState, useEffect } from "react";
import axios from "axios";
import { Layout } from "@/components/Layout";
import { AddAccountModal } from "@/components/AddAccountModal";
import {
  Plus, Search, Mail, Phone, Crown,
  ChevronRight, IdCard, AlertTriangle, Loader2,
  CheckCircle2, XCircle, Clock, Users, UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";
const CDN = "https://bold-sunset-533d.clarkkentraguhos.workers.dev";

interface Account {
  id: number;
  prefix?: string;
  first_name?: string;
  middle_name?: string;
  surname?: string;
  extension_name?: string;
  nickname?: string;
  sex?: string;
  marital_status?: string;
  name_of_spouse?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  religion?: string;
  email?: string;
  contact_number?: string;
  house_block_lot_no?: string;
  street?: string;
  zone_purok?: string;
  house_owner?: string;
  relationship_to_owner?: string;
  resident_status?: string;
  period_of_residency?: string;
  voter_status?: string;
  precinct_no?: string;
  employment_status?: string;
  occupation?: string;
  position?: string;
  pwd_status?: string;
  height_cm?: number;
  weight_kg?: number;
  blood_type?: string;
  complexion?: string;
  username?: string;
  role?: string;
  status?: string;
  id_url?: string;
  is_approved?: boolean | number;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
  // computed
  name?: string;
}

type FilterTab = "all" | "pending" | "approved" | "inactive";

function getInitials(name?: string) {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
}

function formatDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}

function buildIdUrl(path?: string) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${CDN}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─── Status config ─────────────────────────────────────────────────────────────
function ApprovalBadge({ is_approved, status }: { is_approved?: boolean | number; status?: string }) {
  const approved = is_approved === true || is_approved === 1;
  const inactive  = status === "inactive";

  if (inactive) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
      style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db" }}>
      <XCircle className="h-3 w-3" /> Inactive
    </span>
  );
  if (approved) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
      style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}>
      <CheckCircle2 className="h-3 w-3" /> Approved
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
      style={{ background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a" }}>
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}


// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, border }: {
  label: string; value: number;
  icon: React.ElementType; color: string; bg: string; border: string;
}) {
  return (
    <div className="rounded-sm border p-4 flex items-center gap-4"
      style={{ background: "#fff", borderColor: border, borderLeftWidth: 3, borderLeftColor: color }}>
      <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("https://westrembomis.onrender.com/api/getAllUser", { withCredentials: true });
      const raw: Account[] = (response.data?.data || []).map((a: any) => ({
        ...a,
        name: [a.first_name, a.middle_name, a.surname].filter(Boolean).join(" "),
      }));
      setAccounts(raw);
    } catch (err) {
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
        .verify-btn { transition: all 0.15s; }
        .verify-btn:hover { background: #eef2ff !important; }
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
              Review submitted IDs, approve accounts, and manage user access.
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
            <StatCard label="Pending Approval" value={pendingCount} icon={Clock}
              color="#92400e" bg="#fef9c3" border="#fde68a" />
            <StatCard label="Approved" value={approvedCount} icon={UserCheck}
              color="#15803d" bg="#dcfce7" border="#86efac" />
            <StatCard label="Administrators" value={adminCount} icon={Crown}
              color={PINK} bg="#fce7f3" border="#f9a8d4" />
          </div>
        )}

        {/* Pending alert banner */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-sm"
            style={{ background: "#fef9c3", border: "1px solid #fde68a", borderLeftWidth: 3, borderLeftColor: "#f59e0b" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: "#b45309" }} />
            <p className="text-sm font-medium" style={{ color: "#92400e" }}>
              <strong>{pendingCount}</strong> account{pendingCount > 1 ? "s are" : " is"} waiting for ID verification and approval.
            </p>
            <button onClick={() => setActiveTab("pending")}
              className="ml-auto text-xs font-bold uppercase tracking-wider px-3 py-1.5"
              style={{ background: "#b45309", color: "#fff", borderRadius: 2 }}>
              Review Now
            </button>
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
                    color: activeTab === tab.key ? "#fff" : "#9ca3af",
                  }}>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-black"
                      style={{
                        background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                        color: activeTab === tab.key ? "#fff" : "#6b7280",
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
              <AlertTriangle className="h-8 w-8 mb-3" style={{ color: "#fca5a5" }} />
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
                    {["User", "Contact", "Role", "ID Status", "Approval", "Action"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#9ca3af" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderTop: "none" }}>
                  {filtered.map(account => {
                    const isPending = !account.is_approved && account.status !== "inactive";
                    const idUrl = buildIdUrl(account.id_url);

                    return (
                      <tr key={account.id} className="acct-row border-b" style={{ borderColor: "#f0f2f5" }}>
                        {/* User */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white"
                                style={{ background: isPending ? "#b45309" : NAVY }}>
                                {getInitials(account.name)}
                              </div>
                              {isPending && (
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                                  style={{ background: "#f59e0b" }} title="Pending approval" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: NAVY }}>{account.name || "—"}</p>
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
                              color: account.role === "ADMIN" ? PINK : NAVY,
                              border: `1px solid ${account.role === "ADMIN" ? "#f9a8d4" : "#c8d4ed"}`,
                            }}>
                            {account.role === "ADMIN" && <Crown className="inline h-2.5 w-2.5 mr-1" />}
                            {account.role ?? "STAFF"}
                          </span>
                        </td>

                        {/* ID Status */}
                        <td className="py-3 px-4">
                          {idUrl ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1 w-fit"
                              style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}>
                              <IdCard className="h-3 w-3" /> Uploaded
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1 w-fit"
                              style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }}>
                              <AlertTriangle className="h-3 w-3" /> Missing
                            </span>
                          )}
                        </td>

                        {/* Approval */}
                        <td className="py-3 px-4">
                          <ApprovalBadge is_approved={account.is_approved} status={account.status} />
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/settings/AccountDetails/${account.id}`)}
                            className="verify-btn flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all"
                            style={{
                              background: isPending ? "#fef9c3" : "#eef2ff",
                              color: isPending ? "#92400e" : NAVY,
                              border: `1px solid ${isPending ? "#fde68a" : "#c8d4ed"}`,
                              borderRadius: 2,
                            }}>
                            {isPending
                              ? <><IdCard className="h-3 w-3" /> Verify ID</>
                              : <><ChevronRight className="h-3 w-3" /> View Details</>}
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
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: "1px solid #f0f2f5" }}>
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