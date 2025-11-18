import { Layout } from "@/components/Layout";
import { ClearanceCard } from "@/components/ClearanceCard";
import { Navigate, useNavigate } from "react-router-dom";
import { Building2, Briefcase, Home, FileText } from "lucide-react";

export default function Clearances() {
  const navigate = useNavigate()
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Barangay Clearances</h2>
          <p className="text-muted-foreground">
            Select a clearance type to process a new application
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ClearanceCard
            title="Barangay Clearance"
            description="General barangay clearance for residents"
            icon={FileText}
            gradient="primary"
            onClick={() => navigate('/clearancehome/clearance')}
          />
          
          <ClearanceCard
            title="Business Clearance"
            description="Clearance for business operations"
            icon={Briefcase}
            gradient="accent"
            onClick={() => navigate('/clearancehome/bussinessclearance')}
          />
          
          <ClearanceCard
            title="Building Clearance"
            description="Clearance for construction and building permits"
            icon={Building2}
            gradient="primary"
            onClick={() => navigate('/clearancehome/buildingclearance')}
          />

          {/* <ClearanceCard
            title="Residency Certificate"
            description="Certificate of residency for residents"
            icon={Home}
            gradient="accent"
            onClick={() => navigate('/clearancehome/residencycertificate')}
          /> */}
        </div>
      </div>
    </Layout>
  );
}
