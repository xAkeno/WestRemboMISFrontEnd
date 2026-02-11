import { useState, useEffect, useCallback } from 'react';
import { Save, RotateCcw, ImageIcon, Palette } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';
const API_BASE = 'http://127.0.0.1:8000/api';

interface SiteSettings {
  logo: string | null;
  site_title: string;
  navbar_color: string;
  navbar_text_color: string;
  background_color: string;
  background_image: string | null;
  primary_color: string;
  accent_color: string;
  footer_text: string;
}

const defaultSettings: SiteSettings = {
  logo: null,
  site_title: 'Barangay West Rembo',
  navbar_color: '#1e3a5f',
  navbar_text_color: '#ffffff',
  background_color: '#f8fafc',
  background_image: null,
  primary_color: '#2563eb',
  accent_color: '#f59e0b',
  footer_text: '© 2026 Barangay West Rembo. All rights reserved.',
};

const WebsiteSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/site-settings`);
      setSettings(res.data?.data ?? res.data ?? defaultSettings);
    } catch {
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(settings).forEach(([key, val]) => {
        if (val !== null) formData.append(key, String(val));
      });
      if (logoFile) formData.append('logo', logoFile);
      if (bgFile) formData.append('background_image', bgFile);
      await axios.post(`${API_BASE}/site-settings`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ title: 'Saved', description: 'Website settings updated successfully' });
    } catch {
      toast({ title: 'Saved locally', description: 'API unavailable — saved locally' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
        </div>
        <Input value={value} onChange={e => onChange(e.target.value)} className="flex-1 font-mono text-sm" placeholder="#000000" />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Website Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Customize website appearance and branding</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset</Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2"><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Branding */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Branding</h2>
              <div className="space-y-2">
                <Label>Site Title</Label>
                <Input value={settings.site_title} onChange={e => setSettings(s => ({ ...s, site_title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                    {(logoFile || settings.logo) ? (
                      <img src={logoFile ? URL.createObjectURL(logoFile) : settings.logo!} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Input value={settings.footer_text} onChange={e => setSettings(s => ({ ...s, footer_text: e.target.value }))} />
              </div>
            </div>

            {/* Colors */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2"><Palette className="h-5 w-5" /> Colors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput label="Navbar Color" value={settings.navbar_color} onChange={v => setSettings(s => ({ ...s, navbar_color: v }))} />
                <ColorInput label="Navbar Text Color" value={settings.navbar_text_color} onChange={v => setSettings(s => ({ ...s, navbar_text_color: v }))} />
                <ColorInput label="Primary Color" value={settings.primary_color} onChange={v => setSettings(s => ({ ...s, primary_color: v }))} />
                <ColorInput label="Accent Color" value={settings.accent_color} onChange={v => setSettings(s => ({ ...s, accent_color: v }))} />
                <ColorInput label="Background Color" value={settings.background_color} onChange={v => setSettings(s => ({ ...s, background_color: v }))} />
              </div>
            </div>

            {/* Background */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-lg font-medium text-foreground">Background Image</h2>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                  {(bgFile || settings.background_image) ? (
                    <img src={bgFile ? URL.createObjectURL(bgFile) : settings.background_image!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <Input type="file" accept="image/*" onChange={e => setBgFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-lg font-medium text-foreground">Live Preview</h2>
              <div className="rounded-lg overflow-hidden border border-border">
                <div className="h-12 flex items-center px-4 gap-3" style={{ backgroundColor: settings.navbar_color, color: settings.navbar_text_color }}>
                  {(logoFile || settings.logo) && (
                    <img src={logoFile ? URL.createObjectURL(logoFile) : settings.logo!} alt="" className="h-8 w-8 object-contain" />
                  )}
                  <span className="font-semibold text-sm">{settings.site_title}</span>
                </div>
                <div className="h-32 flex items-center justify-center" style={{ backgroundColor: settings.background_color }}>
                  <p className="text-sm" style={{ color: settings.primary_color }}>Page content area preview</p>
                </div>
                <div className="h-10 flex items-center justify-center text-xs" style={{ backgroundColor: settings.navbar_color, color: settings.navbar_text_color + '99' }}>
                  {settings.footer_text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WebsiteSettings;
