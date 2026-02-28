import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";
import logo from "@/assets/West_Rembo_Logo.png";

const EmailVerification = () => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast({ title: "Error", description: "Please enter the verification code", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/api/verify-email", { code });
      setVerified(true);
      toast({ title: "Verified", description: "Your email has been verified successfully." });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Verification failed. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post("/api/resend-verification");
      toast({ title: "Code Resent", description: "A new verification code has been sent to your email." });
    } catch {
      toast({ title: "Error", description: "Failed to resend code.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div
        className="w-full max-w-md bg-white overflow-hidden"
        style={{
          borderRadius: 4,
          boxShadow: "0 2px 40px rgba(10,20,60,0.15)",
          border: "1px solid #dde3ed",
        }}
      >
        {/* Navy header */}
        <div
          className="flex items-center gap-4 px-8 py-5"
          style={{ backgroundColor: "#0f2a5e" }}
        >
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
            <p className="text-white/50 uppercase tracking-widest" style={{ fontSize: 10 }}>
              Identity Verification
            </p>
          </div>
        </div>
        {/* Pink accent */}
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-8">
          {verified ? (
            /* ── Verified success ── */
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "#f0fdf4", border: "1.5px solid #86efac" }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: "#16a34a" }} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#c2467d" }}>
                Verification Complete
              </p>
              <h2
                className="font-bold mb-2"
                style={{ fontFamily: "'Georgia', serif", fontSize: "1.3rem", color: "#0f2a5e" }}
              >
                Email Successfully Verified
              </h2>
              <div className="mx-auto my-3" style={{ width: 40, height: 2, backgroundColor: "#c2467d" }} />
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b7280" }}>
                Your email address has been verified. You may now proceed to log in to your account.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold uppercase tracking-wider transition-all"
                style={{ borderRadius: 2, backgroundColor: "#0f2a5e", letterSpacing: "0.08em" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"}
              >
                Proceed to Login
              </Link>
            </div>
          ) : (
            /* ── Verification form ── */
            <>
              <div className="mb-7">
                <div
                  className="w-12 h-12 rounded flex items-center justify-center mb-5"
                  style={{ backgroundColor: "#fdf5f8", border: "1.5px solid #f0c4d8" }}
                >
                  <ShieldCheck className="w-6 h-6" style={{ color: "#c2467d" }} strokeWidth={1.5} />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#c2467d" }}>
                  One-Time Verification
                </p>
                <h2
                  className="font-bold mb-2"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "1.3rem", color: "#0f2a5e" }}
                >
                  Verify Your Email Address
                </h2>
                <div style={{ width: 40, height: 2, backgroundColor: "#c2467d", marginTop: 8, marginBottom: 16 }} />
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
                  A 6-digit verification code has been sent to your registered email address. Please enter the code below to complete your registration.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Verification Code
                  </Label>
                  <Input
                    placeholder="— — — — — —"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="rounded-none border-0 border-b-2 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center font-mono text-2xl tracking-[0.6em] font-bold"
                    style={{ borderBottomColor: "#dde3ed", letterSpacing: "0.6em" }}
                    onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                    onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    maxLength={6}
                  />

                  {/* Progress pips */}
                  <div className="flex justify-center gap-2 pt-1">
                    {[0,1,2,3,4,5].map((i) => (
                      <div
                        key={i}
                        className="transition-all duration-200"
                        style={{
                          width: i < code.length ? 28 : 20,
                          height: 3,
                          borderRadius: 1,
                          backgroundColor: i < code.length ? "#c2467d" : "#e5e7eb",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || code.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                  style={{ borderRadius: 2, backgroundColor: "#0f2a5e", letterSpacing: "0.08em" }}
                  onMouseEnter={(e) => { if (!isLoading && code.length >= 6) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"; }}
                >
                  {isLoading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Confirm Verification</>
                  )}
                </button>

                <div
                  className="flex items-center justify-between pt-2"
                  style={{ borderTop: "1px solid #f0f0f0" }}
                >
                  <Link to="/login" className="text-xs font-semibold hover:underline inline-flex items-center gap-1" style={{ color: "#6b7280" }}>
                    <ArrowLeft className="w-3 h-3" /> Back to Login
                  </Link>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-xs font-semibold hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                    style={{ color: "#c2467d" }}
                  >
                    {isResending && <RefreshCw className="w-3 h-3 animate-spin" />}
                    Resend Code
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;