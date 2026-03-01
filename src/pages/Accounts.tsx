import { useState, useEffect } from "react";
import axios from "axios";
import { Layout } from "@/components/Layout";
import { AddAccountModal } from "@/components/AddAccountModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreVertical, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Account {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  phone?: string;
  location?: string;
  lastActive?: string;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch accounts from backend
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("https://westrembomis.onrender.com/api/getAllUser", { withCredentials: true });
      // Assuming API response: { status: 'success', data: [ ...users ] }
      setAccounts(response.data?.data || []);
    } catch (err: any) {
      console.error("Failed to fetch accounts:", err);
      setError("Failed to fetch accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Account Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage system users and their permissions
            </p>
          </div>
          <Button className="w-fit" onClick={() => setAddAccountModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        {loading ? (
          <div>Loading accounts...</div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{accounts.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {accounts.filter((a) => a.status === "active").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {accounts.filter((a) => a.status === "inactive").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {accounts.filter((a) => a.role === "Administrator").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>All Accounts</CardTitle>
                    <CardDescription>View and manage user accounts</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search accounts..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => (
                      <TableRow
                        key={account.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/settings/AccountDetails/${account.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(account.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{account.name}</div>
                              {/* <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {account.email}
                              </div> */}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {account.email}
                              </div>
                            {/* {account.phone && (
                              <div className="text-sm flex items-center gap-1">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                {account.phone}
                              </div>
                            )}
                            {account.location && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {account.location}
                              </div>
                            )} */}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{account.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={account.status === "active" ? "default" : "secondary"}
                            className={
                              account.status === "active"
                                ? "bg-success text-success-foreground"
                                : ""
                            }
                          >
                            {account.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {account.lastActive || "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Account</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        <AddAccountModal
          open={addAccountModalOpen}
          onOpenChange={setAddAccountModalOpen}
          onAccountAdded={fetchAccounts} // Refresh accounts after adding new
        />
      </div>
    </Layout>
  );
}
