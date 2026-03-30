import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueueDisplay } from "@/components/queue/QueueDisplay";
import { QueueControl } from "@/components/queue/QueueControl";
import { Ticket } from "@/types/queue";
import { Monitor, Settings } from "lucide-react";
import axios from "axios";

  const QueueSystem = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [nowServing, setNowServing] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchQueueData = async () => {
    try {
      setLoading(true);

      // Fetch tickets
      const ticketsRes = await axios.get("http://127.0.0.1:8000/api/tickets/pending", {
        params: { page: 1, per_page: 100 },
        withCredentials: true,
      });

      // Filter only pending tickets
      const pendingTickets = (ticketsRes.data.data || []).filter(
        (ticket: Ticket) => ticket.status.toUpperCase() === "PENDING"
      );




      setTickets(pendingTickets);

      // Fetch now serving
      const nowServingRes = await axios.get(
        "http://127.0.0.1:8000/api/tickets/now-serving",
        { withCredentials: true }
      );

      setNowServing(nowServingRes.data.ticket_number.reverse || null);
    } catch (error) {
      console.error("Failed to fetch queue data:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchQueueData();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchQueueData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    try {
      // Call your API to move to next ticket
      await axios.post("http://127.0.0.1:8000/api/tickets/call-next", {}, {
        withCredentials: true,
      });
      await fetchQueueData();
    } catch (error) {
      console.error("Failed to call next:", error);
      throw error;
    }
  };

  const handleSkip = async (ticketId: string) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/tickets/${ticketId}/skip`, {}, {
        withCredentials: true,
      });
      await fetchQueueData();
    } catch (error) {
      console.error("Failed to skip:", error);
      throw error;
    }
  };

  const handleComplete = async (ticketId: string) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/tickets/${ticketId}/complete`, {}, {
        withCredentials: true,
      });
      await fetchQueueData();
    } catch (error) {
      console.error("Failed to complete:", error);
      throw error;
    }
  };

  const handleReject = async (ticketId: string) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/tickets/${ticketId}/reject`, {}, {
        withCredentials: true,
      });
      await fetchQueueData();
    } catch (error) {
      console.error("Failed to reject:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading queue system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <Tabs defaultValue="display" className="space-y-8">
          {/* <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="display" className="text-base">
              <Monitor className="mr-2 h-5 w-5" />
              Public Display
            </TabsTrigger>
            <TabsTrigger value="control" className="text-base">
              <Settings className="mr-2 h-5 w-5" />
              Admin Control
            </TabsTrigger>
          </TabsList> */}

          <TabsContent value="display" className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Queue Management System</h1>
              <p className="text-muted-foreground">Real-time ticket serving display</p>
            </div>
            <QueueDisplay 
              nowServing={nowServing}
              tickets={[...tickets].reverse()}
              showUpcoming={10}
            />
          </TabsContent>

          <TabsContent value="control" className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Queue Control Panel</h1>
              <p className="text-muted-foreground">Manage and control the serving queue</p>
            </div>
            <div className="max-w-4xl mx-auto">
              <QueueControl
                tickets={tickets}
                onCallNext={handleCallNext}
                onSkip={handleSkip}
                onComplete={handleComplete}
                onReject={handleReject}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QueueSystem;
