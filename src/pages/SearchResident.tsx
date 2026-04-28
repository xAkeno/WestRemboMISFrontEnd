import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, ArrowRight, UserSearch, FilePlus2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import westRemboLogo from "@/assets/West_Rembo_Logo.png";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

// ── Local cache helpers (fallback when backend doesn't return full formData) ──
// Key is normalised so casing / whitespace differences don't break lookups.
const KIOSK_CACHE_PREFIX = "kiosk:profile:";
const makeCacheKey = (fn: string, ln: string, dob: string) =>
  `${KIOSK_CACHE_PREFIX}${(fn || "").trim().toLowerCase()}|${(ln || "").trim().toLowerCase()}|${(dob || "").trim()}`;

const readCachedProfile = (fn: string, ln: string, dob: string): Record<string, string> | null => {
  try {
    const raw = localStorage.getItem(makeCacheKey(fn, ln, dob));
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
};

/**
 * Normalise a backend kiosk record so its field names match the `formData`
 * shape used by `frontDesk.tsx` (e.g. `surname`, `contact_number`,
 * `place_of_birth`, `date_of_birth`).
 *
 * Backends in this codebase historically nest the resident under various
 * wrapper keys (`resident`, `profile`, `applicant`, `data`, `attributes`,
 * `payload`, `record`, `details`, `kiosk_profile`) depending on which
 * endpoint persisted it. To avoid the previous bug where only top-level
 * scalars (e.g. `email`) made it through, we flatten one level into every
 * known wrapper before mapping field names.
 *
 * If the backend returns an unfamiliar shape we still want SOMETHING to
 * land in formData, so we also copy any primitive top-level key as-is.
 */
const NESTED_WRAPPER_KEYS = [
  "resident", "profile", "applicant", "data", "attributes",
  "payload", "record", "details", "kiosk_profile", "kiosk",
  "user", "person", "service", "form_data", "formData",
];

const flattenSource = (raw: Record<string, unknown>): Record<string, unknown> => {
  const flat: Record<string, unknown> = {};
  // Top-level primitives win first; nested objects override only when the
  // top-level value is missing/empty (so a nested resident.email won't
  // clobber a real top-level email).
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object" && !Array.isArray(v)) continue;
    flat[k] = v;
  }
  for (const wrapper of NESTED_WRAPPER_KEYS) {
    const nested = raw[wrapper];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      for (const [k, v] of Object.entries(nested as Record<string, unknown>)) {
        if (v === null || v === undefined) continue;
        if (typeof v === "object" && !Array.isArray(v)) continue;
        if (flat[k] === undefined || flat[k] === "") flat[k] = v;
      }
    }
  }
  return flat;
};

const normalisePrefill = (raw: Record<string, unknown>): Record<string, string> => {
  const flat = flattenSource(raw);

  const get = (...keys: string[]): string => {
    for (const k of keys) {
      const v = flat[k];
      if (v !== undefined && v !== null && v !== "") return String(v);
    }
    return "";
  };

  const out: Record<string, string> = {};
  // 1) Bulk copy every primitive top-level key so unknown fields still land
  //    in formData (defensive — covers backend-added columns we haven't
  //    explicitly mapped yet).
  for (const [k, v] of Object.entries(flat)) {
    if (v === null || v === undefined) continue;
    out[k] = String(v);
  }

  // 2) Authoritative mapping for every input the kiosk reads. Each entry
  //    lists the kiosk's formData key on the left and every backend column
  //    name we've seen for it on the right.
  out.prefix                = get("prefix");
  out.first_name            = get("first_name", "firstname", "given_name");
  out.middle_name           = get("middle_name", "middlename");
  out.surname               = get("surname", "last_name", "lastname", "family_name");
  out.last_name             = get("last_name", "lastname", "surname");
  out.ext_name              = get("ext_name", "extension", "ext", "suffix");
  out.date_of_birth         = get("date_of_birth", "dob", "birth_date", "birthdate");
  out.place_of_birth        = get("place_of_birth", "pob", "birth_place", "birthplace");
  out.age                   = get("age");
  out.sex                   = get("sex", "gender");
  out.marital_status        = get("marital_status", "civil_status", "civilstatus");
  out.name_of_spouse        = get("name_of_spouse", "spouse", "spouse_name");
  out.nickname              = get("nickname", "alias");
  out.blood_type            = get("blood_type", "bloodtype");
  out.complexion            = get("complexion");
  out.height_cm             = get("height_cm", "height");
  out.weight_kg             = get("weight_kg", "weight");
  out.religion              = get("religion");
  out.pwd                   = get("pwd", "is_pwd", "person_with_disability");
  out.contact_number        = get("contact_number", "contact_no", "phone", "mobile", "mobile_number");
  out.email                 = get("email", "email_address");
  out.house_block_lot_no    = get("house_block_lot_no", "house_no", "block_lot");
  out.street                = get("street");
  out.zone                  = get("zone");
  out.period_of_residency   = get("period_of_residency", "residency_period", "years_of_residency");
  out.registered_voter      = get("registered_voter", "is_voter", "voter");
  out.house_owner           = get("house_owner", "is_house_owner");
  out.relationship_to_owner = get("relationship_to_owner", "relation_to_owner");
  out.precinct_no           = get("precinct_no", "precinct");
  out.resident_status       = get("resident_status");
  out.occupation            = get("occupation");
  out.position              = get("position");
  out.employment_status     = get("employment_status");
  out.notes                 = get("notes", "remarks");
  out.purpose               = get("purpose");
  out.purpose_details       = get("purpose_details", "purpose_detail");
  out.business_name         = get("business_name");
  out.business_type         = get("business_type");
  out.capital               = get("capital");
  out.establishment         = get("establishment");

  // 3) Strip empty strings that overrode real bulk-copy values (e.g. a
  //    bulk-copied `surname` would survive even if the mapped get() above
  //    returned "" — but if both are empty, just drop the key so the input
  //    placeholder shows).
  for (const k of Object.keys(out)) {
    if (out[k] === "" || out[k] === "null" || out[k] === "undefined") delete out[k];
  }

  // 4) Drop fields that should always be fresh per request.
  delete out.id;
  delete out.created_at;
  delete out.updated_at;
  delete out.service_type;
  delete out.status;
  delete out.bcert_number;
  delete out.brgy_business_no;

  return out;
};

