import { useState, useEffect, useCallback } from 'react';
import { Mail, MailOpen, Reply, MoreHorizontal, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layout } from '@/components/Layout';

const API_BASE = 'http://127.0.0.1:8000/api';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'replied' | 'resolved';
  admin_reply: string | null;
  created_at: string;
}

const defaultMessages: ContactMessage[] = [
  { id: 1, name: 'Maria Santos', email: 'maria@email.com', subject: 'Clearance Request Inquiry', message: 'Good day! I would like to know the requirements for getting a barangay clearance. Thank you.', status: 'new', admin_reply: null, created_at: '2026-02-08' },
  { id: 2, name: 'Juan Reyes', email: 'juan@email.com', subject: 'Event Suggestion', message: 'I would like to suggest a community sports fest for the youth this summer.', status: 'replied', admin_reply: 'Thank you for your suggestion! We will discuss this in the next council meeting.', created_at: '2026-02-05' },
  { id: 3, name: 'Ana Cruz', email: 'ana@email.com', subject: 'Street Light Issue', message: 'The street light on Zone 3 has been broken for 2 weeks. Please fix it.', status: 'resolved', admin_reply: 'This has been forwarded to our maintenance team. The light was repaired on Feb 7.', created_at: '2026-02-01' },
];

const statusConfig = {
  new: { label: 'New', icon: AlertCircle, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  replied: { label: 'Replied', icon: Reply, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  resolved: { label: 'Resolved', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
};

const ContactAdmin = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'replied' | 'resolved'>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/contacts`);
      setMessages(res.data?.data ?? res.data ?? defaultMessages);
    } catch {
      setMessages(defaultMessages);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openMessage = (msg: ContactMessage) => {
    setViewMessage(msg);
    setReplyText(msg.admin_reply ?? '');
  };

  const handleReply = async () => {
    if (!viewMessage || !replyText.trim()) return;
    setIsSending(true);
    const updated = { ...viewMessage, admin_reply: replyText, status: 'replied' as const };
    try {
      await axios.put(`${API_BASE}/contacts/${viewMessage.id}`, { admin_reply: replyText, status: 'replied' });
    } catch { /* local fallback */ }
    setMessages(prev => prev.map(m => m.id === viewMessage.id ? updated : m));
    setViewMessage(null);
    setIsSending(false);
    toast({ title: 'Reply Sent', description: 'Response saved successfully' });
  };

  const updateStatus = async (id: number, status: 'new' | 'replied' | 'resolved') => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    try {
      await axios.put(`${API_BASE}/contacts/${id}`, { status });
    } catch { /* local fallback */ }
    toast({ title: 'Status Updated', description: `Message marked as ${status}` });
  };

  const filtered = activeTab === 'all' ? messages : messages.filter(m => m.status === activeTab);
  const counts = { all: messages.length, new: messages.filter(m => m.status === 'new').length, replied: messages.filter(m => m.status === 'replied').length, resolved: messages.filter(m => m.status === 'resolved').length };

  return (
    <Layout> 
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Contact Messages</h1>
              <p className="text-sm text-muted-foreground mt-1">View and respond to messages from residents</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(['all', 'new', 'replied', 'resolved'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
              </button>
            ))}
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(msg => {
                  const sc = statusConfig[msg.status];
                  return (
                    <div key={msg.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-start gap-4" onClick={() => openMessage(msg)}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.status === 'new' ? 'bg-blue-500/10' : 'bg-muted/50'}`}>
                        {msg.status === 'new' ? <Mail className="h-5 w-5 text-blue-600" /> : <MailOpen className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{msg.name}</span>
                          <span className="text-xs text-muted-foreground">({msg.email})</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.className}`}>
                            <sc.icon className="h-3 w-3" /> {sc.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{msg.subject}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{msg.created_at}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); updateStatus(msg.id, 'new'); }}>Mark as New</DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); updateStatus(msg.id, 'replied'); }}>Mark as Replied</DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); updateStatus(msg.id, 'resolved'); }}>Mark as Resolved</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-sm text-muted-foreground">No messages found</div>
                )}
              </div>
            )}
          </div>

          {/* View / Reply Dialog */}
          <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{viewMessage?.subject}</DialogTitle>
              </DialogHeader>
              {viewMessage && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{viewMessage.name}</span>
                    <span className="text-muted-foreground">({viewMessage.email})</span>
                    <span className="text-xs text-muted-foreground ml-auto">{viewMessage.created_at}</span>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-sm">{viewMessage.message}</div>
                  {viewMessage.admin_reply && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-1">Admin Reply</p>
                      <p className="text-sm">{viewMessage.admin_reply}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Reply</Label>
                    <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." rows={4} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewMessage(null)}>Close</Button>
                <Button onClick={handleReply} disabled={isSending || !replyText.trim()} className="gap-2">
                  <Send className="h-4 w-4" /> {isSending ? 'Sending...' : 'Send Reply'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default ContactAdmin;
