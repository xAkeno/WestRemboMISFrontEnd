import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Send, KeyRound, Eye, EyeOff, CheckCircle2, Loader2, X } from "lucide-react";
import logo from "@/assets/West_Rembo_Logo.png";
import ReCAPTCHA from "react-google-recaptcha";

const NAVY = "#0f2a5e";
const PINK  = "#c2467d";
const RECAPTCHA_SITE_KEY = "6LcxosUsAAAAAJpim7cdKsK_GgUJf8GBkPUNHtS1";

// ─── Reusable underline field ──────────────────────────────────────────────
const UField = ({
  label, id, type = "text", placeholder, value, onChange,
  icon, rightSlot, disabled,
}: {
  label: string; id: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; rightSlot?: React.ReactNode; disabled?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label
      htmlFor={id}
      className="text-[10px] font-bold uppercase tracking-[0.14em]"
      style={{ color: "#6b7280" }}
    >
      {label}
    </Label>
    <div className="relative">
      {icon && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }}>
          {icon}
        </div>
      )}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-none border-0 border-b-2 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm disabled:opacity-50"
        style={{
          paddingLeft: icon ? 28 : 0,
          paddingRight: rightSlot ? 32 : 0,
          borderBottomColor: "#dde3ed",
        }}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = PINK)}
        onBlur={(e)  => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
      />
      {rightSlot && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  </div>
);

// ─── Submit button ─────────────────────────────────────────────────────────
const SubmitBtn = ({
  loading, label, icon, disabled,
}: { loading: boolean; label: string; icon: React.ReactNode; disabled?: boolean }) => (
  <button
    type="submit"
    disabled={loading || disabled}
    className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-60"
    style={{ borderRadius: 2, backgroundColor: PINK, letterSpacing: "0.08em" }}
    onMouseEnter={(e) => { if (!loading && !disabled) (e.currentTarget as HTMLElement).style.backgroundColor = "#a33568"; }}
    onMouseLeave={(e) => { if (!loading && !disabled) (e.currentTarget as HTMLElement).style.backgroundColor = PINK; }}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{icon} {label}</>}
  </button>
);

// ─── Card shell ───────────────────────────────────────────────────────────
const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    className="w-full max-w-md bg-white overflow-hidden"
    style={{ borderRadius: 4, boxShadow: "0 2px 40px rgba(10,20,60,0.15)", border: "1px solid #dde3ed" }}
  >
    <div className="flex items-center gap-4 px-8 py-5" style={{ backgroundColor: NAVY }}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(194,70,125,0.40)" }}
      >
        <img src={logo} alt="West Rembo" className="w-7 h-7 object-contain" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "#e8a0bf" }}>
          Barangay West Rembo
        </p>
        <p className="uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>
          Account Recovery
        </p>
      </div>
    </div>
    <div style={{ height: 3, backgroundColor: PINK }} />
    <div className="p-8">{children}</div>
  </div>
);

