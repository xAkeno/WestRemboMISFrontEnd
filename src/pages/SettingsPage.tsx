import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Settings</h2>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Barangay Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="barangay-name">Barangay Name</Label>
              <Input id="barangay-name" defaultValue="West Rembo" />
            </div>
            <div>
              <Label htmlFor="captain">Barangay Captain</Label>
              <Input id="captain" placeholder="Enter captain name" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Enter barangay address" />
            </div>
            <div>
              <Label htmlFor="contact">Contact Number</Label>
              <Input id="contact" placeholder="Enter contact number" />
            </div>
            <Button>Save Changes</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">System Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clearance-fee">Clearance Fee (PHP)</Label>
              <Input id="clearance-fee" type="number" placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="certificate-fee">Certificate Fee (PHP)</Label>
              <Input id="certificate-fee" type="number" placeholder="0.00" />
            </div>
            <Button>Update Fees</Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
