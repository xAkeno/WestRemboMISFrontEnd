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
    recordNo: "Record No",
    clearanceNo: "Clearance No",
    issuedDate: "Issued Date",
    prefix: "Prefix",
    firstname: "Firstname",
    middlename: "Middle Name",
    surname: "Surname",
    extension: "Extension",
    age: "Age",
    dateOfBirth: "Date of Birth",
    placeOfBirth: "Place of Birth",
    houseBlockLot: "House Block Lot No",
    street: "Street",
    zone: "Zone",
    contactNo: "Contact No",
    residencyPeriod: "Period of Residency",
    registeredVoter: "Registered Voter",
    houseOwner: "House Owner",
    relationshipToOwner: "Relationship to Owner",
    purpose: "Purpose",
    purposeDetails: "Purpose Details",
    ctcVrrNo: "CTCVRR No",
    issuedAt: "Issued at",
    issuedOn: "Issued on",
    orNo: "OR No",
    remarks: "Remarks",
  };

  // Update PDF fields
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

  // Initialize WebViewer only once
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

  // Only update fields when formData changes
  useEffect(() => {
    updatePDFFields();
  }, [formData]);

  return (
    <div>
      <div className="w-full h-[600px]" ref={viewerRef}></div>
    </div>
  );
};