// ─── Section heading ──────────────────────────────────────────────────────
const Heading = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div className="mb-7">
    <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1" style={{ color: PINK }}>
      {eyebrow}
    </p>
    <h2 className="font-bold" style={{ fontFamily: "'Georgia', serif", fontSize: "1.3rem", color: NAVY }}>
      {title}
    </h2>
    <div style={{ width: 40, height: 2, backgroundColor: PINK, marginTop: 8 }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────
const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1 — email + captcha
  const [email,           setEmail          ] = useState("");
  const [sending,         setSending        ] = useState(false);
  const [captchaToken,    setCaptchaToken   ] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Step 2 — code + new password
  const [sent,       setSent      ] = useState(false);
  const [code,       setCode      ] = useState("");
  const [password,   setPassword  ] = useState("");
  const [confirm,    setConfirm   ] = useState("");
  const [showPwd,    setShowPwd   ] = useState(false);
  const [showConf,   setShowConf  ] = useState(false);
  const [resetting,  setResetting ] = useState(false);
  const [cooldown,   setCooldown  ] = useState(0);

  // Step 2 — reset captcha
  const [resetCaptchaToken, setResetCaptchaToken] = useState<string | null>(null);
  const resetRecaptchaRef = useRef<ReCAPTCHA>(null);

  // ── password rules (mirrors Register) ────────────────────────────────────
  const passwordRules = [
    { label: "Maximum 10 characters",                     valid: password.length >= 1 && password.length <= 10 },
    { label: "Contains an uppercase letter",               valid: /[A-Z]/.test(password) },
    { label: "Contains a lowercase letter",               valid: /[a-z]/.test(password) },
    { label: "Contains a numeric digit",                  valid: /\d/.test(password) },
    { label: "Contains a special character (!@#$%^&*…)",  valid: /[^A-Za-z0-9]/.test(password) },
    { label: "Passwords match",                           valid: confirm.length > 0 && password === confirm },
  ];
  const passwordValid = password.length > 0 && passwordRules.every((r) => r.valid);

  // ── helpers ──────────────────────────────────────────────────────────────
  const resetCaptcha = () => {
    recaptchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const resetResetCaptcha = () => {
    resetRecaptchaRef.current?.reset();
    setResetCaptchaToken(null);
  };

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: validate locally → CAPTCHA → DB ──────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: "Error", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!captchaToken) {
      toast({ title: "CAPTCHA Required", description: "Please complete the verification before continuing.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      await api.post("/api/forgot-password", { email, recaptcha_token: captchaToken });
      setSent(true);
      startCooldown();
      toast({ title: "Code Sent", description: "A 6-digit code has been sent to your email." });
    } catch (error: any) {
      resetCaptcha();
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send reset code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ── Step 2: resend ────────────────────────────────────────────────────────
  const handleResendCode = async () => {
    if (cooldown > 0) return;
    if (!captchaToken) {
      toast({ title: "CAPTCHA Required", description: "Please complete the verification below before resending.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      await api.post("/api/resend-password-reset-code", { email, recaptcha_token: captchaToken });
      toast({ title: "Code Resent ✅", description: "A new 6-digit code has been sent to your email." });
      resetCaptcha();
      startCooldown();
    } catch (error: any) {
      resetCaptcha();
      toast({
        title: "Failed ❌",
        description: error.response?.data?.message || "Unable to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ── Step 2: submit new password ──────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast({ title: "Error", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }
    if (!passwordValid) {
      toast({ title: "Error", description: "Please fix the password requirements.", variant: "destructive" });
      return;
    }
    if (!resetCaptchaToken) {
      toast({ title: "CAPTCHA Required", description: "Please complete the verification before resetting your password.", variant: "destructive" });
      return;
    }

    setResetting(true);
    try {
      await api.post("/api/reset-password", {
        email,
        code,
        password,
        password_confirmation: confirm,
        recaptcha_token: resetCaptchaToken,
      });
      toast({ title: "Password Reset", description: "Your password has been updated. Please sign in." });
      navigate("/login");
    } catch (error: any) {
      resetResetCaptcha();
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <Card>

        {/* ══════════ STEP 1 — Email + CAPTCHA ══════════ */}
        {!sent && (
          <>
            <Heading eyebrow="Password Recovery" title="Forgot Your Password?" />

            <p className="text-sm leading-relaxed mb-6" style={{ color: "#6b7280" }}>
              Enter the email address associated with your account and we'll send you a 6-digit code to reset your password.
            </p>

            <form onSubmit={handleSendCode} className="space-y-6">
              <UField
                id="email" label="Registered Email Address" type="email"
                placeholder="name@gmail.com" value={email} onChange={setEmail}
                icon={<Mail className="w-4 h-4" />}
              />

              {/* reCAPTCHA — centered */}
              <div className="flex flex-col items-center gap-1.5">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => {
                    setCaptchaToken(null);
                    toast({ title: "CAPTCHA Expired", description: "Please complete the verification again.", variant: "destructive" });
                  }}
                  theme="light"
                />
                {!captchaToken && (
                  <p className="text-xs" style={{ color: "#ef4444" }}>
                    ↑ Please complete the CAPTCHA above to continue
                  </p>
                )}
              </div>

              <SubmitBtn
                loading={sending}
                label={captchaToken ? "Send Reset Code" : "Complete CAPTCHA to Continue"}
                icon={<Send className="w-4 h-4" />}
                disabled={!captchaToken}
              />

              <div className="pt-1 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold hover:underline inline-flex items-center gap-1 transition-colors duration-150"
                  style={{ color: NAVY }}
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Login
                </Link>
              </div>
            </form>
          </>
        )}

        {/* ══════════ STEP 2 — Code + New Password ══════════ */}
        {sent && (
          <>
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#fdf5f8", border: "1.5px solid #f0c4d8" }}
              >
                <Mail className="w-6 h-6" style={{ color: PINK }} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: PINK }}>
                Code Dispatched
              </p>
              <h2
                className="font-bold mb-1"
                style={{ fontFamily: "'Georgia', serif", fontSize: "1.2rem", color: NAVY }}
              >
                Check Your Inbox
              </h2>
              <div className="mx-auto my-3" style={{ width: 36, height: 2, backgroundColor: PINK }} />
              <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
                A 6-digit code was sent to{" "}
                <span className="font-semibold" style={{ color: NAVY }}>{email}</span>.
                Enter it below along with your new password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Code field */}
              <UField
                id="code" label="6-Digit Code" type="text"
                placeholder="e.g. 123456" value={code} onChange={setCode}
                icon={<KeyRound className="w-4 h-4" />}
              />

              {/* Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                  New Password
                </p>
                <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              {/* New password */}
              <UField
                id="password" label="New Password"
                type={showPwd ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password} onChange={setPassword}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="p-0.5 transition-colors"
                    style={{ color: "#9ca3af" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = NAVY}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#9ca3af"}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Confirm password */}
              <UField
                id="confirm" label="Confirm New Password"
                type={showConf ? "text" : "password"}
                placeholder="Repeat your new password"
                value={confirm} onChange={setConfirm}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowConf((v) => !v)}
                    className="p-0.5 transition-colors"
                    style={{ color: "#9ca3af" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = NAVY}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#9ca3af"}
                  >
                    {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Password checklist — only shown once user starts typing */}
              {password.length > 0 && (
                <div
                  className="p-4 space-y-2"
                  style={{ backgroundColor: "#f8f9fb", border: "1px solid #e5e7eb", borderRadius: 2 }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: NAVY }}>
                    Password Requirements
                  </p>
                  {passwordRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: rule.valid ? "#d45ea3" : "#fee2e2" }}
                      >
                        {rule.valid
                          ? <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          : <X className="w-2.5 h-2.5" style={{ color: "#ef4444" }} strokeWidth={3} />
                        }
                      </div>
                      <span className="text-xs" style={{ color: "#6b7280" }}>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Reset CAPTCHA — centered, above the Reset button ── */}
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <ReCAPTCHA
                  ref={resetRecaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={(token) => setResetCaptchaToken(token)}
                  onExpired={() => {
                    setResetCaptchaToken(null);
                    toast({ title: "CAPTCHA Expired", description: "Please complete the verification again.", variant: "destructive" });
                  }}
                  theme="light"
                />
                {!resetCaptchaToken && (
                  <p className="text-xs" style={{ color: "#ef4444" }}>
                    ↑ Please complete the CAPTCHA above to reset your password
                  </p>
                )}
              </div>

              {/* Reset password button */}
              <SubmitBtn
                loading={resetting}
                label={resetCaptchaToken ? "Reset Password" : "Complete CAPTCHA to Continue"}
                icon={<CheckCircle2 className="w-4 h-4" />}
                disabled={!resetCaptchaToken}
              />

              {/* ── Resend section ── */}
              <div className="pt-2 space-y-3" style={{ borderTop: "1px solid #f0f0f0" }}>
                <p className="text-xs text-center" style={{ color: "#9ca3af" }}>
                  Didn't receive the code?
                </p>

                {/* Resend CAPTCHA — only shown when cooldown has expired */}
                {/* {cooldown === 0 && (
                  <div className="flex flex-col items-center gap-1.5">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => {
                        setCaptchaToken(null);
                        toast({ title: "CAPTCHA Expired", description: "Please complete the verification again.", variant: "destructive" });
                      }}
                      theme="light"
                    />
                  </div>
                )} */}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setCode("");
                      setPassword("");
                      setConfirm("");
                      resetCaptcha();
                      resetResetCaptcha();
                    }}
                    className="text-xs font-semibold hover:underline inline-flex items-center gap-1 transition-colors"
                    style={{ color: "#6b7280" }}
                  >
                    <ArrowLeft className="w-3 h-3" /> Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={sending || cooldown > 0}
                    className="text-xs font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                    style={{ color: cooldown > 0 ? "#9ca3af" : PINK }}
                  >
                    {sending
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Send className="w-3 h-3" />
                    }
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

      </Card>
    </AuthLayout>
  );
};

export default ForgotPassword;