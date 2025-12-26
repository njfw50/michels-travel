import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Plane,
  User,
  Bell,
  Heart,
  Clock,
  Settings,
  Award,
  TrendingUp,
  MapPin,
  Calendar,
  Search,
  ChevronRight,
  Loader2,
  Star,
  AlertCircle,
  Plus,
} from "lucide-react";

const translations = {
  en: {
    dashboard: "My Dashboard",
    welcome: "Welcome back",
    overview: "Overview",
    savedRoutes: "Saved Routes",
    priceAlerts: "Price Alerts",
    searchHistory: "Search History",
    profile: "Profile",
    totalSearches: "Total Searches",
    savedRoutesCount: "Saved Routes",
    activeAlerts: "Active Alerts",
    loyaltyPoints: "Loyalty Points",
    recentSearches: "Recent Searches",
    topRoutes: "Your Top Routes",
    noSearches: "No recent searches",
    noRoutes: "No saved routes yet",
    noAlerts: "No price alerts set",
    searchFlights: "Search Flights",
    createAlert: "Create Alert",
    viewAll: "View All",
    searches: "searches",
    lastSearched: "Last searched",
    targetPrice: "Target price",
    currentPrice: "Current price",
    active: "Active",
    paused: "Paused",
    loginRequired: "Please log in to access your dashboard",
    login: "Log In",
    tier: {
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold",
      platinum: "Platinum",
    },
  },
  pt: {
    dashboard: "Meu Painel",
    welcome: "Bem-vindo de volta",
    overview: "Visão Geral",
    savedRoutes: "Rotas Salvas",
    priceAlerts: "Alertas de Preço",
    searchHistory: "Histórico de Buscas",
    profile: "Perfil",
    totalSearches: "Total de Buscas",
    savedRoutesCount: "Rotas Salvas",
    activeAlerts: "Alertas Ativos",
    loyaltyPoints: "Pontos de Fidelidade",
    recentSearches: "Buscas Recentes",
    topRoutes: "Suas Rotas Principais",
    noSearches: "Nenhuma busca recente",
    noRoutes: "Nenhuma rota salva ainda",
    noAlerts: "Nenhum alerta de preço configurado",
    searchFlights: "Buscar Voos",
    createAlert: "Criar Alerta",
    viewAll: "Ver Todos",
    searches: "buscas",
    lastSearched: "Última busca",
    targetPrice: "Preço alvo",
    currentPrice: "Preço atual",
    active: "Ativo",
    paused: "Pausado",
    loginRequired: "Por favor, faça login para acessar seu painel",
    login: "Entrar",
    tier: {
      bronze: "Bronze",
      silver: "Prata",
      gold: "Ouro",
      platinum: "Platina",
    },
  },
  es: {
    dashboard: "Mi Panel",
    welcome: "Bienvenido de nuevo",
    overview: "Resumen",
    savedRoutes: "Rutas Guardadas",
    priceAlerts: "Alertas de Precio",
    searchHistory: "Historial de Búsquedas",
    profile: "Perfil",
    totalSearches: "Total de Búsquedas",
    savedRoutesCount: "Rutas Guardadas",
    activeAlerts: "Alertas Activas",
    loyaltyPoints: "Puntos de Fidelidad",
    recentSearches: "Búsquedas Recientes",
    topRoutes: "Tus Rutas Principales",
    noSearches: "Sin búsquedas recientes",
    noRoutes: "Sin rutas guardadas aún",
    noAlerts: "Sin alertas de precio configuradas",
    searchFlights: "Buscar Vuelos",
    createAlert: "Crear Alerta",
    viewAll: "Ver Todo",
    searches: "búsquedas",
    lastSearched: "Última búsqueda",
    targetPrice: "Precio objetivo",
    currentPrice: "Precio actual",
    active: "Activo",
    paused: "Pausado",
    loginRequired: "Por favor, inicie sesión para acceder a su panel",
    login: "Iniciar Sesión",
    tier: {
      bronze: "Bronce",
      silver: "Plata",
      gold: "Oro",
      platinum: "Platino",
    },
  },
};

