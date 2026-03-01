import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Shield, Edit } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  phone: string;
  location: string;
  joinDate: string;
  lastActive: string;
  permissions: string[];
}

// Only these are the allowed permissions
const ALL_PERMISSIONS = ["resident", "doc_req", "certificate", "cashier", "reports", "settings"];

export default function AccountDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/users/${id}`, {
          withCredentials: true,
          headers: { "Cache-Control": "no-cache" },
        });
        setAccount(response.data.data);
        setPermissions(response.data.data.permissions || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAccount();
  }, [id]);

  const getInitials = (name: string | undefined) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handlePermissionToggle = async (perm: string) => {
    if (!account) return;

    let updatedPermissions: string[];
    if (permissions.includes(perm)) {
      updatedPermissions = permissions.filter((p) => p !== perm);
    } else {
      updatedPermissions = [...permissions, perm];
    }

    setPermissions(updatedPermissions);

    try {
      const ers = await axios.put(
        `https://westrembomis.onrender.com/api/users/${account.id}/permissions`,
        { permissions: updatedPermissions },
        { withCredentials: true }
      );

      if(ers.status === 200){
        toast("Successfully changed permission")
      }
      
    } catch (error) {
      console.error("Failed to update permissions", error);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (!account) return <Layout><div>Account not found</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings/AccountManage")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Account Details</h1>
            <p className="text-muted-foreground mt-1">View and manage account information</p>
          </div>
          {/* <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Account
          </Button> */}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(account.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-xl font-semibold">{account.name}</h3>
                <p className="text-sm text-muted-foreground">{account.role}</p>
                <div className="mt-4">
                  <Badge
                    variant={account.status === "active" ? "default" : "secondary"}
                    className={account.status === "active" ? "bg-success text-success-foreground" : ""}
                  >
                    {account.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{account.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{account.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Join Date</p>
                    <p className="text-sm text-muted-foreground">{account.joinDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Permissions & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">System Permissions</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ALL_PERMISSIONS.map((permission, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                      />
                      <span className="text-sm font-medium">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
