import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  Briefcase, 
  HardHat, 
  Search, 
  ArrowRight, 
  Building2, 
  Info,
  Menu,
  X
} from 'lucide-react';
import BuildingClearanceForm from '../forms/BuildingClearanceForm';
import BusinessClearanceForm from '../forms/BusinessClearanceForm';
import BarangayClearanceForm from '../forms/BarangayClearanceForm';
import BarangayCertificateForm from '../forms/BarangayCertificateForm';
import ResidentRegistrationForm from '../forms/ResidentRegistrationForm';

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
    color: "bg-blue-500",
    popular: true,
  },
  {
    id: 2,
    type: "barangay-certificate",
    title: "Barangay Certificate",
    description: "Request official certification.",
    icon: FileText,
    category: "personal",
    color: "bg-indigo-500",
    popular: true,
  },
  {
    id: 3,
    type: "barangay-clearance",
    title: "Barangay Clearance",
    description: "Apply for clearance documents.",
    icon: ShieldCheck,
    category: "personal",
    color: "bg-emerald-500",
  },
  {
    id: 4,
    type: "business-clearance",
    title: "Business Clearance",
    description: "Secure business permits.",
    icon: Briefcase,
    category: "business",
    color: "bg-amber-500",
  },
  {
    id: 5,
    type: "building-clearance",
    title: "Building Clearance",
    description: "Request construction clearance.",
    icon: HardHat,
    category: "property",
    color: "bg-rose-500",
  },
];


const requestTypes = [
  {
    id: "resident-registration" as const,
    title: "Resident Registration",
    description: "Register as a resident of Barangay West Rembo",
    icon: Users,
  },
  {
    id: "barangay-certificate" as const,
    title: "Barangay Certificate",
    description: "Request for barangay certificate documentation",
    icon: FileText,
  },
  {
    id: "barangay-clearance" as const,
    title: "Barangay Clearance",
    description: "Apply for barangay clearance for various purposes",
    icon: FileText,
  },
  {
    id: "business-clearance" as const,
    title: "Business Clearance",
    description: "Apply for business permit clearance",
    icon: Briefcase,
  },
  {
    id: "building-clearance" as const,
    title: "Building Clearance",
    description: "Request building or construction clearance",
    icon: Building2,
  },
];




// --- Components ---

const ServiceCards = ({ service, onClick }) => {
  const Icon = service.icon;

  return (
    <div 
      onClick={() => onClick(service)}
      className="group relative bg-white mb-2 rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
    >
      {/* Decorative top accent */}
      <div className={`absolute top-0 left-0 w-full h-1 ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${service.color} bg-opacity-10 text-slate-700 group-hover:text-white group-hover:${service.color} transition-colors duration-300`}>
          <Icon className={`w-6 h-6 ${service.color.replace('bg-', 'text-') } group-hover:text-white`} />
        </div>
        {service.popular && (
          <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-100">
            Popular
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
        {service.title}
      </h3>
      
      <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
        {service.description}
      </p>

      <div className="mt-auto flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform duration-300">
        Apply Now
        <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );
};

const Modal = ({ service, onClose, onProceed, selectedType, renderForm }) => {
  if (!service) return null;
  const Icon = service.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{service.title}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto">
          {!selectedType ? (
            <>
              <p className="text-slate-600 mb-6">{service.description}</p>

              <button
                onClick={() => onProceed(service.type)}
                className={`w-full py-3 rounded-xl text-white ${service.color}`}
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

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

      {/* Modal */}
      {/* {selectedService && (
        <Modal service={selectedService}
          selectedType={selectedType}
          onProceed={setSelectedType}
          renderForm={renderForm} 
          onClose={() => setSelectedService(null)} />
      )} */}
      
      {/* Global CSS for Animations */}
      {/* <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
      `}</style> */}
    </div>
  );
}