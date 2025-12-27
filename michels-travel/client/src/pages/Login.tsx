import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLoginUrl, isOAuthConfigured } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
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
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      refresh();
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Conta criada com sucesso!");
      refresh();
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar conta");
    },
  });

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const handleEmailRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
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
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Plane className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Michel's Travel</CardTitle>
          <CardDescription className="mt-2">
            {isRegistering ? "Criar nova conta" : "Faça login para continuar"}
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
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isRegistering ? "Mínimo 6 caracteres" : "Sua senha"}
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
                    {isRegistering ? "Criando conta..." : "Entrando..."}
                  </>
                ) : (
                  <>
                    <Plane className="h-4 w-4 mr-2" />
                    {isRegistering ? "Criar conta" : "Entrar"}
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
                    ? "Já tem uma conta? Faça login"
                    : "Não tem uma conta? Criar conta"}
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
                    Ou continue com
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
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <Plane className="h-4 w-4 mr-2" />
                    Entrar com Manus OAuth
                  </>
                )}
              </Button>
            </>
          )}

          {/* OAuth is optional - no alert needed when not configured */}

          <div className="pt-4 border-t">
            <Link href="/">
              <Button variant="ghost" className="w-full" disabled={isLoading}>
                Voltar para a página inicial
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
