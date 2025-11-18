import WebViewer from "@pdftron/webviewer";
import { useEffect, useRef } from "react";

interface FormData {
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
    bcert_number: "Certification No",
    issued_date: "Issued Date",
    prefix: "Prefix",
    firstname: "Firstname",
    middle_name: "Middle Name",
    surname: "Surname",
    extension: "Extension",
    house_block_lot: "House Block Lot No",
    street: "Street",
    zone: "Zone",
    age: "Age",
    date_of_birth: "Date of Birth",
    place_of_birth: "Place of Birth",
    contact_no: "Contact No",
    residency_period: "Period of Residency",
    registered_voter: "Registered Voter",
    house_owner: "House Owner",
    relationship: "Relationship",
    purpose: "Purpose",
    punong_barangay: "Punong Barangay",
    for_punong_brgy: "For Punong Barangay",
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
