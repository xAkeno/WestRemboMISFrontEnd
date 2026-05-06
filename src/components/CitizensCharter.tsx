import { Clock } from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import axios from "axios";
import Header from "@/components/forms/Header";
import Footer from "@/components/forms/Footer";

interface ContactInfo {
  id?: number;
  address: string;
  email: string;
  telephone: string;
  facebook: string;
  office_days: string;
  office_hours: string;
}

const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
};

// ── Fee Group sub-component ──────────────────────────────────────────────────
const FeeGroup = ({
  letter,
  title,
  rows,
}: {
  letter: string;
  title: string;
  rows: { label: string; amount: string }[];
}) => (
  <div>
    <div className="flex items-start gap-3 mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5"
        style={{ background: "#0f2a5e", color: "#e8a0bf" }}
      >
        {letter}
      </div>
      <p className="font-bold text-sm" style={{ color: "#0f2a5e" }}>
        {title}
      </p>
    </div>
    <div
      className="ml-10 rounded-lg overflow-hidden"
      style={{ border: "1px solid rgba(15,42,94,0.12)" }}
    >
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="flex justify-between items-center px-4 py-2.5"
          style={{
            background: i % 2 === 0 ? "rgba(15,42,94,0.03)" : "#fff",
            borderBottom: i < rows.length - 1 ? "1px solid rgba(15,42,94,0.07)" : "none",
          }}
        >
          <span className="text-xs" style={{ color: "rgba(15,42,94,0.80)" }}>
            {r.label}
          </span>
          <span
            className="text-xs font-bold ml-4 flex-shrink-0"
            style={{ color: r.amount === "WAIVED" ? "#16a34a" : "#c2467d" }}
          >
            {r.amount}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
const CitizensCharter = () => {
  const API_BASE = "https://westrembomis.onrender.com/api";

  const defaultContact: ContactInfo = {
    address: "Plaza Drive A. Mabini Street (21st), Barangay West Rembo, Taguig City",
    email: "westrembofficial@gmail.com",
    telephone: "(02) 8836 9731 / (02) 8836 9732 / (02) 8836 9733",
    facebook: "https://www.facebook.com/KapLeoBes",
    office_days: "Monday–Saturday",
    office_hours: "5:00 AM – 6:00 PM",
  };

  const [form, setForm] = useState<ContactInfo>(defaultContact);

  const loadData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/contact`, { withCredentials: true });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data) && data.length > 0) {
        setForm(data[data.length - 1]);
      } else if (data) {
        setForm(data);
      } else {
        setForm(defaultContact);
      }
    } catch {
      setForm(defaultContact);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Palette from the CTA section ───────────────────────────────────────────
  // Navy:    #0f2a5e  /  #1a3d7c
  // Pink:    #c2467d  /  #e8a0bf
  // Dark bg: #3b1030
  // ────────────────────────────────────────────────────────────────────────────

  const BarangayLogo = () => (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xs text-center"
      style={{
        background: "linear-gradient(135deg, #c2467d, #e8a0bf)",
        color: "#0f2a5e",
        border: "3px solid rgba(255,255,255,0.30)",
      }}
    >
      WEST
      <br />
      REMBO
    </div>
  );

  const services = [
    {
      id: "barangay-clearance",
      number: "1",
      title: "BARANGAY CLEARANCE",
      headerGradient: "linear-gradient(135deg, #0f2a5e 0%, #1a3d7c 100%)",
      accentBorder: "#c2467d",
      accentBg: "rgba(194,70,125,0.06)",
      stepBg: "#c2467d",
      icon: "📋",
      duration: "7 MINUTES",
      steps: [
        {
          num: 1,
          title: "Apply through the website",
          description: "Get a request slip from the Information Desk and fill out the same",
          duration: "1 MINUTE",
          office: "INFORMATION DESK",
        },
        {
          num: 2,
          title: "Go to the scheduled appointment",
          description:
            "Submit the request slip together with the requirements for recording & tracking",
          duration: "1 MINUTE",
          office: "INFORMATION DESK",
        },
        {
          num: 3,
          title: "Review of requirements",
          description: "Proceed to the Clearance Section for the encoding",
          duration: "1 MINUTE",
          office: "CLEARANCE SECTION",
        },
        {
          num: 4,
          title: "Signature / Approval",
          description:
            "Proceed to the Secretary's Office / Kagawad's Office or Punong Barangay's Office for assessment and signature",
          duration: "3 MINUTES",
          office: "SECRETARY'S OFFICE / KAGAWAD'S OFFICE / FB OFFICE",
        },
        {
          num: 5,
          title: "Payment of fees",
          description: "Pay the corresponding fee",
          duration: "1 MINUTE",
          office: "CLEARANCE SECTION (CASHIER)",
        },
      ],
    },
    {
      id: "business-clearance",
      number: "2",
      title: "BUSINESS / BUILDING CLEARANCE",
      headerGradient: "linear-gradient(135deg, #3b1030 0%, #1a3d7c 100%)",
      accentBorder: "#e8a0bf",
      accentBg: "rgba(232,160,191,0.07)",
      stepBg: "#e8a0bf",
      icon: "🏢",
      duration: "1 DAY AND 5 MINUTES",
      steps: [
        {
          num: 1,
          title: "Apply through the website",
          description: "Get a request slip from the Information Desk and fill out the same",
          duration: "1 MINUTE",
          office: "INFORMATION DESK",
        },
        {
          num: 2,
          title: "Go to the scheduled appointment",
          description:
            "Submit the request slip together with the requirements for recording & tracking",
          duration: "1 MINUTE",
          office: "INFORMATION DESK",
        },
        {
          num: 3,
          title: "Review of requirements",
          description: "Proceed to the Clearance Section for the encoding",
          duration: "1 MINUTE",
          office: "CLEARANCE SECTION",
        },
        {
          num: 4,
          title: "Signature / Approval",
          description: "For Inspection & Verification of Documents Submitted",
          duration: "1 DAY",
          office: "BARANGAY INSPECTOR",
        },
        {
          num: 5,
          title: "Review of requirements",
          description: "Claim the request at the Clearance Section",
          duration: "1 MINUTE",
          office: "CLEARANCE SECTION",
        },
        {
          num: 6,
          title: "Payment of fees",
          description: "Pay the corresponding fee",
          duration: "1 MINUTE",
          office: "CLEARANCE SECTION (CASHIER)",
        },
      ],
    },
  ];

  const allServicesMenu = [
    "Indigency",
    "Job Employment",
    "Good Moral",
    "Local Employment",
    "Marriage License",
    "Yellow Card",
    "Travel / Passport",
    "Foreign Purposes",
    "Bank Requirement",
    "Scholarship",
    "Lot / Title / Motor Survey",
    "Blue Card",
    "Business / Residency",
    "BLOA / LOAD",
    "Load / Bayard / Trucking",
    "Green Card",
    "Public Attorney's Office",
    "White Card",
    "BIR Requirement",
    "School Requirement",
    "Tax Assessment",
    "PWD / Solo ID Application",
    "House ID / Assessment",
    "Makati EMI Card",
  ];

  const { ref: contentRef, visible: contentVisible } = useScrollReveal(0.1);

  return (
    <div className="min-h-screen" style={{ background: "#f5f6fa" }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          opacity: 0;
          animation: fadeSlideUp 0.65s ease forwards;
        }
        .step-row + .step-row {
          border-top: 1px solid rgba(15,42,94,0.08);
          padding-top: 1.25rem;
          margin-top: 1.25rem;
        }
      `}</style>

      {/* ── Shared Header ──────────────────────────────────────────────── */}
      <Header />

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden py-10 px-4 md:px-8"
        style={{
          background: "linear-gradient(145deg, #0f2a5e 0%, #1a3d7c 55%, #3b1030 100%)",
          borderBottom: "4px solid #c2467d",
        }}
      >
        {/* Diagonal texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.04,
            backgroundImage:
              "repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)",
          }}
        />

        <div className="max-w-7xl mx-auto relative">
          {/* Logo + Title */}
          <div
            className="flex items-start gap-6 mb-8 pb-7"
            style={{ borderBottom: "1px solid rgba(194,70,125,0.35)" }}
          >
            <BarangayLogo />
            <div className="flex-1">
              <p
                className="text-xs font-bold uppercase tracking-[0.22em] mb-2"
                style={{ color: "#e8a0bf" }}
              >
                Barangay West Rembo · Taguig City
              </p>
              <h1
                className="text-4xl md:text-5xl font-black text-white leading-tight"
                style={{ letterSpacing: "-0.01em" }}
              >
                CITIZEN'S CHARTER
              </h1>
              <div
                className="mt-2 text-sm font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Steps in Securing Certificates and Clearances
              </div>
            </div>
          </div>

          {/* Services grid */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.20em] mb-4"
              style={{ color: "#e8a0bf" }}
            >
              Types of Services Available
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {allServicesMenu.map((service, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span style={{ color: "#c2467d", fontSize: "1rem", lineHeight: 1, marginTop: 2 }}>
                    ✓
                  </span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.80)" }}>
                    {service}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-14" ref={contentRef}>
        <div className="space-y-10">
          {services.map((service, serviceIdx) => (
            <div
              key={service.id}
              className={contentVisible ? "fade-up" : "opacity-0"}
              style={{ animationDelay: `${serviceIdx * 180}ms` }}
            >
              {/* Service header bar */}
              <div
                className="rounded-t-2xl px-7 md:px-10 py-6 flex items-center gap-5"
                style={{
                  background: service.headerGradient,
                  borderBottom: `3px solid ${service.accentBorder}`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* texture */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    opacity: 0.04,
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)",
                  }}
                />
                <div className="text-4xl relative">{service.icon}</div>
                <div className="relative">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.18em] mb-0.5"
                    style={{ color: service.accentBorder }}
                  >
                    Service No. {service.number}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black text-white" style={{ letterSpacing: "-0.01em" }}>
                    {service.title}
                  </h2>
                </div>
              </div>

              {/* Service body */}
              <div
                className="rounded-b-2xl px-7 md:px-10 py-8"
                style={{
                  background: "#fff",
                  border: `1.5px solid ${service.accentBorder}`,
                  borderTop: "none",
                  boxShadow: "0 4px 32px rgba(15,42,94,0.07)",
                }}
              >
                {/* Column headers */}
                <div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-4"
                  style={{ borderBottom: `1.5px solid rgba(15,42,94,0.10)` }}
                >
                  {["Steps", "Duration", "Accountable Office"].map((h) => (
                    <p
                      key={h}
                      className="text-xs font-black uppercase tracking-[0.18em]"
                      style={{ color: "#0f2a5e" }}
                    >
                      {h}
                    </p>
                  ))}
                </div>

                {/* Steps */}
                <div>
                  {service.steps.map((step, si) => (
                    <div
                      key={step.num}
                      className={`grid grid-cols-1 md:grid-cols-3 gap-4 items-start step-row${si > 0 ? " step-row" : ""}`}
                    >
                      {/* Step title + desc */}
                      <div className="flex gap-4">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5"
                          style={{
                            background: service.stepBg,
                            color: service.stepBg === "#e8a0bf" ? "#0f2a5e" : "#fff",
                          }}
                        >
                          {step.num}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: "#0f2a5e" }}>
                            {step.title}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "rgba(15,42,94,0.60)" }}>
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-2 md:justify-center">
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "#c2467d" }} />
                        <span className="text-xs font-bold" style={{ color: "#0f2a5e" }}>
                          {step.duration}
                        </span>
                      </div>

                      {/* Office */}
                      <p
                        className="text-xs font-semibold md:text-right"
                        style={{ color: "rgba(15,42,94,0.70)" }}
                      >
                        {step.office}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total duration footer */}
                <div
                  className="mt-8 pt-5 flex flex-wrap items-center gap-3"
                  style={{ borderTop: `1.5px solid rgba(15,42,94,0.10)` }}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                    style={{ background: "#0f2a5e" }}
                  >
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span
                    className="text-sm font-black uppercase tracking-wide"
                    style={{ color: "#c2467d" }}
                  >
                    Total Duration: {service.duration}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(15,42,94,0.55)" }}>
                    (with complete requirements / documents presented & submitted)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Article B: Clearance & Certification Fees ──────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-14">
        {/* Section header */}
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{ boxShadow: "0 4px 32px rgba(15,42,94,0.10)" }}
        >
          <div
            className="px-8 py-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0f2a5e 0%, #3b1030 100%)",
              borderBottom: "3px solid #c2467d",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: 0.04,
                backgroundImage:
                  "repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)",
              }}
            />
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-1 relative" style={{ color: "#e8a0bf" }}>
              Article B
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white relative" style={{ letterSpacing: "-0.01em" }}>
              CLEARANCE AND CERTIFICATION FEES
            </h2>
            <p className="text-sm mt-1 relative" style={{ color: "rgba(255,255,255,0.60)" }}>
              Section 2. Imposition of Fees — The following Barangay Clearance and Certification fees shall be collected.
            </p>
          </div>

          {/* Fees body */}
          <div className="bg-white px-8 py-8 space-y-8">

            {/* A. Residency */}
            <FeeGroup
              letter="A"
              title="Pertaining to Residency of Any Individual"
              rows={[
                { label: "Employment — Local", amount: "Php 25.00" },
                { label: "Employment — Foreign", amount: "Php 25.00" },
                { label: "Yellow Card and Philhealth Application", amount: "Php 25.00" },
                { label: "School Requirement", amount: "Php 25.00" },
                { label: "Senior Citizen's Card (White, Blu, Yellow & Philhealth)", amount: "WAIVED" },
                { label: "PWD's Benefit Cards (Philhealth, Yellow)", amount: "WAIVED" },
                { label: "PVAO Application", amount: "WAIVED" },
                { label: "Reference Purposes", amount: "Php 25.00" },
                { label: "Loan Purpose / Bank Requirement", amount: "Php 25.00" },
                { label: "Postal ID", amount: "Php 25.00" },
                { label: "Police Clearance / NBI Clearance", amount: "Php 25.00" },
                { label: "Comelec Requirement / NSO / PSA", amount: "Php 25.00" },
                { label: "Travel Abroad, VISA / Passport Application", amount: "Php 50.00" },
                { label: "Bailbond", amount: "Php 50.00" },
                { label: "Bona fide Residency", amount: "Php 50.00" },
                { label: "Barangay ID", amount: "Php 75.00" },
              ]}
            />

            {/* B. Character & Status */}
            <FeeGroup
              letter="B"
              title="Pertaining to Character and Status as an Individual"
              rows={[
                { label: "Good Moral Character", amount: "Php 50.00" },
                { label: "Marriage License", amount: "Php 50.00" },
                { label: "No Derogatory Record", amount: "Php 50.00" },
                { label: "Indigency", amount: "Php 50.00" },
                { label: "Live-in / Solo Parent", amount: "Php 50.00" },
                { label: "Scholarship / UMAK Consortia", amount: "Php 50.00" },
                { label: "Green Card", amount: "Php 50.00" },
              ]}
            />

            {/* C. Business */}
            <FeeGroup
              letter="C"
              title="Pertaining to Business and Commercial Establishments (Capital Investment)"
              rows={[
                { label: "Php 5,000.00 and below", amount: "Php 100.00" },
                { label: "Php 5,001 – Php 10,000.00", amount: "Php 200.00" },
                { label: "Php 10,001 – Php 30,000.00", amount: "Php 300.00" },
                { label: "Php 30,001 – Php 50,000.00", amount: "Php 400.00" },
                { label: "Php 50,001 – Php 100,000.00", amount: "Php 500.00" },
                { label: "Php 100,001 – Php 250,000.00", amount: "Php 600.00" },
                { label: "Php 250,001 – Php 500,000.00", amount: "Php 700.00" },
                { label: "Php 500,001 – Php 1,000,000.00", amount: "Php 800.00" },
                { label: "Php 1,000,001.00 and Above", amount: "Php 1,000.00" },
              ]}
            />

            {/* D–E single-row groups */}
            <FeeGroup
              letter="D"
              title="Pertaining to Clearance Fees for Computer Shops / Internet Cafe"
              rows={[{ label: "Per unit", amount: "Php 100.00 / unit" }]}
            />
            <FeeGroup
              letter="E"
              title="Pertaining to Clearance for Junkshops"
              rows={[{ label: "Per square meter", amount: "Php 20.00 / sqm." }]}
            />

            {/* F. Construction */}
            <FeeGroup
              letter="F"
              title="Pertaining to Clearance to Construct / Repair Residential / Commercial Buildings / Establishments"
              rows={[
                { label: "Repair / Renovation", amount: "Php 200.00" },
                { label: "Construction (New)", amount: "Php 300.00" },
                { label: "Additional Floor (Storey)", amount: "Php 200.00" },
                { label: "Demolition", amount: "Php 200.00" },
                { label: "Fencing", amount: "Php 200.00" },
                { label: "Excavation", amount: "Php 200.00" },
                { label: "Roofing", amount: "Php 200.00" },
              ]}
            />

            {/* G. Advertisements */}
            <FeeGroup
              letter="G"
              title="Pertaining to Promotional Advertisements"
              rows={[
                { label: "Billboard", amount: "Php 500.00" },
                { label: "Booth (per day)", amount: "Php 500.00" },
                { label: "Tarp (per piece for 1 week display)", amount: "Php 50.00" },
                { label: "Mobile Advertisements / Distribution of Flyers (per day)", amount: "Php 200.00" },
                { label: "Product Demonstration (per day)", amount: "Php 200.00" },
              ]}
            />

            {/* H. Utilities */}
            <FeeGroup
              letter="H"
              title="Pertaining to Utilities and Subscriptions"
              rows={[
                { label: "Telephone / Cable Network", amount: "Php 50.00" },
                { label: "Internet / Broadband", amount: "Php 50.00" },
                { label: "Electricity / Water", amount: "Php 50.00" },
              ]}
            />

            {/* I. Service Providers */}
            <FeeGroup
              letter="I"
              title="Pertaining to Installation and Maintenance of Service Providers (Per Month)"
              rows={[{ label: "Monthly fee", amount: "Php 1,000.00" }]}
            />

            {/* J. Lots */}
            <FeeGroup
              letter="J"
              title="Pertaining to the Lots in the Barangay"
              rows={[
                { label: "Lot Titling / Lot Survey", amount: "Php 100.00" },
                { label: "Tax Assessment", amount: "Php 50.00" },
              ]}
            />

            {/* K. Barangay Properties */}
            <FeeGroup
              letter="K"
              title="Pertaining to the Use of Barangay Properties"
              rows={[
                { label: "Chairs / piece", amount: "Php 10.00" },
                { label: "Tables / piece", amount: "Php 50.00" },
              ]}
            />

            {/* Lupon Filing Fee */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1.5px solid #c2467d" }}
            >
              <div
                className="px-5 py-3"
                style={{ background: "linear-gradient(90deg, #c2467d, #3b1030)" }}
              >
                <p className="text-white font-black text-sm uppercase tracking-[0.15em]">
                  LUPON FILING FEE
                </p>
              </div>
              <div className="px-5 py-4 divide-y divide-gray-100">
                {[
                  { label: "Civil Dispute", amount: "Php 200.00" },
                  { label: "Criminal Dispute", amount: "Php 100.00" },
                  { label: "Certificate to File Action (CTFA)", amount: "Php 50.00" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between items-center py-2">
                    <span className="text-sm" style={{ color: "#0f2a5e" }}>{r.label}</span>
                    <span className="text-sm font-bold" style={{ color: "#c2467d" }}>{r.amount}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Page Footer note + contact ──────────────────────────────────── */}
      <section
        className="py-10 px-4 md:px-8"
        style={{
          background: "linear-gradient(145deg, #0f2a5e 0%, #1a3d7c 55%, #3b1030 100%)",
          borderTop: "4px solid #c2467d",
        }}
      >
        {/* texture */}
        <div
          className="pointer-events-none"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage:
              "repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)",
          }}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Note */}
          <div
            className="rounded-xl p-6 flex gap-4"
            style={{
              background: "rgba(194,70,125,0.12)",
              border: "1.5px solid rgba(194,70,125,0.35)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
              style={{ background: "#c2467d", color: "#fff" }}
            >
              ℹ
            </div>
            <div>
              <p className="font-bold mb-1" style={{ color: "#e8a0bf" }}>
                NOTE:
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                After the verification and inspection, papers will be forwarded to the Office of
                the Punong Barangay for Signature.
              </p>
            </div>
          </div>

          {/* Office hours quick info */}
          <div
            className="rounded-xl p-6"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.12)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5" style={{ color: "#e8a0bf" }} />
              <p className="font-bold" style={{ color: "#e8a0bf" }}>
                Office Hours
              </p>
            </div>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              {form.office_days}
            </p>
            <p className="text-xl font-black text-white mb-3">{form.office_hours}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              {form.address}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              {form.telephone}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
              {form.email}
            </p>
          </div>
        </div>
      </section>

      {/* ── Shared Footer ───────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
};

export default CitizensCharter;