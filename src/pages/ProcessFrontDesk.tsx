import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const ProcessFrontDesk = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4 shadow-[var(--shadow-medium)]">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
            West Rembo Document Request System asdasd
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            This platform allows residents to apply for Barangay services such as Barangay Clearance, Building Clearance, Business Clearance, Barangay Certificates, and Resident Forms efficiently and securely.
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 md:p-12 shadow-[var(--shadow-medium)] backdrop-blur-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-3">Start an Application</h2>
            <p className="text-muted-foreground">
              Have you submitted an application before?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/searchKiosk")}
              className="h-16 text-lg font-medium bg-primary hover:bg-primary/90 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all"
            >
              Yes
              <span className="block text-xs font-normal opacity-90 mt-1">Search existing information</span>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/kiosk")}
              className="h-16 text-lg font-medium shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all"
            >
              No
              
              <span className="block text-xs font-normal opacity-90 mt-1">Register to use the application</span>
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          City Government of Taguig - Barangay West Rembo
        </p>
      </div>
    </div>
  );
};

export default ProcessFrontDesk;
