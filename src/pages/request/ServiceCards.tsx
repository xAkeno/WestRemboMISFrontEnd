import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  Briefcase, 
  HardHat, 
  ArrowRight, 
  Building2, 
  X
} from 'lucide-react';
import BuildingClearanceForm from '../forms/BuildingClearanceForm';
import BusinessClearanceForm from '../forms/BusinessClearanceForm';
import BarangayClearanceForm from '../forms/BarangayClearanceForm';
import BarangayCertificateForm from '../forms/BarangayCertificateForm';
import ResidentRegistrationForm from '../forms/ResidentRegistrationForm';
import { useNavigate } from 'react-router-dom';

// --- Data Models ---

const CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'personal', label: 'Personal' },
  { id: 'business', label: 'Business' },
  { id: 'property', label: 'Property' },
];

type RequestType =
  | "resident-registration"
  | "barangay-certificate"
  | "barangay-clearance"
  | "business-clearance"
  | "building-clearance"
  | null;

const SERVICES = [
  {
    id: 1,
    type: "resident-registration",
    title: "Resident Registration",
    description: "Register as a new resident of Barangay West Rembo.",
    icon: Users,
    category: "personal",
    popular: true,
  },
  {
    id: 2,
    type: "barangay-certificate",
    title: "Barangay Certificate",
    description: "Request official certification.",
    icon: FileText,
    category: "personal",
    popular: true,
  },
  {
    id: 3,
    type: "barangay-clearance",
    title: "Barangay Clearance",
    description: "Apply for clearance documents.",
    icon: ShieldCheck,
    category: "personal",
  },
  {
    id: 4,
    type: "business-clearance",
    title: "Business Clearance",
    description: "Secure business permits.",
    icon: Briefcase,
    category: "business",
  },
  {
    id: 5,
    type: "building-clearance",
    title: "Building Clearance",
    description: "Request construction clearance.",
    icon: HardHat,
    category: "property",
  },
];

// --- ServiceCard Component ---

const ServiceCards = ({ service, onClick }) => {
  const Icon = service.icon;

  return (
    <div
      onClick={() => onClick(service)}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 mb-3 border border-border hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(212,94,163,0.06)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(212,94,163,0.16)";
        (e.currentTarget as HTMLElement).style.borderColor = "#f9a8d4";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(212,94,163,0.06)";
        (e.currentTarget as HTMLElement).style.borderColor = "";
      }}
    >
      {/* Top pink accent bar */}
      <div
        className="absolute top-0 left-0 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"
        style={{ height: 3, backgroundColor: "#d45ea3" }}
      />

      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div
          className="p-3 rounded-xl transition-all duration-300"
          style={{ backgroundColor: "#fce7f3" }}
        >
          <Icon
            className="w-6 h-6 transition-colors duration-300"
            style={{ color: "#d45ea3" }}
          />
        </div>

        {/* Popular badge */}
        {service.popular && (
          <span
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full"
            style={{ backgroundColor: "#fce7f3", color: "#d45ea3", border: "1px solid #f9a8d4" }}
          >
            Popular
          </span>
        )}
      </div>

      <h3
        className="text-lg font-bold text-foreground mb-2 transition-colors duration-200 group-hover:text-[#d45ea3]"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {service.title}
      </h3>

      <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
        {service.description}
      </p>

      <div
        className="mt-auto flex items-center text-sm font-semibold gap-1 transition-all duration-300 group-hover:gap-2"
        style={{ color: "#d45ea3" }}
      >
        Apply Now
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
};

// --- Modal Component ---

const Modal = ({ service, onClose, onProceed, selectedType, renderForm }) => {
  if (!service) return null;
  const Icon = service.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(26,10,19,0.60)" }}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(212,94,163,0.18)" }}
      >
        {/* Modal Header */}
        <div
          className="flex justify-between items-center px-6 py-5"
          style={{ borderBottom: "1px solid #fce7f3" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#fce7f3" }}
            >
              <Icon className="w-5 h-5" style={{ color: "#d45ea3" }} />
            </div>
            <h2
              className="text-lg font-bold text-foreground"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {service.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          {!selectedType ? (
            <>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{service.description}</p>
              <button
                onClick={() => onProceed(service.type)}
                className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:opacity-90 hover:scale-[1.01]"
                style={{
                  backgroundColor: "#d45ea3",
                  boxShadow: "0 4px 20px rgba(212,94,163,0.30)",
                }}
              >
                Proceed with Application
              </button>
            </>
          ) : (
            renderForm()
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter Logic
  const filteredServices = SERVICES.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const [selectedType, setSelectedType] = useState<RequestType>(null);

  const handleBack = () => {
    setSelectedType(null);
  };

  const renderForm = () => {
    switch (selectedType) {
      case "resident-registration":
        return <ResidentRegistrationForm onBack={handleBack} />;
      case "barangay-certificate":
        return <BarangayCertificateForm onBack={handleBack} />;
      case "barangay-clearance":
        return <BarangayClearanceForm onBack={handleBack} />;
      case "business-clearance":
        return <BusinessClearanceForm onBack={handleBack} />;
      case "building-clearance":
        return <BuildingClearanceForm onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d45ea3" }}
            >
              Online Services
            </span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            How Can We{" "}
            <span style={{ color: "#fa43ae" }}>Serve You?</span>
          </h1>
          <div
            className="mx-auto mt-3 rounded-full"
            style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={
                activeCategory === cat.id
                  ? {
                      backgroundColor: "#d45ea3",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(212,94,163,0.30)",
                      transform: "scale(1.05)",
                    }
                  : {
                      backgroundColor: "#fff",
                      color: "#607a86",
                      border: "1px solid #e8eff2",
                    }
              }
              onMouseEnter={(e) => {
                if (activeCategory !== cat.id) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#f9a8d4";
                  (e.currentTarget as HTMLElement).style.color = "#d45ea3";
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat.id) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#e8eff2";
                  (e.currentTarget as HTMLElement).style.color = "#607a86";
                }
              }}
            >
              {cat.label}
            </button>
          ))}

          <button
            onClick={() => navigate("/myrequest")}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: "#fff",
              color: "#607a86",
              border: "1px solid #e8eff2",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#f9a8d4";
              (e.currentTarget as HTMLElement).style.color = "#d45ea3";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#e8eff2";
              (e.currentTarget as HTMLElement).style.color = "#607a86";
            }}
          >
            View my request
          </button>
        </div>

        {/* Service Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <ServiceCards
              key={service.id}
              service={service}
              onClick={(service) => {
                setSelectedService(service);
                setSelectedType(service.type);
              }}
            />
          ))}
        </div>

        {/* Modal */}
        {selectedService && (
          <Modal
            service={selectedService}
            selectedType={selectedType}
            onProceed={setSelectedType}
            renderForm={renderForm}
            onClose={() => {
              setSelectedService(null);
              setSelectedType(null);
            }}
          />
        )}
      </main>
    </div>
  );
}