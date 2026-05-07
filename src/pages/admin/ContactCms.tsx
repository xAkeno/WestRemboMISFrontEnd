import { useState, useEffect, useCallback } from 'react';
import { Save, MapPin, Mail, Phone, Globe, Clock } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';

const API_BASE = 'https://westrembomis.onrender.com/api';

interface ContactInfo {
  id?: number;
  address: string;
  email: string;
  telephone: string;
  facebook: string;
  office_days: string;
  office_hours: string;
}

interface FormErrors {
  address?: string;
  email?: string;
  telephone?: string;
  facebook?: string;
  office_days?: string;
  office_hours?: string;
}

const defaultContact: ContactInfo = {
  address: 'Plaza Drive A. Mabini Street (21st), Barangay West Rembo, Taguig City',
  email: 'leobes27@gmail.com',
  telephone: '(02) 8836 9731 / (02) 8836 9732 / (02) 8836 9733',
  facebook: 'https://www.facebook.com/KapLeoBes',
  office_days: 'Monday–Saturday',
  office_hours: '5:00 AM – 6:00 PM',
};

// ── Validators ────────────────────────────────────────────────────────────────

const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const isValidUrl = (v: string) => {
  try {
    new URL(v.trim());
    return true;
  } catch {
    return false;
  }
};

// Must contain at least one digit
const isValidTelephone = (v: string) => /\d/.test(v.trim());

// Office hours: must contain a colon (time-like), e.g. "8:00 AM – 5:00 PM"
const isValidOfficeHours = (v: string) => /:/.test(v.trim());

function validate(form: ContactInfo): FormErrors {
  const errors: FormErrors = {};

  if (!form.address.trim()) {
    errors.address = 'Address is required.';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!form.telephone.trim()) {
    errors.telephone = 'Telephone is required.';
  } else if (!isValidTelephone(form.telephone)) {
    errors.telephone = 'Must contain at least one phone number.';
  }

  if (!form.facebook.trim()) {
    errors.facebook = 'Facebook URL is required.';
  } else if (!isValidUrl(form.facebook)) {
    errors.facebook = 'Please enter a valid URL (e.g. https://facebook.com/...).';
  }

  if (!form.office_days.trim()) {
    errors.office_days = 'Office days are required.';
  }

  if (!form.office_hours.trim()) {
    errors.office_hours = 'Office hours are required.';
  } else if (!isValidOfficeHours(form.office_hours)) {
    errors.office_hours = 'Use a time format, e.g. 8:00 AM – 5:00 PM.';
  }

  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ContactCms = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<ContactInfo>(defaultContact);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactInfo, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/contact`, { withCredentials: true });
      const data = res.data?.data ?? res.data;

      if (Array.isArray(data) && data.length > 0) {
        setForm(data[data.length - 1]);
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

  // Re-validate touched fields on every form change
  useEffect(() => {
    const allErrors = validate(form);
    const visibleErrors: FormErrors = {};
    (Object.keys(touched) as (keyof ContactInfo)[]).forEach((key) => {
      if (touched[key] && allErrors[key]) {
        visibleErrors[key] = allErrors[key];
      }
    });
    setErrors(visibleErrors);
  }, [form, touched]);

  const update = (key: keyof ContactInfo, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const touch = (key: keyof ContactInfo) => {
    setTouched(t => ({ ...t, [key]: true }));
  };

  const handleSave = async () => {
    // Mark all fields as touched so every error shows
    const allTouched = Object.keys(form).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Partial<Record<keyof ContactInfo, boolean>>
    );
    setTouched(allTouched);

    const allErrors = validate(form);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/contact/${form.id}`,
        form,
        { withCredentials: true }
      );
      const saved = res.data?.data ?? res.data;
      if (saved?.id) setForm(saved);

      toast({
        title: 'Contact Info Saved',
        description: 'Contact information has been updated successfully.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to update contact information.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Helper: render error message
  const Err = ({ field }: { field: keyof FormErrors }) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1">{errors[field]}</p>
    ) : null;

  // Helper: input class with error highlight
  const inputCls = (field: keyof FormErrors) =>
    errors[field] ? 'border-destructive focus-visible:ring-destructive' : '';

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Contact Information</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage contact details displayed on the website
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="space-y-6">
            {/* ── Address ── */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-medium">Office Address</h2>
              </div>
              <div className="space-y-2">
                <Label>Full Address</Label>
                <Input
                  className={inputCls('address')}
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  onBlur={() => touch('address')}
                  placeholder="Enter office address"
                />
                <Err field="address" />
              </div>
            </div>

            {/* ── Contact Details ── */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="font-medium">Contact Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      className={`pl-10 ${inputCls('email')}`}
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      onBlur={() => touch('email')}
                      placeholder="email@example.com"
                    />
                  </div>
                  <Err field="email" />
                </div>

                {/* Telephone */}
                <div className="space-y-2">
                  <Label>Telephone Numbers</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className={`pl-10 ${inputCls('telephone')}`}
                      value={form.telephone}
                      onChange={e => update('telephone', e.target.value)}
                      onBlur={() => touch('telephone')}
                      placeholder="(02) XXXX XXXX"
                    />
                  </div>
                  <Err field="telephone" />
                </div>
              </div>
            </div>

            {/* ── Social Media ── */}
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
                  <Input
                    className={`pl-10 ${inputCls('facebook')}`}
                    value={form.facebook}
                    onChange={e => update('facebook', e.target.value)}
                    onBlur={() => touch('facebook')}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <Err field="facebook" />
              </div>
            </div>

            {/* ── Office Hours ── */}
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
                  <Input
                    className={inputCls('office_days')}
                    value={form.office_days}
                    onChange={e => update('office_days', e.target.value)}
                    onBlur={() => touch('office_days')}
                    placeholder="e.g. Monday–Saturday"
                  />
                  <Err field="office_days" />
                </div>
                <div className="space-y-2">
                  <Label>Office Hours</Label>
                  <Input
                    className={inputCls('office_hours')}
                    value={form.office_hours}
                    onChange={e => update('office_hours', e.target.value)}
                    onBlur={() => touch('office_hours')}
                    placeholder="e.g. 8:00 AM – 5:00 PM"
                  />
                  <Err field="office_hours" />
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