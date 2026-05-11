import { useCallback, useState, useEffect, useRef } from "react";
import { MapPin, Mail, Phone, Facebook, Clock, Send } from "lucide-react";
import Header from "./Header";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import ReCAPTCHA from "react-google-recaptcha";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

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
  address: "Plaza Drive A. Mabini Street (21st), Barangay West Rembo, Taguig City",
  email: "leobes27@gmail.com",
  telephone: "(02) 8836 9731 / (02) 8836 9732 / (02) 8836 9733",
  facebook: "https://www.facebook.com/KapLeoBes",
  office_days: "Monday–Saturday",
  office_hours: "5:00 AM – 6:00 PM",
};

const API_BASE = `${import.meta.env.VITE_WEB_URL}/api`;

const ContactSection = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    home_address: "",
    topic: "",
    message: "",
  });

  const [form, setForm] = useState<ContactInfo>(defaultContact);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ── reCAPTCHA ──
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification before submitting.");
      return;
    }

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      await axios.post(`${API_BASE}/contacts`, { ...formData, recaptcha_token: captchaToken });

      setSuccess("Your inquiry has been sent successfully!");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        home_address: "",
        topic: "",
        message: "",
      });

      // Reset captcha after successful submission
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again later.");
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

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
        title: "Error Loading Contact",
        description: err.response?.data?.message ?? err.message ?? "Unable to fetch contact info.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const contactInfo = [
    { icon: MapPin, title: "Location", content: form.address },
    { icon: Mail, title: "Email", content: form.email },
    { icon: Phone, title: "Telephone", content: form.telephone },
    { icon: Facebook, title: "Facebook", content: form.facebook },
    { icon: Clock, title: "Office Hours", content: `${form.office_days} ${form.office_hours}` },
  ];

  const inputBase: React.CSSProperties = {
    display: "block",
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #d1d5db",
    borderRadius: 0,
    padding: "8px 0",
    fontSize: "0.875rem",
    color: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelCls = "block text-[10px] font-bold uppercase tracking-[0.14em] mb-1";

  return (
    <section id="contact" className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <div style={{ width: 32, height: 1, backgroundColor: PINK }} />
            <span className="text-xs font-bold uppercase tracking-[0.20em]" style={{ color: PINK }}>
              Reach Out
            </span>
            <div style={{ width: 32, height: 1, backgroundColor: PINK }} />
          </div>
          <h2
            className="font-bold text-foreground mb-3 leading-tight"
            style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem,3.5vw,2.25rem)" }}
          >
            Get in Touch with{" "}
            <span style={{ color: PINK }}>Barangay West Rembo</span>
          </h2>
          <div style={{ width: 48, height: 2, backgroundColor: PINK, margin: "12px auto 0" }} />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-14">
          {/* Left — info */}
          <div>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              If you have any inquiries, concerns, or clarifications, choose one of the many ways to
              get in touch with us. You can fill out the form, dial our numbers, send a direct email,
              or reach us through social media. We'd love to hear from you.
            </p>

            <div className="hidden lg:flex flex-col gap-3">
              {contactInfo.map((info) => {
                const Icon = info.icon;
                return (
                  <div
                    key={info.title}
                    className="flex items-start gap-4 p-4 border border-border bg-card transition-all duration-200 hover:shadow-sm"
                    style={{ borderRadius: 2, borderLeftWidth: 2, borderLeftColor: PINK }}
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}
                    >
                      <Icon className="w-4 h-4" style={{ color: NAVY }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: PINK }}>
                        {info.title}
                      </p>
                      <p className="text-sm text-foreground">{info.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className="bg-card border border-border p-6 sm:p-8"
              style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: NAVY }}>
                Official Inquiry Form
              </p>
              <p className="text-xs text-muted-foreground mb-8">
                All fields marked are required to process your inquiry.
              </p>

              {success && <p className="mb-4 text-green-600 text-sm">{success}</p>}
              {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {["first_name", "last_name"].map((name) => (
                    <div key={name}>
                      <label className={labelCls} style={{ color: PINK }}>
                        {name === "first_name" ? "First Name" : "Last Name"}
                      </label>
                      <input
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleChange}
                        placeholder={name === "first_name" ? "Juan" : "dela Cruz"}
                        style={inputBase}
                        onFocus={(e) => (e.currentTarget.style.borderBottomColor = PINK)}
                        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d1d5db")}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    { name: "email", label: "Email Address", type: "email", ph: "juan@example.com" },
                    { name: "phone", label: "Phone Number", ph: "09XX-XXX-XXXX" },
                  ].map(({ name, label, type, ph }) => (
                    <div key={name}>
                      <label className={labelCls} style={{ color: PINK }}>{label}</label>
                      <input
                        name={name}
                        type={type || "text"}
                        value={(formData as any)[name]}
                        onChange={handleChange}
                        placeholder={ph}
                        style={inputBase}
                        onFocus={(e) => (e.currentTarget.style.borderBottomColor = PINK)}
                        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d1d5db")}
                        required
                      />
                    </div>
                  ))}
                </div>

                {["home_address", "subject"].map((name) => (
                  <div key={name}>
                    <label className={labelCls} style={{ color: PINK }}>
                      {name === "home_address" ? "Home Address" : "Subject / Topic"}
                    </label>
                    <input
                      name={name}
                      value={(formData as any)[name]}
                      onChange={handleChange}
                      placeholder={name === "home_address" ? "Your full home address" : "What is your concern about?"}
                      style={inputBase}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = PINK)}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d1d5db")}
                      required
                    />
                  </div>
                ))}

                <div>
                  <label className={labelCls} style={{ color: PINK }}>Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    rows={4}
                    style={{ ...inputBase, resize: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = PINK)}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#d1d5db")}
                    required
                  />
                </div>

                {/* ── reCAPTCHA — above Submit Inquiry ── */}
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey="6LcxosUsAAAAAJpim7cdKsK_GgUJf8GBkPUNHtS1"
                    onChange={(token) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                    theme="light"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 inline-flex items-center justify-center gap-2 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200"
                  style={{ backgroundColor: NAVY, borderRadius: 1 }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
                  disabled={loading}
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Sending..." : "Submit Inquiry"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;