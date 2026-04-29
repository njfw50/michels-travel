import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { Plane, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Login() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isEmailLogin, setIsEmailLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  const oauthConfigured = isOAuthConfigured();
  const loginUrl = getLoginUrl();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      toast.success("Login successful!");
      // DOGMA 2: Wait for refresh to complete before navigating
      await refresh();
      // Small delay to ensure state is updated
      setTimeout(() => {
        // CANONICAL: Redirect admin to admin dashboard, regular users to user dashboard
        if (data.user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 100);
    },
    onError: (error) => {
      toast.error(error.message || "Error during login");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      toast.success("Account created successfully!");
      // DOGMA 2: Wait for refresh to complete before navigating
      await refresh();
      // Small delay to ensure state is updated
      setTimeout(() => {
        // CANONICAL: Redirect admin to admin dashboard, regular users to user dashboard
        if (data.user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 100);
    },
    onError: (error) => {
      toast.error(error.message || "Error creating account");
    },
  });

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const handleEmailRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  const handleOAuthLogin = () => {
    if (!oauthConfigured) {
      // OAuth not configured - this shouldn't happen as button only shows if configured
      // But if it does, just return silently
      return;
    }

    setIsRedirecting(true);
    window.location.href = loginUrl;
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || isRedirecting;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="default" showTagline={true} />
          </div>
          <CardDescription className="mt-2">
            {isRegistering ? "Create a new account" : "Login to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Password Login Form */}
          {isEmailLogin && (
            <form
              onSubmit={isRegistering ? handleEmailRegister : handleEmailLogin}
              className="space-y-4"
            >
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email or Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="your@email.com or admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isRegistering ? "Minimum 6 characters" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isRegistering ? "Creating account..." : "Logging in..."}
                  </>
                ) : (
                  <>
                    <Plane className="h-4 w-4 mr-2" />
                    {isRegistering ? "Create account" : "Login"}
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setPassword("");
                  }}
                  disabled={isLoading}
                  className="text-sm"
                >
                  {isRegistering
                    ? "Already have an account? Login"
                    : "Don't have an account? Create account"}
                </Button>
              </div>
            </form>
          )}

          {/* OAuth Login Option */}
          {oauthConfigured && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                onClick={handleOAuthLogin}
                variant="outline"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Plane className="h-4 w-4 mr-2" />
                    Login with Manus OAuth
                  </>
                )}
              </Button>
            </>
          )}

          {/* OAuth is optional - no alert needed when not configured */}

          <div className="pt-4 border-t">
            <Link href="/">
              <Button variant="ghost" className="w-full" disabled={isLoading}>
                Back to home page
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
