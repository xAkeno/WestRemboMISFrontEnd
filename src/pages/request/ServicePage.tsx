import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, FileText, ShieldCheck, Building2, Hammer, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Service not found</h1>
            <Button asChild>
              <Link to="/">Go back home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = service.icon;

  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Link>

          <div className="bg-card rounded-2xl border border-border p-8 md:p-12" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="icon-container w-20 h-20 mb-6 mx-0">
              <Icon className="w-10 h-10 text-primary-foreground" strokeWidth={1.5} />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {service.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {service.description}
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Requirements</h3>
                <ul className="space-y-3">
                  {service.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <div className="bg-muted/50 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Processing Time</h4>
                  <p className="text-xl font-semibold text-foreground">{service.processingTime}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Service Fee</h4>
                  <p className="text-xl font-semibold text-foreground">{service.fee}</p>
                </div>
              </div>
            </div>

            <Button onClick={() => navigate("/services")} size="lg" className="hero-gradient hover:opacity-90 text-primary-foreground w-full md:w-auto px-12">
              Go to Application
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServicePage;
