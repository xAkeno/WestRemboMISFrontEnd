import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/West_Rembo_Logo.png";
import { supabase } from "@/utils/supabase";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // ── Track failed attempts ──
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Show captcha once the user has failed 3 or more times
  const showCaptcha = failedAttempts >= 3;

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    // If captcha is visible, require it to be completed
    if (showCaptcha && !captchaToken) {
      toast({ title: "CAPTCHA Required", description: "Please complete the verification before signing in.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      await api.post(
        "/api/login",
        { token: data.session.access_token },
        { withCredentials: true }
      );

      // Reset on success
      setFailedAttempts(0);
      setCaptchaToken(null);

      toast({ title: "Success!", description: "You've been logged in successfully." });
      navigate("/home");

    } catch (error: any) {
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);

      // Reset captcha widget so user can re-verify on next attempt
      recaptchaRef.current?.reset();
      setCaptchaToken(null);

      let errorMessage = "Login failed. Please try again.";
      if (error.message) errorMessage = error.message;

      // Give a hint once the captcha threshold is hit
      if (newCount === 3) {
        toast({
          title: "Too Many Failed Attempts",
          description: "Please complete the CAPTCHA verification before trying again.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div
        className="w-full max-w-4xl grid md:grid-cols-[1fr_1.1fr] overflow-hidden"
        style={{
          borderRadius: 4,
          boxShadow: "0 2px 40px rgba(10,20,60,0.18)",
          border: "1px solid #dde3ed",
        }}
      >
        {/* ── Left panel: official identity ── */}
        <div
          className="relative flex flex-col justify-between p-10 overflow-hidden"
          style={{ backgroundColor: "#0f2a5e" }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                #fff,
                #fff 1px,
                transparent 1px,
                transparent 20px
              )`,
            }}
          />
          <div
            className="absolute top-0 left-0 right-0"
            style={{ height: 3, backgroundColor: "#c2467d" }}
          />

          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.10)",
                  border: "1.5px solid rgba(194,70,125,0.50)",
                }}
              >
                <img src={logo} alt="Barangay West Rembo" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[0.18em] mb-0.5"
                  style={{ color: "#c2467d", letterSpacing: "0.18em" }}
                >
                  Republic of the Philippines
                </p>
                <p
                  className="text-xs text-white/50 uppercase tracking-widest"
                  style={{ fontSize: 10 }}
                >
                  City of Makati · District II
                </p>
              </div>
            </div>

            <div style={{ width: 40, height: 2, backgroundColor: "#c2467d", marginBottom: 24 }} />

            <h1
              className="text-white leading-tight mb-4"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                fontWeight: 700,
                lineHeight: 1.25,
              }}
            >
              Barangay<br />
              <span style={{ color: "#e8a0bf" }}>West Rembo</span>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed" style={{ maxWidth: 260 }}>
              Official Digital Services Portal for residents, community programs, and local government transactions.
            </p>
          </div>

          <div
            className="relative pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
          >
            <p className="text-white/35 text-xs leading-relaxed">
              This portal is the official online channel of Barangay West Rembo. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* ── Right panel: login form ── */}
        <div className="bg-white p-10 flex flex-col justify-center">
          <div className="mb-8">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em] mb-2"
              style={{ color: "#c2467d" }}
            >
              Resident Access
            </p>
            <h2
              className="text-foreground mb-1"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#0f2a5e",
              }}
            >
              Sign In to Your Account
            </h2>
            <div style={{ width: 40, height: 2, backgroundColor: "#c2467d", marginTop: 10 }} />
          </div>

          <form onSubmit={handleSupabaseLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#374151" }}>
                Email Address
              </Label>
              <Input
                type="text"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                style={{ borderBottomColor: "#dde3ed", outline: "none" }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#374151" }}>
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-none border-0 border-b-2 bg-transparent px-0 pr-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                  style={{ borderBottomColor: "#dde3ed" }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                  style={{ color: "#9ca3af" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-medium hover:underline"
                style={{ color: "#c2467d" }}
              >
                Forgot your password?
              </Link>
            </div>

            {/* ── reCAPTCHA — appears after 3 failed attempts ── */}
            {showCaptcha && (
              <div
                className="flex flex-col items-center"
              >
                
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LcxosUsAAAAAJpim7cdKsK_GgUJf8GBkPUNHtS1"
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                  theme="light"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all duration-200 disabled:opacity-60"
              style={{
                backgroundColor: isLoading ? "#9b3a6b" : "#c2467d",
                borderRadius: 2,
                letterSpacing: "0.08em",
              }}
              onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = "#a33568"; }}
              onMouseLeave={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = "#c2467d"; }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div
            className="mt-8 pt-6 flex items-center justify-between text-xs"
            style={{ borderTop: "1px solid #f0f0f0" }}
          >
            <span style={{ color: "#9ca3af" }}>
              New resident?{" "}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: "#0f2a5e" }}>
                Create Account
              </Link>
            </span>
            <span style={{ color: "#d1d5db" }}>v2.0</span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;