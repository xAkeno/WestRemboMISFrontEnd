import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Shield, ArrowRight, FileText, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { MaskedInput } from "@/components/MaskedInput";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const ProcessFrontDesk = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isSearching, setIsSearching]         = useState(false);
  const [searchData, setSearchData]           = useState({ first_name: "", last_name: "", date_of_birth: "" });
  const [foundData, setFoundData]             = useState<any>(null);
  const [editData, setEditData]               = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleSearch = async () => {
    if (!searchData.first_name || !searchData.last_name || !searchData.date_of_birth) {
      toast({ title: "Missing Information", description: "Please fill in all search fields", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/kiosk/search", searchData, { withCredentials: true });
      if (res.data.kiosk) {
        setFoundData(res.data.kiosk);
        setEditData(res.data.kiosk);
        toast({ title: "Record Found", description: "Click 'View Details' to review and update your application" });
      } else {
        setFoundData(null); setEditData(null);
        toast({ title: "No record found", description: "Please check your details and try again", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Not Found", description: error.response?.data?.message || "No record found", variant: "destructive" });
      setFoundData(null); setEditData(null);
    } finally { setIsSearching(false); }
  };

  const serviceOptions = ["Barangay Clearance", "Building Clearance", "Business Clearance", "Resident Registration"];

  const handleSubmit = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/kiosk/update", editData, { withCredentials: true });
      toast({ title: "Application Updated", description: "Your application has been resubmitted successfully" });
      setShowDetailModal(false); setShowSearchModal(false);
      setFoundData(null); setEditData(null);
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.response?.data?.message || "Failed to update application", variant: "destructive" });
    }
  };

  const handleResubmit = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/kiosk/submit", foundData, { withCredentials: true });
      toast({ title: "Application Resubmitted", description: "Your application has been submitted again successfully" });
      setShowSearchModal(false); setFoundData(null); setEditData(null);
      setSearchData({ first_name: "", last_name: "", date_of_birth: "" });
    } catch (error: any) {
      toast({ title: "Resubmit Failed", description: error.response?.data?.message || "Failed to resubmit", variant: "destructive" });
    }
  };

  // ─── Shared button styles ────────────────────────────────────────────────────
  const btnPrimary: React.CSSProperties = {
    background:    NAVY,
    borderRadius:  2,
    fontSize:      "0.78em",
    border:        `1px solid ${NAVY}`,
    color:         "#fff",
    fontWeight:    700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor:        "pointer",
    transition:    "background .15s",
  };

  const btnOutline: React.CSSProperties = {
    background:    "transparent",
    borderRadius:  2,
    fontSize:      "0.78em",
    border:        `1px solid #d1d5db`,
    color:         NAVY,
    fontWeight:    700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor:        "pointer",
    transition:    "border-color .15s",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f2f7" }}>

      {/* ── Top accent bar ── */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${NAVY} 0%, ${PINK} 100%)` }} />

      {/* ── Page body ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-2xl bg-white" style={{ borderRadius: 8, border: "1px solid #dce1ec", boxShadow: "0 4px 24px rgba(15,42,94,0.07), 0 1px 4px rgba(15,42,94,0.05)", padding: "2.5rem 2.5rem 2rem" }}>

          {/* ── Header ── */}
          <div className="text-center mb-10">
            {/* Seal ring */}
            <div className="flex items-center justify-center mb-6">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                style={{ border: `3px solid ${PINK}`, background: "#fdf5f9" }}
              >
                <Shield className="h-8 w-8" style={{ color: PINK }} />
              </div>
            </div>

            <p
              className="font-bold uppercase tracking-[0.22em] mb-3"
              style={{ color: PINK, fontSize: "0.68em" }}
            >
              Republic of the Philippines · Barangay West Rembo
            </p>

            {/* Ornamental rule */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ flex: 1, maxWidth: 56, height: 1, background: `linear-gradient(to right, transparent, ${PINK}88)` }} />
              <div style={{ width: 5, height: 5, background: PINK, transform: "rotate(45deg)", borderRadius: 1 }} />
              <div style={{ flex: 1, maxWidth: 56, height: 1, background: `linear-gradient(to left, transparent, ${PINK}88)` }} />
            </div>

            <h1
              className="font-bold text-foreground mb-3"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.5rem, 3.5vw, 2.1rem)", color: NAVY }}
            >
              West Rembo Clearance System
            </h1>

            <div className="flex items-center justify-center gap-3 mb-4">
              <div style={{ flex: 1, maxWidth: 56, height: 1, background: `linear-gradient(to right, transparent, ${PINK}88)` }} />
              <div style={{ width: 5, height: 5, background: PINK, transform: "rotate(45deg)", borderRadius: 1 }} />
              <div style={{ flex: 1, maxWidth: 56, height: 1, background: `linear-gradient(to left, transparent, ${PINK}88)` }} />
            </div>

            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed" style={{ fontSize: "0.88em" }}>
              Apply for Barangay Clearance, Building Clearance, Business Clearance,
              Barangay Certificates, and Resident Forms efficiently and securely.
            </p>
          </div>

          {/* ── Main card ── */}
          <div
            className="bg-white border border-border overflow-hidden"
            style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
          >
            {/* Card header */}
            <div className="px-8 py-5 text-center" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <p className="font-bold uppercase tracking-[0.18em] mb-1" style={{ color: PINK, fontSize: "0.6em" }}>
                Document Request Portal
              </p>
              <h2 className="font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15em", color: NAVY }}>
                Start an Application
              </h2>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.82em" }}>
                Have you submitted an application before?
              </p>
            </div>

            {/* ── Choice buttons ── */}
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Yes — pink filled */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="group relative flex flex-col items-center justify-center gap-1.5 py-6 px-6 transition-all duration-150"
                style={{
                  background:   PINK,
                  borderRadius: 2,
                  border:       `1.5px solid ${PINK}`,
                  color:        "#fff",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#a83569"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = PINK}
              >
                <div className="flex items-center gap-2 font-bold" style={{ fontSize: "1em" }}>
                  <Search className="w-4 h-4" />
                  Yes
                </div>
                <span className="font-normal" style={{ fontSize: "0.72em", color: "rgba(255,255,255,0.8)" }}>
                  Search existing information
                </span>
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 group-hover:opacity-100 transition-all" />
              </button>

              {/* No — navy outlined */}
              <button
                onClick={() => navigate("/kiosk")}
                className="group relative flex flex-col items-center justify-center gap-1.5 py-6 px-6 transition-all duration-150"
                style={{
                  background:   "transparent",
                  borderRadius: 2,
                  border:       `1.5px solid #dde3ed`,
                  color:        NAVY,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = NAVY;
                  (e.currentTarget as HTMLElement).style.background  = "#f5f7fb";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#dde3ed";
                  (e.currentTarget as HTMLElement).style.background  = "transparent";
                }}
              >
                <div className="flex items-center gap-2 font-bold" style={{ fontSize: "1em" }}>
                  <Plus className="w-4 h-4" style={{ color: PINK }} />
                  No
                </div>
                <span className="font-normal text-muted-foreground" style={{ fontSize: "0.72em" }}>
                  Register to use the application
                </span>
                <ArrowRight
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20 group-hover:opacity-60 transition-all"
                  style={{ color: NAVY }}
                />
              </button>
            </div>
          </div>

          {/* ── Footer ── */}
          <p
            className="text-center mt-8 font-bold uppercase tracking-[0.15em]"
            style={{ color: "#c4c9d4", fontSize: "0.6em" }}
          >
            City Government of Taguig · Barangay West Rembo
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          Search Modal
      ════════════════════════════════════════════════════ */}
      <Dialog
        open={showSearchModal}
        onOpenChange={(open) => {
          setShowSearchModal(open);
          if (!open) { setFoundData(null); setEditData(null); setSearchData({ first_name: "", last_name: "", date_of_birth: "" }); }
        }}
      >
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto bg-white p-0"
          style={{ borderRadius: 2, borderTop: `3px solid ${PINK}` }}
        >
          <DialogHeader className="px-7 pt-7 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: PINK }}>
              Application Lookup
            </p>
            <DialogTitle
              className="text-lg font-bold"
              style={{ color: NAVY, fontFamily: "'Georgia', serif" }}
            >
              Search Your Application
            </DialogTitle>
            <DialogDescription style={{ fontSize: "0.85em" }}>
              Enter your details to find your previous application
            </DialogDescription>
          </DialogHeader>

          {!foundData ? (
            <div className="px-7 py-6 space-y-5">
              {[
                { id: "s_fn",  label: "First Name",    key: "first_name",    type: "text", ph: "e.g. Juan"        },
                { id: "s_ln",  label: "Last Name",     key: "last_name",     type: "text", ph: "e.g. Dela Cruz"   },
                { id: "s_dob", label: "Date of Birth", key: "date_of_birth", type: "date", ph: ""                 },
              ].map(f => (
                <div key={f.id}>
                  <Label htmlFor={f.id} className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: PINK }}>
                    {f.label}
                  </Label>
                  <Input
                    id={f.id}
                    type={f.type}
                    value={searchData[f.key as keyof typeof searchData]}
                    onChange={e => setSearchData({ ...searchData, [f.key]: e.target.value })}
                    placeholder={f.ph}
                    className="w-full bg-transparent border-0 border-b rounded-none shadow-none focus-visible:ring-0 px-0 py-2 text-sm placeholder-gray-400"
                    style={{ borderColor: "#d1d5db" }}
                  />
                </div>
              ))}

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full flex items-center justify-center gap-2 py-3 mt-2 text-white disabled:opacity-50"
                style={btnPrimary}
                onMouseEnter={e => !isSearching && ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = NAVY)}
              >
                {isSearching
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                  : <><Search className="w-4 h-4" /> Search Application</>
                }
              </button>
            </div>
          ) : (
            <div className="px-7 py-6 space-y-4">
              {/* Found banner */}
              <div
                className="flex items-start gap-3 p-4"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4 }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: "#dcfce7", color: "#15803d" }}
                >
                  ✓
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#166534" }}>Application Found</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {foundData.first_name} {foundData.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{foundData.service_type}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleResubmit}
                  className="flex-1 py-2.5"
                  style={btnOutline}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = NAVY}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"}
                >
                  Submit Again
                </button>
                <button
                  onClick={() => setShowDetailModal(true)}
                  className="flex-1 py-2.5 text-white"
                  style={btnPrimary}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
                >
                  View Details
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          Detail / Edit Modal
      ════════════════════════════════════════════════════ */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0"
          style={{ borderRadius: 2, borderTop: `3px solid ${PINK}` }}
        >
          <DialogHeader className="px-7 pt-7 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: PINK }}>
              Edit Application
            </p>
            <DialogTitle
              className="text-lg font-bold"
              style={{ color: NAVY, fontFamily: "'Georgia', serif" }}
            >
              Application Details
            </DialogTitle>
            <DialogDescription style={{ fontSize: "0.85em" }}>
              Review and update your application information below
            </DialogDescription>
          </DialogHeader>

          <div className="px-7 py-6">
            {editData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {Object.keys(editData).map(key => {
                  if (["id", "created_at", "updated_at"].includes(key)) return null;

                  const fieldLabel = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

                  if (key === "service_type") return (
                    <div key={key} className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: PINK }}>
                        {fieldLabel}
                      </label>
                      <select
                        value={editData[key]}
                        onChange={e => setEditData({ ...editData, [key]: e.target.value })}
                        className="w-full bg-transparent border-0 border-b py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c2467d] transition-colors cursor-pointer"
                        style={{ borderColor: "#d1d5db" }}
                      >
                        {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  );

                  return (
                    <div key={key} className={key === "address" ? "sm:col-span-2" : ""}>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: PINK }}>
                        {fieldLabel}
                      </label>
                      <MaskedInput
                        type={key.includes("date") ? "date" : "text"}
                        value={editData[key] || ""}
                        onValueChange={val => setEditData({ ...editData, [key]: val })}
                        placeholder={fieldLabel}
                        className="w-full bg-transparent border-0 border-b py-2.5 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:border-[#c2467d] transition-colors"
                        style={{ borderColor: "#d1d5db" }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action row */}
            <div className="flex gap-3 pt-8 mt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2.5"
                style={btnOutline}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = NAVY}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 text-white"
                style={btnPrimary}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
              >
                Update Application
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessFrontDesk;