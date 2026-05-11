import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, FileText, ShieldCheck, Building2, Hammer, CheckCircle, Clock, Banknote, Loader2,
} from "lucide-react";
import axios from "axios";
import Header from "@/components/forms/Header";
import Footer from "@/components/forms/Footer";

// ── Icon map: API service name → lucide icon ──────────────────────────────────
const iconMap: Record<string, typeof Users> = {
  "Barangay Certificate": FileText,
  "Barangay Clearance":   ShieldCheck,
  "Business Clearance":   Building2,
  "Building Clearance":   Hammer,
};

const defaultIcon = FileText;

// ── Slug map: URL param → API service name ────────────────────────────────────
const slugToName: Record<string, string> = {
  "barangay-certificate": "Barangay Certificate",
  "barangay-clearance":   "Barangay Clearance",
  "business-clearance":   "Business Clearance",
  "building-clearance":   "Building Clearance",
};

// ── Route map: URL param → application route ──────────────────────────────────
const slugToRoute: Record<string, string> = {
  "barangay-certificate": "/services",
  "barangay-clearance":   "/services",
  "business-clearance":   "/services",
  "building-clearance":   "/services",
};

interface ServiceInfo {
  title: string;
  description: string;
  requirements: string[];
  processingTime: string;
  fee: string;
  icon: typeof Users;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />
);

// ── Main Component ────────────────────────────────────────────────────────────
const ServicePage = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<ServiceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── Scroll to top whenever serviceId changes ──────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [serviceId]);

  // ── Fetch service data from API ───────────────────────────────────────────
  useEffect(() => {
    if (!serviceId) { setNotFound(true); setLoading(false); return; }

    const apiName = slugToName[serviceId];
    if (!apiName) { setNotFound(true); setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await axios.get(`${import.meta.env.VITE_WEB_URL}/api/services`, { withCredentials: true });
        const services: any[] = res.data?.data ?? res.data ?? [];
        const match = services.find((s) => s.name === apiName);

        if (!match) { setNotFound(true); return; }

        setService({
          title: match.name ?? apiName,
          description: match.description ?? "",
          requirements: match.requirements
            ? match.requirements.split("\n").map((r: string) => r.trim()).filter(Boolean)
            : [],
          processingTime: match.processing_time ?? "",
          fee: match.fee ?? "",
          icon: iconMap[match.name] ?? defaultIcon,
        });
      } catch (e) {
        console.error("Failed to fetch service:", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [serviceId]);

  // ── Not found state ───────────────────────────────────────────────────────
  if (!loading && notFound) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div
              className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#f0f4ff", borderRadius: 2 }}
            >
              <FileText className="w-7 h-7" style={{ color: "#0f2a5e" }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              Service Not Found
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              The service you're looking for doesn't exist or may have been moved.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold uppercase tracking-wider transition-all"
              style={{ backgroundColor: "#0f2a5e", borderRadius: 1, letterSpacing: "0.08em" }}
            >
              Return to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = service?.icon ?? defaultIcon;
  const applicationRoute = serviceId ? (slugToRoute[serviceId] ?? "/services") : "/services";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12 pt-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider mb-8 transition-colors duration-200 group"
            style={{ color: "#6b7280", letterSpacing: "0.07em" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#0f2a5e"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#6b7280"}
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Services
          </Link>

          {/* Main card */}
          <div
            className="bg-card border border-border overflow-hidden"
            style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: "#c2467d" }}
          >
            <div className="p-6 sm:p-8 md:p-12">

              {/* ── Loading state ── */}
              {loading ? (
                <div>
                  {/* Header row skeleton */}
                  <div className="flex items-start gap-5 mb-8">
                    <Skeleton className="w-14 h-14 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-7 w-64" />
                      <Skeleton className="h-0.5 w-10 mt-2" />
                    </div>
                  </div>
                  {/* Description skeleton */}
                  <div className="space-y-2 mb-10">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  {/* Grid skeleton */}
                  <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-3">
                      <Skeleton className="h-3 w-24 mb-4" />
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="w-5 h-5 flex-shrink-0" />
                          <Skeleton className="h-4 flex-1" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full rounded" />
                      <Skeleton className="h-24 w-full rounded" />
                    </div>
                  </div>
                  {/* Button skeleton */}
                  <Skeleton className="h-11 w-52" />
                </div>
              ) : service ? (
                <>
                  {/* ── Header row ── */}
                  <div className="flex items-start gap-5 mb-8">
                    <div
                      className="w-14 h-14 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#f0f4ff", borderRadius: 2 }}
                    >
                      <Icon className="w-7 h-7" style={{ color: "#0f2a5e" }} strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "#c2467d" }}>
                        Barangay Service
                      </p>
                      <h1
                        className="font-bold text-foreground"
                        style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                      >
                        {service.title}
                      </h1>
                      <div style={{ width: 40, height: 2, backgroundColor: "#c2467d", marginTop: 10 }} />
                    </div>
                  </div>

                  {/* Description */}
                  {service.description && (
                    <p className="text-base text-muted-foreground mb-10 leading-relaxed">
                      {service.description}
                    </p>
                  )}

                  {/* Requirements + Meta */}
                  <div className="grid md:grid-cols-2 gap-8 mb-10">

                    {/* Requirements */}
                    <div>
                      <h3
                        className="text-base font-bold text-foreground mb-4 uppercase tracking-wider"
                        style={{ fontSize: "0.75rem", color: "#0f2a5e", letterSpacing: "0.12em" }}
                      >
                        Requirements
                      </h3>
                      {service.requirements.length > 0 ? (
                        <ul className="space-y-3">
                          {service.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div
                                className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: "#fdf5f8", borderRadius: 1 }}
                              >
                                <CheckCircle className="w-3.5 h-3.5" style={{ color: "#c2467d" }} />
                              </div>
                              <span className="text-muted-foreground text-sm leading-relaxed">{req}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No requirements listed.</p>
                      )}
                    </div>

                    {/* Meta cards */}
                    <div className="space-y-4">
                      {service.processingTime && (
                        <div
                          className="p-5 border"
                          style={{ backgroundColor: "#f8faff", borderColor: "#dde3ed", borderRadius: 2, borderLeftWidth: 2, borderLeftColor: "#0f2a5e" }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4" style={{ color: "#0f2a5e" }} />
                            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>
                              Processing Time
                            </h4>
                          </div>
                          <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Georgia', serif" }}>
                            {service.processingTime}
                          </p>
                        </div>
                      )}

                      {service.fee && (
                        <div
                          className="p-5 border"
                          style={{ backgroundColor: "#fdf5f8", borderColor: "#f0c4d8", borderRadius: 2, borderLeftWidth: 2, borderLeftColor: "#c2467d" }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Banknote className="w-4 h-4" style={{ color: "#c2467d" }} />
                            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c2467d" }}>
                              Service Fee
                            </h4>
                          </div>
                          <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Georgia', serif" }}>
                            {service.fee === "Free" ? "Free" : `₱${service.fee}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate(applicationRoute)}
                    className="px-10 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all duration-200"
                    style={{ backgroundColor: "#0f2a5e", borderRadius: 1, letterSpacing: "0.08em" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"}
                  >
                    Proceed to Application
                  </button>
                </>
              ) : null}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServicePage;