import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Add this import
import axios from 'axios'; // Add this import
import type { TextField, PDFTemplateInfo } from '@/types/certificate';
import { DEFAULT_FIELD } from '@/types/certificate';
import { loadPDFTemplate, generatePDF, pdfBytesToBlobUrl } from '@/utils/pdfGenerator';
import { Toolbar } from './Toolbar';
import { EditorSidebar } from './Sidebar';
import { PDFPreview } from './PDFPreview';
import { toast } from 'sonner';
import { Layout } from '../Layout';
import { useLocation } from 'react-router-dom';
const LABEL_TO_KEY: Record<string, string> = {
  'First Name': 'first_name',
  'Middle Name': 'middle_name',
  'Last Name': 'surname',

  'House block lot no': 'house_block_lot_no',
  'Street': 'street',
  'Zone': 'zone',

  'DateofBirth': 'dob',                
  'PlaceofBirth': 'pob',

  'Period of residency': 'period_of_residency',
  'House Owner': 'house_owner',
  'Releationship to House Owner': 'relationship_to_owner',

  'CTC/VRR No.': 'ctc_vrr_no',
  'Issued at': 'issued_at',
  'Issued On': 'issued_on',
  'OR No': 'or_no',

  'Barangay Clearance No': 'bcert_number',

  'Remarks': 'remarks',
  'Date': 'issued_date',               

  'Purpose': 'purpose',
  'Purpose Details': 'purpose_details',
};



