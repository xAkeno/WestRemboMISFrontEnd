import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { toast } from "sonner";
import { MaskedInput } from "@/components/MaskedInput";

const ProcessFrontDesk = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
  });
  const [foundData, setFoundData] = useState<any>(null);
  const [editData, setEditData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleSearch = async () => {
    if (!searchData.first_name || !searchData.last_name || !searchData.date_of_birth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all search fields",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/kiosk/search",
        searchData,
        { withCredentials: true }
      );
      if (res.data.kiosk) {
        // Record exists
        setFoundData(res.data.kiosk);
        setEditData(res.data.kiosk);
        toast({
          title: "Record Found",
          description: "Click 'View Details' to review and update your application",
        });
      } else {
        // No record found
        setFoundData(null);
        setEditData(null);
        toast({
          title: "No record found",
          description: "Please check your details and try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Not Found",
        description: error.response?.data?.message || "No record found for the given details",
        variant: "destructive",
      });
      setFoundData(null);
      setEditData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const serviceOptions = [
    "Barangay Clearance",
    "Building Clearance",
    "Business Clearance",
    "Resident Registration",
  ];


  const handleSubmit = async () => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/kiosk/update",
        editData,
        { withCredentials: true }
      );
      toast({
        title: "Application Updated",
        description: "Your application has been resubmitted successfully",
      });
      setShowDetailModal(false);
      setShowSearchModal(false);
      setFoundData(null);
      setEditData(null);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update application",
        variant: "destructive",
      });
    }
  };
  const handleResubmit = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/kiosk/submit", foundData, {
        withCredentials: true,
      });
      toast({
        title: "Application Resubmitted",
        description: "Your application has been submitted again successfully",
      });
      setShowSearchModal(false);
      setFoundData(null);
      setEditData(null);
      setSearchData({ first_name: "", last_name: "", date_of_birth: "" }); // reset input
    } catch (error: any) {
      toast({
        title: "Resubmit Failed",
        description: error.response?.data?.message || "Failed to resubmit application",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4 shadow-[var(--shadow-medium)]">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
            West Rembo Clearance System
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
              onClick={() => setShowSearchModal(true)}
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

      {/* Search Modal */}
      <Dialog open={showSearchModal}
        onOpenChange={(open) => {
          setShowSearchModal(open);
          if (!open) {
            // Reset all fields when modal closes
            setFoundData(null);
            setEditData(null);
            setSearchData({ first_name: "", last_name: "", date_of_birth: "" });
          }
        }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Search Your Application</DialogTitle>
            <DialogDescription>
              Enter your details to find your previous application
            </DialogDescription>
          </DialogHeader>

          {!foundData ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="search_first_name">First Name</Label>
                <Input
                  id="search_first_name"
                  value={searchData.first_name}
                  onChange={(e) =>
                    setSearchData({ ...searchData, first_name: e.target.value })
                  }
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search_last_name">Last Name</Label>
                <Input
                  id="search_last_name"
                  value={searchData.last_name}
                  onChange={(e) =>
                    setSearchData({ ...searchData, last_name: e.target.value })
                  }
                  placeholder="Enter your last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search_dob">Date of Birth</Label>
                <Input
                  id="search_dob"
                  type="date"
                  value={searchData.date_of_birth}
                  onChange={(e) =>
                    setSearchData({ ...searchData, date_of_birth: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Application
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-success">
                  ✓ Application Found!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Name: {foundData.first_name} {foundData.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Service: {foundData.service_type}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => (handleResubmit())}
                  className="flex-1"
                >
                  Submit application again
                </Button>
                <Button 
                  onClick={() => setShowDetailModal(true)} 
                  className="flex-1" 
                  size="lg"
                >
                  View Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Application Details</DialogTitle>
            <DialogDescription>
              Review and update your application information below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editData &&
              Object.keys(editData).map((key) => {
                if (key === "id" || key === "created_at" || key === "updated_at") return null;

                if (key === "service_type") {
                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`detail_${key}`} className="capitalize">
                        {key.replace(/_/g, " ")}
                      </Label>
                      <select
                        id={`detail_${key}`}
                        value={editData[key]}
                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {serviceOptions.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // For all other fields use MaskedInput
                const inputType = key.includes("date") ? "date" : "text";

                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`detail_${key}`} className="capitalize">
                      {key.replace(/_/g, " ")}
                    </Label>
                    <MaskedInput
                      id={`detail_${key}`}
                      type={inputType}
                      value={editData[key] || ""}
                      onValueChange={(val) => setEditData({ ...editData, [key]: val })}
                      placeholder={key.replace(/_/g, " ")}
                    />
                  </div>
                );
              })}



            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1" size="lg">
                Update Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessFrontDesk;