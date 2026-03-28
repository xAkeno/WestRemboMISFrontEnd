import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, AlertTriangle, ChevronRight, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DocumentRequest } from "@/types/types";
import { DOCUMENT_LABELS, STATUS_CONFIG } from "@/types/types";

interface Props {
  request: DocumentRequest;
}

export default function RequestCard({ request }: Props) {
  const status = STATUS_CONFIG[request.status];

  return (
    <Link to={`/request/${request.id}`}>
      <Card className="group hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {DOCUMENT_LABELS[request.document_type]}
                </h3>
                <Badge variant="outline" className={`shrink-0 text-xs ${status.color}`}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{request.id}</p>
              <p className="text-sm text-muted-foreground truncate">{request.purpose}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          </div>

          {/* Missing items alert */}
          {request.missing_items && request.missing_items.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-warning/10 p-2.5">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-warning">Missing Information</p>
                <p className="text-xs text-muted-foreground">
                  {request.missing_items.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Schedule */}
          {request.scheduled_date && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Pickup: {format(new Date(request.scheduled_date), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          )}

          {/* Files */}
          {request.uploaded_files && request.uploaded_files.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <FileCheck className="h-3.5 w-3.5" />
              <span>{request.uploaded_files.length} file(s) uploaded</span>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground mt-3">
            Submitted {format(new Date(request.created_at), "MMM d, yyyy")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
