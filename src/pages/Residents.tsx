import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";

export default function Residents() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Resident Records</h2>
            <p className="text-muted-foreground">
              Manage and view resident information
            </p>
          </div>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Resident
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search residents..." 
              className="pl-10"
            />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">No residents found. Add your first resident to get started.</p>
        </div>
      </div>
    </Layout>
  );
}
