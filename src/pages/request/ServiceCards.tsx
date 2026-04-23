import React, { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  ShieldCheck,
  Briefcase,
  HardHat,
  ArrowRight,
  X,
} from 'lucide-react';
import AuthRequiredModal from '@/components/AuthRequiredModal';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MaintenanceModal } from '@/components/MaintenanceModal';
import { VacationModal } from '@/components/VacationModal';
import { useMaintenance } from '@/hooks/useMaintenance';

// --- Data Models ---

const CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'personal', label: 'Personal' },
  { id: 'business', label: 'Business' },
  { id: 'property', label: 'Property' },
];

const SERVICES = [
  // {
  //   id: 1,
  //   type: 'resident-registration',
  //   title: 'Resident Registration',
  //   description: 'Register as a new resident of Barangay West Rembo.',
  //   icon: Users,
  //   category: 'personal',
  //   popular: true,
  //   route: '/services/barangay-resident-registration/apply',
  // },
  {
    id: 2,
    type: 'barangay-certificate',
    title: 'Barangay Certificate',
    description: 'Request official certification.',
    icon: FileText,
    category: 'personal',
    popular: true,
    route: '/services/barangay-certificate/apply',
  },
  {
    id: 3,
    type: 'barangay-clearance',
    title: 'Barangay Clearance',
    description: 'Apply for clearance documents.',
    icon: ShieldCheck,
    category: 'personal',
    route: '/services/barangay-clearance/apply',
  },
  {
    id: 4,
    type: 'business-clearance',
    title: 'Business Clearance',
    description: 'Secure business permits.',
    icon: Briefcase,
    category: 'business',
    route: '/services/barangay-business-clearance/apply',
  },
  {
    id: 5,
    type: 'building-clearance',
    title: 'Building Clearance',
    description: 'Request construction clearance.',
    icon: HardHat,
    category: 'property',
    route: '/services/barangay-building-clearance/apply',
  },
];

// --- ServiceCard ---

const ServiceCard = ({ service, onClick }) => {
  const Icon = service.icon;

  return (
    <div
      onClick={() => onClick(service)}
      className="group relative bg-card border border-border p-6 mb-3 transition-all duration-300 cursor-pointer flex flex-col h-full"
      style={{ borderRadius: 2 }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderTopColor = '#c2467d';
        (e.currentTarget as HTMLElement).style.borderTopWidth = '2px';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(15,42,94,0.10)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderTopColor = '';
        (e.currentTarget as HTMLElement).style.borderTopWidth = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 transition-all duration-300" style={{ backgroundColor: '#f0f4ff', borderRadius: 2 }}>
          <Icon className="w-6 h-6" style={{ color: '#0f2a5e' }} />
        </div>
        {service.popular && (
          <span
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
            style={{ backgroundColor: '#fdf5f8', color: '#c2467d', border: '1px solid #f0c4d8', borderRadius: 1 }}
          >
            Popular
          </span>
        )}
      </div>

      <h3
        className="text-base font-bold text-foreground mb-2 transition-colors duration-200 group-hover:text-[#0f2a5e]"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {service.title}
      </h3>

      <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">
        {service.description}
      </p>

      <div
        className="mt-auto flex items-center text-xs font-bold uppercase tracking-wider gap-1.5 transition-all duration-300 group-hover:gap-2.5"
        style={{ color: '#c2467d', letterSpacing: '0.08em' }}
      >
        Apply Now
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

// --- Main ServiceCards ---

export default function ServiceCards() {
  const navigate = useNavigate();
  const [self, setSelf] = useState<any>(null);

  // Add this — grab the user from localStorage same as App.jsx
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { showMaintenance, message, showVacation, vacationStart, vacationEnd } = useMaintenance(user);
  const [activeCategory, setActiveCategory] = useState('all');

  // Auth modal state
  const [authModal, setAuthModal] = useState(false);
  const [pendingService, setPendingService] = useState<any>(null); // service the user tried to open

  // Fetch current user once
  useEffect(() => {
    axios
      .get('http://127.0.0.1:8000/api/details', { withCredentials: true })
      .then((res) => { if (res.status === 200) setSelf(res.data.data); })
      .catch(() => {/* not logged in */});
  }, []);

  const filteredServices = SERVICES.filter((s) => {
    return activeCategory === 'all' || s.category === activeCategory;
  });

  // Called when a card is clicked
  const handleCardClick = (service: any) => {
    if (!self) {
      // Not logged in → show auth modal, remember which card was clicked
      setPendingService(service);
      setAuthModal(true);
      return;
    }
    // Logged in → navigate to the service route
    navigate(service.route);
  };

  // After user signs in via the modal button, we navigate to /login
  // (AuthRequiredModal handles that). If they close the modal we just clear state.
  const handleAuthModalClose = () => {
    setAuthModal(false);
    setPendingService(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:max-w-7xl">

        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div style={{ width: 32, height: 1, backgroundColor: '#c2467d' }} />
            <span className="text-xs font-bold uppercase tracking-[0.20em]" style={{ color: '#c2467d' }}>
              Online Services
            </span>
            <div style={{ width: 32, height: 1, backgroundColor: '#c2467d' }} />
          </div>
          <h1
            className="font-bold text-foreground mb-3"
            style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)' }}
          >
            How Can We <span style={{ color: '#c2467d' }}>Serve You?</span>
          </h1>
          <div style={{ width: 48, height: 2, backgroundColor: '#c2467d', margin: '12px auto 0' }} />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200"
              style={
                activeCategory === cat.id
                  ? { backgroundColor: '#0f2a5e', color: '#fff', borderRadius: 1 }
                  : { backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #dde3ed', borderRadius: 1 }
              }
              onMouseEnter={(e) => {
                if (activeCategory !== cat.id) {
                  (e.currentTarget as HTMLElement).style.borderColor = '#c2467d';
                  (e.currentTarget as HTMLElement).style.color = '#c2467d';
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat.id) {
                  (e.currentTarget as HTMLElement).style.borderColor = '#dde3ed';
                  (e.currentTarget as HTMLElement).style.color = '#6b7280';
                }
              }}
            >
              {cat.label}
            </button>
          ))}

          {/* Show View My Requests only if user is logged in */}
          {self && (
            <button
              onClick={() => navigate('/myrequest')}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200"
              style={{ backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #dde3ed', borderRadius: 1 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#c2467d';
                (e.currentTarget as HTMLElement).style.color = '#c2467d';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#dde3ed';
                (e.currentTarget as HTMLElement).style.color = '#6b7280';
              }}
            >
              View My Requests
            </button>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={handleCardClick}
            />
          ))}
        </div>

        {/* Auth Required Modal — shown when not logged in and a card is clicked */}
        <AuthRequiredModal
          open={authModal}
          onClose={handleAuthModalClose}
          featureLabel={pendingService ? `apply for ${pendingService.title}` : 'access this service'}
        />
      </main>
      {showMaintenance && <MaintenanceModal message={message} />}
      {showVacation && !showMaintenance && (
        <VacationModal vacationStart={vacationStart} vacationEnd={vacationEnd} />
      )}
    </div>
  );
}