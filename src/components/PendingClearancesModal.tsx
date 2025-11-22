import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, User } from "lucide-react";

interface PendingClearancesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clearanceType: string;
  tickets: any[]; // <-- pass the fetched tickets here
}


interface PendingClearancesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clearanceType: string;
}

export const PendingClearancesModal = ({ open, onOpenChange, clearanceType, tickets }: PendingClearancesModalProps) => {
  const navigate = useNavigate();

  // Filter tickets for this clearance type
  const pendingData = tickets.filter(t => t.service_type === clearanceType);

  const handleProcess = (item: any) => {
    onOpenChange(false);
    
    const routeMap: Record<string, string> = {
      "Business Clearance": "/business-clearance",
      "Building Clearance": "/building-clearance",
      "Barangay Clearance": "/barangay-clearance",
      "Barangay Certificate": "/barangay-certificate",
      "Resident Registration": "/residents/new",
    };

    const route = routeMap[clearanceType] || "/";
    
    navigate(route, { state: { pendingData: item } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            Pending {clearanceType}
            <Badge variant="secondary" className="ml-2">
              {pendingData.length} items
            </Badge>
          </DialogTitle>
          <DialogDescription>Select an application to process</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket No.</TableHead>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{item.ticket_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {item.serviceable.firstname} {item.serviceable.surname}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${
                      item.status === "Pending"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : item.status === "Approved"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => handleProcess(item)}
                      className="gap-2"
                    >
                      Process
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
