import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Send } from "lucide-react";
import logo from "@/assets/West_Rembo_Logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/api/forgot-password", { email });
      setSent(true);
      toast({ title: "Request Sent", description: "Password reset instructions sent to your email." });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to send reset link. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
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
              Account Recovery
            </p>
          </div>
        </div>
        {/* Pink accent */}
        <div style={{ height: 3, backgroundColor: "#c2467d" }} />

        <div className="p-8">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "#fdf5f8", border: "1.5px solid #f0c4d8" }}
              >
                <Mail className="w-7 h-7" style={{ color: "#c2467d" }} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#c2467d" }}>
                Email Dispatched
              </p>
              <h2
                className="font-bold mb-2"
                style={{ fontFamily: "'Georgia', serif", fontSize: "1.3rem", color: "#0f2a5e" }}
              >
                Check Your Inbox
              </h2>
              <div className="mx-auto my-3" style={{ width: 40, height: 2, backgroundColor: "#c2467d" }} />
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b7280" }}>
                A password reset link has been sent to{" "}
                <span className="font-semibold" style={{ color: "#0f2a5e" }}>{email}</span>.
                Please follow the instructions in the email to reset your password.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold uppercase tracking-wider transition-all"
                style={{ borderRadius: 2, backgroundColor: "#0f2a5e", letterSpacing: "0.08em" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"}
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "#c2467d" }}>
                  Password Recovery
                </p>
                <h2
                  className="font-bold mb-2"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "1.3rem", color: "#0f2a5e" }}
                >
                  Forgot Your Password?
                </h2>
                <div style={{ width: 40, height: 2, backgroundColor: "#c2467d", marginTop: 8, marginBottom: 16 }} />
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
                  Enter the email address associated with your account and we will send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Registered Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                    <Input
                      type="email"
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-none border-0 border-b-2 bg-transparent pl-7 pr-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                      style={{ borderBottomColor: "#dde3ed" }}
                      onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#c2467d")}
                      onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#dde3ed")}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all disabled:opacity-60"
                  style={{ borderRadius: 2, backgroundColor: "#c2467d", letterSpacing: "0.08em" }}
                  onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = "#a33568"; }}
                  onMouseLeave={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = "#c2467d"; }}
                >
                  {isLoading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reset Link</>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link to="/login" className="text-xs font-semibold hover:underline inline-flex items-center gap-1" style={{ color: "#0f2a5e" }}>
                    <ArrowLeft className="w-3 h-3" /> Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;