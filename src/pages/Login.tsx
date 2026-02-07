import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/West_Rembo_Logo.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/api/login", { username, password }, { withCredentials: true });

      if (response.status === 200) {
        toast({
          title: "Success!",
          description: "You've been logged in successfully.",
        });
        navigate("/home");
      }
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-2xl max-w-4xl w-full grid md:grid-cols-2 overflow-hidden">
        {/* Left - Branding */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <img src={logo} alt="West Rembo Logo" className="w-20 h-20" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              West Rembo<br />announcements
            </h1>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Our community platform ensures every resident stays updated with the latest announcements, events, and government services—bringing transparency and unity closer to home.
          </p>
        </div>

        {/* Right - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-xl font-bold text-foreground mb-6">Sign in to West Rembo</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-semibold text-foreground">Your email</Label>
              <Input
                id="email"
                type="text"
                placeholder="name@gmail.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 bg-card border-border"
              />
            </div>
            <div>
              <Label htmlFor="password" className="font-semibold text-foreground">Your password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-card border-border"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-auto">
              {isLoading ? "Logging in..." : "Login to your account"}
            </Button>
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground">
                Not registered yet?{" "}
                <Link to="/register" className="text-accent font-semibold hover:underline">
                  Create account
                </Link>
              </span>
              <Link to="/forgot-password" className="text-foreground font-semibold hover:underline">
                Forget your password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
