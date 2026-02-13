import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import IndexBCS from "./pages/indexBCS";
import NotFound from "./pages/NotFound";
import SettingsPage from "./pages/SettingsPage";
import Residents from "./pages/Residents";
import Reports from "./pages/Reports";
import ClearanceForm from "./pages/Clearances";
import Certifications from "./pages/Certifications";
import BuildingClearanceForm from "./pages/BuildingClearanceForm";
import Dashboard from "./pages/Dashboard";
import ResidentForm from "./pages/ResidentForm";
import BussinessClearanceForm from "./pages/BussinessClearanceForm";
import FrontDesk from "./pages/frontDesk";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cashier from "./pages/Cashier";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import ProcessFrontDesk from "./pages/ProcessFrontDesk";
import SearchResident from "./pages/SearchResident";
import { LanguageProvider } from "@/components/context/LanguageContext";
import QueueSystem from "./pages/QueueSystem";
import { ResidentsPage } from "./components/residents/ResidentsPage";
import BarangayClearance from "./pages/BarangayClearance";
import BuildingClearance from "./pages/BuildingClearance";
import BusinessClearance from "./pages/BusinessClearance";
import Certificate from "./pages/Certificate";
import HomePage from "./pages/HomePage";
import AboutUsSection from "./components/forms/AboutUsSection";
import ContactSection from "./components/forms/ContactSection";
import ProfileManagement from "./pages/ProfileManagement";
import ServicesRequest from "./pages/request/ServicesRequest";
import ServiceCards from "./pages/request/ServiceCards";
import ServicePage from "./pages/request/ServicePage";
import ServicesSection from "./pages/request/ServicesSection";
import ServiceCard from "./pages/request/ServiceCard";
import AboutUsCms from "./pages/admin/AboutUsCms";
import Contact from "./pages/admin/ContactAdmin";
import BackupRecovery from "./pages/admin/BackupRecovery";
import ElectedOfficials from "./pages/admin/ElectedOfficials";
import EventsCalendar from "./pages/admin/EventsCalendar";
import WebsiteSettings from "./pages/admin/WebsiteSettings";
import ActivityLog from "./pages/admin/ActivityLog";
import { DocumentGrid } from "./pages/admin/DocumentGrid";

import { CertificateEditor } from "./components/documentMaker/CertificateEditor";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} /> {/*Login*/}
              <Route path="/home" element={<HomePage />} />
              <Route path="/profile" element={<ProfileManagement />} />
              <Route path="/aboutus" element={<AboutUsSection />} />
              <Route path="/contact" element={<ContactSection />} />
              <Route path="/services/:serviceId" element={<ServicePage />} />
              <Route path="/services" element={<ServicesRequest />} />

              <Route path="/document-edit/:id" element={<CertificateEditor />} />

              <Route path="/certificatehome" element={<Certificate />} /> 
              <Route path="/certificatehome/create" element={<Certifications/>} /> {/*Certificate home*/}

              <Route path="/clearancehome" element={<ClearanceForm/>} /> {/*Clearance home */}

              
              <Route path="//clearancehome/bussinessclearance" element={<BusinessClearance />} /> 
              <Route path="/clearancehome/bussinessclearance/create" element={<BussinessClearanceForm />} /> {/*Residents ???*/}

              <Route path="/clearancehome/buildingclearance" element={<BuildingClearance />} /> 
              <Route path="/clearancehome/buildingclearance/create" element={<BuildingClearanceForm/>} /> {/*BARANGAY BUILDING CLEARANCE*/}

              <Route path="/clearancehome/clearance" element={<BarangayClearance />} /> {/*Barangay Clearance */}
              <Route path="/clearancehome/clearance/create" element={<IndexBCS />} /> {/*Barangay Clearance */}

              <Route path="/residenthome" element={<ResidentsPage />} /> {/*Resident Form*/}
              <Route path="/residenthome/create" element={<ResidentForm/>} /> {/*Create Resident */}

              {/* Admin */}
              <Route path="/aboutus-admin" element={<AboutUsCms />} /> {/*About Us CMS*/}
              <Route path="/contact-admin" element={<Contact />} /> {/*Contact Admin*/}
              <Route path="/backup-recovery" element={<BackupRecovery />} /> {/*Backup Recovery*/}
              <Route path="/elected-officials" element={<ElectedOfficials />} /> {/*Elected Officials*/}
              <Route path="/events-calendar" element={<EventsCalendar />} /> {/*Events Calendar*/}
              <Route path="/websitesetting" element={<WebsiteSettings />} /> {/*Website Settings*/}
              <Route path="/activity-log" element={<ActivityLog />} /> {/*Activity Log*/}
              <Route path="/document-setting" element={<DocumentGrid />} /> {/*Document Grid*/}
              {/* <Route path="/document-table" element={<DocumentTable />} /> */}


              <Route path="/register" element={<Register />} /> {/*Register*/}
              <Route path="/kiosk" element={<FrontDesk />} /> {/*Front Desk*/}
              <Route path="/certificatehome/certificate" element={<Index />} /> {/*Barangay Certificate */}

              <Route path="/reports" element={<Reports />} /> {/*Report*/}
              <Route path="/b" element={<Residents />} /> {/*Residents ???*/}
              <Route path="/dashboard" element={<Dashboard />} /> {/*Dashboard*/}
              <Route path="/settings" element={<SettingsPage/>} /> {/*Setting ?? */}


              <Route path="/cashier" element={<Cashier />} /> {/*Residents ???*/}
              <Route path="/settings/AccountManage" element={<Accounts/>}/>
              <Route path="/settings/AccountDetails/:id" element={<AccountDetail/>}/>
              <Route path="/frontdesk" element={<SearchResident/>}/>
              <Route path="/queue" element={<QueueSystem/>}/>
              {/* <Route path="/searchKiosk" element={<SearchResident/>}/> */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
