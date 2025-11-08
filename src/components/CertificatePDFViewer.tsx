import { useEffect, useRef } from "react";
import WebViewer from "@pdftron/webviewer";

interface CertificatePDFViewerProps {
  formData: any;
}

export const CertificatePDFViewer = ({ formData }: CertificatePDFViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null); // <-- store WebViewer instance here

  useEffect(() => {
    WebViewer(
      {
        path: "/webviewer/lib",
        initialDoc: "/templates/barangay_certificate.pdf",
      },
      viewerRef.current!
    ).then((instance: any) => {
      viewerInstanceRef.current = instance; // <-- save instance for later use

      const { docViewer, annotManager, Annotations } = instance;

      docViewer.on("documentLoaded", () => {
        const annotation = new Annotations.FreeTextAnnotation();
        annotation.PageNumber = 1;
        annotation.X = 100;
        annotation.Y = 200;
        annotation.Width = 400;
        annotation.Height = 50;
        annotation.setContents(
          `This is to certify that ${formData.firstname || "______"} ${formData.surname || ""}`
        );
        annotManager.addAnnotation(annotation);
        annotManager.redrawAnnotation(annotation);
      });
    });
  }, [formData]);

  // ✅ 2. File upload handler
  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewerInstanceRef.current) {
      viewerInstanceRef.current.loadDocument(file); // <-- load new PDF template
    }
  };

  return (
    <div>
      {/* Upload button */}
      <input type="file" accept=".pdf" onChange={handleTemplateUpload} className="mb-4" />
      
      {/* PDFTron viewer */}
      <div className="w-full h-[600px]" ref={viewerRef}></div>
    </div>
  );
};
