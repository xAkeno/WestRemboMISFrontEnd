import { useState, useRef} from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CertificationForm } from "@/components/CertificationForm";
import { CertificatePreview } from "@/components/CertificatePreview";
import { Layout } from "../components/Layout";
import {
  FileText,
  Save,
  Search,
  RefreshCw,
  Eye,
  FileDown,
  PlusCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import WebViewer from "@pdftron/webviewer";
import { BarangayCertificateFindModal } from "@/components/BarangayCertificateFindModal";

interface FormData {
  id: number,
  bcert_number: string;
  issued_date: Date | undefined;
  prefix: string;
  firstname: string;
  middle_name: string;
  surname: string;
  extension: string;
  house_block_lot: string;
  street: string;
  zone: string;
  age: string;
  date_of_birth: Date | undefined;
  place_of_birth: string;
  contact_no: string;
  residency_period: string;
  registered_voter: string;
  house_owner: string;
  relationship: string;
  purpose: string;
  punong_barangay: string;
  for_punong_brgy: string;
}


const Index = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: 0,
    bcert_number: "BC-2025-01-0010",
    issued_date: new Date("2025-02-01"),
    prefix: "MS.",
    firstname: "SAGRE",
    middle_name: "LOUISE",
    surname: "MANZANO",
    extension: "",
    house_block_lot: "43-C",
    street: "A. Mabini Street",
    zone: "Sitio 5",
    age: "0",
    date_of_birth: undefined,
    place_of_birth: "",
    contact_no: "",
    residency_period: "",
    registered_voter: "",
    house_owner: "",
    relationship: "",
    purpose: "LOCAL EMPLOYMENT",
    punong_barangay: "Hon. LEO E. BES",
    for_punong_brgy: "",
  });


  const handleNewRecord = () => {
    setFormData({
      id: 0,
      bcert_number: "",
      issued_date: undefined,
      prefix: "",
      firstname: "",
      middle_name: "",
      surname: "",
      extension: "",
      house_block_lot: "",
      street: "",
      zone: "",
      age: "",
      date_of_birth: undefined,
      place_of_birth: "",
      contact_no: "",
      residency_period: "",
      registered_voter: "",
      house_owner: "",
      relationship: "",
      purpose: "",
      punong_barangay: "",
      for_punong_brgy: "",
    });

    toast.success("New record form cleared");
  };

  const [recordStatus, setRecordStatus] = useState<"Save" | "Update">("Save");

  const handleSaveRecord = async () => {
    setIsSaving(true);

    try {
      console.log("Submitting barangay clearance data:", formData);

      let response;

      if (recordStatus === "Save") {
        // Create new record
        response = await axios.post(
          "http://127.0.0.1:8000/api/barangay-certificates",
          formData,
          { withCredentials: true }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success("Barangay clearance record saved successfully");
          console.log("Created record:", response.data);
        }

      } else if (recordStatus === "Update") {
        // Update existing record
        if (!formData.id || formData.id === 0) {
          toast.error("No record selected to update");
          return;
        }

        response = await axios.put(
          `http://127.0.0.1:8000/api/barangay-certificates/${formData.id}`,
          formData,
          { withCredentials: true }
        );

        if (response.status === 200) {
          toast.success("Barangay clearance record updated successfully");
          console.log("Updated record:", response.data);
        }
      }

    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to save barangay clearance record";
      toast.error(errorMessage);
      console.error(error);

    } finally {
      setIsSaving(false);
    }
  };

  const [modal, setModal] = useState(false);

  const handleFindRecord = () => {
    setModal(true);
    toast.info("Search functionality - Coming soon");
  };

  const handleRefresh = () => {
    toast.info("Data refreshed");
  };

  const handlePrintPreview = () => {
    toast.info("Opening print preview...");
    window.print();
  };

  const handlePrintPDF = () => {
    toast.success("Generating PDF...");
  };

  const handleClose = () => {
    toast.info("Form closed");
  };

  const viewerInstanceRef = useRef<any>(null);

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewerInstanceRef.current) {
      viewerInstanceRef.current.loadDocument(file);
    }
  };
  const updateModal = (open: boolean) => {
    setModal(open);
  }
  const updateSelect = (open: any) => {
    toast.info("Record successfully selected");
    setModal(false);
    console.log(open)
    setFormData(open);
    setRecordStatus("Update")
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* <header className="bg-primary text-primary-foreground shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
                BARANGAY CERTIFICATION SYSTEM
              </h1>
            </div>
            <p className="text-sm mt-2 opacity-90">Official Document Management Portal</p>
          </div>
        </header> */}
        {
          modal ? <BarangayCertificateFindModal updateModal={updateModal} updateSelect={updateSelect}/> :<></>
        }

        <main className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="bg-secondary/50">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-5 w-5" />
                    Certification Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <CertificationForm formData={formData} setFormData={setFormData} />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      onClick={handleNewRecord}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">New</span>
                    </Button>
                    <Button
                      onClick={handleSaveRecord}
                      disabled={isSaving}
                      className="w-full flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span className="hidden sm:inline">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span className="hidden sm:inline">{recordStatus} Record</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleFindRecord}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      disabled={isSaving}
                    >
                      <Search className="h-4 w-4" />
                      <span className="hidden sm:inline">Find</span>
                    </Button>
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      disabled={isSaving}
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>

                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <Card className="shadow-lg">
                <CardHeader className="bg-accent/10">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Eye className="h-5 w-5" />
                    Certificate Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <CertificatePreview
                      formData={formData}
                      handleTemplateUpload={handleTemplateUpload}
                    />

                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <footer className="bg-card mt-12 border-t">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            <p>© 2025 Barangay West Rembo, Taguig City. All rights reserved.</p>
          </div>
        </footer>
      </div>

    </Layout>
  );
};

export default Index;