const ProcessFrontDesk = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Confirmation modal ──────────────────────────────────────────────────────
  const [showConfirmModal, setShowConfirmModal]   = useState(false);

  // ── Search modal ────────────────────────────────────────────────────────────
  const [showSearchModal, setShowSearchModal]     = useState(false);
  const [isSearching, setIsSearching]             = useState(false);
  const [searchData, setSearchData]               = useState({ first_name: "", last_name: "", date_of_birth: "" });

  // ── Confirmation modal handlers ─────────────────────────────────────────────
  const handleProceedClick = () => setShowConfirmModal(true);

  /** User chose YES → close confirm modal, open search modal */
  const handleConfirmYes = () => {
    setShowConfirmModal(false);
    setShowSearchModal(true);
  };

  /** User chose NO → skip lookup, go straight to empty form */
  const handleConfirmNo = () => {
    setShowConfirmModal(false);
    navigate("/kiosk");
  };

  // ── Search → autofill ───────────────────────────────────────────────────────
  // Goal: locate the resident's previous kiosk submission (via the backend
  // first, falling back to a localStorage cache populated by `frontDesk.tsx`),
  // then navigate to the kiosk form with the prefilled formData in router
  // state. The form reads that state on mount and skips re-entry.
  const handleSearch = async () => {
    if (!searchData.first_name || !searchData.last_name || !searchData.date_of_birth) {
      toast({ title: "Missing Information", description: "Please fill in all search fields", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    try {
      let prefill: Record<string, string> | null = null;

      try {
        // Backend validates `surname` (matches the residents schema). The
        // local form field is labelled "Last Name" for UX, so we map it on
        // the request boundary. We deliberately send ONLY first_name +
        // surname + date_of_birth so a stray field can't fail validation.
        const res = await axios.post(
          "http://127.0.0.1:8000/api/kiosk/search",
          {
            first_name:    searchData.first_name.trim(),
            surname:       searchData.last_name.trim(),
            date_of_birth: searchData.date_of_birth,
          },
          { withCredentials: true },
        );
        // Pass the full response body (not just one wrapper) into the
        // normaliser so its NESTED_WRAPPER_KEYS walk can find the resident
        // record regardless of how the backend nests it. The previous code
        // pre-narrowed to res.data.kiosk / res.data.data and missed any
        // siblings, which caused the "only email comes through" bug.
        const root = (res.data ?? {}) as Record<string, unknown>;
        // eslint-disable-next-line no-console
        console.debug("[kiosk/search] raw response →", root);
        if (Object.keys(root).length > 0) {
          prefill = normalisePrefill(root);
          // If the normaliser couldn't extract anything beyond the few
          // identifying fields we already knew, treat it as a miss so the
          // localStorage cache fallback still gets a chance to fill in.
          const meaningfulKeys = Object.keys(prefill).filter(
            (k) => !["first_name", "surname", "last_name", "date_of_birth"].includes(k)
          );
          if (meaningfulKeys.length === 0) prefill = null;
        }
      } catch {
        // Backend miss → fall through to local cache.
      }

      if (!prefill) {
        const cached = readCachedProfile(
          searchData.first_name,
          searchData.last_name,
          searchData.date_of_birth,
        );
        if (cached) prefill = cached;
      }

      if (prefill) {
        // Honour the search inputs in case the persisted record had a
        // different casing ("juan" vs "Juan", etc.).
        prefill.first_name    = searchData.first_name;
        prefill.surname       = prefill.surname || searchData.last_name;
        prefill.last_name     = prefill.last_name || searchData.last_name;
        prefill.date_of_birth = searchData.date_of_birth;

        toast({
          title: "Record Found",
          description: "Your previous details have been loaded — pick a service to continue.",
        });
        setShowSearchModal(false);
        setSearchData({ first_name: "", last_name: "", date_of_birth: "" });
        navigate("/kiosk", { state: { prefill } });
      } else {
        toast({
          title: "No record found",
          description: "Please check your details and try again, or close this dialog to start a new application.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  // ── Shared button styles ────────────────────────────────────────────────────
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f2f7" }}>

      {/* ── Top accent bar ── */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${NAVY} 0%, ${PINK} 100%)` }} />

      {/* ── Page body ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-14">
        <div
          className="w-full max-w-2xl bg-white"
          style={{
            borderRadius: 8,
            border: "1px solid #dce1ec",
            boxShadow: "0 4px 24px rgba(15,42,94,0.07), 0 1px 4px rgba(15,42,94,0.05)",
            padding: "2.5rem 2.5rem 2rem",
          }}
        >

          {/* ── Header ── */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-6">
              <div
                className="w-[82px] h-[82px] rounded-full flex items-center justify-center overflow-hidden"
                style={{ border: `3px solid ${PINK}`, background: "#fdf5f9", padding: "6px" }}
              >
                <img src={westRemboLogo} alt="West Rembo Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            <p className="font-bold uppercase tracking-[0.22em] mb-3" style={{ color: PINK, fontSize: "0.68em" }}>
              Republic of the Philippines · Barangay West Rembo
            </p>

            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ flex: 1, maxWidth: 56, height: 1, background: `linear-gradient(to right, transparent, ${PINK}88)` }} />
              <div style={{ width: 5, height: 5, background: PINK, transform: "rotate(45deg)", borderRadius: 1 }} />
              <div style={{ flex: 1, maxWidth: 56, height: 1, background: `linear-gradient(to left, transparent, ${PINK}88)` }} />
            </div>

            <h1
              className="font-bold text-foreground mb-3"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.5rem, 3.5vw, 2.1rem)", color: NAVY }}
            >
              West Rembo Document Request System
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
            <div className="px-8 py-5 text-center" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <p className="font-bold uppercase tracking-[0.18em] mb-1" style={{ color: PINK, fontSize: "0.6em" }}>
                Document Request Portal
              </p>
              <h2 className="font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.15em", color: NAVY }}>
                Start an Application
              </h2>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.82em" }}>
                Click <strong>Proceed</strong> to begin your document request
              </p>
            </div>

            {/* ── Proceed button ── */}
            <div className="p-8 flex justify-center">
              <button
                onClick={handleProceedClick}
                className="group relative flex items-center justify-center gap-3 px-12 py-4 transition-all duration-200"
                style={{
                  background:    `linear-gradient(135deg, ${NAVY} 0%, #1a3d7c 100%)`,
                  borderRadius:  3,
                  border:        `2px solid ${NAVY}`,
                  color:         "#fff",
                  fontWeight:    700,
                  fontSize:      "0.9em",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor:        "pointer",
                  boxShadow:     `0 4px 16px rgba(15,42,94,0.25), inset 0 1px 0 rgba(255,255,255,0.1)`,
                  minWidth:      220,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${PINK} 0%, #a83569 100%)`;
                  (e.currentTarget as HTMLElement).style.borderColor = PINK;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px rgba(194,70,125,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${NAVY} 0%, #1a3d7c 100%)`;
                  (e.currentTarget as HTMLElement).style.borderColor = NAVY;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(15,42,94,0.25), inset 0 1px 0 rgba(255,255,255,0.1)`;
                }}
              >
                Proceed
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
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
          Confirmation Modal — Returning Resident?
      ════════════════════════════════════════════════════ */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => { if (!open) setShowConfirmModal(false); }}>
        <DialogContent
          className="max-w-sm bg-white p-0"
          style={{ borderRadius: 2, borderTop: `3px solid ${PINK}` }}
        >
          {/* Header */}
          <DialogHeader className="px-7 pt-7 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: PINK }}>
              Before You Begin
            </p>
            <DialogTitle
              className="text-lg font-bold leading-snug"
              style={{ color: NAVY, fontFamily: "'Georgia', serif" }}
            >
              Have you submitted a request here before?
            </DialogTitle>
            <DialogDescription style={{ fontSize: "0.85em", marginTop: "0.4rem" }}>
              If yes, we can retrieve your previous details and pre-fill the form to save you time.
            </DialogDescription>
          </DialogHeader>

          {/* Option cards */}
          <div className="px-7 py-6 space-y-3">

            {/* YES option */}
            <button
              onClick={handleConfirmYes}
              className="w-full flex items-start gap-4 p-4 text-left transition-all duration-150"
              style={{
                border:       `1.5px solid #dce1ec`,
                borderRadius: 4,
                background:   "#f8f9fc",
                cursor:       "pointer",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = NAVY;
                (e.currentTarget as HTMLElement).style.background  = "#eef1f8";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#dce1ec";
                (e.currentTarget as HTMLElement).style.background  = "#f8f9fc";
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${NAVY}14`, color: NAVY }}
              >
                <UserSearch className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: NAVY }}>
                  Yes, retrieve my details
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  We'll look up your previous submission and pre-fill the form with your information.
                </p>
              </div>
            </button>

            {/* NO option */}
            <button
              onClick={handleConfirmNo}
              className="w-full flex items-start gap-4 p-4 text-left transition-all duration-150"
              style={{
                border:       `1.5px solid #dce1ec`,
                borderRadius: 4,
                background:   "#f8f9fc",
                cursor:       "pointer",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = PINK;
                (e.currentTarget as HTMLElement).style.background  = "#fdf5f9";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#dce1ec";
                (e.currentTarget as HTMLElement).style.background  = "#f8f9fc";
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${PINK}14`, color: PINK }}
              >
                <FilePlus2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: NAVY }}>
                  No, start a new application
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Skip the lookup and go directly to a blank form to enter fresh information.
                </p>
              </div>
            </button>
          </div>

          {/* Footer note */}
          <div
            className="px-7 pb-6 text-center"
            style={{ fontSize: "0.75em", color: "#9ca3af" }}
          >
            Your information is handled securely and used only for this request.
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════
          Search Modal
      ════════════════════════════════════════════════════ */}
      <Dialog
        open={showSearchModal}
        onOpenChange={(open) => {
          setShowSearchModal(open);
          if (!open) setSearchData({ first_name: "", last_name: "", date_of_birth: "" });
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
            <DialogTitle className="text-lg font-bold" style={{ color: NAVY, fontFamily: "'Georgia', serif" }}>
              Search Your Application
            </DialogTitle>
            <DialogDescription style={{ fontSize: "0.85em" }}>
              Enter your details to find your previous application
            </DialogDescription>
          </DialogHeader>

          <div className="px-7 py-6 space-y-5">
            {[
              { id: "s_fn",  label: "First Name",    key: "first_name",    type: "text", ph: "e.g. Juan"      },
              { id: "s_ln",  label: "Last Name",     key: "last_name",     type: "text", ph: "e.g. Dela Cruz" },
              { id: "s_dob", label: "Date of Birth", key: "date_of_birth", type: "date", ph: ""               },
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

            <p className="text-center text-xs text-muted-foreground pt-1">
              We'll auto-fill the form with your previous details if a match is found.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessFrontDesk;
