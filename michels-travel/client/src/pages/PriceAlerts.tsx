import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Bell,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Plane,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { AirportSearch } from "@/components/AirportSearch";

const translations = {
  en: {
    title: "Price Alerts",
    back: "Back to Dashboard",
    description: "Get notified when prices drop for your favorite routes",
    createAlert: "Create Alert",
    noAlerts: "No price alerts yet",
    noAlertsDesc: "Create alerts to track price changes for your favorite routes",
    origin: "Origin",
    destination: "Destination",
    targetPrice: "Target Price",
    targetPriceDesc: "Get notified when price drops below this amount",
    dateRange: "Travel Dates (Optional)",
    from: "From",
    to: "To",
    active: "Active",
    paused: "Paused",
    currentPrice: "Current lowest price",
    lastChecked: "Last checked",
    delete: "Delete",
    cancel: "Cancel",
    create: "Create Alert",
    loginRequired: "Please log in to manage price alerts",
    login: "Log In",
    alertCreated: "Price alert created successfully",
    alertDeleted: "Price alert deleted",
  },
  pt: {
    title: "Alertas de Preço",
    back: "Voltar ao Painel",
    description: "Seja notificado quando os preços caírem para suas rotas favoritas",
    createAlert: "Criar Alerta",
    noAlerts: "Nenhum alerta de preço ainda",
    noAlertsDesc: "Crie alertas para acompanhar mudanças de preço nas suas rotas favoritas",
    origin: "Origem",
    destination: "Destino",
    targetPrice: "Preço Alvo",
    targetPriceDesc: "Seja notificado quando o preço cair abaixo deste valor",
    dateRange: "Datas de Viagem (Opcional)",
    from: "De",
    to: "Até",
    active: "Ativo",
    paused: "Pausado",
    currentPrice: "Menor preço atual",
    lastChecked: "Última verificação",
    delete: "Excluir",
    cancel: "Cancelar",
    create: "Criar Alerta",
    loginRequired: "Por favor, faça login para gerenciar alertas de preço",
    login: "Entrar",
    alertCreated: "Alerta de preço criado com sucesso",
    alertDeleted: "Alerta de preço excluído",
  },
  es: {
    title: "Alertas de Precio",
    back: "Volver al Panel",
    description: "Recibe notificaciones cuando bajen los precios de tus rutas favoritas",
    createAlert: "Crear Alerta",
    noAlerts: "Sin alertas de precio aún",
    noAlertsDesc: "Crea alertas para seguir cambios de precio en tus rutas favoritas",
    origin: "Origen",
    destination: "Destino",
    targetPrice: "Precio Objetivo",
    targetPriceDesc: "Recibe notificación cuando el precio baje de esta cantidad",
    dateRange: "Fechas de Viaje (Opcional)",
    from: "Desde",
    to: "Hasta",
    active: "Activo",
    paused: "Pausado",
    currentPrice: "Precio más bajo actual",
    lastChecked: "Última verificación",
    delete: "Eliminar",
    cancel: "Cancelar",
    create: "Crear Alerta",
    loginRequired: "Por favor, inicia sesión para gestionar alertas de precio",
    login: "Iniciar Sesión",
    alertCreated: "Alerta de precio creada exitosamente",
    alertDeleted: "Alerta de precio eliminada",
  },
};

export default function PriceAlerts() {
  const { language } = useLanguage();
  const t = translations[language];
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);

  interface Airport {
    code: string;
    name: string;
    city: string;
    country: string;
    type: string;
    label: string;
  }

  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Queries
  const { data: alerts, refetch: refetchAlerts, isLoading } = trpc.priceAlerts.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const createAlert = trpc.priceAlerts.create.useMutation({
    onSuccess: () => {
      toast.success(t.alertCreated);
      setDialogOpen(false);
      refetchAlerts();
      setOrigin(null);
      setDestination(null);
      setTargetPrice("");
      setStartDate("");
      setEndDate("");
    },
  });

  const deleteAlert = trpc.priceAlerts.delete.useMutation({
    onSuccess: () => {
      toast.success(t.alertDeleted);
      refetchAlerts();
    },
  });

  const toggleAlert = trpc.priceAlerts.toggle.useMutation({
    onSuccess: () => {
      refetchAlerts();
    },
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
            <Bell className="h-12 w-12 mx-auto text-primary mb-4" />
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t.back}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">{t.title}</h1>
                <p className="text-sm text-muted-foreground">{t.description}</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.createAlert}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t.createAlert}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t.origin}</Label>
                    <AirportSearch
                      value={origin}
                      onChange={setOrigin}
                      placeholder={t.origin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.destination}</Label>
                    <AirportSearch
                      value={destination}
                      onChange={setDestination}
                      placeholder={t.destination}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.targetPrice} (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        className="pl-9"
                        placeholder="500"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{t.targetPriceDesc}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.dateRange}</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t.from}</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t.to}</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={() =>
                      createAlert.mutate({
                        origin: origin?.code || "",
                        originName: origin?.label || "",
                        destination: destination?.code || "",
                        destinationName: destination?.label || "",
                        targetPrice: parseFloat(targetPrice) || 0,
                        departureDateStart: startDate || undefined,
                        departureDateEnd: endDate || undefined,
                      })
                    }
                    disabled={
                      !origin ||
                      !destination ||
                      !targetPrice ||
                      createAlert.isPending
                    }
                  >
                    {createAlert.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t.create
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Plane className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">
                            {alert.origin} → {alert.destination}
                          </span>
                          <Badge variant={alert.isActive ? "default" : "secondary"}>
                            {alert.isActive ? t.active : t.paused}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.originName} → {alert.destinationName}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingDown className="h-4 w-4" />
                            <span>Target: ${alert.targetPrice}</span>
                          </div>
                          {alert.departureDateStart && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(alert.departureDateStart).toLocaleDateString()}
                                {alert.departureDateEnd && ` - ${new Date(alert.departureDateEnd).toLocaleDateString()}`}
                              </span>
                            </div>
                          )}
                        </div>
                        {alert.currentLowestPrice && (
                          <p className="text-sm mt-2">
                            {t.currentPrice}: <span className="font-semibold">${alert.currentLowestPrice}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.isActive ?? false}
                        onCheckedChange={() => toggleAlert.mutate({ id: alert.id })}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => deleteAlert.mutate({ id: alert.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">{t.noAlerts}</h3>
              <p className="text-muted-foreground mb-6">{t.noAlertsDesc}</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t.createAlert}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
