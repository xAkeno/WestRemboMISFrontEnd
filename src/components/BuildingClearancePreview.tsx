import WebViewer from "@pdftron/webviewer";
import { useEffect, useRef } from "react";

interface FormData {
  bcert_number: string;
  issuedDate: string;
  prefix: string;
  firstname: string;
  middlename: string;
  surname: string;
  extension: string;
  establishment: string;
  purpose: string;
  purposeDetails: string;
  houseBlockLot: string;
  street: string;
  zone: string;
  orNo: string;
  remarks: string;
  punongBarangay: string;
  forThePunongBarangay: string;
  barangayPosition: string
}

interface Props {
  formData: FormData;
  handleTemplateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  templatePath?: string;
}

export const BuildingClearancePreview = ({
  formData,
  handleTemplateUpload,
  templatePath = "/templates/yowyow.pdf",
}: Props) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  const fieldMapping: Record<string, string> = {
    recordNo: "Record No",
    clearanceNo: "Clearance No",
    issuedDate: "Issued Date",
    prefix: "Prefix",
    firstname: "Firstname",
    middleName: "Middle Name",
    surname: "Surname",
    extension: "Extension",
    establishment: "Establishment",
    purpose: "Purpose",
    purposeDetails: "Purpose Details",
    houseBlockLot: "House Block Lot No",
    street: "Street",
    zone: "Zone",
    orNo: "OR No",
    remarks: "Remarks",
    applicantType: "Applicant Type",
    address: "Address",
  };
  console.log("Field Mapping:", formData);

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
        licenseKey: "demo:1763914622659:60e900c30300000000e92a6b15fc125996c1e67a34dc24ca13fef56e4a",
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
