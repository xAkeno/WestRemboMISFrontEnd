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
import MyRequest from "./components/myrequest/MyRequest";
import { CertificateEditor } from "./components/documentMaker/CertificateEditor";
import RequestDetail from "./components/myrequest/RequestDetail";
import Calendar from "./pages/Calendar";4
import EventDetail from "./pages/EventDetail";
import { useEffect } from "react";
import ForgotPassword from "./pages/ForgotPassword";
import EmailVerification from "./pages/EmailVerification";
const queryClient = new QueryClient();
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ContactCms from "./pages/admin/ContactCms";
import ServicesCms from "./pages/admin/ServicesCms";
const App = () => {

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <LanguageProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} /> {/*Login*/}
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/event-detail/:id" element={<EventDetail />} />
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/profile" element={<ProfileManagement />} />
                <Route path="/aboutus" element={<AboutUsSection />} />
                <Route path="/contact" element={<ContactSection />} />
                <Route path="/services/:serviceId" element={<ServicePage />} />
                <Route path="/services" element={<ServicesRequest />} />

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/email-verification" element={<EmailVerification />} />

                <Route path="/document-edit/:id/:bcertNumber" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><CertificateEditor /></ProtectedRoute>} />
                <Route path="/document-edit/:id" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><CertificateEditor /></ProtectedRoute>} />
                <Route path="/certificatehome" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><Certificate /></ProtectedRoute>} /> 
                <Route path="/certificatehome/create" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><Certifications/></ProtectedRoute>} /> {/*Certificate home*/}

                <Route path="/clearancehome" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><ClearanceForm/></ProtectedRoute>} /> {/*Clearance home */}

                <Route path="/myrequest" element={<MyRequest />} />
                <Route path="/request/:type/:id" element={<RequestDetail />} />
                
                <Route path="/clearancehome/bussinessclearance" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><BusinessClearance /></ProtectedRoute>} /> 
                <Route path="/clearancehome/bussinessclearance/create" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><BussinessClearanceForm /></ProtectedRoute>} /> {/*Residents ???*/}

                <Route path="/clearancehome/buildingclearance" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><BuildingClearance /></ProtectedRoute>} /> 
                <Route path="/clearancehome/buildingclearance/create" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><BuildingClearanceForm/></ProtectedRoute>} /> {/*BARANGAY BUILDING CLEARANCE*/}

                <Route path="/clearancehome/clearance" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><BarangayClearance /></ProtectedRoute>} /> {/*Barangay Clearance */}
                <Route path="/clearancehome/clearance/create" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><IndexBCS /></ProtectedRoute>} /> {/*Barangay Clearance */}

                <Route path="/residenthome" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><ResidentsPage /></ProtectedRoute>} /> {/*Resident Form*/}
                <Route path="/residenthome/create" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><ResidentForm /></ProtectedRoute>} /> {/*Create Resident */}

                {/* Admin */}
                <Route path="/aboutus-admin" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><AboutUsCms /></ProtectedRoute>} /> {/*About Us CMS*/}
                <Route path="/contact-admin" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><Contact /></ProtectedRoute>} /> {/*Contact Admin*/}
                <Route path="/backup-recovery" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><BackupRecovery /></ProtectedRoute>} /> {/*Backup Recovery*/}
                <Route path="/elected-officials" element={<ElectedOfficials />} /> {/*Elected Officials*/}
                <Route path="/events-calendar" element={<EventsCalendar />} /> {/*Events Calendar*/}
                <Route path="/websitesetting" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><WebsiteSettings /></ProtectedRoute>} /> {/*Website Settings*/}
                <Route path="/activity-log" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><ActivityLog /></ProtectedRoute>} /> {/*Activity Log*/}
                <Route path="/document-setting" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><DocumentGrid /></ProtectedRoute>} /> {/*Document Grid*/}
                {/* <Route path="/document-table" element={<DocumentTable />} /> */}


                <Route path="/register" element={<Register />} /> {/*Register*/}
                <Route path="/kiosk" element={<FrontDesk />} /> {/*Front Desk*/}
                <Route path="/certificatehome/certificate" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><Index /></ProtectedRoute>} /> {/*Barangay Certificate */}

                <Route path="/reports" element={<Reports />} /> {/*Report*/}
                <Route path="/b" element={<Residents />} /> {/*Residents ???*/}
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><SettingsPage /></ProtectedRoute>} /> {/*Setting ?? */}


                <Route path="/cashier" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><Cashier /></ProtectedRoute>} /> {/*Residents ???*/}

                <Route path="/contactCms" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><ContactCms /></ProtectedRoute>} />
                <Route path="/servicesCms" element={<ProtectedRoute allowedRoles={["ADMIN","STAFF"]}><ServicesCms /></ProtectedRoute>} />


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
};

export default App;
