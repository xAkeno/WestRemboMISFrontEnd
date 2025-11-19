import { UserPlus, Shield } from "lucide-react";
import { SettingCard } from "@/components/SettingCard";
import { Layout } from "@/components/Layout";
import { useNavigate } from "react-router-dom";
export default function SettingsPage() {
  const navigate = useNavigate();
  return (
    <Layout>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SettingCard
          title="Add Account"
          description="Create a new user account and assign permissions."
          icon={UserPlus}
          gradient="primary"
          onClick={() => navigate("/settings/AccountManage")}
        />

        {/* <SettingCard
          title="Management Access"
          description="Manage existing users and their access levels."
          icon={Shield}
          gradient="accent"
          onClick={() => navigate("/settings/ManageAccess")}
        /> */}
      </div>
    </Layout>
  );
}
