import WebViewer from "@pdftron/webviewer";
import { useEffect, useRef } from "react";

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

interface CertificatePreviewProps {
  formData: FormData;
  handleTemplateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  templatePath?: string;
}

export const CertificatePreview = ({
  formData,
  handleTemplateUpload,
  templatePath = "/templates/bruh.pdf",
}: CertificatePreviewProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  // 🧭 Field name mapping (matches PDF form field names)
  const fieldMapping: Record<string, string> = {
    transactionNo: "Transaction No",
    certificationNo: "Certification No",
    issuedDate: "Issued Date",
    prefix: "Prefix",
    firstname: "Firstname",
    middleName: "Middle Name",
    surname: "Surname",
    extension: "Extension",
    houseBlockLot: "House Block Lot No",
    street: "Street",
    zone: "Zone",
    age: "Age",
    dateOfBirth: "Date of Birth",
    placeOfBirth: "Place of Birth",
    contactNo: "Contact No",
    residencyPeriod: "Period of Residency",
    registeredVoter: "Registered Voter",
    houseOwner: "House Owner",
    relationship: "Relationship",
    purpose: "Purpose",
    punongBarangay: "Punong Barangay",
    forPunongBrgy: "For Punong Barangay",
  };

  // ✏️ Update PDF fields with form data
  const updatePDFFields = () => {
    const instance = viewerInstanceRef.current;
    if (!instance) return;

    const { annotationManager, documentViewer } = instance.Core;
    const fieldManager = annotationManager.getFieldManager();
    const allFields = fieldManager.getFields();

    allFields.forEach((field: any) => {
      const formKey = Object.keys(fieldMapping).find(
        (key) => fieldMapping[key] === field.name
      );

      if (formKey && formData[formKey] !== undefined) {
        const value =
          formData[formKey] instanceof Date
            ? (formData[formKey] as Date).toLocaleDateString()
            : formData[formKey] || "";

        field.widgets.forEach((widget: any) => {
          widget.setValue(value);
        });
      }
    });

    documentViewer.refreshAll();
  };

  // 📄 Initialize WebViewer once
  useEffect(() => {
    if (!viewerRef.current) return;

    WebViewer(
      {
        path: "/webviewer",
        initialDoc: templatePath,
      },
      viewerRef.current
    ).then((instance: any) => {
      viewerInstanceRef.current = instance;

      const { documentViewer } = instance.Core;
      documentViewer.addEventListener("annotationsLoaded", () => {
        updatePDFFields();
      });
    });
  }, []);

  // 🔄 Update fields when form data changes
  useEffect(() => {
    updatePDFFields();
  }, [formData]);

  return (
    <div>

      {/* PDF Viewer */}
      <div className="w-full h-[600px]" ref={viewerRef}></div>
    </div>
  );
};
