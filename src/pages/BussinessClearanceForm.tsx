import { useState,useRef, useEffect } from "react";
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
import { useLocation } from "react-router-dom";


interface FormData {
  id: number;
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
    id: 0,
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

  const [recordStatus, setRecordStatus] = useState<"Save" | "Update">("Save"); 


  const handleSaveAsync = async () => {
    setIsSaving(true);

    try {
      // Prepare & format dates
      const payload = {
        ...clearanceData,
        issuedDate: clearanceData.issuedDate ? clearanceData.issuedDate.split("T")[0] : null,
        dateOfInspection: clearanceData.dateOfInspection ? clearanceData.dateOfInspection.split("T")[0] : null,
        dateInspected: clearanceData.dateInspected ? clearanceData.dateInspected.split("T")[0] : null,
      };

      let response;
      let savedRecordId = null;

      if (recordStatus === "Save") {
        // Create new record
        response = await axios.post(
          "https://westrembomis.onrender.com/api/business-clearances",
          payload,
          { withCredentials: true }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success("Successfully created business clearance record");
          console.log("Created record:", response.data);

          // Get ID from backend
          savedRecordId = response.data.data.service.id;
        }

      } else if (recordStatus === "Update") {

        if (!clearanceData.id || clearanceData.id === 0) {
          toast.error("No record selected for update");
          return;
        }

        console.log("Updating record ID:", clearanceData.id);

        response = await axios.put(
          `https://westrembomis.onrender.com/api/business-clearances/${clearanceData.id}`,
          payload,
          { withCredentials: true }
        );

        if (response.status === 200) {
          toast.success("Successfully updated business clearance record");
          console.log("Updated record:", response.data);

          savedRecordId = clearanceData.id;
        }
      }

      /** -----------------------------------------------------
       *  🔥 NEW: Update Ticket after saving the service
       * ----------------------------------------------------- */
      if (savedRecordId) {
        console.log("Updating ticket for service ID:", savedRecordId);
        await axios.post(
          `https://westrembomis.onrender.com/api/tickets/update-by-service/${ticket.ticket_number}`,
          {
            status: "ENCODED"
          },
          { withCredentials: true }
        );

        toast("Updated the ticket to encoded status");
      }

    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "Failed to save business clearance record";
      toast.error(errMsg);
      console.error("Error saving record:", error);

    } finally {
      setIsSaving(false);
    }
  };



  const handleSelectRecord = (record: FormData) => {
    setClearanceData(record);
    setRecordStatus("Update"); // <-- Existing record, so status is Update
    toast.success("Record loaded for update");
  };


  const handleNewRecord = () => {
    setClearanceData({
      id: 0,
      brgyBusinessNo: "BBUSINESSNO_001",
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
    setRecordStatus("Save");
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

  const parseAddress = (fullAddress: string = "") => {
  const parts = fullAddress.split(",");

  let house_block_lot_no = "";
  let street = "";
  let zone = "";

  if (parts.length === 2) {
    zone = parts[1].trim();
      const firstPart = parts[0].trim();

      const match = firstPart.match(/^(Block\s+\d+\s+Lot\s+\d+)\s+(.+)$/i);
      if (match) {
        house_block_lot_no = match[1];
        street = match[2];
      } else {
        street = firstPart;
      }
    } else {
      street = fullAddress;
    }

    return { house_block_lot_no, street, zone };
  };


  const location = useLocation();
  const ticket = location.state?.ticket;

  useEffect(() => {
    if (ticket?.serviceable) {
      const data = ticket.serviceable;
      const { house_block_lot_no, street, zone } = parseAddress(data.address);
      setClearanceData({
        id: data.id || 0,
        brgyBusinessNo: "BBUSINESSNO_001",
        issuedDate: new Date().toISOString().split("T")[0],

        prefix: "",
        firstname: data.first_name || "",
        middleName: data.middle_name || "",
        surname: data.last_name || "",
        ext: "",

        businessName: data.authorized_person || "",
        businessType: "",
        businessDetails: "",
        capital: "",

        orNo: "",

        houseBlockLotNo: house_block_lot_no,
        street: street,
        zone: zone,

        inspectedBy: "",
        dateOfInspection: "",
        inspectionRemarks: "",
        inspectedRemarks: "",
        dateInspected: "",
        inspectedNote: "",
      });
      // console.log(ticket);
      // setRecordStatus("Update"); // optional: depends on your logic
    }
  }, [ticket]);


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
                updateSaveStatus={setRecordStatus}
                recordStatus={recordStatus}
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
