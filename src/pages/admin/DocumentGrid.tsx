import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, Eye, Edit } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Layout } from "@/components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface DocItem {
  id?: number;
  name: string;
  file_url: string | null;
  file_name: string | null;
}

const DEFAULT_DOCS: DocItem[] = [
  { name: "Barangay Certificate", file_url: null, file_name: null },
  { name: "Barangay Clearance", file_url: null, file_name: null },
  { name: "Building Clearance", file_url: null, file_name: null },
  { name: "Business Clearance", file_url: null, file_name: null },
  { name: "Resident Certificate", file_url: null, file_name: null },
  { name: "Cedula", file_url: null, file_name: null },
];

export function DocumentGrid() {
  const [docs, setDocs] = useState<DocItem[]>(DEFAULT_DOCS);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const API_BASE = "https://westrembomis.onrender.com/api"; // adjust as needed

  // Fetch documents from backend and merge with defaults
  useEffect(() => {
    axios.get(`${API_BASE}/documents`, { withCredentials: true })
      .then(res => {
        console.log("Raw document data:", res.data);
        const dbDocs: DocItem[] = res.data.map((d: any) => ({
          id: d.id,
          name: d.name,
          file_name: d.file_name,
          file_url: d.file_url ?? null, // use backend's file_url
        }));


        const merged = DEFAULT_DOCS.map(def => {
          const found = dbDocs.find(d => d.name === def.name);
          return found ? found : def;
        });

        setDocs(merged);
        console.log("Fetched documents:", merged);
      })
      .catch(err => console.error("Failed to fetch documents", err));
  }, []);

  const handleReplace = (idx: number) => {
    setReplaceIdx(idx);
    setTimeout(() => fileRef.current?.click(), 0);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceIdx === null) return;

    const doc = docs[replaceIdx];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", doc.name);

    try {
      let res;

      // If document already has ID → UPDATE
      if (doc.id) {
        res = await axios.post(
          `${API_BASE}/documents/${doc.id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true }
        );
      } 
      // If no ID → CREATE
      else {
        res = await axios.post(
          `${API_BASE}/documents`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true }
        );
      }

      const updated = res.data;

    setDocs(prev =>
      prev.map((d, i) =>
        i === replaceIdx
          ? {
              id: updated.id,
              name: updated.name,
              file_name: updated.file_name,
              // just use the file_path as-is
              file_url: `https://bold-sunset-533d.clarkkentraguhos.workers.dev${updated.file_path}`,
            }
          : d
      )
    );

    } catch (err) {
      console.error(err);
      alert("Upload failed!");
    }

    setReplaceIdx(null);
    e.target.value = "";
  };

  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Document Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload or replace PDF files for each document type
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {docs.map((doc, idx) => (
            <Card key={doc.name} className="border overflow-hidden">
              {/* PDF Preview Area */}
              <div className="relative bg-muted/50 flex items-center justify-center h-48 border-b">
                {doc.file_url ? (
                  <>
                    <iframe
                      src={`https://bold-sunset-533d.clarkkentraguhos.workers.dev${doc.file_url}`}
                      title={doc.name}
                      className="w-full h-full pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-transparent" />
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                    <FileText className="h-12 w-12" />
                    <span className="text-xs font-medium">No PDF uploaded</span>
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-base">{doc.name}</h3>
                {doc.file_name && (
                  <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleReplace(idx)}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {doc.file_url ? "Replace" : "Upload"} PDF
                  </Button>
                  {doc.file_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewUrl(doc.file_url)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                    </Button>
                  )}
                  {doc.file_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={ () => navigate(`/document-edit/${doc.id}`) }
                    >
                      <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFile}
        />

        {/* Full Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader className="flex-none">
              <DialogTitle>PDF Preview</DialogTitle>
              <DialogDescription>Viewing uploaded document</DialogDescription>
            </DialogHeader>

            <div className="flex-1 mt-2">
              {previewUrl && (
                <iframe
                  src={"https://bold-sunset-533d.clarkkentraguhos.workers.dev" + previewUrl}
                  className="w-full h-full rounded-md border"
                  title="PDF Preview"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
