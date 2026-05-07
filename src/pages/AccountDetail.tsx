import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Shield,
  ShieldCheck, ShieldX, IdCard, ZoomIn, X,
  CheckCircle2, XCircle, Clock, Loader2, AlertTriangle,
  Users, Home, Briefcase, BookOpen, Heart, Crown,
  User, Lock, ToggleLeft, ToggleRight, Trash2, ChevronDown,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";
const CDN = "https://bold-sunset-533d.clarkkentraguhos.workers.dev";

const ALL_PERMISSIONS = [
  { key: "resident",    label: "Resident Management",  desc: "View and manage residents" },
  { key: "doc_req",     label: "Document Requests",    desc: "Process document requests" },
  { key: "certificate", label: "Certificates",         desc: "Issue barangay certificates" },
  { key: "cashier",     label: "Cashier / Payments",   desc: "Access payment records" },
  { key: "reports",     label: "Reports",              desc: "View and export reports" },
  { key: "settings",   label: "Settings",             desc: "Modify system settings" },
];

const ROLES = [
  { value: "ADMIN",    label: "Admin",    color: PINK,      bg: "#fce7f3", border: "#f9a8d4", icon: Crown },
  { value: "STAFF",    label: "Staff",    color: NAVY,      bg: "#eef2ff", border: "#c8d4ed", icon: User },
  { value: "KAGAWAD",  label: "Kagawad",  color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", icon: Users },
];

interface FullAccount {
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
  permissions?: string[] | string;
  created_at?: string;
  updated_at?: string;
}

function getInitials(a: FullAccount) {
  return [a.first_name, a.surname].filter(Boolean).map(n => n![0]).join("").toUpperCase() || "??";
}
function fullName(a: FullAccount) {
  return [a.prefix, a.first_name, a.middle_name, a.surname, a.extension_name].filter(Boolean).join(" ");
}
function formatDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }); }
  catch { return d; }
}
function buildIdUrl(path?: string) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${CDN}${path.startsWith("/") ? "" : "/"}${path}`;
}

function InfoField({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>{label}</p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`} style={{ color: NAVY }}>
        {value != null && value !== "" ? String(value) : <span className="text-gray-300 font-normal italic text-xs">—</span>}
      </p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
        style={{ background: "#f0f4ff", borderRadius: 1 }}>
        <Icon className="h-3.5 w-3.5" style={{ color: NAVY }} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>{title}</p>
      <div className="flex-1 h-px" style={{ background: "#e5e7eb" }} />
    </div>
  );
}

function RoleBadge({ role }: { role?: string }) {
  const r = ROLES.find(x => x.value === role) ?? ROLES[1];
  const Icon = r.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
      style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>
      <Icon className="h-2.5 w-2.5" />
      {r.label}
    </span>
  );
}

