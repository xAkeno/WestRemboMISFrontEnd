import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { Ticket, SERVICE_TYPE_COLORS } from "@/types/queue";
import { cn } from "@/lib/utils";

interface QueueDisplayProps {
  nowServing: string | null;
  tickets: Ticket[];
  showUpcoming?: number;
  className?: string;
}

export const QueueDisplay = ({ 
  nowServing, 
  tickets, 
  showUpcoming = 5,
  className 
}: QueueDisplayProps) => {
  const [animateNumber, setAnimateNumber] = useState(false);
  const currentTicket = tickets[0];
  const upcomingTickets = tickets.slice(1, showUpcoming + 1);

  useEffect(() => {
    if (nowServing) {
      setAnimateNumber(true);
      const timer = setTimeout(() => setAnimateNumber(false), 600);
      return () => clearTimeout(timer);
    }
  }, [nowServing]);

  return (
    <div className={cn("w-full space-y-8", className)}>
      {/* Main Display - Now Serving */}
      <Card className="border-none shadow-2xl overflow-hidden bg-gradient-to-br from-display-bg via-display-bg to-display-bg/90">
        <CardContent className="p-12">
          <div className="text-center space-y-8">
            {/* Header */}
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-display-accent/20 to-display-accent/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-display-accent animate-pulse" />
              </div>
              <div>
                <p className="text-2xl uppercase tracking-[0.3em] font-semibold text-display-text/60">
                  Now Serving
                </p>
              </div>
            </div>

            {/* Ticket Number */}
            <div className={cn(
              "text-display py-8",
              animateNumber && "animate-number-change"
            )}>
              <div className="text-[12rem] font-black leading-none text-display-text drop-shadow-[0_0_40px_hsl(var(--display-glow)/0.6)]">
                {currentTicket?.ticket_number || nowServing || "---"}
              </div>
            </div>

            {/* Service Type & Status */}
            {currentTicket && (
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <Badge 
                  className={cn(
                    "px-8 py-3 text-xl font-semibold rounded-xl",
                    SERVICE_TYPE_COLORS[currentTicket.service_type] || "bg-muted"
                  )}
                >
                  {currentTicket.service_type}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="px-8 py-3 text-xl font-semibold rounded-xl border-display-text/20 text-display-text/80"
                >
                  {currentTicket.status}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Preview */}
      {upcomingTickets.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Up Next</h3>
                <p className="text-sm text-muted-foreground">
                  {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} in queue
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {upcomingTickets.map((ticket, index) => (
                <Card 
                  key={ticket.id}
                  className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 2}
                      </span>
                      <Badge 
                        variant="outline"
                        className="text-xs"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-foreground">
                        {ticket.ticket_number}
                      </p>
                      <p className={cn(
                        "text-xs font-semibold px-2 py-1 rounded-md text-white inline-block",
                        SERVICE_TYPE_COLORS[ticket.service_type] || "bg-muted"
                      )}>
                        {ticket.service_type}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
