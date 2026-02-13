import WebViewer from "@pdftron/webviewer";
import { useEffect, useRef } from "react";

interface FormData { /* same as before */ }

interface Props {
  formData: FormData;
  handleTemplateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  templatePath?: string;
}

export const BarangayClearancePreview = ({
  formData,
  handleTemplateUpload,
  templatePath = "/templates/yow.pdf",
}: Props) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  const fieldMapping: Record<string, string> = {
    bcert_number: "Record No",
    issued_date: "Issued Date",
    prefix: "Prefix",
    first_name: "Firstname",
    middle_name: "Middle Name",
    surname: "Surname",
    ext_name: "Extension",
    age: "Age",
    dob: "Date of Birth",
    pob: "Place of Birth",
    house_block_lot_no: "House Block Lot No",
    street: "Street",
    zone: "Zone",
    contactNo: "Contact No",
    period_of_residency: "Period of Residency",
    registered_voter: "Registered Voter",
    house_owner: "House Owner",
    relationship_to_owner: "Relationship to Owner",
    purpose: "Purpose",
    purpose_details: "Purpose Details",
    ctc_vrr_no: "CTCVRR No",
    issued_at: "Issued at",
    issued_on: "Issued on",
    or_no: "OR No",
    remarks: "Remarks",
  };

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
        field.widgets.forEach((widget: any) => {
          widget.setValue(formData[formKey] || "");
        });
      }
    });

    documentViewer.refreshAll();
  };

  // Initialize WebViewer once
  useEffect(() => {
    if (!viewerRef.current) return;

    WebViewer(
      {
        path: "/webviewer",
        initialDoc: templatePath,
        licenseKey: "demo:1763914622659:60e900c30300000000e92a6b15fc125996c1e67a34dc24ca13fef56e4a", // <-- Add your valid license
      },
      viewerRef.current
    ).then((instance: any) => {
      viewerInstanceRef.current = instance;
      const { documentViewer } = instance.Core;

      // Wait for document to be fully loaded before updating fields
      documentViewer.addEventListener("documentLoaded", () => {
        updatePDFFields();
      });
    });
  }, []);

  // Update fields whenever formData changes
  useEffect(() => {
    const instance = viewerInstanceRef.current;
    if (!instance || !instance.Core.documentViewer.getDocument()) return;

    updatePDFFields();
  }, [formData]);

  return (
    <div>
      <div className="w-full h-[700px]" ref={viewerRef}></div>
    </div>
  );
};