function LoyaltyBadge({ tier, points }: { tier: string; points: number }) {
  const tierColors: Record<string, string> = {
    bronze: "bg-amber-700 text-white",
    silver: "bg-gray-400 text-white",
    gold: "bg-yellow-500 text-white",
    platinum: "bg-purple-600 text-white",
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${tierColors[tier] || tierColors.bronze}`}>
      <Award className="h-4 w-4" />
      <span className="font-medium capitalize">{tier}</span>
      <span className="text-sm opacity-90">• {points.toLocaleString()} pts</span>
    </div>
  );
}

export default function Dashboard() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashboardData, isLoading } = trpc.dashboard.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: savedRoutes } = trpc.savedRoutes.list.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "routes" }
  );

  const { data: priceAlerts } = trpc.priceAlerts.list.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "alerts" }
  );

  const { data: searchHistory } = trpc.searchHistory.list.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated && activeTab === "history" }
  );

  const deleteRoute = trpc.savedRoutes.delete.useMutation({
    onSuccess: () => toast.success("Route removed"),
  });

  const deleteAlert = trpc.priceAlerts.delete.useMutation({
    onSuccess: () => toast.success("Alert removed"),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>{t.loginRequired}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>{t.login}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">{t.dashboard}</h1>
              <p className="text-muted-foreground">
                {t.welcome}, {user?.name || "Traveler"}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              {dashboardData?.user && (
                <LoyaltyBadge
                  tier={dashboardData.user.loyaltyTier || "bronze"}
                  points={dashboardData.user.loyaltyPoints || 0}
                />
              )}
              <Button variant="outline" onClick={() => navigate("/profile")}>
                <Settings className="h-4 w-4 mr-2" />
                {t.profile}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t.overview}</span>
            </TabsTrigger>
            <TabsTrigger value="routes" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">{t.savedRoutes}</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t.priceAlerts}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{t.searchHistory}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <Search className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{dashboardData?.stats.totalSearches || 0}</p>
                          <p className="text-sm text-muted-foreground">{t.totalSearches}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-pink-100 rounded-full">
                          <Heart className="h-6 w-6 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{dashboardData?.stats.savedRoutes || 0}</p>
                          <p className="text-sm text-muted-foreground">{t.savedRoutesCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-full">
                          <Bell className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{dashboardData?.stats.activeAlerts || 0}</p>
                          <p className="text-sm text-muted-foreground">{t.activeAlerts}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Award className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{(dashboardData?.stats.loyaltyPoints || 0).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{t.loyaltyPoints}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Searches */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">{t.recentSearches}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("history")}>
                        {t.viewAll}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {dashboardData?.recentSearches && dashboardData.recentSearches.length > 0 ? (
                        <div className="space-y-3">
                          {dashboardData.recentSearches.slice(0, 5).map((search, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => navigate(`/?origin=${search.origin}&destination=${search.destination}`)}
                            >
                              <div className="flex items-center gap-3">
                                <Plane className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="font-medium">
                                    {search.originName || search.origin} → {search.destinationName || search.destination}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {search.departureDate}
                                    {search.returnDate && ` - ${search.returnDate}`}
                                  </p>
                                </div>
                              </div>
                              {search.lowestPrice && (
                                <Badge variant="secondary">
                                  ${(search.lowestPrice / 100).toFixed(0)}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>{t.noSearches}</p>
                          <Button className="mt-4" onClick={() => navigate("/")}>
                            {t.searchFlights}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Routes */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">{t.topRoutes}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("routes")}>
                        {t.viewAll}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {dashboardData?.topRoutes && dashboardData.topRoutes.length > 0 ? (
                        <div className="space-y-3">
                          {dashboardData.topRoutes.slice(0, 5).map((route) => (
                            <div
                              key={route.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => navigate(`/?origin=${route.origin}&destination=${route.destination}`)}
                            >
                              <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-pink-500" />
                                <div>
                                  <p className="font-medium">
                                    {route.nickname || `${route.originName || route.origin} → ${route.destinationName || route.destination}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {route.searchCount} {t.searches}
                                  </p>
                                </div>
                              </div>
                              <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>{t.noRoutes}</p>
                          <Button className="mt-4" onClick={() => navigate("/")}>
                            {t.searchFlights}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Saved Routes Tab */}
          <TabsContent value="routes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.savedRoutes}</CardTitle>
                <CardDescription>
                  {language === "en" && "Your favorite flight routes for quick access"}
                  {language === "pt" && "Suas rotas de voo favoritas para acesso rápido"}
                  {language === "es" && "Tus rutas de vuelo favoritas para acceso rápido"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedRoutes && savedRoutes.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedRoutes.map((route) => (
                      <Card key={route.id} className="relative group">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-lg">
                                {route.origin} → {route.destination}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {route.originName} → {route.destinationName}
                              </p>
                              {route.nickname && (
                                <Badge variant="outline" className="mt-2">
                                  {route.nickname}
                                </Badge>
                              )}
                            </div>
                            <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                          </div>
                          <Separator className="my-4" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {route.searchCount} {t.searches}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/?origin=${route.origin}&destination=${route.destination}`)}
                              >
                                <Search className="h-3 w-3 mr-1" />
                                {t.searchFlights}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => deleteRoute.mutate({ id: route.id })}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">{t.noRoutes}</p>
                    <p className="text-sm mt-2">
                      {language === "en" && "Save your favorite routes while searching for flights"}
                      {language === "pt" && "Salve suas rotas favoritas enquanto busca voos"}
                      {language === "es" && "Guarda tus rutas favoritas mientras buscas vuelos"}
                    </p>
                    <Button className="mt-6" onClick={() => navigate("/")}>
                      {t.searchFlights}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Price Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t.priceAlerts}</CardTitle>
                  <CardDescription>
                    {language === "en" && "Get notified when prices drop for your routes"}
                    {language === "pt" && "Seja notificado quando os preços caírem para suas rotas"}
                    {language === "es" && "Recibe notificaciones cuando bajen los precios de tus rutas"}
                  </CardDescription>
                </div>
                <Button onClick={() => navigate("/")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.createAlert}
                </Button>
              </CardHeader>
              <CardContent>
                {priceAlerts && priceAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {priceAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${alert.isActive ? "bg-green-100" : "bg-gray-100"}`}>
                            <Bell className={`h-5 w-5 ${alert.isActive ? "text-green-600" : "text-gray-400"}`} />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {alert.originName || alert.origin} → {alert.destinationName || alert.destination}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{t.targetPrice}: ${(alert.targetPrice || 0) / 100}</span>
                              {alert.currentLowestPrice && (
                                <span>{t.currentPrice}: ${alert.currentLowestPrice / 100}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={alert.isActive ? "default" : "secondary"}>
                            {alert.isActive ? t.active : t.paused}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteAlert.mutate({ id: alert.id })}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">{t.noAlerts}</p>
                    <p className="text-sm mt-2">
                      {language === "en" && "Set up price alerts to get notified of deals"}
                      {language === "pt" && "Configure alertas de preço para ser notificado de ofertas"}
                      {language === "es" && "Configura alertas de precio para recibir notificaciones de ofertas"}
                    </p>
                    <Button className="mt-6" onClick={() => navigate("/")}>
                      {t.createAlert}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.searchHistory}</CardTitle>
                <CardDescription>
                  {language === "en" && "Your recent flight searches"}
                  {language === "pt" && "Suas buscas de voos recentes"}
                  {language === "es" && "Tus búsquedas de vuelos recientes"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchHistory && searchHistory.length > 0 ? (
                  <div className="space-y-3">
                    {searchHistory.map((search, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/?origin=${search.origin}&destination=${search.destination}&date=${search.departureDate}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Plane className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {search.originName || search.origin} → {search.destinationName || search.destination}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {search.departureDate}
                                {search.returnDate && ` - ${search.returnDate}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {search.adults} adult{search.adults !== 1 && "s"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {search.lowestPrice && (
                            <p className="font-semibold text-primary">
                              ${(search.lowestPrice / 100).toFixed(0)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {search.resultsCount} results
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">{t.noSearches}</p>
                    <Button className="mt-6" onClick={() => navigate("/")}>
                      {t.searchFlights}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
