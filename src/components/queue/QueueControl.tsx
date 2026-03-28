import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  SkipForward, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Users
} from "lucide-react";
import { Ticket, SERVICE_TYPE_COLORS } from "@/types/queue";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QueueControlProps {
  tickets: Ticket[];
  onCallNext: () => void;
  onSkip: (ticketId: string) => void;
  onComplete: (ticketId: string) => void;
  onReject: (ticketId: string) => void;
}

export const QueueControl = ({ 
  tickets, 
  onCallNext, 
  onSkip, 
  onComplete, 
  onReject 
}: QueueControlProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const currentTicket = tickets[0];
  const queueLength = tickets.length;

  const handleAction = async (
    action: () => void, 
    actionName: string,
    ticketId?: string
  ) => {
    setLoading(ticketId || "action");
    try {
      await action();
      toast.success(`${actionName} successful`);
    } catch (error) {
      toast.error(`Failed to ${actionName.toLowerCase()}`);
    } finally {
      setLoading(null);
    }
  };

  // Calculate stats by service type
  const serviceTypeCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.service_type] = (acc[ticket.service_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Queue</p>
                <p className="text-3xl font-bold text-foreground">{queueLength}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait</p>
                <p className="text-3xl font-bold text-foreground">~5m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Now Serving</p>
                <p className="text-2xl font-bold text-foreground truncate">
                  {currentTicket?.ticket_number || "---"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Ticket Control */}
      {currentTicket && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Ticket</span>
              <Badge 
                className={cn(
                  "text-sm",
                  SERVICE_TYPE_COLORS[currentTicket.service_type] || "bg-muted"
                )}
              >
                {currentTicket.service_type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">Ticket Number</p>
              <p className="text-5xl font-bold text-foreground mb-4">
                {currentTicket.ticket_number}
              </p>
              <Badge variant="outline">{currentTicket.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                onClick={() => handleAction(() => onComplete(currentTicket.id), "Complete", currentTicket.id)}
                disabled={loading === currentTicket.id}
                className="w-full bg-success hover:bg-success/90"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Complete
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => handleAction(() => onReject(currentTicket.id), "Reject", currentTicket.id)}
                disabled={loading === currentTicket.id}
                className="w-full"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Reject
              </Button>
            </div>

            <Button
              size="lg"
              variant="outline"
              onClick={() => handleAction(() => onSkip(currentTicket.id), "Skip", currentTicket.id)}
              disabled={loading === currentTicket.id}
              className="w-full"
            >
              <SkipForward className="mr-2 h-5 w-5" />
              Skip to Next
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Call Next Button */}
      <Button
        size="lg"
        onClick={() => handleAction(onCallNext, "Call Next")}
        disabled={loading === "action" || queueLength === 0}
        className="w-full h-16 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        <Play className="mr-2 h-6 w-6" />
        Call Next Ticket
      </Button>

      {/* Service Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Queue by Service Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(serviceTypeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  SERVICE_TYPE_COLORS[type] || "bg-muted"
                )} />
                <span className="font-medium">{type}</span>
              </div>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
