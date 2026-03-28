import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EmailVerification = () => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      toast({ title: "Success!", description: "Your email has been verified." });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Verification failed. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/api/resend-verification");
      toast({ title: "Sent!", description: "A new verification code has been sent to your email." });
    } catch {
      toast({ title: "Error", description: "Failed to resend code.", variant: "destructive" });
    }
  };

  return (
    <AuthLayout>
      <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full p-8 md:p-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Email Verification</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          We've sent a verification code to your email. Enter it below to verify your account.
        </p>

        {verified ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <p className="text-foreground font-medium">Email verified successfully!</p>
            <Link to="/">
              <Button className="mt-4">Go to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label className="font-semibold text-foreground">Verification Code</Label>
              <Input placeholder="Enter 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 bg-card text-center text-lg tracking-widest" maxLength={6} />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Didn't receive a code?{" "}
              <button type="button" onClick={handleResend} className="text-accent font-semibold hover:underline">
                Resend
              </button>
            </p>
            <p className="text-sm text-center text-muted-foreground">
              <Link to="/" className="text-accent font-semibold hover:underline">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default EmailVerification;
