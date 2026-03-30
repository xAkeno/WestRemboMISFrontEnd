import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRequestById } from "../services/api";
import { DOCUMENT_LABELS, STATUS_CONFIG } from "@/types/types";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  ArrowLeft, Calendar, AlertTriangle, FileCheck,
  FileText, Upload, Loader2, MessageSquare,
  User, MapPin, Phone, Building2, Briefcase,
  ClipboardList, ShieldCheck, Hash, BadgeInfo,
  CheckCircle, Clock, Banknote, Users, Hammer,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import Header from "../forms/Header";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

// ─── Status badge colors ───────────────────────────────────────────────────────
const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  approved:   { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  pending:    { bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  processing: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  incomplete: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  rejected:   { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
  released:   { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
};

// ─── Service requirements data ─────────────────────────────────────────────────
const serviceData: Record<string, {
  icon: React.ElementType;
  requirements: string[];
  processingTime: string;
  fee: string;
}> = {
  // API key variants mapped below
  barangay_certificate: {
    icon: FileText,
    requirements: [
      "Valid government ID",
      "Barangay residency certificate",
      "Purpose of request",
    ],
    processingTime: "Same day",
    fee: "₱50.00",
  },
  barangay_clearance: {
    icon: ShieldCheck,
    requirements: [
      "Valid government ID",
      "Barangay residency certificate",
      "Community Tax Certificate (Cedula)",
      "2x2 ID photo",
    ],
    processingTime: "1-2 business days",
    fee: "₱100.00",
  },
  business_clearance: {
    icon: Building2,
    requirements: [
      "DTI/SEC Registration",
      "Barangay clearance of business owner",
      "Lease contract or land title",
      "Valid government ID",
    ],
    processingTime: "3-5 business days",
    fee: "₱500.00 - ₱2,000.00",
  },
  building_clearance: {
    icon: Hammer,
    requirements: [
      "Building permit application",
      "Site development plan",
      "Proof of land ownership",
      "Barangay clearance",
    ],
    processingTime: "5-7 business days",
    fee: "₱300.00 - ₱1,000.00",
  },
  resident_registration: {
    icon: Users,
    requirements: [
      "Valid government ID",
      "Proof of residence (utility bill, lease contract)",
      "2x2 ID photos (2 pieces)",
      "Accomplished registration form",
    ],
    processingTime: "1-2 business days",
    fee: "Free",
  },
};

// ─── Requirements panel ────────────────────────────────────────────────────────
function RequirementsPanel({ documentType }: { documentType: string }) {
  // Normalize key: handle slug variants like "barangay-certificate" → "barangay_certificate"
  const key = documentType.replace(/-/g, "_");
  const service = serviceData[key];
  if (!service) return null;

  const Icon = service.icon;

  return (
    <div
      className="rounded-sm border overflow-hidden"
      style={{ borderColor: "#dde3ed" }}
    >
      {/* Panel header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: "#f0f4ff", borderBottom: "1px solid #dde3ed" }}
      >
        <Icon className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: NAVY }}>
          Requirements for this Request
        </span>
      </div>

      <div className="px-4 py-4 grid sm:grid-cols-2 gap-4 bg-white">
        {/* Requirements list */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: PINK }}>
            Documents Needed
          </p>
          <ul className="space-y-2">
            {service.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: NAVY }} />
                <span className="text-xs text-gray-600">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Processing time + fee */}
        <div
          className="flex flex-col gap-4 sm:border-l sm:pl-4"
          style={{ borderColor: "#dde3ed" }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: PINK }}>
              Processing Time
            </p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
              <span className="text-xs font-semibold text-gray-700">{service.processingTime}</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: PINK }}>
              Fee
            </p>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 shrink-0" style={{ color: NAVY }} />
              <span className="text-xs font-semibold text-gray-700">{service.fee}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
const DetailLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: PINK }}>
    {children}
  </p>
);

const DetailValue = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-medium text-foreground">{children || <span className="text-gray-400 italic font-normal text-xs">—</span>}</p>
);

const DetailGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">{children}</div>
);

const DetailField = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
  const display =
    value === true ? "Yes" :
    value === false ? "No" :
    value != null ? String(value) : "";
  return (
    <div>
      <DetailLabel>{label}</DetailLabel>
      <DetailValue>{display}</DetailValue>
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}>
        <Icon className="h-3.5 w-3.5" style={{ color: NAVY }} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: NAVY }}>{title}</p>
      <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
    </div>
    {children}
  </div>
);

// ─── Document-type-specific sections ──────────────────────────────────────────

const CertificateFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Requester Details">
      <DetailGrid>
        <DetailField label="Full Name"           value={r.requester_name} />
        <DetailField label="Age"                 value={r.age} />
        <DetailField label="Date of Birth"       value={r.date_of_birth} />
        <DetailField label="Place of Birth"      value={r.place_of_birth} />
        <DetailField label="Contact No."         value={r.contact_no} />
      </DetailGrid>
    </Section>

    <Section icon={MapPin} title="Address">
      <DetailGrid>
        <DetailField label="Address"             value={r.address} />
        <DetailField label="House Owner"         value={r.house_owner} />
        <DetailField label="Relationship to Owner" value={r.relationship_to_owner} />
      </DetailGrid>
    </Section>

    <Section icon={ClipboardList} title="Certificate Details">
      <DetailGrid>
        <DetailField label="Certificate No."     value={r.bcert_number} />
        <DetailField label="Purpose"             value={r.purpose} />
        <DetailField label="Purpose Details"     value={r.purpose_details} />
        <DetailField label="Period of Residency" value={r.period_of_residency} />
        <DetailField label="Registered Voter"    value={r.registered_voter} />
      </DetailGrid>
    </Section>
  </>
);

const ClearanceFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Requester Details">
      <DetailGrid>
        <DetailField label="Full Name"           value={r.requester_name} />
        <DetailField label="Date of Birth"       value={r.dob} />
        <DetailField label="Place of Birth"      value={r.pob} />
        <DetailField label="Contact No."         value={r.contact_no} />
      </DetailGrid>
    </Section>

    <Section icon={MapPin} title="Address">
      <DetailGrid>
        <DetailField label="Address"             value={r.address} />
        <DetailField label="House Owner"         value={r.house_owner} />
        <DetailField label="Relationship to Owner" value={r.relationship_to_owner} />
      </DetailGrid>
    </Section>

    <Section icon={ClipboardList} title="Clearance Details">
      <DetailGrid>
        <DetailField label="Clearance No."       value={r.bcert_number} />
        <DetailField label="Purpose"             value={r.purpose} />
        <DetailField label="Purpose Details"     value={r.purpose_details} />
        <DetailField label="Period of Residency" value={r.period_of_residency} />
        <DetailField label="Registered Voter"    value={r.registered_voter} />
      </DetailGrid>
    </Section>

    <Section icon={Hash} title="Official Reference">
      <DetailGrid>
        <DetailField label="CTC / VRR No."       value={r.ctc_vrr_no} />
        <DetailField label="Issued At"           value={r.issued_at} />
        <DetailField label="Issued On"           value={r.issued_on} />
        <DetailField label="O.R. Number"         value={r.or_no} />
      </DetailGrid>
    </Section>
  </>
);

const BuildingFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Applicant Details">
      <DetailGrid>
        <DetailField label="Full Name"           value={r.requester_name} />
      </DetailGrid>
    </Section>

    <Section icon={Building2} title="Building Details">
      <DetailGrid>
        <DetailField label="Establishment"       value={r.raw?.establishment} />
        <DetailField label="Purpose"             value={r.purpose} />
        <DetailField label="Purpose Details"     value={r.purpose_details} />
      </DetailGrid>
    </Section>

    <Section icon={MapPin} title="Project Location">
      <DetailGrid>
        <DetailField label="Address"             value={r.address} />
      </DetailGrid>
    </Section>

    <Section icon={ShieldCheck} title="Clearance Info">
      <DetailGrid>
        <DetailField label="Clearance No."       value={r.bcert_number} />
        <DetailField label="O.R. Number"         value={r.raw?.orNo} />
        <DetailField label="Punong Barangay"     value={r.raw?.punongBarangay} />
        <DetailField label="Barangay Position"   value={r.raw?.barangayPosition} />
        {r.updated_by && <DetailField label="Updated By"   value={r.updated_by} />}
      </DetailGrid>
    </Section>
  </>
);

const BusinessFields = ({ r }: { r: any }) => (
  <>
    <Section icon={User} title="Owner Details">
      <DetailGrid>
        <DetailField label="Full Name"           value={r.requester_name} />
      </DetailGrid>
    </Section>

    <Section icon={Briefcase} title="Business Information">
      <DetailGrid>
        <DetailField label="Business Name"       value={r.raw?.businessName ?? r.purpose} />
        <DetailField label="Business Type"       value={r.raw?.businessType} />
        <DetailField label="Business Details"    value={r.purpose_details} />
        <DetailField label="Capital (PHP)"       value={r.capital != null ? `₱${r.capital}` : ""} />
      </DetailGrid>
    </Section>

    <Section icon={MapPin} title="Business Address">
      <DetailGrid>
        <DetailField label="Address"             value={r.address} />
      </DetailGrid>
    </Section>

    <Section icon={ClipboardList} title="Clearance Details">
      <DetailGrid>
        <DetailField label="Barangay Business No." value={r.bcert_number} />
        <DetailField label="O.R. Number"         value={r.raw?.orNo} />
        {r.updated_by && <DetailField label="Updated By"   value={r.updated_by} />}
      </DetailGrid>
    </Section>

    <Section icon={BadgeInfo} title="Inspection Details">
      <DetailGrid>
        <DetailField label="Inspected By"        value={r.inspected_by} />
        <DetailField label="Date of Inspection"  value={r.date_of_inspection} />
        <DetailField label="Inspection Remarks"  value={r.raw?.inspectionRemarks} />
        <DetailField label="Additional Notes"    value={r.inspected_notes} />
      </DetailGrid>
    </Section>
  </>
);

// ─── Main component ────────────────────────────────────────────────────────────
export default function RequestDetail() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const { id, type } = useParams<{ id: string; type: string }>();

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", type, id],
    queryFn: () => fetchRequestById(type!, id!),
    enabled: !!id && !!type,
  });

  console.log("Request data:", request);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast({ title: "File Uploaded", description: "Your document has been uploaded successfully." });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#f0f4ff", borderRadius: 2 }}>
            <FileText className="w-7 h-7" style={{ color: NAVY }} />
          </div>
          <p className="text-muted-foreground text-sm mb-4">Request not found.</p>
          <button
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200"
            style={{ backgroundColor: NAVY, borderRadius: 1 }}
            onClick={() => navigate("/myrequest")}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const normalizedStatus = request.raw.status?.toLowerCase();
  const badge = statusStyle[normalizedStatus] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    border: "#d1d5db",
  };
  console.log(request)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">

        {/* Back button */}
        <button
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6 transition-colors duration-200 group"
          style={{ color: "#6b7280" }}
          onClick={() => navigate("/myrequest")}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = NAVY}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#6b7280"}
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Requests
        </button>

        {/* ── Main card ── */}
        <div
          className="bg-card border border-border overflow-hidden"
          style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
        >
          {/* Card header */}
          <div
            className="px-6 py-5"
            style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 mb-1.5">
                  <div style={{ width: 16, height: 1, backgroundColor: PINK }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: PINK }}>
                    Service Request
                  </p>
                </div>
                <h2
                  className="font-bold text-foreground flex items-center gap-2"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "1.1rem" }}
                >
                  <FileText className="h-5 w-5 flex-shrink-0" style={{ color: NAVY }} />
                  {DOCUMENT_LABELS[request.document_type]}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-bold" style={{ color: PINK }}>Ref: </span>
                  {request.id}
                  {request.bcert_number && (
                    <span className="ml-3">
                      <span className="font-bold" style={{ color: PINK }}>Doc No.: </span>
                      {request.bcert_number}
                    </span>
                  )}
                </p>
              </div>

              {/* Status badge */}
              <span
                className="self-start text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border flex-shrink-0"
                style={{
                  backgroundColor: badge.bg,
                  color: badge.text,
                  borderColor: badge.border,
                  borderRadius: 2,
                }}
              >
                {normalizedStatus}
              </span>
            </div>
          </div>

          {/* ── Card body ── */}
          <div className="p-6 space-y-7">

            {/* ── Requirements panel (type-aware) ── */}
            <RequirementsPanel documentType={request.document_type} />
            {/* ── Submission meta ── */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm pb-5"
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <div>
                <DetailLabel>Date Submitted</DetailLabel>
                <DetailValue>{format(new Date(request.created_at), "MMMM d, yyyy")}</DetailValue>
              </div>
              {request.updated_at && (
                <div>
                  <DetailLabel>Last Updated</DetailLabel>
                  <DetailValue>{format(new Date(request.updated_at), "MMMM d, yyyy")}</DetailValue>
                </div>
              )}
            </div>

            {/* ── Document-type-specific fields ── */}
            {request.document_type === "barangay_certificate" && <CertificateFields r={request} />}
            {request.document_type === "barangay_clearance"   && <ClearanceFields   r={request} />}
            {request.document_type === "building_clearance"   && <BuildingFields    r={request} />}
            {request.document_type === "business_clearance"   && <BusinessFields    r={request} />}

            {/* ── Scheduled pickup ── */}
            {request.scheduled_date && (
              <div
                className="flex items-center gap-3 p-4"
                style={{ backgroundColor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0", borderLeftWidth: 3, borderLeftColor: "#16a34a" }}
              >
                <Calendar className="h-5 w-5 flex-shrink-0" style={{ color: "#16a34a" }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#15803d" }}>Scheduled Pickup</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(request.scheduled_date), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            )}

            {/* ── Missing items ── */}
            {request.missing_items && request.missing_items.length > 0 && (
              <div
                className="p-4"
                style={{ backgroundColor: "#fefce8", borderRadius: 2, border: "1px solid #fde68a", borderLeftWidth: 3, borderLeftColor: "#ca8a04" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#ca8a04" }} />
                  <p className="font-semibold text-sm" style={{ color: "#92400e" }}>Missing Information Required</p>
                </div>
                <ul className="space-y-1.5 ml-7">
                  {request.missing_items.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span style={{ color: "#ca8a04", flexShrink: 0 }}>—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Remarks ── */}
            {request.remarks && (
              <div
                className="p-4"
                style={{ backgroundColor: "#fff1f2", borderRadius: 2, border: "1px solid #fecdd3", borderLeftWidth: 3, borderLeftColor: "#e11d48" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-5 w-5 flex-shrink-0" style={{ color: "#e11d48" }} />
                  <p className="font-semibold text-sm" style={{ color: "#9f1239" }}>Remarks</p>
                </div>
                <p className="text-sm text-muted-foreground ml-7">{request.remarks}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}