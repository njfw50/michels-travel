import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { maskApiKey, validateApiKeyFormat, sanitizeInput } from "@/utils/security";
import { SecurityBadge } from "@/components/SecurityBadge";
import {
  Shield,
  Users,
  Plane,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  LogOut,
  Settings,
  BarChart3,
  FileText,
  CreditCard,
  Link as LinkIcon,
  Globe,
  Bot,
  Zap,
  Activity,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Bell,
  Key,
  Database,
  Server,
  Lock,
  Unlock,
  Mail,
  Phone,
} from "lucide-react";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [apiEnvironment, setApiEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [editSquareOpen, setEditSquareOpen] = useState(false);
  const [editDuffelOpen, setEditDuffelOpen] = useState(false);

  // API Credentials state
  const [squareSandboxToken, setSquareSandboxToken] = useState("");
  const [squareSandboxAppId, setSquareSandboxAppId] = useState("");
  const [squareProductionToken, setSquareProductionToken] = useState("");
  const [squareProductionAppId, setSquareProductionAppId] = useState("");
  const [duffelApiKeySandbox, setDuffelApiKeySandbox] = useState("");
  const [duffelApiKeyProduction, setDuffelApiKeyProduction] = useState("");

  // Load credentials
  const { data: apiCredentials, refetch: refetchCredentials } = trpc.system.getApiCredentials.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  // Update credentials mutation
  const updateCredentialsMutation = trpc.system.updateApiCredentials.useMutation({
    onSuccess: async (data) => {
      toast.success(data.message);
      // Fecha os modais primeiro
      setEditSquareOpen(false);
      setEditDuffelOpen(false);
      // Aguarda um pouco antes de refetch para evitar conflitos
      await new Promise(resolve => setTimeout(resolve, 300));
      // Atualiza as credenciais sem forçar refresh da página
      try {
        await refetchCredentials();
      } catch (error) {
        // Se houver erro no refetch, apenas loga mas não interrompe o fluxo
        console.warn("[AdminDashboard] Erro ao atualizar credenciais na UI:", error);
      }
    },
    onError: (error) => {
      // Não fecha os modais em caso de erro, para o usuário poder tentar novamente
      toast.error(error.message || "Erro ao atualizar credenciais");
    },
  });

  // Load credentials when they're fetched
  useEffect(() => {
    if (apiCredentials) {
      setSquareSandboxToken(apiCredentials.squareAccessTokenSandbox);
      setSquareSandboxAppId(apiCredentials.squareApplicationIdSandbox);
      setSquareProductionToken(apiCredentials.squareAccessTokenProduction);
      setSquareProductionAppId(apiCredentials.squareApplicationIdProduction);
      
      // Duffel API keys - detecta se tem chaves separadas ou usa a principal
      const duffelKey = apiCredentials.duffelApiKey || "";
      const duffelSandbox = (apiCredentials as any).duffelApiKeySandbox || "";
      const duffelProduction = (apiCredentials as any).duffelApiKeyProduction || "";
      
      if (duffelSandbox || duffelProduction) {
        // Tem chaves separadas
        setDuffelApiKeySandbox(duffelSandbox);
        setDuffelApiKeyProduction(duffelProduction);
      } else {
        // Usa a chave principal e detecta o tipo
        if (duffelKey.startsWith("duffel_live_")) {
          setDuffelApiKeyProduction(duffelKey);
          setDuffelApiKeySandbox("");
        } else if (duffelKey.startsWith("duffel_test_")) {
          setDuffelApiKeySandbox(duffelKey);
          setDuffelApiKeyProduction("");
        } else {
          // Assume sandbox por padrão
          setDuffelApiKeySandbox(duffelKey);
          setDuffelApiKeyProduction("");
        }
      }
      setApiEnvironment(apiCredentials.squareEnvironment);
    }
  }, [apiCredentials]);

  // Stats queries
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(undefined, {
    enabled: !!user,
  });

  // Orders query
  const { data: allOrders = [], isLoading: ordersLoading } = trpc.orders.listAll.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  // Leads query
  const { data: allLeads = [], isLoading: leadsLoading } = trpc.leads.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Redirect if not admin
  if (user && user.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Calculate stats
  const totalOrders = allOrders?.length || 0;
  const totalLeads = allLeads?.length || 0;
  const pendingOrders = allOrders?.filter((o: any) => o.status === "pending")?.length || 0;
  const confirmedOrders = allOrders?.filter((o: any) => o.status === "confirmed")?.length || 0;
  const totalRevenue = allOrders
    ?.filter((o: any) => o.status === "confirmed")
    .reduce((sum: number, o: any) => sum + (o.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Painel de Administração - Michel's Travel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-1">
                <Shield className="h-3 w-3 mr-1.5" />
                Admin
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Pedidos</p>
                  <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pendentes</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingOrders}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Confirmados</p>
                  <p className="text-3xl font-bold text-green-600">{confirmedOrders}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-purple-600">{totalLeads}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Receita Total</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${(totalRevenue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="apis" className="gap-2">
              <Key className="h-4 w-4" />
              APIs & Config
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <FileText className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Parceiros
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="gap-2">
              <Bot className="h-4 w-4" />
              Chatbot IA
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Estatísticas do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : stats ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Total de Buscas</span>
                        <span className="text-lg font-bold">{stats.stats.totalSearches}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Rotas Salvas</span>
                        <span className="text-lg font-bold">{stats.stats.savedRoutes}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Alertas Ativos</span>
                        <span className="text-lg font-bold">{stats.stats.activeAlerts}</span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Rotas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.topRoutes && stats.topRoutes.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topRoutes.slice(0, 5).map((route: any, idx: number) => (
                        <div
                          key={route.id || idx}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10"
                        >
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {route.origin || "N/A"} → {route.destination || "N/A"}
                            </span>
                          </div>
                          <Badge variant="secondary">{route.count || 0} buscas</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma rota ainda</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* APIs & Configuration Tab */}
          <TabsContent value="apis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Configuração de APIs
                </CardTitle>
                <CardDescription>
                  Gerencie as credenciais e ambiente (Sandbox/Produção) das APIs integradas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Environment Toggle */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-semibold flex items-center gap-2">
                        {apiEnvironment === "production" ? (
                          <Lock className="h-4 w-4 text-red-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-600" />
                        )}
                        Ambiente Ativo
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {apiEnvironment === "production"
                          ? "⚠️ MODO PRODUÇÃO - Alterações afetam clientes reais"
                          : "✅ MODO SANDBOX - Ambiente de testes seguro"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={apiEnvironment === "sandbox" ? "default" : "outline"}
                        className={apiEnvironment === "sandbox" ? "bg-green-600" : ""}
                      >
                        Sandbox
                      </Badge>
                      <Switch
                        checked={apiEnvironment === "production"}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const confirmed = window.confirm(
                              "⚠️ ATENÇÃO: Você está prestes a ativar o MODO PRODUÇÃO.\n\n" +
                                "Isso irá usar credenciais reais e processar pagamentos reais.\n\n" +
                                "Tem certeza que deseja continuar?"
                            );
                            if (confirmed) {
                              const newEnv = "production";
                              setApiEnvironment(newEnv);
                              // Atualiza ambiente E a chave principal do Duffel baseado no ambiente
                              const duffelKeyToUse = duffelApiKeyProduction || apiCredentials?.duffelApiKey || "";
                              updateCredentialsMutation.mutate({
                                squareEnvironment: newEnv,
                                duffelApiKey: duffelKeyToUse, // Atualiza chave principal para produção
                              });
                              toast.warning("Modo Produção ativado. Use com cuidado!");
                            }
                          } else {
                            const newEnv = "sandbox";
                            setApiEnvironment(newEnv);
                            // Atualiza ambiente E a chave principal do Duffel baseado no ambiente
                            const duffelKeyToUse = duffelApiKeySandbox || apiCredentials?.duffelApiKey || "";
                            updateCredentialsMutation.mutate({
                              squareEnvironment: newEnv,
                              duffelApiKey: duffelKeyToUse, // Atualiza chave principal para sandbox
                            });
                            toast.success("Modo Sandbox ativado");
                          }
                        }}
                      />
                      <Badge
                        variant={apiEnvironment === "production" ? "default" : "outline"}
                        className={apiEnvironment === "production" ? "bg-red-600" : ""}
                      >
                        Produção
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Square API */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">Square Payment API</Label>
                    </div>
                    <Badge variant="outline">Ativo</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Application ID ({apiEnvironment})</Label>
                      <div className="relative">
                        <Input
                          type={showApiKeys ? "text" : "password"}
                          value={
                            apiEnvironment === "production"
                              ? apiCredentials?.squareApplicationIdProduction || "Não configurado"
                              : apiCredentials?.squareApplicationIdSandbox || "Não configurado"
                          }
                          disabled
                          className="pr-10 font-mono text-sm"
                          readOnly
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowApiKeys(!showApiKeys)}
                        >
                          {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Access Token ({apiEnvironment})</Label>
                      <div className="relative">
                        <Input
                          type="password" // Always password type for tokens
                          value={
                            apiEnvironment === "production"
                              ? apiCredentials?.squareAccessTokenProduction || "Não configurado"
                              : apiCredentials?.squareAccessTokenSandbox || "Não configurado"
                          }
                          disabled
                          className="pr-10 font-mono text-sm"
                          readOnly
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowApiKeys(!showApiKeys)}
                        >
                          {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setEditSquareOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Editar Credenciais
                  </Button>
                </div>

                {/* Duffel API */}
                <div className="space-y-4 p-4 border-2 border-purple-200 rounded-lg bg-purple-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">Duffel Flight API</Label>
                      <SecurityBadge level="high" label="Criptografado" />
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Ativo</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    API Keys são criptografadas em repouso e mascaradas na exibição
                  </p>
                  <div className="space-y-2">
                    <Label>API Key ({apiEnvironment})</Label>
                    <div className="relative">
                      <Input
                        type="password" // Always password type for API keys
                        value={(() => {
                          // Sempre mostra a chave do ambiente ativo (já vem mascarada do backend)
                          if (apiEnvironment === "production") {
                            // Modo produção: mostra chave de produção
                            const prodKey = (apiCredentials as any)?.duffelApiKeyProduction;
                            if (prodKey) return prodKey;
                            // Se não tem chave específica, verifica se a principal é de produção
                            const mainKey = apiCredentials?.duffelApiKey || "";
                            if (mainKey && !mainKey.includes("•") && !mainKey.includes("*")) {
                              // Se não está mascarada, mascara aqui
                              return maskApiKey(mainKey);
                            }
                            if (mainKey) return mainKey;
                            return "Não configurado (produção)";
                          } else {
                            // Modo sandbox: mostra chave de sandbox
                            const sandboxKey = (apiCredentials as any)?.duffelApiKeySandbox;
                            if (sandboxKey) return sandboxKey;
                            // Se não tem chave específica, verifica se a principal é de sandbox
                            const mainKey = apiCredentials?.duffelApiKey || "";
                            if (mainKey && !mainKey.includes("•") && !mainKey.includes("*")) {
                              // Se não está mascarada, mascara aqui
                              return maskApiKey(mainKey);
                            }
                            if (mainKey) return mainKey;
                            return "Não configurado";
                          }
                        })()}
                        disabled
                        className="pr-10 font-mono text-sm"
                        readOnly
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowApiKeys(!showApiKeys)}
                      >
                        {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {apiEnvironment === "production"
                        ? "⚠️ Modo Produção: Use duffel_live_..."
                        : "✅ Modo Sandbox: Use duffel_test_..."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setEditDuffelOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Editar API Key
                  </Button>
                </div>

                {/* Database Status */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">Status do Banco de Dados</Label>
                    </div>
                    <Badge variant="default" className="bg-green-600">Conectado</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Tipo: SQLite</p>
                    <p>Localização: ./database.db</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Verificar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gerenciamento de Pedidos
                </CardTitle>
                <CardDescription>Visualize e gerencie todos os pedidos do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allOrders && allOrders.length > 0 ? (
                  <div className="space-y-3">
                    {(allOrders as any[]).map((order: any) => (
                      <div
                        key={order.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">Pedido #{order.id}</span>
                              <Badge
                                variant={
                                  order.status === "confirmed"
                                    ? "default"
                                    : order.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {order.status}
                              </Badge>
                              {order.paymentStatus && (
                                <Badge variant="outline">{order.paymentStatus}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {order.customerEmail} • {order.customerName || "N/A"}
                            </p>
                            <p className="text-sm font-medium text-primary">
                              ${(order.amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                              {order.currency}
                            </p>
                            {order.duffelOrderId && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Duffel Order: {order.duffelOrderId}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Gerenciamento de Leads
                </CardTitle>
                <CardDescription>Solicitações de cotação e contatos</CardDescription>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allLeads && allLeads.length > 0 ? (
                  <div className="space-y-3">
                    {allLeads.map((lead: any) => {
                      // Parse flight details if available
                      let flightDetails = null;
                      if (lead.flightDetails) {
                        try {
                          flightDetails = typeof lead.flightDetails === 'string' 
                            ? JSON.parse(lead.flightDetails) 
                            : lead.flightDetails;
                        } catch (e) {
                          console.warn("Failed to parse flight details:", e);
                        }
                      }

                      // Calculate total passengers
                      const adults = lead.adults || 0;
                      const children = lead.children || 0;
                      const infants = lead.infants || 0;
                      const totalPassengers = adults + children + infants;

                      return (
                        <div
                          key={lead.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-white"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              {/* Header with name and badges */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-lg">{lead.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {lead.type === "quote" ? "Cotação" : lead.type === "booking" ? "Reserva" : "Contato"}
                                </Badge>
                                <Badge
                                  variant={
                                    lead.status === "new"
                                      ? "default"
                                      : lead.status === "contacted"
                                      ? "secondary"
                                      : lead.status === "converted"
                                      ? "default"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {lead.status === "new" ? "Novo" : 
                                   lead.status === "contacted" ? "Contatado" :
                                   lead.status === "converted" ? "Convertido" : "Fechado"}
                                </Badge>
                              </div>

                              {/* Contact Information */}
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </span>
                                {lead.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.phone}
                                  </span>
                                )}
                              </div>

                              {/* Flight Route */}
                              {lead.origin && lead.destination && (
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Plane className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-primary">
                                      {lead.originName || lead.origin} ({lead.origin}) → {lead.destinationName || lead.destination} ({lead.destination})
                                    </span>
                                  </div>
                                  
                                  {/* Flight Details Grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                                    {/* Dates */}
                                    {lead.departureDate && (
                                      <div>
                                        <span className="text-xs text-muted-foreground block">Data de Ida</span>
                                        <span className="font-medium">
                                          {new Date(lead.departureDate).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric"
                                          })}
                                        </span>
                                      </div>
                                    )}
                                    {lead.returnDate && (
                                      <div>
                                        <span className="text-xs text-muted-foreground block">Data de Volta</span>
                                        <span className="font-medium">
                                          {new Date(lead.returnDate).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric"
                                          })}
                                        </span>
                                      </div>
                                    )}

                                    {/* Passengers */}
                                    {totalPassengers > 0 && (
                                      <div>
                                        <span className="text-xs text-muted-foreground block">Passageiros</span>
                                        <span className="font-medium">
                                          {adults > 0 && `${adults} Adulto${adults > 1 ? 's' : ''}`}
                                          {children > 0 && `${adults > 0 ? ', ' : ''}${children} Criança${children > 1 ? 's' : ''}`}
                                          {infants > 0 && `${(adults > 0 || children > 0) ? ', ' : ''}${infants} Bebê${infants > 1 ? 's' : ''}`}
                                          {totalPassengers > 0 && ` (Total: ${totalPassengers})`}
                                        </span>
                                      </div>
                                    )}

                                    {/* Travel Class */}
                                    {lead.travelClass && (
                                      <div>
                                        <span className="text-xs text-muted-foreground block">Classe</span>
                                        <span className="font-medium">
                                          {lead.travelClass === "ECONOMY" ? "Econômica" :
                                           lead.travelClass === "PREMIUM_ECONOMY" ? "Econômica Premium" :
                                           lead.travelClass === "BUSINESS" ? "Executiva" :
                                           lead.travelClass === "FIRST" ? "Primeira Classe" :
                                           lead.travelClass}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Estimated Price */}
                                  {lead.estimatedPrice && (
                                    <div className="mt-2 pt-2 border-t border-primary/10">
                                      <span className="text-xs text-muted-foreground">Preço Estimado: </span>
                                      <span className="font-semibold text-primary">
                                        {typeof lead.estimatedPrice === 'string' 
                                          ? lead.estimatedPrice 
                                          : `$${parseFloat(lead.estimatedPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Message/Comment */}
                              {lead.message && (
                                <div className="p-2 bg-muted/50 rounded text-sm italic border-l-2 border-primary/30">
                                  <span className="text-muted-foreground">Mensagem: </span>
                                  "{lead.message}"
                                </div>
                              )}

                              {/* Flight Details (if parsed) */}
                              {flightDetails && (
                                <div className="p-2 bg-blue-50 rounded text-xs text-muted-foreground">
                                  <span className="font-medium">Detalhes do Voo:</span> Informações adicionais disponíveis
                                </div>
                              )}
                            </div>

                            {/* Right side - Date */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                              <p className="text-sm font-medium">
                                {new Date(lead.createdAt).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric"
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(lead.createdAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum lead encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Links de Parceiros
                    </CardTitle>
                    <CardDescription>
                      Gerencie links de páginas de venda de parceiros para integração
                    </CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Parceiro
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Parceiro Exemplo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Ativo</Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    value="https://parceiro-exemplo.com/pagina-venda"
                    disabled
                    className="mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Abrir Link
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Copiar Link
                    </Button>
                  </div>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Adicione links de parceiros para integração</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot IA Tab */}
          <TabsContent value="chatbot" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configuração do Chatbot com IA
                </CardTitle>
                <CardDescription>
                  Configure o chatbot inteligente para atendimento automático aos clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-semibold">Status do Chatbot</Label>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      O chatbot está preparado para integração com IA
                    </p>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Pronto
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Modelo de IA</Label>
                    <Input placeholder="Ex: GPT-4, Claude, etc." disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key da IA</Label>
                    <div className="relative">
                      <Input type="password" placeholder="Sua API key" disabled className="pr-10" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full"
                        disabled
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Prompt do Sistema</Label>
                    <Textarea
                      placeholder="Configure o comportamento do chatbot..."
                      rows={6}
                      disabled
                      className="resize-none"
                    />
                  </div>
                  <Button disabled className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Configuração (Em desenvolvimento)
                  </Button>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> A integração completa do chatbot com IA será implementada em uma
                    próxima fase. A estrutura base já está preparada seguindo os dogmas do projeto.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Square Credentials Modal */}
        <Dialog open={editSquareOpen} onOpenChange={setEditSquareOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Editar Credenciais Square
              </DialogTitle>
              <DialogDescription>
                Configure as credenciais do Square para Sandbox e Produção
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Sandbox Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-green-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Sandbox
                  </Badge>
                  <Label className="text-base font-semibold">Credenciais de Teste</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Application ID (Sandbox)</Label>
                    <Input
                      value={squareSandboxAppId}
                      onChange={(e) => setSquareSandboxAppId(e.target.value)}
                      placeholder="sandbox-sq0idb-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Access Token (Sandbox)</Label>
                    <Input
                      type="password"
                      value={squareSandboxToken}
                      onChange={(e) => {
                        const sanitized = sanitizeInput(e.target.value);
                        setSquareSandboxToken(sanitized);
                      }}
                      placeholder="EAAAl0_7o25XCFUCDA8zKy79fFNl8yYZIqusB1GAVwtws2bNheCXiuBWkJGq4e3L"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Production Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-red-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    Produção
                  </Badge>
                  <Label className="text-base font-semibold">Credenciais de Produção</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Application ID (Production)</Label>
                    <Input
                      type="text"
                      value={squareProductionAppId}
                      onChange={(e) => {
                        const sanitized = sanitizeInput(e.target.value);
                        setSquareProductionAppId(sanitized);
                      }}
                      placeholder="sq0idp-..."
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Access Token (Production)</Label>
                    <Input
                      type="password"
                      value={squareProductionToken}
                      onChange={(e) => {
                        const sanitized = sanitizeInput(e.target.value);
                        setSquareProductionToken(sanitized);
                      }}
                      placeholder="Seu token de produção"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditSquareOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  updateCredentialsMutation.mutate({
                    squareAccessTokenSandbox: squareSandboxToken,
                    squareApplicationIdSandbox: squareSandboxAppId,
                    squareAccessTokenProduction: squareProductionToken,
                    squareApplicationIdProduction: squareProductionAppId,
                    squareEnvironment: apiEnvironment,
                  });
                }}
                disabled={updateCredentialsMutation.isPending}
                className="gap-2"
              >
                {updateCredentialsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Credenciais
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Duffel Credentials Modal */}
        <Dialog open={editDuffelOpen} onOpenChange={setEditDuffelOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Editar API Key Duffel
              </DialogTitle>
              <DialogDescription>
                Configure a API Key do Duffel para Sandbox e Produção
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Sandbox Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-green-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Sandbox
                  </Badge>
                  <Label className="text-base font-semibold">API Key de Teste</Label>
                </div>
                <div className="space-y-2">
                  <Label>Duffel API Key (Sandbox)</Label>
                  <Input
                    type="password"
                    value={duffelApiKeySandbox}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      setDuffelApiKeySandbox(sanitized);
                    }}
                    placeholder="duffel_test_..."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="text-xs bg-muted px-1 rounded">duffel_test_</code> para ambiente de testes
                  </p>
                </div>
              </div>

              {/* Production Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-red-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    Produção
                  </Badge>
                  <Label className="text-base font-semibold">API Key de Produção</Label>
                </div>
                <div className="space-y-2">
                  <Label>Duffel API Key (Production)</Label>
                  <Input
                    type="password"
                    value={duffelApiKeyProduction}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      setDuffelApiKeyProduction(sanitized);
                    }}
                    placeholder="duffel_live_..."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="text-xs bg-muted px-1 rounded">duffel_live_</code> para ambiente de produção
                  </p>
                </div>
              </div>

              {/* Environment Active Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Ambiente Ativo:</strong> {apiEnvironment === "production" ? "Produção" : "Sandbox"}
                  <br />
                  {apiEnvironment === "production"
                    ? "⚠️ O sistema usará a API Key de Produção"
                    : "✅ O sistema usará a API Key de Sandbox"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDuffelOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Salva ambas as chaves (sandbox e produção) e atualiza a principal baseado no ambiente
                  updateCredentialsMutation.mutate({
                    duffelApiKeySandbox: duffelApiKeySandbox,
                    duffelApiKeyProduction: duffelApiKeyProduction,
                    // Atualiza a chave principal baseado no ambiente ativo
                    duffelApiKey: apiEnvironment === "production" ? duffelApiKeyProduction : duffelApiKeySandbox,
                  });
                }}
                disabled={updateCredentialsMutation.isPending}
                className="gap-2"
              >
                {updateCredentialsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Todas as Credenciais
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
