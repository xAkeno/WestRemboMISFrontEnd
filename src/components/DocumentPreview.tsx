interface DocumentPreviewProps {
  formData: {
    recordNo: string;
    clearanceNo: string;
    issuedDate: string;
    prefix: string;
    firstname: string;
    middleName: string;
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
    applicantType: string;
    address: string;
    officialReceipt: string;
    businessClearance: string;
  };
}

export const DocumentPreview = ({ formData }: DocumentPreviewProps) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-document-bg p-8 rounded-lg shadow-sm border border-border min-h-[800px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-border">
        <div className="flex-1 text-center">
          <div className="text-xs mb-2 font-semibold">Republic of the Philippines</div>
          <div className="text-xs mb-1">City of Taguig</div>
          <div className="text-sm font-bold mb-1">Barangay West Rembo</div>
          <div className="text-xs">Plaza Drive, A. Mabini Street West Rembo, 1644</div>
          <div className="text-xs">Hotline 8836-9722</div>
          <div className="text-xs">Email Add: westrembokaptebas@gmail.com</div>
        </div>
      </div>

      {/* Office Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold border-b-2 border-foreground inline-block pb-1">
          OFFICE OF THE PUNONG BARANGAY
        </h2>
      </div>

      {/* Date Field */}
      <div className="text-right mb-8">
        <span className="text-sm">Date: {formData.issuedDate || '_____________'}</span>
      </div>

      {/* Main Title */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold mb-2">BARANGAY BUILDING CLEARANCE</h1>
      </div>

      {/* Content */}
      <div className="space-y-6 text-sm">
        <p className="font-semibold">TO WHOM IT MAY CONCERN:</p>
        
        <p className="text-justify leading-relaxed">
          THIS IS TO CERTIFY that BARANGAY BUILDING CLEARANCE is hereby issued to the
          person whose name and thumb marks appear hereon.
        </p>

        <div className="space-y-3">
          <div>
            <span className="font-semibold">Individual/Establishment:</span>
            <div className="mt-1 text-center text-base font-semibold">
              {formData.firstname || formData.establishment ? (
                formData.establishment || 
                `${formData.prefix} ${formData.firstname} ${formData.middleName} ${formData.surname} ${formData.extension}`.trim()
              ) : (
                "#Type!"
              )}
            </div>
          </div>

          <div>
            <span className="font-semibold">Address:</span>
            <div className="mt-1 text-center">
              {formData.address || formData.houseBlockLot || formData.street || formData.zone ? (
                `${formData.houseBlockLot} ${formData.street} ${formData.zone}`.trim()
              ) : (
                "#Type!"
              )}
            </div>
          </div>
        </div>

        <p className="text-justify leading-relaxed">
          This clearance is issued to enable the aforementioned subject/establishment to support
          the application in securing the necessary City Mayor's Permit/License.
        </p>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div>Official Receipt No.: {formData.officialReceipt || '_______________'}</div>
            <div>Business Clearance No.: {formData.businessClearance || '_______________'}</div>
            <div>Remarks: {formData.remarks || '_______________'}</div>
          </div>
          <div className="border border-border h-32 flex items-end justify-around p-2">
            <div className="text-center text-xs">Left</div>
            <div className="text-center text-xs">Right</div>
          </div>
        </div>

        <div className="text-right text-xs">City Building Permit</div>

        {/* Signature Section */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="text-center mb-8 text-xs">Applicant's Signature</div>
          
          <div className="text-center">
            <div className="border-t-2 border-foreground inline-block w-64 mb-2"></div>
            <div className="font-bold text-sm">HON. LEO E. BES</div>
            <div className="text-xs">PUNONG BARANGAY</div>
          </div>
        </div>
      </div>
    </div>
  );
};
