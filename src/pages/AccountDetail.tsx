import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Shield,
  ShieldCheck, ShieldX, IdCard, ZoomIn, X,
  CheckCircle2, XCircle, Clock, Loader2, AlertTriangle,
  Users, Home, Briefcase, BookOpen, Heart, Crown,
  User, Lock, ToggleLeft, ToggleRight,
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

// ─── Field ────────────────────────────────────────────────────────────────────
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

// ─── Section header ───────────────────────────────────────────────────────────
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

// ─── Approval badge ───────────────────────────────────────────────────────────
function ApprovalBadge({ is_approved, status }: { is_approved?: boolean | number; status?: string }) {
  const approved = is_approved === true || is_approved === 1;
  const inactive = status === "inactive";
  if (inactive) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm"
      style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db" }}>
      <XCircle className="h-3.5 w-3.5" /> Inactive
    </span>
  );
  if (approved) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm"
      style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}>
      <CheckCircle2 className="h-3.5 w-3.5" /> Approved
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm"
      style={{ background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a" }}>
      <Clock className="h-3.5 w-3.5" /> Pending Approval
    </span>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function AccountDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast: shadToast } = useToast();

  const [account, setAccount]       = useState<FullAccount | null>(null);
  const [loading, setLoading]       = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [approving, setApproving]   = useState(false);
  const [lightbox, setLightbox]     = useState(false);
  const [permConfirm, setPermConfirm] = useState<{ key: string; label: string; enabling: boolean } | null>(null);
  const [permSaving, setPermSaving] = useState(false);

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`https://westrembomis.onrender.com/api/users/${id}`, { withCredentials: true });
      console.log("Account details response:", res); // Debug log
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
      await axios.put(`https://westrembomis.onrender.com/api/users/${account.id}/permissions`,
        { permissions: updated }, { withCredentials: true });
      toast("Permission updated.");
    } catch {
      toast("Failed to update permissions.");
    } finally {
      setPermSaving(false);
      setPermConfirm(null);
    }
  };

  const handleApprove = async () => {
    if (!account) return;
    setApproving(true);
    try {
      await axios.put(`https://westrembomis.onrender.com/api/users/${account.id}/approve`,
        { is_approved: true, status: "active" }, { withCredentials: true });
      setAccount(prev => prev ? { ...prev, is_approved: true, status: "active" } : prev); 
      shadToast({ title: "Account Approved", description: "The user can now log in." });
    } catch (err: any) {
      shadToast({ title: "Error", description: err?.response?.data?.message ?? "Failed.", variant: "destructive" });
    } finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!account) return;
    setApproving(true);
    try {
      await axios.put(`https://westrembomis.onrender.com/api/users/${account.id}/approve`,
        { is_approved: false, status: "inactive" }, { withCredentials: true });
      setAccount(prev => prev ? { ...prev, is_approved: false, status: "inactive" } : prev);
      shadToast({ title: "Account Rejected", description: "User set to inactive." });
    } catch (err: any) {
      shadToast({ title: "Error", description: err?.response?.data?.message ?? "Failed.", variant: "destructive" });
    } finally { setApproving(false); }
  };

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

  const idUrl = buildIdUrl(account.id_url);
  const isApproved = account.is_approved === true || account.is_approved === 1;
  const isPending = !isApproved && account.status !== "inactive";
  const address = [account.house_block_lot_no, account.street, account.zone_purok].filter(Boolean).join(", ");

  return (
    <Layout>
      {/* Permission Confirmation Modal */}
      {permConfirm && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => !permSaving && setPermConfirm(null)}>
          <div
            className="bg-white rounded-sm shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            style={{ border: `1px solid #dde3ed`, borderTopWidth: 3, borderTopColor: permConfirm.enabling ? NAVY : PINK }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
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

            {/* Actions */}
            <div className="px-5 py-4 flex gap-2 justify-end">
              <button
                onClick={() => setPermConfirm(null)}
                disabled={permSaving}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-40"
                style={{ borderColor: "#d1d5db", color: "#374151", borderRadius: 2 }}>
                Cancel
              </button>
              <button
                onClick={confirmPermissionToggle}
                disabled={permSaving}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
                style={{
                  background: permConfirm.enabling ? "#1d4ed8" : "#e11d48",
                  borderRadius: 2,
                }}>
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
      <style>{`
        .perm-card { transition: all 0.15s; cursor: pointer; }
        .perm-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,42,94,0.08); }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6 pb-12">

        {/* Back + Header */}
        <div className="flex items-start gap-4">
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
              <ApprovalBadge is_approved={account.is_approved} status={account.status} />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
                style={{
                  background: account.role === "ADMIN" ? "#fce7f3" : "#eef2ff",
                  color: account.role === "ADMIN" ? PINK : NAVY,
                  border: `1px solid ${account.role === "ADMIN" ? "#f9a8d4" : "#c8d4ed"}`,
                }}>
                {account.role === "ADMIN" && <Crown className="inline h-2.5 w-2.5 mr-1" />}
                {account.role ?? "STAFF"}
              </span>
            </div>
          </div>
        </div>

        {/* Pending warning banner */}
        {isPending && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-sm"
            style={{ background: "#fef9c3", border: "1px solid #fde68a", borderLeftWidth: 3, borderLeftColor: "#f59e0b" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: "#b45309" }} />
            <p className="text-sm font-medium" style={{ color: "#92400e" }}>
              This account is <strong>pending approval</strong>. Review the submitted ID below before approving.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Profile card */}
            <div className="rounded-sm border overflow-hidden" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <div className="h-20" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3d7c 100%)` }} />
              <div className="px-5 pb-5">
                <div className="flex items-end justify-between -mt-10 mb-3">
                  <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                    style={{ background: isPending ? "#b45309" : NAVY }}>
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

            {/* ID Photo card */}
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

              {/* Approval actions */}
              <div className="px-3 pb-3 flex flex-col gap-2">
                {!isApproved ? (
                  <>
                    <button onClick={handleApprove} disabled={approving}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-40"
                      style={{ background: "#16a34a", borderRadius: 2 }}>
                      {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {approving ? "Approving…" : "Approve Account"}
                    </button>
                    <button onClick={handleReject} disabled={approving}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                      style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", borderRadius: 2 }}>
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold"
                    style={{ color: "#15803d", background: "#f0fdf4", borderRadius: 2 }}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Account approved — can log in
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal Info */}
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

            {/* Residency */}
            <div className="rounded-sm border p-5" style={{ borderColor: "#dde3ed", background: "#fff" }}>
              <SectionHeader icon={BookOpen} title="Residency & Voter Info" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Resident Status"    value={account.resident_status} />
                <InfoField label="Period of Residency" value={account.period_of_residency} />
                <InfoField label="Voter Status"       value={account.voter_status} />
                <InfoField label="Precinct No."       value={account.precinct_no} />
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

            {/* Permissions */}
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
                        background: active ? "#eff6ff" : "#f8faff",
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

            {/* System info */}
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