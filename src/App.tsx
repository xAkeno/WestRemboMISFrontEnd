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
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} /> {/*Login*/}
            <Route path="/register" element={<Register />} /> {/*Register*/}
            <Route path="/frontdesk" element={<FrontDesk />} /> {/*Front Desk*/}
            <Route path="/certificatehome/certificate" element={<Index />} /> {/*Barangay Certificate */}
            <Route path="/clearancehome/clearance" element={<IndexBCS />} /> {/*Barangay Clearance */}
            <Route path="/reports" element={<Reports />} /> {/*Report*/}
            <Route path="/b" element={<Residents />} /> {/*Residents ???*/}
            <Route path="/residenthome" element={<ResidentForm />} /> {/*Resident Form*/}
            <Route path="/dashboard" element={<Dashboard />} /> {/*Dashboard*/}
            <Route path="/settings" element={<SettingsPage/>} /> {/*Setting ?? */}
            <Route path="/clearancehome" element={<ClearanceForm/>} /> {/*Clearance home */}
            <Route path="/certificatehome" element={<Certifications/>} /> {/*Certificate home*/}
            <Route path="//clearancehome/buildingclearance" element={<BuildingClearanceForm/>} /> {/*BARANGAY BUILDING CLEARANCE*/}
            <Route path="/clearancehome/bussinessclearance" element={<BussinessClearanceForm />} /> {/*Residents ???*/}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
