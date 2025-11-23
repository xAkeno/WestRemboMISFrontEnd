import WebViewer from "@pdftron/webviewer";
import { useEffect, useRef } from "react";

interface FormData {
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

interface BusinessClearancePreviewProps {
  formData: FormData;
  handleTemplateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  templatePath?: string;
}

export const BusinessClearancePreview = ({
  formData,
  handleTemplateUpload,
  templatePath = "/templates/damm.pdf",
}: BusinessClearancePreviewProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  const fieldMapping: Record<string, string> = {
    brgyBusinessNo: "Brgy Business No",
    issuedDate: "Issued Date",
    prefix: "Prefix",
    firstname: "Firstname",
    middleName: "Middle Name",
    surname: "Surname",
    ext: "Extension",
    businessName: "Business Name",
    businessType: "Business Type",
    businessDetails: "Business Details",
    capital: "Capital",
    orNo: "OR No",
    houseBlockLotNo: "House Block Lot No",
    street: "Street",
    zone: "Zone",
    inspectedBy: "Inspected By",
    dateOfInspection: "Date of Inspection",
    inspectionRemarks: "Inspection Remarks",
    inspectedRemarks: "Inspected Remarks",
    dateInspected: "Date Inspected",
    inspectedNote: "Inspected Note",
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
        licenseKey: "demo:1763914622659:60e900c30300000000e92a6b15fc125996c1e67a34dc24ca13fef56e4a",
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

  // Update fields when formData changes
  useEffect(() => {
    updatePDFFields();
  }, [formData]);

  return (
    <div>
      <div className="w-full h-[600px]" ref={viewerRef}></div>
    </div>
  );
};
