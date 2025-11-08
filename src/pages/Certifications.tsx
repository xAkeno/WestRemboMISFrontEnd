import { Layout } from "@/components/Layout";
import { ClearanceCard } from "@/components/ClearanceCard";
import { Award, FileCheck, ShieldCheck, UserCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

export default function Certifications() {
  const navigate = useNavigate()
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Certifications</h2>
          <p className="text-muted-foreground">
            Issue and manage various barangay certifications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* <ClearanceCard
            title="Indigency Certificate"
            description="Certificate for indigent residents"
            icon={Award}
            gradient="accent"
          />
          
          <ClearanceCard
            title="Good Moral Certificate"
            description="Certificate of good moral character"
            icon={ShieldCheck}
            gradient="primary"
          /> */}
          
          <ClearanceCard
            title="Employment Certificate"
            description="Certificate for employment purposes"
            icon={UserCheck}
            gradient="accent"
            onClick={() => navigate('/certificatehome/certificate')}
          />

          {/* <ClearanceCard
            title="First Time Job Seeker"
            description="Certificate for first-time job seekers"
            icon={FileCheck}
            gradient="primary"
          /> */}
        </div>
      </div>
    </Layout>
  );
}
