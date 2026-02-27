import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, FileText, ShieldCheck, Building2, Hammer, CheckCircle, Clock, Banknote } from "lucide-react";
import Header from "@/components/forms/Header";
import Footer from "@/components/forms/Footer";

const serviceData: Record<string, {
  icon: typeof Users;
  title: string;
  description: string;
  requirements: string[];
  processingTime: string;
  fee: string;
}> = {
  "resident-registration": {
    icon: Users,
    title: "Resident Registration",
    description: "Register as a resident of Barangay West Rembo to access various barangay services and programs.",
    requirements: [
      "Valid government ID",
      "Proof of residence (utility bill, lease contract)",
      "2x2 ID photos (2 pieces)",
      "Accomplished registration form",
    ],
    processingTime: "1-2 business days",
    fee: "Free",
  },
  "barangay-certificate": {
    icon: FileText,
    title: "Barangay Certificate",
    description: "Request for barangay certificate documentation for employment, school enrollment, or other purposes.",
    requirements: [
      "Valid government ID",
      "Barangay residency certificate",
      "Purpose of request",
    ],
    processingTime: "Same day",
    fee: "₱50.00",
  },
  "barangay-clearance": {
    icon: ShieldCheck,
    title: "Barangay Clearance",
    description: "Apply for barangay clearance needed for employment, business permits, or other legal purposes.",
    requirements: [
      "Valid government ID",
      "Barangay residency certificate",
      "Community Tax Certificate (Cedula)",
      "2x2 ID photo",
    ],
    processingTime: "1-2 business days",
    fee: "₱100.00",
  },
  "business-clearance": {
    icon: Building2,
    title: "Business Clearance",
    description: "Apply for business permit clearance required for operating a business within the barangay.",
    requirements: [
      "DTI/SEC Registration",
      "Barangay clearance of business owner",
      "Lease contract or land title",
      "Valid government ID",
    ],
    processingTime: "3-5 business days",
    fee: "₱500.00 - ₱2,000.00",
  },
  "building-clearance": {
    icon: Hammer,
    title: "Building Clearance",
    description: "Request building or construction clearance for renovation or new construction projects.",
    requirements: [
      "Building permit application",
      "Site development plan",
      "Proof of land ownership",
      "Barangay clearance",
    ],
    processingTime: "5-7 business days",
    fee: "₱300.00 - ₱1,000.00",
  },
};

const ServicePage = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const service = serviceId ? serviceData[serviceId] : null;
  const navigate = useNavigate();

  if (!service) {
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
            <h1
              className="text-2xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
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

  const Icon = service.icon;

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

              {/* Header row */}
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

              <p className="text-base text-muted-foreground mb-10 leading-relaxed">
                {service.description}
              </p>

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
                </div>

                {/* Meta cards */}
                <div className="space-y-4">
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
                      {service.fee}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate("/services")}
                className="px-10 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all duration-200"
                style={{ backgroundColor: "#0f2a5e", borderRadius: 1, letterSpacing: "0.08em" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"}
              >
                Proceed to Application
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServicePage;