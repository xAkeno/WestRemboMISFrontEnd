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
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#fce7f3" }}
            >
              <FileText className="w-8 h-8" style={{ color: "#d45ea3" }} />
            </div>
            <h1
              className="text-2xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Service not found
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              The service you're looking for doesn't exist.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#d45ea3", boxShadow: "0 4px 14px rgba(212,94,163,0.28)" }}
            >
              Go back home
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
            className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors duration-200 group"
            style={{ color: "#d45ea3" }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Services
          </Link>

          {/* Main card */}
          <div
            className="bg-card rounded-2xl border border-border overflow-hidden"
            style={{ boxShadow: "0 4px 32px rgba(212,94,163,0.10)" }}
          >
            {/* Pink top accent bar */}
            <div style={{ height: 4, backgroundColor: "#d45ea3" }} />

            <div className="p-6 sm:p-8 md:p-12">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: "#fce7f3" }}
              >
                <Icon className="w-8 h-8" style={{ color: "#d45ea3" }} strokeWidth={1.6} />
              </div>

              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="h-px w-6" style={{ backgroundColor: "#d45ea3" }} />
                <span
                  className="text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ color: "#d45ea3" }}
                >
                  Barangay Service
                </span>
              </div>

              {/* Title */}
              <h1
                className="text-3xl md:text-4xl font-bold text-foreground mb-3"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {service.title}
              </h1>

              {/* Underline */}
              <div
                className="mb-5 rounded-full"
                style={{ width: 48, height: 3, backgroundColor: "#d45ea3" }}
              />

              <p className="text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed">
                {service.description}
              </p>

              {/* Requirements + Meta */}
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                {/* Requirements */}
                <div>
                  <h3
                    className="text-lg font-bold text-foreground mb-4"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    Requirements
                  </h3>
                  <ul className="space-y-3">
                    {service.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: "#fce7f3" }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" style={{ color: "#d45ea3" }} />
                        </div>
                        <span className="text-muted-foreground text-sm leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meta cards */}
                <div className="space-y-4">
                  <div
                    className="rounded-2xl p-5 border"
                    style={{ backgroundColor: "#fdf2f8", borderColor: "#f9a8d4" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" style={{ color: "#d45ea3" }} />
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d45ea3" }}>
                        Processing Time
                      </h4>
                    </div>
                    <p
                      className="text-xl font-bold text-foreground"
                      style={{ fontFamily: "'Georgia', serif" }}
                    >
                      {service.processingTime}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl p-5 border"
                    style={{ backgroundColor: "#fdf2f8", borderColor: "#f9a8d4" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="w-4 h-4" style={{ color: "#d45ea3" }} />
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d45ea3" }}>
                        Service Fee
                      </h4>
                    </div>
                    <p
                      className="text-xl font-bold text-foreground"
                      style={{ fontFamily: "'Georgia', serif" }}
                    >
                      {service.fee}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate("/services")}
                className="w-full md:w-auto px-12 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                style={{
                  backgroundColor: "#d45ea3",
                  boxShadow: "0 4px 20px rgba(212,94,163,0.30)",
                }}
              >
                Go to Application
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