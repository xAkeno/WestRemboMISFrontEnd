import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/forgot-password", { email });
      setSent(true);
      toast({ title: "Success!", description: "Password reset link sent to your email." });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to send reset link. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full p-8 md:p-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">Forgot your password?</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">📧</div>
            <p className="text-foreground font-medium">Check your email!</p>
            <p className="text-sm text-muted-foreground">We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/">
              <Button variant="outline" className="mt-4">Back to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-semibold text-foreground">Email address</Label>
              <Input type="email" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-card" />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link to="/" className="text-accent font-semibold hover:underline">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
