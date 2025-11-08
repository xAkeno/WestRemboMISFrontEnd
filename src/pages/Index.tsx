import { useState, useRef} from "react";
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

interface FormData {
  transactionNo: string;
  certificationNo: string;
  issuedDate: Date | undefined;
  prefix: string;
  firstname: string;
  middleName: string;
  surname: string;
  extension: string;
  houseBlockLot: string;
  street: string;
  zone: string;
  age: string;
  dateOfBirth: Date | undefined;
  placeOfBirth: string;
  contactNo: string;
  residencyPeriod: string;
  registeredVoter: string;
  houseOwner: string;
  relationship: string;
  purpose: string;
  punongBarangay: string;
  forPunongBrgy: string;
}

const Index = () => {
  const [formData, setFormData] = useState<FormData>({
    transactionNo: "10",
    certificationNo: "BC-2025-01-0010",
    issuedDate: new Date("2025-02-01"),
    prefix: "MS.",
    firstname: "SAGRE",
    middleName: "LOUISE",
    surname: "MANZANO",
    extension: "",
    houseBlockLot: "43-C",
    street: "A. Mabini Street",
    zone: "Sitio 5",
    age: "0",
    dateOfBirth: undefined,
    placeOfBirth: "",
    contactNo: "",
    residencyPeriod: "",
    registeredVoter: "",
    houseOwner: "",
    relationship: "",
    purpose: "LOCAL EMPLOYMENT",
    punongBarangay: "Hon. LEO E. BES",
    forPunongBrgy: "",
  });

  const handleNewRecord = () => {
    setFormData({
      transactionNo: "",
      certificationNo: "",
      issuedDate: undefined,
      prefix: "",
      firstname: "",
      middleName: "",
      surname: "",
      extension: "",
      houseBlockLot: "",
      street: "",
      zone: "",
      age: "",
      dateOfBirth: undefined,
      placeOfBirth: "",
      contactNo: "",
      residencyPeriod: "",
      registeredVoter: "",
      houseOwner: "",
      relationship: "",
      purpose: "",
      punongBarangay: "",
      forPunongBrgy: "",
    });
    toast.success("New record form cleared");
  };

  const handleSaveRecord = () => {
    toast.success("Record saved successfully");
  };

  const handleFindRecord = () => {
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
                      onClick={handleFindRecord}
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      <span className="hidden sm:inline">Find</span>
                    </Button>
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      className="w-full flex items-center gap-2"
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
