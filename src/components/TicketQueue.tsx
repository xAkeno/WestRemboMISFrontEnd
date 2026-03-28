import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Ticket {
  id: number;
  ticket_number: string;
  service_type: string;
  status: string;
}

interface TicketQueueProps {
  tickets: Ticket[];
}

const TicketQueue: React.FC<TicketQueueProps> = ({ tickets }) => {
  return (
    <div className="flex overflow-x-auto gap-4 py-2">
      {tickets.map((ticket, index) => {
        let path = "";
        switch (ticket.service_type) {
          case "Barangay Clearance":
            path = "/clearances/barangay";
            break;
          case "Business Clearance":
            path = "/clearances/business";
            break;
          case "Building Clearance":
            path = "/clearances/building";
            break;
          case "Barangay Certificate":
            path = "/certifications/barangay";
            break;
          default:
            path = "/tickets";
        }

        return (
          <Link
            key={ticket.id}
            to={path}
            state={{ ticket }}
            className={`flex-1 min-w-[180px] sm:min-w-[200px] md:min-w-[220px] flex items-center gap-3 px-4 py-2 rounded-lg border border-border/50 transition-colors
              ${index === 0 ? "bg-primary/20 font-semibold" : "bg-card hover:bg-muted/50"}`}
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-sm">
              {index + 1}
            </span>
            <div className="flex flex-col min-w-0">
              <p className="text-sm text-foreground truncate">{ticket.ticket_number}</p>
              <p className="text-xs text-muted-foreground truncate">{ticket.service_type}</p>
            </div>
            <Badge
              variant={ticket.status === "Pending" ? "secondary" : "outline"}
              className="text-xs shrink-0"
            >
              {ticket.status}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
};

export default TicketQueue;
