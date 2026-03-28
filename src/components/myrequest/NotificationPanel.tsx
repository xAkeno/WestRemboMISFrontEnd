import type { Notification } from "@/lib/types";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const ICON_MAP = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const COLOR_MAP = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

interface Props {
  notifications: Notification[];
  onClose: () => void;
}

export default function NotificationPanel({ notifications, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-lg border bg-card shadow-lg animate-slide-in">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
          ) : (
            notifications.map((n) => {
              const Icon = ICON_MAP[n.type];
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 p-4 border-b last:border-0 ${!n.read ? "bg-secondary/50" : ""}`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${COLOR_MAP[n.type]}`} />
                  <div className="min-w-0">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(n.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
