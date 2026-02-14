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

export function CertificateEditor() {
  const { id } = useParams<{ id: string }>(); // Get ID from URL
  const [fields, setFields] = useState<TextField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateInfo, setTemplateInfo] = useState<PDFTemplateInfo | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const templateBytesRef = useRef<ArrayBuffer | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);


  const fetchUser = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/api/me",
        { withCredentials: true }
      );

      const user = response.data.data;

      console.log("User data:", user);

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



  const fetchPDFTemplate = async (documentId: string) => {
    setIsLoading(true);
    try {
      console.log('Fetching PDF from API endpoint...');
      const id = parseInt(documentId, 10);
      const metadata = await axios.get(
        `http://127.0.0.1:8000/api/documents/single/${id}`, 
        { withCredentials: true }
      );
      
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

      setFields(savedLayout);
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
        />
        <div className="flex flex-1 min-h-0">
          <EditorSidebar
            fields={fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={handleFieldChange}
            onDelete={handleDeleteField}
            isAdmin={isAdmin}
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