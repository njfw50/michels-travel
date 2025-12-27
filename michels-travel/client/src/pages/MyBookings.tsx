import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plane, Calendar, Users, ArrowLeft, Loader2, Search, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import { Link } from "wouter";

const translations = {
  en: {
    myBookings: "My Bookings",
    noBookings: "No bookings yet",
    noBookingsDesc: "Start searching for flights to make your first booking",
    searchFlights: "Search Flights",
    login: "Log In",
    loginRequired: "Please log in to view your bookings",
    loading: "Loading your bookings...",
    bookingId: "Booking #",
    status: {
      pending: "Pending",
      paid: "Paid",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      refunded: "Refunded",
    },
    departure: "Departure",
    return: "Return",
    passengers: "Passengers",
    adult: "adult(s)",
    child: "child(ren)",
    infant: "infant(s)",
    totalPaid: "Total",
    viewDetails: "View Details",
    back: "Back",
  },
  pt: {
    myBookings: "Minhas Reservas",
    noBookings: "Nenhuma reserva ainda",
    noBookingsDesc: "Comece a buscar voos para fazer sua primeira reserva",
    searchFlights: "Buscar Voos",
    login: "Entrar",
    loginRequired: "Por favor, faça login para ver suas reservas",
    loading: "Carregando suas reservas...",
    bookingId: "Reserva #",
    status: {
      pending: "Pendente",
      paid: "Pago",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      refunded: "Reembolsado",
    },
    departure: "Partida",
    return: "Retorno",
    passengers: "Passageiros",
    adult: "adulto(s)",
    child: "criança(s)",
    infant: "bebê(s)",
    totalPaid: "Total",
    viewDetails: "Ver Detalhes",
    back: "Voltar",
  },
  es: {
    myBookings: "Mis Reservas",
    noBookings: "Sin reservas aún",
    noBookingsDesc: "Comienza a buscar vuelos para hacer tu primera reserva",
    searchFlights: "Buscar Vuelos",
    login: "Iniciar Sesión",
    loginRequired: "Por favor, inicie sesión para ver sus reservas",
    loading: "Cargando sus reservas...",
    bookingId: "Reserva #",
    status: {
      pending: "Pendiente",
      paid: "Pagado",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      refunded: "Reembolsado",
    },
    departure: "Salida",
    return: "Regreso",
    passengers: "Pasajeros",
    adult: "adulto(s)",
    child: "niño(s)",
    infant: "bebé(s)",
    totalPaid: "Total",
    viewDetails: "Ver Detalles",
    back: "Volver",
  },
};

const statusIcons = {
  pending: Clock,
  paid: CheckCircle,
  confirmed: CheckCircle,
  cancelled: XCircle,
  refunded: RefreshCw,
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function MyBookings() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: bookings, isLoading } = trpc.bookings.list.useQuery(undefined, {
    enabled: isAuthenticated,
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
          <CardContent className="flex flex-col gap-4">
            <Button asChild className="w-full">
              <Link href="/login">{t.login}</Link>
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
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
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
            <h1 className="text-xl font-bold text-primary">{t.myBookings}</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{t.noBookings}</h3>
              <p className="text-muted-foreground mb-6">{t.noBookingsDesc}</p>
              <Button onClick={() => navigate("/")}>
                <Search className="h-4 w-4 mr-2" />
                {t.searchFlights}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {bookings.map((booking) => {
              const StatusIcon = statusIcons[booking.status as keyof typeof statusIcons] || Clock;
              const statusColor = statusColors[booking.status as keyof typeof statusColors] || statusColors.pending;

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {t.bookingId}{booking.id}
                      </CardTitle>
                      <Badge className={statusColor}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {t.status[booking.status as keyof typeof t.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Flight Route */}
                      <div className="flex items-center gap-4">
                        <Plane className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">
                            {booking.originName || booking.origin} → {booking.destinationName || booking.destination}
                          </p>
                          <p className="text-sm text-muted-foreground">{booking.travelClass}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Details Grid */}
                      <div className="grid sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">{t.departure}</p>
                            <p className="font-medium">{booking.departureDate}</p>
                          </div>
                        </div>
                        {booking.returnDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">{t.return}</p>
                              <p className="font-medium">{booking.returnDate}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">{t.passengers}</p>
                            <p className="font-medium">
                              {booking.adults} {t.adult}
                              {booking.children && booking.children > 0 && `, ${booking.children} ${t.child}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Total and Actions */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t.totalPaid}</p>
                          <p className="text-xl font-bold text-primary">
                            ${(booking.totalAmount / 100).toFixed(2)} {booking.currency}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          {t.viewDetails}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
