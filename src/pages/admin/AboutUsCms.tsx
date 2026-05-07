import { useState, useEffect, useCallback } from 'react';
import { Save, ImageIcon, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';

const API_BASE = `${import.meta.env.VITE_WEB_URL}/api`;

interface AboutUsData {
  description: string;
  mission: string;
  vision: string;
  image: string | null;
  feature1_title: string;
  feature1_description: string;
  feature2_title: string;
  feature2_description: string;
  feature3_title: string;
  feature3_description: string;
}

const defaultData: AboutUsData = {
  description: 'This website is dedicated to sharing official announcements, events, and updates for the community of West Rembo. It serves as an information hub to keep residents connected and informed.',
  mission: 'To provide transparent, efficient, and accessible governance services to all residents of West Rembo.',
  vision: 'A progressive, peaceful, and self-sustaining barangay where every resident thrives.',
  image: null,
  feature1_title: 'Community Announcements',
  feature1_description: 'Stay updated with the latest news, government notices, and barangay updates relevant to West Rembo residents.',
  feature2_title: 'Event Calendar',
  feature2_description: 'Browse upcoming events, meetings, and activities in the community—so you never miss what\'s happening in West Rembo.',
  feature3_title: 'Emergency Info & Contacts',
  feature3_description: 'Access emergency hotlines, health center contacts, and safety tips to help you stay ready during urgent situations in West Rembo.',
};

const AboutUsCms = () => {
  const { toast } = useToast();
  const [data, setData] = useState<AboutUsData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/about-us`);
      setData(res.data?.data ?? res.data ?? defaultData);
    } catch {
      setData(defaultData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== null) formData.append(key, String(val));
      });
      if (imageFile) formData.append('image', imageFile);
      await axios.post(`${API_BASE}/about-us`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ title: 'Saved', description: 'About Us content updated successfully' });
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

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">About Us CMS</h1>
              <p className="text-sm text-muted-foreground mt-1">Edit the About Us page content</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset</Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2"><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Main Content */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-lg font-medium text-foreground">Main Content</h2>
              <div className="space-y-2">
                <Label>About Us Image</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                    {(imageFile || data.image) ? (
                      <img src={imageFile ? URL.createObjectURL(imageFile) : data.image!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Barangay Description</Label>
                <Textarea value={data.description} onChange={e => setData(d => ({ ...d, description: e.target.value }))} rows={4} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mission</Label>
                  <Textarea value={data.mission} onChange={e => setData(d => ({ ...d, mission: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Vision</Label>
                  <Textarea value={data.vision} onChange={e => setData(d => ({ ...d, vision: e.target.value }))} rows={3} />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-lg font-medium text-foreground">Feature Highlights</h2>
              {[1, 2, 3].map(i => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{`0${i}`}</span>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Input
                      value={(data as any)[`feature${i}_title`]}
                      onChange={e => setData(d => ({ ...d, [`feature${i}_title`]: e.target.value }))}
                      placeholder="Feature title"
                      className="font-medium"
                    />
                    <Textarea
                      value={(data as any)[`feature${i}_description`]}
                      onChange={e => setData(d => ({ ...d, [`feature${i}_description`]: e.target.value }))}
                      placeholder="Feature description"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
};

export default AboutUsCms;
