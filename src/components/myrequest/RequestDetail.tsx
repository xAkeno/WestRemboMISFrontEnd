import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRequestById } from "../services/api";
import { DOCUMENT_LABELS,STATUS_CONFIG } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  FileCheck,
  FileText,
  Upload,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: () => fetchRequestById(id!),
    enabled: !!id,
  });

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast({ title: "File Uploaded", description: "Your document has been uploaded successfully." });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Request not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[request.status];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                {DOCUMENT_LABELS[request.document_type]}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{request.id}</p>
            </div>
            <Badge variant="outline" className={`self-start text-sm px-3 py-1 ${status.color}`}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Purpose</p>
              <p className="font-medium">{request.purpose}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Date Submitted</p>
              <p className="font-medium">{format(new Date(request.created_at), "MMMM d, yyyy")}</p>
            </div>
          </div>

          {/* Schedule */}
          {request.scheduled_date && (
            <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
              <Calendar className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-sm">Scheduled Pickup</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.scheduled_date), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          )}

          {/* Missing items */}
          {request.missing_items && request.missing_items.length > 0 && (
            <div className="rounded-lg bg-warning/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <p className="font-medium text-sm">Missing Information</p>
              </div>
              <ul className="space-y-1 ml-7">
                {request.missing_items.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Remarks */}
          {request.remarks && (
            <div className="rounded-lg bg-destructive/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-5 w-5 text-destructive" />
                <p className="font-medium text-sm">Remarks</p>
              </div>
              <p className="text-sm text-muted-foreground ml-7">{request.remarks}</p>
            </div>
          )}

          {/* Uploaded files */}
          {request.uploaded_files && request.uploaded_files.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                Uploaded Documents
              </p>
              <div className="space-y-2">
                {request.uploaded_files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload section */}
          {(request.status === "incomplete" || request.status === "pending") && (
            <div className="border-t pt-5">
              <Label className="text-sm font-medium mb-2 block">Upload Additional Documents</Label>
              <div className="flex gap-2">
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="flex-1" />
                <Button
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
