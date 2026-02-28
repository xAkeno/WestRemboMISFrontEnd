import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Eye, EyeOff, Check, X } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateField = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const passwordRules = [
    { label: "Minimum 8 characters", valid: formData.password.length >= 8 },
    { label: "Begins with a capital letter", valid: /^[A-Z]/.test(formData.password) },
    { label: "Contains at least one number", valid: /\d/.test(formData.password) },
  ];

  const passwordErrors = () => {
    const errors: string[] = [];
    if (formData.password.length > 0 && formData.password.length < 8) errors.push("Password length must be 8 minimum");
    if (formData.password.length > 0 && !/^[A-Z]/.test(formData.password)) errors.push("Password must start with capital letter");
    if (formData.password.length > 0 && !/\d/.test(formData.password)) errors.push("Password must contain a number");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.surname || !formData.email || !formData.password || !formData.confirmPassword || !formData.dateOfBirth) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
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
      toast({ title: "Error", description: "Please upload a valid government ID", variant: "destructive" });
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
      form.append("date_of_birth", formData.dateOfBirth);
      form.append("password", formData.password);
      form.append("password_confirmation", formData.confirmPassword);
      form.append("id_url", idFile);
      await api.post("/api/register", form, { headers: { "Content-Type": "multipart/form-data" } });
      toast({ title: "Registration Successful", description: "Please check your email for verification instructions." });
      navigate("/email-verification", { state: { email: formData.email } });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Registration failed.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({ firstName: "", surname: "", email: "", phone: "", gender: "", dateOfBirth: "", password: "", confirmPassword: "" });
    setIdFile(null);
  };

  // Shared underline input style helper
  const underlineInput = "rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm";

  return (
    <AuthLayout>
      <div
        className="w-full max-w-4xl bg-white overflow-hidden"
        style={{
          borderRadius: 4,
          boxShadow: "0 2px 40px rgba(10,20,60,0.15)",
          border: "1px solid #dde3ed",
        }}
      >
        {/* Navy top bar with pink accent stripe */}
        <div style={{ backgroundColor: "#0f2a5e", padding: "20px 40px" }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#e8a0bf" }}>
              Republic of the Philippines · City of Taguig
            </p>
            <h1
              className="text-white font-bold"
              style={{ fontFamily: "'Georgia', serif", fontSize: "1.15rem" }}
            >
              Barangay West Rembo — Resident Registration
            </h1>
          </div>
          <div
            className="hidden sm:block text-right"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.12)", paddingLeft: 24 }}
          >
            <p className="text-white/40 text-xs uppercase tracking-wider">Form No.</p>
            <p className="text-white/70 text-xs font-mono mt-0.5">BWR-REG-001</p>
          </div>
        </div>
        {/* Pink accent line */}
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1 — Personal Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}
                >1</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>
                  Personal Information
                </h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "First Name *", field: "firstName", placeholder: "Juan" },
                  { label: "Last Name *", field: "surname", placeholder: "dela Cruz" },
                  { label: "Email Address *", field: "email", placeholder: "juan@email.com", type: "email" },
                ].map(({ label, field, placeholder, type }) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>{label}</Label>
                    <Input
                      type={type || "text"}
                      placeholder={placeholder}
                      value={(formData as any)[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className={underlineInput}
                      style={{ borderBottomColor: "#dde3ed" }}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                  />
                </div>
              </div>
            </div>

            {/* Section 2 — Contact & Gender */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>2</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Contact & Identity</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Phone Number</Label>
                  <Input
                    placeholder="09XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={underlineInput}
                    style={{ borderBottomColor: "#dde3ed" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Sex</Label>
                  <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                    <SelectTrigger className="rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0 text-sm" style={{ borderBottomColor: "#dde3ed" }}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className={`${underlineInput} pr-8`}
                      style={{ borderBottomColor: "#dde3ed" }}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 — ID & Password confirmation */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#0f2a5e", fontSize: 11 }}>3</div>
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#0f2a5e" }}>Verification Documents</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ID Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Government-Issued ID with Address *
                  </Label>
                  <label
                    className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[140px]"
                    style={{
                      border: `1.5px dashed ${idFile ? "#c2467d" : "#d1d5db"}`,
                      backgroundColor: idFile ? "#fdf5f8" : "#fafafa",
                      borderRadius: 2,
                      padding: 24,
                    }}
                    onMouseEnter={(e) => { if (!idFile) (e.currentTarget as HTMLElement).style.borderColor = "#c2467d"; }}
                    onMouseLeave={(e) => { if (!idFile) (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; }}
                  >
                    <Upload className="w-6 h-6 mb-2" style={{ color: idFile ? "#c2467d" : "#9ca3af" }} />
                    <span className="text-sm text-center" style={{ color: idFile ? "#c2467d" : "#6b7280" }}>
                      {idFile ? (
                        <span className="font-semibold">{idFile.name}</span>
                      ) : (
                        <>
                          <span className="font-semibold" style={{ color: "#0f2a5e" }}>Click to upload</span> or drag and drop
                        </>
                      )}
                    </span>
                    <span className="text-xs mt-1" style={{ color: "#9ca3af" }}>PNG, JPG, or PDF accepted</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                  </label>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Accepted: PhilSys ID, Driver's License, Passport, Voter's ID, etc.
                  </p>
                </div>

                {/* Confirm + rules */}
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        className={`${underlineInput} pr-8`}
                        style={{ borderBottomColor: "#dde3ed" }}
                        onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-0 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password checklist */}
                  <div className="space-y-2 p-4" style={{ backgroundColor: "#f8f9fb", border: "1px solid #e5e7eb", borderRadius: 2 }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#0f2a5e" }}>
                      Password Requirements
                    </p>
                    {passwordRules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-2">
                        {formData.password.length > 0 ? (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: rule.valid ? "#d45ea3" : "#fee2e2" }}
                          >
                            {rule.valid
                              ? <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              : <X className="w-2.5 h-2.5" style={{ color: "#ef4444" }} strokeWidth={3} />
                            }
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border flex-shrink-0" style={{ borderColor: "#d1d5db" }} />
                        )}
                        <span className="text-xs" style={{ color: "#6b7280" }}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 pt-6"
              style={{ borderTop: "1px solid #e5e7eb" }}
            >
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                Already registered?{" "}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: "#0f2a5e" }}>Sign in here</Link>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all"
                  style={{ borderRadius: 2, border: "1.5px solid #c2467d", color: "#c2467d", backgroundColor: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf5f8"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-2.5 text-white text-sm font-semibold uppercase tracking-wider transition-all disabled:opacity-60"
                  style={{ borderRadius: 2, backgroundColor: "#0f2a5e", letterSpacing: "0.08em" }}
                  onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
                  onMouseLeave={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"; }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Submitting...
                    </span>
                  ) : "Submit Registration"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;