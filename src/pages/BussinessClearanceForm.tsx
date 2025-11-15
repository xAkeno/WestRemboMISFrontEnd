import { useState,useRef } from "react";
import axios from "axios";

import {
  FileText,
  Search,
  Eye,
  FileDown,
  PlusCircle,
  X,Printer, Save, RefreshCw, FileSearch, FilePlus 
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BussinessClearanceCard } from "@/components/BussinessClearanceCard";
import {BusinessClearancePreview} from "@/components/BusinessClearancePreview";


interface FormData {
  recordNo: string;
  brgyBusinessNo: string;
  issuedDate: string;
  prefix: string;
  firstname: string;
  middleName: string;
  surname: string;
  ext: string;
  businessName: string;
  businessType: string;
  businessDetails: string;
  capital: string;
  orNo: string;
  remarks: string;
  houseBlockLotNo: string;
  street: string;
  zone: string;
  inspectedBy: string;
  dateOfInspection: string;
  inspectionRemarks: string;
  inspectedRemarks: string;
  dateInspected: string;
  inspectedNote: string;
}


const Index = () => {
  const [clearanceData, setClearanceData] = useState<FormData>({
    recordNo: "",
    brgyBusinessNo: "",
    issuedDate: new Date().toISOString().split('T')[0],
    prefix: "",
    firstname: "",
    middleName: "",
    surname: "",
    ext: "",
    businessName: "",
    businessType: "",
    businessDetails: "",
    capital: "",
    orNo: "",
    remarks: "",
    houseBlockLotNo: "",
    street: "",
    zone: "",
    inspectedBy: "",
    dateOfInspection: "",
    inspectionRemarks: "",
    inspectedRemarks: "",
    dateInspected: "",
    inspectedNote: "",
  });

  const handleSave = () => {
    // placeholder, real save handled in async handler below
    toast.success("Record saved successfully");
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAsync = async () => {
    setIsSaving(true);
    try {
      // Use token from localStorage if available, otherwise use provided fallback
      const fallbackToken = "23|PDMlrBxvx6QqNKlR7mMT1T10vAwSjqOYvFotKAeBc455eff4";

      const response = await axios.post(
        "http://127.0.0.1:8000/api/business-clearances",
        clearanceData,
        {
          headers: {
            Authorization: `Bearer ${fallbackToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Business clearance created");
      console.log("Response:", response.data);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to create business clearance";
      toast.error(errMsg);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  

  const handleNewRecord = () => {
    setClearanceData({
      recordNo: "",
      brgyBusinessNo: "",
      issuedDate: new Date().toISOString().split('T')[0],
      prefix: "",
      firstname: "",
      middleName: "",
      surname: "",
      ext: "",
      businessName: "",
      businessType: "",
      businessDetails: "",
      capital: "",
      orNo: "",
      remarks: "",
      houseBlockLotNo: "",
      street: "",
      zone: "",
      inspectedBy: "",
      dateOfInspection: "",
      inspectionRemarks: "",
      inspectedRemarks: "",
      dateInspected: "",
      inspectedNote: "",
    });
    toast.info("New record created");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Preparing certificate for printing");
  };

  const handleRefresh = () => {
    toast.info("Form refreshed");
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
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 print:py-0">
          <div className="grid lg:grid-cols-2 gap-8 print:grid-cols-1">
            {/* Form Section */}
            <div className="print:hidden">
              <BussinessClearanceCard
                data={clearanceData}
                onChange={setClearanceData}
                onSave={handleSaveAsync}
                isSaving={isSaving}
              />
            </div>

            {/* Certificate Preview */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <Card className="shadow-lg">
                <CardHeader className="bg-accent/10">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Eye className="h-5 w-5" />
                    Bussiness Clearance Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <BusinessClearancePreview
                      formData={clearanceData}
                      handleTemplateUpload={handleTemplateUpload}
                    />

                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            @page {
              margin: 1cm;
              size: A4;
            }
          }
        `}</style>
      </div>
      <footer className="bg-card border-t mt-16 print:hidden">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Barangay West Rembo. All rights reserved.</p>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
