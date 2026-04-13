import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import type { TextField, PDFTemplateInfo } from '@/types/certificate';
import { DEFAULT_FIELD } from '@/types/certificate';
import { loadPDFTemplate, generatePDF, pdfBytesToBlobUrl } from '@/utils/pdfGenerator';
import { Toolbar } from './Toolbar';
import { EditorSidebar } from './Sidebar';
import { PDFPreview } from './PDFPreview';
import { toast } from 'sonner';
import { Layout } from '../Layout';
import { QRCodeField, type QRCodeFieldData } from './QRCodeField';
import { useReleaseDocument } from '@/pages/useReleaseDocument';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentUserData {
  id?: number;
  bcert_number?: string;
  brgyBusinessNo?: string;
  resident_id?: string;
  requester_id?: number;
  requester_type?: string;
  prefix?: string;
  surname?: string;
  firstname?: string;
  first_name?: string;
  middlename?: string;
  middle_name?: string;
  ext?: string;
  ext_name?: string;
  nick_name?: string;
  sex?: string;
  marital_status?: string;
  name_of_spouse?: string;
  age?: number;
  date_of_birth?: string | Date;
  dob?: string | Date;
  place_of_birth?: string;
  pob?: string;
  house_block_lot_no?: string;
  houseBlockLot?: string;
  houseBlockLotNo?: string;
  street?: string;
  zone?: string;
  resident_status?: string;
  period_of_residency?: string;
  contact_no?: string;
  phone_number?: string;
  email_address?: string;
  businessName?: string;
  businessType?: string;
  businessDetails?: string;
  capital?: number;
  establishment?: string;
  inspectedBy?: string;
  dateOfInspection?: string | Date;
  inspectionRemarks?: string;
  inspectedRemarks?: string;
  dateInspected?: string | Date;
  inspectedNote?: string;
  orNo?: string;
  or_no?: string;
  ctc_vrr_no?: string;
  issued_at?: string;
  issued_on?: string | Date;
  issuedDate?: string | Date;
  purpose?: string;
  purposeDetails?: string;
  purpose_details?: string;
  remarks?: string;
  punongBarangay?: string;
  forThePunongBarangay?: string;
  barangayPosition?: string;
  status?: string;
  registered_voter?: string;
  house_owner?: string;
  relationship_to_owner?: string;
  photo?: string;
  notes?: string;
  position?: string;
  occupation?: string;
  emp_status?: string;
  blood_type?: string;
  complexion?: string;
  pwd?: string;
  precinct_no?: string;
  released_document_path?: string;
  released_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCUMENT_API_PATHS: Record<string, string> = {
  "1": "barangay-certificates",
  "2": "barangay-clearances",
  "3": "building-clearances",
  "4": "business-clearances",
  "5": "cedulay",
  "6": "residents",
};

export const CLEARANCE_FIELDS: Record<string, string[]> = {
  'Barangay Certificate': [
    'Barangay Clearance No', 'First Name', 'M.I.', 'Last Name', 'Ext Name',
    'Date of Birth', 'Age', 'Prefix', 'Place of Birth', 'Contact No',
    'Registered Voter', 'Period of Residency', 'House Owner',
    'Relationship to House Owner', 'Purpose Details', 'House Block Lot No',
    'Street', 'Zone', 'Purpose', 'Status', 'Created By',
  ],
  'Barangay Clearance': [
    'Barangay Clearance No', 'First Name', 'M.I.', 'Last Name', 'Ext Name',
    'Date of Birth', 'Place of Birth', 'House Block Lot No', 'Street', 'Zone',
    'Purpose', 'Issued At', 'Remarks', 'Status', 'Created By',
    'Barangay Clearance No', 'Period of Residency', 'House Owner',
    'Relationship to House Owner', 'Purpose Details', 'CTC/VRR No',
    'Issued On', 'OR No', 'Date',
  ],
  'Business Clearance': [
    'Brgy Business No', 'Issued Date', 'Prefix', 'Ext Name', 'First Name',
    'M.I.', 'Last Name', 'Business Name', 'Business Type', 'Business Details',
    'Capital', 'House Block Lot No', 'Street', 'Zone', 'OR No',
    'Inspected By', 'Inspection Remarks', 'Inspected Remarks', 'Date Inspected',
    'Inspected Note', 'Issued Date', 'Status', 'Created By', 'Brgy Business No', 'Seperator',
  ],
  'Building Clearance': [
    'Barangay Clearance No', 'First Name', 'M.I.', 'Last Name', 'Ext Name',
    'Prefix', 'Establishment', 'House Block Lot No', 'Street', 'Zone',
    'Purpose', 'Purpose Details', 'OR No', 'Remarks', 'Status', 'Created By',
  ],
  'Certificate': [
    'First Name', 'Middle Name', 'Last Name', 'Extension', 'Block No',
    'Street', 'Zone', 'Date of Birth', 'Age', 'Registered Voter',
    'Period of Residency', 'Purpose', 'Status', 'Created By', 'Barangay Clearance No',
  ],
  'Resident': [
    'Resident ID', 'Prefix', 'First Name', 'M.I.', 'Last Name', 'Ext Name',
    'Nickname', 'Sex', 'Date of Birth', 'Place of Birth', 'Marital Status',
    'Name of Spouse', 'Religion', 'Blood Type', 'Complexion', 'PWD',
    'Height (cm)', 'Weight (kg)', 'Phone Number', 'Email Address',
    'House Block Lot No', 'Street', 'Zone', 'Resident Status',
    'Period of Residency', 'House Owner', 'Relationship to House Owner',
    'Voter Status', 'Precinct No', 'Occupation', 'Position',
    'Employment Status', 'Notes', 'Status',
  ],
};

export const LABEL_TO_KEY: Record<string, string> = {
  'First Name': 'first_name',
  'Middle Name': 'middle_name',
  'M.I.': 'middle_name',
  'Last Name': 'surname',
  'Prefix': 'prefix',
  'Ext Name': 'ext_name',
  'Nickname': 'nick_name',
  'Sex': 'sex',
  'Marital Status': 'marital_status',
  'Name of Spouse': 'name_of_spouse',
  'Age': 'age',
  'Date of Birth': 'dob',
  'Place of Birth': 'pob',
  'Date': 'created_at',
  'House Block Lot No': 'house_block_lot_no',
  'HouseBlockLot': 'houseBlockLot',
  'Street': 'street',
  'Zone': 'zone',
  'Resident Status': 'resident_status',
  'Period of Residency': 'period_of_residency',
  'House Owner': 'house_owner',
  'Relationship to House Owner': 'relationship_to_owner',
  'Contact No': 'contact_no',
  'Phone Number': 'phone_number',
  'Email Address': 'email_address',
  'Business Name': 'business_name',
  'Business Type': 'business_type',
  'Business Details': 'business_details',
  'Capital': 'capital',
  'Establishment': 'establishment',
  'Inspected By': 'inspected_by',
  'Date of Inspection': 'date_of_inspection',
  'Inspection Remarks': 'inspection_remarks',
  'Inspected Remarks': 'inspected_remarks',
  'Date Inspected': 'date_inspected',
  'Inspected Note': 'inspected_note',
  'OR No': 'or_no',
  'OR No Alt': 'orNo',
  'CTC/VRR No': 'ctc_vrr_no',
  'Issued At': 'issued_at',
  'Issued On': 'issued_on',
  'Issued Date': 'issued_date',
  'Purpose': 'purpose',
  'Purpose Details': 'purpose_details',
  'Remarks': 'remarks',
  'Barangay Clearance No': 'bcert_number',
  'Brgy Business No': 'brgy_business_no',
  'Punong Barangay': 'punong_barangay',
  'For The Punong Barangay': 'for_the_punong_barangay',
  'Barangay Position': 'barangay_position',
  'Status': 'status',
  'Registered Voter': 'registered_voter',
  'Photo': 'photo',
  'Notes': 'notes',
  'Position': 'position',
  'Occupation': 'occupation',
  'Employment Status': 'emp_status',
  'Blood Type': 'blood_type',
  'Complexion': 'complexion',
  'PWD': 'pwd',
  'Precinct No': 'precinct_no',
  'Religion': 'religion',
  'Voter Status': 'voter_status',
  'Height (cm)': 'height_cm',
  'Weight (kg)': 'weight_kg',
  'ID': 'id',
  'Resident ID': 'resident_id',
  'Requester ID': 'requester_id',
  'Requester Type': 'requester_type',
  'Created At': 'created_at',
  'Updated At': 'updated_at',
};

export const toTitleCase = (value: string) => {
  if (!value) return "";

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CertificateEditor() {
  const { id, bcertNumber } = useParams<{ id: string; bcertNumber: string }>();
  const location = useLocation();
  const ticket = location.state?.ticket;
  const autoPrint = location.state?.autoPrint;

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedClearanceType, setSelectedClearanceType] = useState<string | null>(null);
  const [fields, setFields] = useState<TextField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateInfo, setTemplateInfo] = useState<PDFTemplateInfo | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingToPay, setIsMarkingToPay] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [documentUserData, setDocumentUserData] = useState<DocumentUserData[] | undefined>(undefined);
  const [streets, setStreets] = useState<{ id: number; name: string; sitio: string; formerly?: string }[]>([]);
  const [qrField, setQrField] = useState<QRCodeFieldData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const templateBytesRef = useRef<ArrayBuffer | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const pdfPreviewContainerRef = useRef<HTMLDivElement>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  // NOTE: existingRecord is derived BEFORE useReleaseDocument so the hook
  // always receives the correct recordId on first render.
  const existingRecord =
  documentUserData && documentUserData.length > 0
    ? documentUserData[0]
    : ticket?.serviceable
      ? ticket.serviceable
      : null;

  const isUpdate = !!existingRecord?.bcert_number;


  const resolvedBcert = bcertNumber ?? existingRecord?.bcert_number ?? null;

  

  // ── Release hook ─────────────────────────────────────────────────────────────
  const {
    releaseDocument,
    downloadReleased,
    isReleasing,
    isDownloading,
    hasReleasedDocument,
  } = useReleaseDocument({
    documentId:          id,
    recordId:            existingRecord?.id,
    templateBytes:       templateBytesRef.current,
    fields,
    qrField,
    bcertNumber:         resolvedBcert,
    // Seed from DB so the "Download Released" button shows on page load
    initialReleasedPath: existingRecord?.released_document_path ?? null,
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getApiPath = (documentId: string | number) =>
    DOCUMENT_API_PATHS[String(documentId)] || "barangay-clearances";

  const buildPayloadFromFields = () => {
  const payload: Record<string, any> = {};

  fields.forEach((field) => {
    const key = LABEL_TO_KEY[field.label];
    if (!key) return;

    let value = field.value;

    if (typeof value === "string" && value.includes("T")) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) value = date.toISOString().split("T")[0];
    }

    // ✅ FIX HERE
    if (key === "bcert_number") {
      if (!value || value.trim() === "") {
        return; // ❗ DO NOT INCLUDE FIELD AT ALL
      }
      payload[key] = value;
      return;
    }

    // default status
    if (key === "status") {
      payload[key] = value || "ENCODED";
    } else {
      payload[key] = value ?? "";
    }
  });

  return payload;
};

  const normaliseDate = (value: any): any => {
    if (typeof value === "string" && value.includes("T")) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }
    return value;
  };

  const getTicketValue = (key: string, ticket: any) => {
    if (!ticket?.serviceable) return null;
    const source = ticket.serviceable;
    const keyMap: Record<string, string> = {
      surname:              "last_name",
      dob:                  "date_of_birth",
      pob:                  "place_of_birth",
      relationship_to_owner: "relation_to_house_owner",
    };
    return source[keyMap[key] ?? key] ?? null;
  };

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchStreets = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/streets', { withCredentials: true });
      setStreets(res.data);
    } catch {
      toast.error('Failed to load streets');
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/me", { withCredentials: true });
      setIsAdmin(res.data.data?.role === "ADMIN");
    } catch {
      console.error("Failed to fetch user");
    }
  };

  const fetchUserDocument = async () => {
    try {
      const apiPath = getApiPath(id!);
      const res = await axios.get(
        `http://127.0.0.1:8000/api/${apiPath}?search=${bcertNumber}`,
        { withCredentials: true }
      );
      setDocumentUserData(res.data.data.data);
    } catch {
      toast.error('Failed to fetch document');
    }
  };

  // ── PDF template ─────────────────────────────────────────────────────────────

  const renderPreview = useCallback(async (currentFields: TextField[]) => {
    if (!templateBytesRef.current) return;
    try {
      const bytes = await generatePDF(
        templateBytesRef.current,
        currentFields,
        qrField,
        resolvedBcert
      );
      const url = pdfBytesToBlobUrl(bytes);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error("PDF render error:", err);
    }
  }, [qrField, resolvedBcert]);

  const debouncedRender = useCallback((currentFields: TextField[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => renderPreview(currentFields), 150);
  }, [renderPreview]);

  const fetchPDFTemplate = async (documentId: string, existingData?: DocumentUserData) => {
    setIsLoading(true);
    try {
      const numId = parseInt(documentId, 10);
      const metadataRes = await axios.get(
        `http://127.0.0.1:8000/api/documents/single/${numId}`,
        { withCredentials: true }
      );
      const metadata = metadataRes.data;
      if (!metadata.file_url) throw new Error('Document URL missing');

      const fileUrl = metadata.file_url.startsWith("http")
        ? metadata.file_url
        : `https://bold-sunset-533d.clarkkentraguhos.workers.dev${metadata.file_url}`;

      const pdfRes = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        withCredentials: true,
      });

      const pdfBlob = new Blob([pdfRes.data], { type: 'application/pdf' });
      templateBytesRef.current = await pdfBlob.arrayBuffer();

      const { info } = await loadPDFTemplate(templateBytesRef.current);
      setTemplateInfo(info);
      setCurrentPage(0);

      // Parse saved layout
      let savedLayout: TextField[] = [];
      if (metadata.layout) {
        try {
          savedLayout = Array.isArray(metadata.layout)
            ? metadata.layout
            : JSON.parse(metadata.layout);
        } catch {
          console.error('Invalid layout format');
        }
      }

      // Merge layout with record data
      const record = existingData ?? null;
      const mergedFields = savedLayout.map((field) => {
        const key = LABEL_TO_KEY[field.label];
        let value: any = '';
        if (key) {
          if (record) {
            value = (record as any)[key];
          } else if (ticket?.serviceable) {
            const source = ticket.serviceable;
            const keyMap: Record<string, string> = {
              surname:              'last_name',
              dob:                  'date_of_birth',
              pob:                  'place_of_birth',
              relationship_to_owner: 'relation_to_house_owner',
            };
            value = source[keyMap[key] ?? key];
          }
        }
        value = normaliseDate(value);
        return { ...field, value: value ?? '' };
      });

      setFields(mergedFields);
      setSelectedId(null);
      await renderPreview([]);
      toast.success('Template loaded successfully');
    } catch (error) {
      console.error('Failed to fetch PDF:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) toast.error('Document not found');
        else if ([401, 403].includes(error.response?.status ?? 0)) toast.error('Not authorized');
        else toast.error(`Server error: ${error.response?.status ?? 'Unknown'}`);
      } else {
        toast.error('Failed to load PDF template from server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => { fetchStreets(); }, []);

  // Primary init: fetch user, document record, then template
  useEffect(() => {
    const init = async () => {
      fetchUser();
      let existingData: DocumentUserData | undefined;

      if (bcertNumber && bcertNumber !== "new") {
        try {
          const apiPath = getApiPath(id!);
          const res = await axios.get(
            `http://127.0.0.1:8000/api/${apiPath}?search=${bcertNumber}`,
            { withCredentials: true }
          );
          const records: DocumentUserData[] = res.data.data.data;
          setDocumentUserData(records);
          existingData = records?.[0];
        } catch {
          toast.error('Failed to fetch document');
        }
      } else {
        setDocumentUserData([]);
      }

      if (id) await fetchPDFTemplate(id, existingData);
    };

    init();
  }, [id, bcertNumber]);

  // Sync fetched record → fields
  useEffect(() => {
    if (!documentUserData || documentUserData.length === 0) return;
    if (!bcertNumber || bcertNumber === "new") return;
    const record = documentUserData[0];
    setFields((prev) =>
      prev.map((field) => {
        const key = LABEL_TO_KEY[field.label];
        if (!key) return field;
        const newValue = normaliseDate((record as any)[key]);
        return { ...field, value: newValue ?? field.value };
      })
    );
  }, [documentUserData, bcertNumber]);

  // Sync ticket data → fields
  useEffect(() => {
    if (!ticket || !fields.length) return;
    setFields((prev) =>
      prev.map((field) => {
        const key = LABEL_TO_KEY[field.label];
        if (!key) return field;
        const newValue = normaliseDate(getTicketValue(key, ticket));
        return { ...field, value: newValue ?? field.value };
      })
    );
  }, [ticket, fields.length]);

  // Auto-print on navigation state flag
  useEffect(() => {
    if (!autoPrint || !templateInfo || !templateBytesRef.current || !fields.length) return;
    if (!fields.some((f) => f.value !== null && f.value !== '')) return;
    const timer = setTimeout(() => { handlePrint(); }, 500);
    return () => clearTimeout(timer);
  }, [autoPrint, templateInfo, fields]);

  // Re-render preview when bcertNumber changes
  useEffect(() => {
    if (!bcertNumber || bcertNumber === "new") {
      setDocumentUserData([]);
      setFields((prev) => prev.map((f) => ({ ...f, value: '' })));
    } else {
      fetchUserDocument();
    }
  }, [bcertNumber]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleClearanceChange = (type: string) => {
    setSelectedClearanceType(type);
    const newFields: TextField[] = (CLEARANCE_FIELDS[type] ?? []).map((label) => ({
      ...DEFAULT_FIELD,
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      value: '',
      page: 0,
    }));
    setFields(newFields);
    setSelectedId(null);
  };

  const handleToggleQR = () => {
    if (qrField?.visible) {
      setQrField(null);
    } else {
      setQrField({ x: 5, y: 80, size: 96, page: currentPage, visible: true });
    }
  };

  const handleUpload = useCallback(async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      templateBytesRef.current = buffer;
      const { info } = await loadPDFTemplate(buffer);
      setTemplateInfo(info);
      setCurrentPage(0);
      setFields([]);
      setSelectedId(null);
      await renderPreview([]);
      toast.success('Template loaded successfully');
    } catch {
      toast.error('Failed to load PDF template');
    }
  }, [renderPreview]);

  const handleAddField = useCallback((label: string) => {
    const fieldId = `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newField: TextField = { ...DEFAULT_FIELD, id: fieldId, label, value: '', page: currentPage };
    setFields((prev) => [...prev, newField]);
    setSelectedId(fieldId);
  }, [currentPage]);

  const handleFieldChange = useCallback((fieldId: string, updates: Partial<TextField>) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  }, []);

  const handleDeleteField = useCallback((fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    setSelectedId((prev) => (prev === fieldId ? null : prev));
  }, []);

  const handleDrag = useCallback((fieldId: string, x: number, y: number) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, x, y } : f)));
  }, []);

  const handlePrint = async () => {
    if (!templateBytesRef.current) {
      toast.error("Template not loaded");
      return;
    }
    try {
      const bytes = await generatePDF(templateBytesRef.current, fields, qrField, resolvedBcert);
      const blob  = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url   = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;width:0;height:0;border:none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 300);
      };
    } catch {
      toast.error("Failed to print PDF");
    }
  };

  const handleChangeStatus = async (status: string) => {
    if (!existingRecord?.id) {
      toast.error("No record found.");
      return;
    }

    const apiPath = getApiPath(id!);
    setIsChangingStatus(true);

    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/api/${apiPath}/${existingRecord.id}`,
        { status },
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success(`Status updated to ${status}`);
        setDocumentUserData((prev) =>
          prev?.map((rec, i) =>
            i === 0 ? { ...rec, status } : rec
          )
        );
        setSelectedStatus("");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update status.");
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!templateBytesRef.current) return;
    try {
      const bytes = await generatePDF(templateBytesRef.current, fields, qrField, resolvedBcert);
      const blob  = new Blob([bytes], { type: "application/pdf" });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href      = url;
      a.download  = "certificate.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to generate PDF");
    }
  }, [fields, qrField, resolvedBcert]);

  const handleSaveLayout = useCallback(() => {
    axios
      .put(`http://127.0.0.1:8000/api/documents/${id}/layout`, { layout: fields }, { withCredentials: true })
      .then((res) => {
        if (res.status === 200) toast.success('Layout saved successfully');
        else toast.error('Failed to save layout');
      })
      .catch(() => toast.error('Failed to save layout'));
  }, [fields, id]);

  const handleLoadLayout = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const loaded = JSON.parse(reader.result as string) as TextField[];
        setFields(loaded);
        setSelectedId(null);
        toast.success('Layout loaded');
      } catch {
        toast.error('Invalid layout file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleSubmitCertificate = async () => {
    try {
      const payload = {
        ...buildPayloadFromFields(),
        requester_type: "WALK_IN",
      };

      console.log("Payload for submission:", payload);

      const apiPath = getApiPath(id!);

      // 🔥 Extract the unique key
      // const bcertNumber = payload.bcert_number;

      // if (!bcertNumber) {
      //   toast.error("Barangay Clearance No is required.");
      //   return;
      // }

      // =====================================================
      // ✅ STEP 1: CHECK IF RECORD EXISTS USING BCERT NUMBER
      // =====================================================
      let existingId: number | null = null;

      try {
        const checkRes = await axios.get(
          `http://127.0.0.1:8000/api/${apiPath}?search=${bcertNumber}`,
          { withCredentials: true }
        );

        const records = checkRes.data.data.data;

        if (records && records.length > 0) {
          existingId = records[0].id;
        }
      } catch (err) {
        console.error("Check existing failed", err);
      }

      // =====================================================
      // ✅ STEP 2: UPDATE OR CREATE
      // =====================================================
      if (existingId) {
        // 🔥 UPDATE (NO DUPLICATE)
        await axios.put(
          `http://127.0.0.1:8000/api/${apiPath}/${existingId}`,
          payload,
          { withCredentials: true }
        );

        toast.success("Record updated (no duplicate created)");
      } else {
        // 🔥 CREATE
        await axios.post(
          `http://127.0.0.1:8000/api/${apiPath}`,
          payload,
          { withCredentials: true }
        );

        toast.success("Record saved successfully");
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 422) {
          const errs = error.response?.data?.errors;
          if (errs) {
            Object.values(errs).forEach((m: any) => m[0] && toast.error(m[0]));
          }
        } else if (status === 401) {
          toast.error("You are not authenticated.");
        } else if (status === 403) {
          toast.error("You are not allowed to perform this action.");
        } else {
          toast.error("Something went wrong.");
        }
      } else {
        toast.error("Network error.");
      }
    }
  };

  const handleMarkToPay = async () => {
    if (!existingRecord?.id) { toast.error("No record found to update."); return; }
    const apiPath = getApiPath(id!);
    setIsMarkingToPay(true);
    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/api/${apiPath}/${existingRecord.id}`,
        { status: "TO_PAY" },
        { withCredentials: true }
      );
      if (res.status === 200) {
        toast.success("Status set to To Pay successfully.");
        setDocumentUserData((prev) =>
          prev?.map((rec, i) => (i === 0 ? { ...rec, status: "TO_PAY" } : rec))
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update status.");
    } finally {
      setIsMarkingToPay(false);
    }
  };

  // ── Loading screen ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </Layout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <Toolbar
          selectedClearanceType={selectedClearanceType}
          fields={fields}
          selectedId={selectedId}
          onChangeClearanceType={handleClearanceChange}
          onUpload={handleUpload}
          onAddField={handleAddField}
          onDownload={handleDownload}
          onChangeStatus={handleChangeStatus}
          isChangingStatus={isChangingStatus}
          onSaveLayout={handleSaveLayout}
          onLoadLayout={handleLoadLayout}
          hasTemplate={!!templateInfo}
          isAdmin={isAdmin}
          onSubmit={handleSubmitCertificate}
          onMarkToPay={handleMarkToPay}
          isMarkingToPay={isMarkingToPay}
          isUpdate={isUpdate}
          onPrint={handlePrint}
          // ── Release ──────────────────────────────────────────────────────
          onRelease={releaseDocument}
          onDownloadReleased={downloadReleased}
          isReleasing={isReleasing}
          isDownloading={isDownloading}
          hasReleasedDocument={hasReleasedDocument || !!existingRecord?.released_document_path}
          
        />

        <div className="flex flex-1 min-h-0">
          <EditorSidebar
            fields={fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={handleFieldChange}
            onDelete={handleDeleteField}
            isAdmin={isAdmin}
            documentData={documentUserData}
            streets={streets}
            bcertNumber={resolvedBcert}
            qrEnabled={!!qrField?.visible}
            onToggleQR={handleToggleQR}
          />

          <PDFPreview
            blobUrl={blobUrl}
            templateInfo={templateInfo}
            fields={fields}
            selectedId={selectedId}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSelectField={setSelectedId}
            onDragField={handleDrag}
            onDeleteField={handleDeleteField}
            onDeselect={() => setSelectedId(null)}
            qrField={qrField}
            onQRChange={(updates) =>
              setQrField((prev) => (prev ? { ...prev, ...updates } : null))
            }
            onQRRemove={() => setQrField(null)}
            bcertNumber={resolvedBcert}
          />
        </div>
      </div>
    </Layout>
  );
}