import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "", // 👈 added
    password: "",
    confirmPassword: "",
  });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const passwordErrors = () => {
    const errors: string[] = [];
    if (formData.password.length > 0 && formData.password.length < 8) errors.push("Password length must be 8 minimum");
    if (formData.password.length > 0 && !/^[A-Z]/.test(formData.password)) errors.push("Password must start with capital letter");
    if (formData.password.length > 0 && !/\d/.test(formData.password)) errors.push("Password must contain a number");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check required fields
    if (!formData.firstName || !formData.surname || !formData.email || !formData.password || !formData.confirmPassword || !formData.dateOfBirth) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (passwordErrors().length > 0) {
      toast({ title: "Error", description: "Please fix password requirements", variant: "destructive" });
      return;
    }

    if (!idFile) {
      toast({ title: "Error", description: "Please upload your ID", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("first_name", formData.firstName);
      form.append("surname", formData.surname);
      form.append("email", formData.email);
      form.append("contact", formData.phone);
      form.append("gender", formData.gender);
      form.append("date_of_birth", formData.dateOfBirth); // 👈 send date of birth
      form.append("password", formData.password);
      form.append("password_confirmation", formData.confirmPassword);
      form.append("id_url", idFile); // image

      const response = await api.post("/api/register", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({ title: "Success!", description: "Your account has been created successfully." });
      navigate("/");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ firstName: "", surname: "", email: "", phone: "", gender: "", dateOfBirth: "", password: "", confirmPassword: "" });
    setIdFile(null);
  };

  return (
    <AuthLayout>
      <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-4xl w-full p-8 md:p-12">
        <h1 className="text-3xl font-extrabold text-center text-foreground mb-8 italic">Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="font-semibold text-foreground">First name</Label>
              <Input placeholder="John" value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} className="mt-1 bg-card" />
            </div>
            <div>
              <Label className="font-semibold text-foreground">Last name</Label>
              <Input placeholder="Doe" value={formData.surname} onChange={(e) => updateField("surname", e.target.value)} className="mt-1 bg-card" />
            </div>
            <div>
              <Label className="font-semibold text-foreground">Email address</Label>
              <Input type="email" placeholder="john.doe@company.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1 bg-card" />
            </div>
            <div>
              <Label className="font-semibold text-foreground">Date of Birth</Label>
              <Input type="date" value={formData.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} className="mt-1 bg-card" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="font-semibold text-foreground">Phone number</Label>
              <Input placeholder="09156284536" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1 bg-card" />
            </div>
            <div>
              <Label className="font-semibold text-foreground">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                <SelectTrigger className="mt-1 bg-card">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold text-foreground">Password</Label>
              <Input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => updateField("password", e.target.value)} className="mt-1 bg-card" />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Upload */}
            <div>
              <Label className="font-semibold text-foreground">ID with address</Label>
              <label className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary transition-colors bg-muted/50 min-h-[160px]">
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                </span>
                <span className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (MAX: 800x400px)</span>
                {idFile && <span className="text-xs text-accent mt-2 font-medium">{idFile.name}</span>}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Confirm password + rules */}
            <div className="space-y-4">
              <div>
                <Label className="font-semibold text-foreground">Confirm password</Label>
                <Input type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} className="mt-1 bg-card" />
              </div>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Password length must be 8 minimum</li>
                <li>Password must start with capital letter</li>
                <li>Password must contain a number</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>{isLoading ? "Submitting..." : "Submit"}</Button>
            <Button type="button" variant="outline" onClick={handleClear} className="border-primary text-primary hover:bg-primary/10">Clear</Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Register;