export function CertificateEditor() {
  const { id,bcertNumber } = useParams<{ id: string, bcertNumber: string }>(); // Get ID from URL
  
  const [fields, setFields] = useState<TextField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateInfo, setTemplateInfo] = useState<PDFTemplateInfo | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const templateBytesRef = useRef<ArrayBuffer | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [documentUserData, setDocumentUserData] = useState();

  const location = useLocation();
  const ticket = location.state?.ticket;
  

  const fetchUserDocument = async () => {
    const response = await axios.get(
      `http://127.0.0.1:8000/api/barangay-clearances?search=${bcertNumber}`,
      {withCredentials: true}
    )
    setDocumentUserData(response.data.data.data);
    console.log(response.data.data.data)
  }

  const fetchUser = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/me",
        { withCredentials: true }
      );

      const user = response.data.data;

      // Adjust depending on your backend structure
      if (user.role === "ADMIN") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  };

  const buildPayloadFromFields = () => {
    const payload: Record<string, any> = {};

    fields.forEach((field) => {
      const key = LABEL_TO_KEY[field.label];
      if (!key) return;

      let value = field.value;

      // Clean ISO date if needed
      if (typeof value === "string" && value.includes("T")) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          value = date.toISOString().split("T")[0]; // YYYY-MM-DD
        }
      }

      payload[key] = value ?? "";
    });

    return payload;
  };

  const handleSubmitCertificate = async () => {
    try {
      const payload = {
        ...buildPayloadFromFields(),
        requester_type: "WALK_IN" // 👈 add this
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/api/barangay-clearances",
        payload,
        { withCredentials: true }
      );

      toast.success("Certificate saved successfully");
      console.log(response.data);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        // ✅ Laravel Validation Error
        if (status === 422) {
          const validationErrors = error.response?.data?.errors;

          if (validationErrors) {
            Object.keys(validationErrors).forEach((key) => {
              const messages = validationErrors[key];
              if (messages.length > 0) {
                toast.error(messages[0]); // show first error message
              }
            });
          } else {
            toast.error("Validation failed.");
          }

        }

        // ✅ Unauthorized
        else if (status === 401) {
          toast.error("You are not authenticated.");
        }

        // ✅ Forbidden
        else if (status === 403) {
          toast.error("You are not allowed to perform this action.");
        }

        // ✅ Server Error
        else if (status === 500) {
          toast.error("Server error. Please try again.");
        }

        else {
          toast.error("Something went wrong.");
        }

      } else {
        toast.error("Network error. Please check your connection.");
      }

      console.error(error);
    }
  };




  // When documentUserData or fields change, update only existing fields
  useEffect(() => {
    if (!documentUserData || fields.length === 0) return;

    setFields((prevFields) =>
      prevFields.map((field) => {
        const key = LABEL_TO_KEY[field.label]; // get corresponding key
        if (!key) return field; // no mapping, skip

        // Get the value from the first item in documentUserData array
        let newValue = (documentUserData[0] as any)[key];

        // ✅ Clean ISO date format
        if (typeof newValue === "string" && newValue.includes("T")) {
          const date = new Date(newValue);
          if (!isNaN(date.getTime())) {
            newValue = date.toLocaleDateString("en-CA"); 
            // en-CA → 2026-02-11 (YYYY-MM-DD)
            // use "en-US" if you want MM/DD/YYYY
          }
        }


        if (newValue !== undefined && newValue !== field.value) {
          return { ...field, value: newValue };
        }

        return field;
      })
    );
  }, [documentUserData, fields]);





  const fetchPDFTemplate = async (documentId: string) => {
    setIsLoading(true);
    try {
      console.log('Fetching PDF from API endpoint...');
      const id = parseInt(documentId, 10);
      const metadata = await axios.get(
        `http://127.0.0.1:8000/api/documents/single/${id}`, 
        { withCredentials: true }
      );

      console.log(metadata);
      
      const filename = metadata.data.file_path.replace(/^public\/documents\//, '');

      // Then fetch the PDF using the filename
      const pdfResponse = await axios.get(`http://127.0.0.1:8000/api/documents/${filename}`, {
        responseType: 'arraybuffer',
        withCredentials: true,
      });

      const buffer = pdfResponse.data;

      // Debug check
      const firstBytes = new Uint8Array(buffer.slice(0, 10));
      console.log('First 10 bytes:', Array.from(firstBytes).map(b => String.fromCharCode(b)).join(''));
      
      templateBytesRef.current = buffer;
      const { info } = await loadPDFTemplate(buffer);
      setTemplateInfo(info);
      setCurrentPage(0);

      let savedLayout: TextField[] = [];
      if (metadata.data.layout) {
        try {
          savedLayout = Array.isArray(metadata.data.layout)
            ? metadata.data.layout
            : JSON.parse(metadata.data.layout);
        } catch (err) {
          console.error("Invalid layout format:", err);
        }
      }

      let mergedFields = savedLayout.map((field) => {
  const key = LABEL_TO_KEY[field.label];
  if (!key) return field;

  let value = (ticket?.serviceable as any)?.[key];

  // Format date if needed
  if (value && (key.includes("date") || key.includes("birth"))) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      value = date.toISOString().split("T")[0];
    }
  }

  return { ...field, value: value ?? field.value }; // <-- only change value
});


      setFields(mergedFields);
      setSelectedId(null);
      await renderPreview([]);
      toast.success('Template loaded successfully');
    } catch (error) {
      console.error('Failed to fetch PDF:', error);
      
      // More specific error messages
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error('Document not found');
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error('Not authorized to access this document');
        } else {
          toast.error(`Server error: ${error.response?.status || 'Unknown'}`);
        }
      } else {
        toast.error('Failed to load PDF template from server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    if (id) {
      fetchPDFTemplate(id);
    }
    if(bcertNumber){
      fetchUserDocument();
    }
  }, [id]);

  // Re-render PDF preview when fields change
  const renderPreview = useCallback(async (currentFields: TextField[]) => {
    if (!templateBytesRef.current) return;
    try {
      const bytes = await generatePDF(templateBytesRef.current, currentFields);
      const url = pdfBytesToBlobUrl(bytes);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error('PDF render error:', err);
    }
  }, []);

  const debouncedRender = useCallback((currentFields: TextField[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => renderPreview(currentFields), 150);
  }, [renderPreview]);

  // Uncomment if you want auto-preview on field changes
  // useEffect(() => {
  //   debouncedRender(fields);
  // }, [fields, debouncedRender]);

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
    const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newField: TextField = { ...DEFAULT_FIELD, id, label, value: '', page: currentPage };
    setFields((prev) => [...prev, newField]);
    setSelectedId(id);
  }, [currentPage]);

  const handleFieldChange = useCallback((id: string, updates: Partial<TextField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const handleDeleteField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleDrag = useCallback((id: string, x: number, y: number) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, x, y } : f)));
  }, []);

  // Only generate preview when downloading
  const handleDownload = useCallback(async () => {
    if (!templateBytesRef.current) return;
    try {
      const bytes = await generatePDF(templateBytesRef.current, fields);
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificate.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  }, [fields]);

  const handleSaveLayout = useCallback(() => {
    const json = JSON.stringify(fields, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    console.log('Saving layout:', fields);
    const save = axios.put(`http://127.0.0.1:8000/api/documents/${id}/layout`, {
      layout: fields
    }, {
      withCredentials: true
    });
    save.then((response) => {
      if(response.status === 200) {
        toast.success('Layout saved successfully');
      } else {
        toast.error('Failed to save layout');
      }
    }).catch((error) => {
      toast.error('Failed to save layout');
    });
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'certificate-layout.json';
    // a.click();
    // URL.revokeObjectURL(url);
    toast.success('Layout saved');
  }, [fields]);

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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <Toolbar
          onUpload={handleUpload}
          onAddField={handleAddField}
          onDownload={handleDownload}
          onSaveLayout={handleSaveLayout}
          onLoadLayout={handleLoadLayout}
          hasTemplate={!!templateInfo}
          isAdmin={isAdmin}
          onSubmit={handleSubmitCertificate}
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
          />
        </div>
      </div>
    </Layout>
  );
}