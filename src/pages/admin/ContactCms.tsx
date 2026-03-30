import { useState, useEffect, useCallback } from 'react';
import { Save, MapPin, Mail, Phone, Globe, Clock } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';
const API_BASE = 'http://127.0.0.1:8000/api';

interface ContactInfo {
  id?: number;
  address: string;
  email: string;
  telephone: string;
  facebook: string;
  office_days: string;
  office_hours: string;
}

const defaultContact: ContactInfo = {
  address: 'Plaza Drive A. Mabini Street (21st), Barangay West Rembo, Taguig City',
  email: 'leobes27@gmail.com',
  telephone: '(02) 8836 9731 / (02) 8836 9732 / (02) 8836 9733',
  facebook: 'https://www.facebook.com/KapLeoBes',
  office_days: 'Monday–Saturday',
  office_hours: '5:00 AM – 6:00 PM',
};

const ContactCms = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<ContactInfo>(defaultContact);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/contact`, { withCredentials: true });
      const data = res.data?.data ?? res.data;

      console.log(data);

      if (Array.isArray(data) && data.length > 0) {
        // pick the last item (latest)
        const latest = data[data.length - 1];
        setForm(latest);
      } else if (data) {
        setForm(data);
      } else {
        setForm(defaultContact);
      }
    } catch (err: any) {
      console.error(err);
      setForm(defaultContact);
      toast({
        title: 'Error Loading Contact',
        description: err.response?.data?.message ?? err.message ?? 'Unable to fetch contact info.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const res = await axios.put(
        `${API_BASE}/contact/${form.id}`,
        form,
        { withCredentials: true }
      );

      const saved = res.data?.data ?? res.data;

      if (saved?.id) {
        setForm(saved);
      }

      toast({
        title: "Contact Info Saved",
        description: "Contact information has been updated successfully.",
      });

    } catch (err) {
      console.error(err);

      toast({
        title: "Error",
        description: "Failed to update contact information.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const update = (key: keyof ContactInfo, value: string) => setForm(f => ({ ...f, [key]: value }));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Contact Information</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage contact details displayed on the website</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Address */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-medium">Office Address</h2>
              </div>
              <div className="space-y-2">
                <Label>Full Address</Label>
                <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Enter office address" />
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="font-medium">Contact Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Telephone Numbers</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" value={form.telephone} onChange={e => update('telephone', e.target.value)} placeholder="(02) XXXX XXXX" />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="font-medium">Social Media</h2>
              </div>
              <div className="space-y-2">
                <Label>Facebook Page URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" value={form.facebook} onChange={e => update('facebook', e.target.value)} placeholder="https://facebook.com/..." />
                </div>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <h2 className="font-medium">Office Hours</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Office Days</Label>
                  <Input value={form.office_days} onChange={e => update('office_days', e.target.value)} placeholder="e.g. Monday–Saturday" />
                </div>
                <div className="space-y-2">
                  <Label>Office Hours</Label>
                  <Input value={form.office_hours} onChange={e => update('office_hours', e.target.value)} placeholder="e.g. 8:00 AM – 5:00 PM" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactCms;