export default function AccountDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast: shadToast } = useToast();

  const [account, setAccount]         = useState<FullAccount | null>(null);
  const [loading, setLoading]         = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [lightbox, setLightbox]       = useState(false);
  const [permConfirm, setPermConfirm] = useState<{ key: string; label: string; enabling: boolean } | null>(null);
  const [permSaving, setPermSaving]   = useState(false);

  // ── Role change state ─────────────────────────────────────────────────────
  const [roleConfirm, setRoleConfirm] = useState<{ value: string; label: string } | null>(null);
  const [roleSaving, setRoleSaving]   = useState(false);

  // ── Delete state ──────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput]     = useState("");
  const [deleting, setDeleting]           = useState(false);

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_WEB_URL}/api/users/${id}`, { withCredentials: true });
      const user: FullAccount = res.data.data;
      let perms: string[] = [];
      if (Array.isArray(user.permissions)) perms = user.permissions;
      else if (typeof user.permissions === "string") {
        try { perms = JSON.parse(user.permissions); } catch { perms = []; }
      }
      setAccount(user);
      setPermissions(perms);
    } catch (e) {
      toast("Failed to load account.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchAccount(); }, [id]);

  const handlePermissionToggle = (perm: string, label: string) => {
    const enabling = !permissions.includes(perm);
    setPermConfirm({ key: perm, label, enabling });
  };

  const confirmPermissionToggle = async () => {
    if (!account || !permConfirm) return;
    setPermSaving(true);
    const updated = permConfirm.enabling
      ? [...permissions, permConfirm.key]
      : permissions.filter(p => p !== permConfirm.key);
    setPermissions(updated);
    try {
      await axios.put(`${import.meta.env.VITE_WEB_URL}/api/users/${account.id}/permissions`,
        { permissions: updated }, { withCredentials: true });
      toast("Permission updated.");
    } catch {
      toast("Failed to update permissions.");
    } finally {
      setPermSaving(false);
      setPermConfirm(null);
    }
  };

  // ── Role change handler ───────────────────────────────────────────────────
  const handleRoleChange = (roleValue: string) => {
    if (!account || roleValue === account.role) return;
    const r = ROLES.find(x => x.value === roleValue);
    if (r) setRoleConfirm({ value: r.value, label: r.label });
  };

  const confirmRoleChange = async () => {
    if (!account || !roleConfirm) return;
    setRoleSaving(true);
    try {
      await axios.put(`${import.meta.env.VITE_WEB_URL}/api/users/${account.id}/role`,
        { role: roleConfirm.value }, { withCredentials: true });
      setAccount(prev => prev ? { ...prev, role: roleConfirm.value } : prev);
      shadToast({ title: "Role Updated", description: `Role changed to ${roleConfirm.label}.` });
    } catch (err: any) {
      shadToast({ title: "Error", description: err?.response?.data?.message ?? "Failed to update role.", variant: "destructive" });
    } finally {
      setRoleSaving(false);
      setRoleConfirm(null);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!account) return;
    setDeleting(true);
    try {
      await axios.delete(`${import.meta.env.VITE_WEB_URL}/api/users/${account.id}`, { withCredentials: true });
      shadToast({ title: "Account Deleted", description: `${fullName(account)} has been permanently removed.` });
      navigate("/AccountManage");
    } catch (err: any) {
      shadToast({
        title: "Delete Failed",
        description: err?.response?.data?.message ?? "Could not delete account.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
      setDeleteInput("");
    }
  };

  const nameForConfirm = account ? (account.first_name ?? "").trim() : "";
  const deleteReady    = deleteInput.trim().toLowerCase() === nameForConfirm.toLowerCase() && nameForConfirm !== "";

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: NAVY }} />
      </div>
    </Layout>
  );

  if (!account) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle className="h-8 w-8" style={{ color: "#fca5a5" }} />
        <p className="text-sm text-gray-500">Account not found.</p>
        <button onClick={() => navigate("/settings/AccountManage")}
          className="text-xs font-bold uppercase px-4 py-2 text-white"
          style={{ background: NAVY, borderRadius: 2 }}>Go Back</button>
      </div>
    </Layout>
  );

  const idUrl   = buildIdUrl(account.id_url);
  const address = [account.house_block_lot_no, account.street, account.zone_purok].filter(Boolean).join(", ");

  return (
    <Layout>

      {/* ── Permission Confirmation Modal ─────────────────────────────────── */}
      {permConfirm && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => !permSaving && setPermConfirm(null)}>
          <div
            className="bg-white rounded-sm shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ border: `1px solid #dde3ed`, borderTopWidth: 3, borderTopColor: permConfirm.enabling ? NAVY : PINK }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-sm"
                  style={{ background: permConfirm.enabling ? "#eff6ff" : "#fff1f2" }}>
                  {permConfirm.enabling
                    ? <ShieldCheck className="h-4 w-4" style={{ color: "#2563eb" }} />
                    : <ShieldX     className="h-4 w-4" style={{ color: "#e11d48" }} />}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{ color: permConfirm.enabling ? "#1d4ed8" : PINK }}>
                  {permConfirm.enabling ? "Grant Permission" : "Revoke Permission"}
                </p>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
                Are you sure?
              </h3>
              <p className="text-sm text-gray-500 leading-snug">
                {permConfirm.enabling
                  ? <>You are about to grant <strong className="text-gray-700">{permConfirm.label}</strong> access to this account.</>
                  : <>You are about to revoke <strong className="text-gray-700">{permConfirm.label}</strong> access from this account.</>}
              </p>
            </div>
            <div className="h-px" style={{ background: "#e5e7eb" }} />
            <div className="px-5 py-4 flex gap-2 justify-end">
              <button onClick={() => setPermConfirm(null)} disabled={permSaving}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-40"
                style={{ borderColor: "#d1d5db", color: "#374151", borderRadius: 2 }}>
                Cancel
              </button>
              <button onClick={confirmPermissionToggle} disabled={permSaving}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
                style={{ background: permConfirm.enabling ? "#1d4ed8" : "#e11d48", borderRadius: 2 }}>
                {permSaving
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  : permConfirm.enabling
                    ? <><ShieldCheck className="h-3.5 w-3.5" /> Grant Access</>
                    : <><ShieldX     className="h-3.5 w-3.5" /> Revoke Access</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Role Change Confirmation Modal ────────────────────────────────── */}
      {roleConfirm && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => !roleSaving && setRoleConfirm(null)}>
          <div
            className="bg-white rounded-sm shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ border: `1px solid #dde3ed`, borderTopWidth: 3, borderTopColor: NAVY }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-sm"
                  style={{ background: "#eff6ff" }}>
                  <Users className="h-4 w-4" style={{ color: NAVY }} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: NAVY }}>
                  Change Role
                </p>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
                Are you sure?
              </h3>
              <p className="text-sm text-gray-500 leading-snug">
                You are about to change this account's role to{" "}
                <strong className="text-gray-700">{roleConfirm.label}</strong>. This will affect their access level.
              </p>
            </div>
            <div className="h-px" style={{ background: "#e5e7eb" }} />
            <div className="px-5 py-4 flex gap-2 justify-end">
              <button onClick={() => setRoleConfirm(null)} disabled={roleSaving}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-40"
                style={{ borderColor: "#d1d5db", color: "#374151", borderRadius: 2 }}>
                Cancel
              </button>
              <button onClick={confirmRoleChange} disabled={roleSaving}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
                style={{ background: NAVY, borderRadius: 2 }}>
                {roleSaving
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  : <><CheckCircle2 className="h-3.5 w-3.5" /> Confirm Change</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => !deleting && (setDeleteConfirm(false), setDeleteInput(""))}>
          <div
            className="bg-white rounded-sm shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ border: "1px solid #fecdd3", borderTopWidth: 3, borderTopColor: "#dc2626" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-sm"
                  style={{ background: "#fff1f2" }}>
                  <Trash2 className="h-4 w-4" style={{ color: "#dc2626" }} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "#dc2626" }}>
                  Permanently Delete Account
                </p>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
                This action cannot be undone
              </h3>
              <p className="text-sm text-gray-500 leading-snug mb-4">
                This will permanently delete <strong className="text-gray-700">{fullName(account)}</strong>'s account
                and remove all associated data.
              </p>
              <div className="rounded-sm p-3 mb-1"
                style={{ background: "#fff7f7", border: "1px solid #fecdd3" }}>
                <p className="text-xs text-gray-500 mb-2">
                  Type <strong className="text-gray-700">{nameForConfirm}</strong> to confirm deletion:
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder={nameForConfirm}
                  disabled={deleting}
                  className="w-full px-3 py-2 text-sm border rounded-sm outline-none disabled:opacity-50"
                  style={{
                    borderColor: deleteReady ? "#86efac" : "#fca5a5",
                    background: deleteReady ? "#f0fdf4" : "#fff",
                    color: NAVY,
                  }}
                  onKeyDown={e => e.key === "Enter" && deleteReady && handleDelete()}
                />
              </div>
            </div>
            <div className="h-px" style={{ background: "#fee2e2" }} />
            <div className="px-5 py-4 flex gap-2 justify-end">
              <button
                onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-40"
                style={{ borderColor: "#d1d5db", color: "#374151", borderRadius: 2 }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteReady || deleting}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#dc2626", borderRadius: 2 }}>
                {deleting
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…</>
                  : <><Trash2 className="h-3.5 w-3.5" /> Delete Permanently</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .perm-card { transition: all 0.15s; cursor: pointer; }
        .perm-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,42,94,0.08); }
        .role-card { transition: all 0.15s; cursor: pointer; }
        .role-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,42,94,0.10); }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6 pb-12">

        {/* Back + Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <button onClick={() => navigate("/AccountManage")}
              className="p-2 rounded-sm text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 mt-1"
              style={{ border: "1px solid #e5e7eb" }}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div style={{ width: 14, height: 2, background: PINK }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: PINK }}>
                  Account Details
                </p>
              </div>
              <h1 className="text-2xl font-black" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
                {fullName(account) || "Unknown User"}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <RoleBadge role={account.role} />
              </div>
            </div>
          </div>

          {/* Delete button (top-right) */}
          <button
            onClick={() => { setDeleteInput(""); setDeleteConfirm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all mt-1 flex-shrink-0"
            style={{
              background: "#fff1f2",
              color: "#dc2626",
              border: "1px solid #fecdd3",
              borderRadius: 2,
            }}>
            <Trash2 className="h-3.5 w-3.5" />
            Remove Account
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Profile card */}
            <div className="rounded-sm border overflow-hidden" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <div className="h-20" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3d7c 100%)` }} />
              <div className="px-5 pb-5">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                    style={{ background: NAVY }}>
                    {getInitials(account)}
                  </div>
                </div>
                <h3 className="font-bold text-base" style={{ color: NAVY }}>{fullName(account) || "—"}</h3>
                <p className="text-xs text-gray-400 mb-4">{account.username ? `@${account.username}` : "—"}</p>
                <div className="space-y-3">
                  {[
                    { icon: Mail,     val: account.email },
                    { icon: Phone,    val: account.contact_number },
                    { icon: MapPin,   val: account.zone_purok },
                    { icon: Calendar, val: formatDate(account.created_at), label: "Joined" },
                  ].map(({ icon: Icon, val, label }, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#9ca3af" }} />
                      <p className="text-xs text-gray-600">{label ? <><span className="text-gray-400">{label}: </span>{val || "—"}</> : val || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ID Photo card — view only, no approve/reject */}
            <div className="rounded-sm border overflow-hidden" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: "#f0f4ff", borderBottom: "1px solid #dde3ed" }}>
                <IdCard className="h-3.5 w-3.5" style={{ color: NAVY }} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>
                  Government ID
                </p>
              </div>
              <div className="p-3">
                {idUrl ? (
                  <div className="relative rounded-sm overflow-hidden border"
                    style={{ borderColor: "#dde3ed", background: "#e8eef8", cursor: "zoom-in", height: 180 }}
                    onClick={() => setLightbox(true)}>
                    <img src={idUrl} alt="Government ID" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(15,42,94,0.45)" }}>
                      <div className="flex flex-col items-center gap-1 text-white">
                        <ZoomIn className="h-6 w-6" />
                        <span className="text-[10px] font-bold">Click to enlarge</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-sm border py-8"
                    style={{ borderColor: "#fecdd3", background: "#fff1f2" }}>
                    <AlertTriangle className="h-6 w-6 mb-2" style={{ color: "#fca5a5" }} />
                    <p className="text-xs font-semibold" style={{ color: "#9f1239" }}>No ID uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal Information */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <SectionHeader icon={User} title="Personal Information" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Full Name"       value={fullName(account)} />
                <InfoField label="Nickname"        value={account.nickname} />
                <InfoField label="Sex"             value={account.sex} />
                <InfoField label="Date of Birth"   value={formatDate(account.date_of_birth)} />
                <InfoField label="Place of Birth"  value={account.place_of_birth} />
                <InfoField label="Marital Status"  value={account.marital_status} />
                <InfoField label="Religion"        value={account.religion} />
                <InfoField label="Blood Type"      value={account.blood_type} />
                <InfoField label="PWD Status"      value={account.pwd_status} />
                <InfoField label="Complexion"      value={account.complexion} />
              </div>
            </div>

            {/* Contact & Address */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <SectionHeader icon={Home} title="Contact & Address" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Email"              value={account.email} />
                <InfoField label="Contact No."        value={account.contact_number} />
                <InfoField label="Address"            value={address || "—"} />
                <InfoField label="Zone / Purok"       value={account.zone_purok} />
                <InfoField label="House Owner"        value={account.house_owner} />
                <InfoField label="Relationship"       value={account.relationship_to_owner} />
              </div>
            </div>

            {/* Residency & Voter Info */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <SectionHeader icon={BookOpen} title="Residency & Voter Info" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Resident Status"     value={account.resident_status} />
                <InfoField label="Period of Residency" value={account.period_of_residency} />
                <InfoField label="Voter Status"        value={account.voter_status} />
                <InfoField label="Precinct No."        value={account.precinct_no} />
              </div>
            </div>

            {/* Employment */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <SectionHeader icon={Briefcase} title="Employment" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Employment Status"  value={account.employment_status} />
                <InfoField label="Occupation"         value={account.occupation} />
                <InfoField label="Position"           value={account.position} />
              </div>
            </div>

            {/* ── Role Management ───────────────────────────────────────────── */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <SectionHeader icon={Crown} title="Role Management" />
              <p className="text-xs text-gray-400 mb-3">
                Select a role to assign to this account. Changes require confirmation.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(({ value, label, color, bg, border, icon: Icon }) => {
                  const isActive = account.role === value;
                  return (
                    <div
                      key={value}
                      onClick={() => handleRoleChange(value)}
                      className="role-card rounded-sm border p-3 flex flex-col items-center gap-2 text-center"
                      style={{
                        borderColor: isActive ? border : "#e5e7eb",
                        background: isActive ? bg : "#f8faff",
                        borderWidth: isActive ? 2 : 1,
                        cursor: isActive ? "default" : "pointer",
                        opacity: isActive ? 1 : 0.75,
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: isActive ? bg : "#f0f4ff", border: `1px solid ${isActive ? border : "#dde3ed"}` }}>
                        <Icon className="h-4 w-4" style={{ color: isActive ? color : "#9ca3af" }} />
                      </div>
                      <p className="text-xs font-bold" style={{ color: isActive ? color : NAVY }}>{label}</p>
                      {isActive && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm"
                          style={{ background: bg, color, border: `1px solid ${border}` }}>
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">
                Click a role card to change. A confirmation dialog will appear before saving.
              </p>
            </div>

            {/* Permissions & Access */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <SectionHeader icon={Shield} title="Permissions & Access" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_PERMISSIONS.map(({ key, label, desc }) => {
                  const active = permissions.includes(key);
                  return (
                    <div key={key}
                      onClick={() => handlePermissionToggle(key, label)}
                      className="perm-card rounded-sm border p-3 flex items-center justify-between gap-3"
                      style={{
                        borderColor: active ? "#bfdbfe" : "#e5e7eb",
                        background:  active ? "#eff6ff" : "#f8faff",
                      }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: active ? "#1d4ed8" : NAVY }}>{label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      {active
                        ? <ToggleRight className="h-5 w-5 flex-shrink-0" style={{ color: "#2563eb" }} />
                        : <ToggleLeft  className="h-5 w-5 flex-shrink-0 text-gray-300" />}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">
                Click any permission to toggle. Changes are saved automatically.
              </p>
            </div>

            {/* Danger Zone */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#fecdd3", background: "#fff" }}>
              <SectionHeader icon={Trash2} title="Danger Zone" />
              <div className="flex items-center justify-between gap-4 p-4 rounded-sm"
                style={{ background: "#fff7f7", border: "1px solid #fecdd3" }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#9f1239" }}>Remove this account</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Permanently deletes the user from the database. This cannot be reversed.
                  </p>
                </div>
                <button
                  onClick={() => { setDeleteInput(""); setDeleteConfirm(true); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ background: "#dc2626", borderRadius: 2 }}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Account
                </button>
              </div>
            </div>

            {/* System Account */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <SectionHeader icon={Lock} title="System Account" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Username"       value={account.username} mono />
                <InfoField label="Role"           value={account.role} />
                <InfoField label="Email Verified" value={account.email_verified_at ? formatDate(account.email_verified_at) : "Not verified"} />
                <InfoField label="Last Updated"   value={formatDate(account.updated_at)} />
                <InfoField label="Registered"     value={formatDate(account.created_at)} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && idUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.9)" }} onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 p-2 rounded-full text-white"
            style={{ background: "rgba(255,255,255,0.15)" }} onClick={() => setLightbox(false)}>
            <X className="h-5 w-5" />
          </button>
          <img src={idUrl} alt="Government ID"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </Layout>
  );
}