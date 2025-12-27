import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plane, Users, Calendar, CreditCard, ArrowLeft, Loader2, Shield, CheckCircle } from "lucide-react";

interface PassengerInfo {
  type: "adult" | "child" | "infant";
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  passportNumber?: string;
}

const translations = {
  en: {
    checkout: "Complete Your Booking",
    flightDetails: "Flight Details",
    passengerInfo: "Passenger Information",
    contactInfo: "Contact Information",
    paymentSummary: "Payment Summary",
    adult: "Adult",
    child: "Child",
    infant: "Infant",
    firstName: "First Name",
    lastName: "Last Name",
    dateOfBirth: "Date of Birth",
    passport: "Passport Number",
    email: "Email Address",
    phone: "Phone Number",
    flightPrice: "Flight Price",
    serviceFee: "Service Fee",
    total: "Total",
    proceedToPayment: "Proceed to Payment",
    processing: "Processing...",
    loginRequired: "Please log in to complete your booking",
    login: "Log In",
    back: "Back to Search",
    secure: "Secure Payment",
    secureDesc: "Your payment is protected by Square's secure payment processing",
    noFlightSelected: "No flight selected",
    selectFlight: "Please select a flight first",
    passenger: "Passenger",
    optional: "Optional",
    required: "Required",
  },
  pt: {
    checkout: "Complete Sua Reserva",
    flightDetails: "Detalhes do Voo",
    passengerInfo: "Informações dos Passageiros",
    contactInfo: "Informações de Contato",
    paymentSummary: "Resumo do Pagamento",
    adult: "Adulto",
    child: "Criança",
    infant: "Bebê",
    firstName: "Nome",
    lastName: "Sobrenome",
    dateOfBirth: "Data de Nascimento",
    passport: "Número do Passaporte",
    email: "Endereço de Email",
    phone: "Número de Telefone",
    flightPrice: "Preço do Voo",
    serviceFee: "Taxa de Serviço",
    total: "Total",
    proceedToPayment: "Prosseguir para Pagamento",
    processing: "Processando...",
    loginRequired: "Por favor, faça login para completar sua reserva",
    login: "Entrar",
    back: "Voltar à Busca",
    secure: "Pagamento Seguro",
    secureDesc: "Seu pagamento é protegido pelo processamento seguro do Square",
    noFlightSelected: "Nenhum voo selecionado",
    selectFlight: "Por favor, selecione um voo primeiro",
    passenger: "Passageiro",
    optional: "Opcional",
    required: "Obrigatório",
  },
  es: {
    checkout: "Complete Su Reserva",
    flightDetails: "Detalles del Vuelo",
    passengerInfo: "Información de Pasajeros",
    contactInfo: "Información de Contacto",
    paymentSummary: "Resumen del Pago",
    adult: "Adulto",
    child: "Niño",
    infant: "Bebé",
    firstName: "Nombre",
    lastName: "Apellido",
    dateOfBirth: "Fecha de Nacimiento",
    passport: "Número de Pasaporte",
    email: "Correo Electrónico",
    phone: "Número de Teléfono",
    flightPrice: "Precio del Vuelo",
    serviceFee: "Tarifa de Servicio",
    total: "Total",
    proceedToPayment: "Proceder al Pago",
    processing: "Procesando...",
    loginRequired: "Por favor, inicie sesión para completar su reserva",
    login: "Iniciar Sesión",
    back: "Volver a la Búsqueda",
    secure: "Pago Seguro",
    secureDesc: "Su pago está protegido por el procesamiento seguro de Square",
    noFlightSelected: "Ningún vuelo seleccionado",
    selectFlight: "Por favor, seleccione un vuelo primero",
    passenger: "Pasajero",
    optional: "Opcional",
    required: "Requerido",
  },
};

export default function Checkout() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Get flight data from sessionStorage
  const flightDataStr = typeof window !== "undefined" ? sessionStorage.getItem("selectedFlight") : null;
  const flightData = flightDataStr ? JSON.parse(flightDataStr) : null;

  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [passengers, setPassengers] = useState<PassengerInfo[]>(() => {
    if (!flightData) return [];
    const list: PassengerInfo[] = [];
    for (let i = 0; i < (flightData.adults || 1); i++) {
      list.push({ type: "adult", firstName: "", lastName: "" });
    }
    for (let i = 0; i < (flightData.children || 0); i++) {
      list.push({ type: "child", firstName: "", lastName: "", dateOfBirth: "" });
    }
    for (let i = 0; i < (flightData.infants || 0); i++) {
      list.push({ type: "infant", firstName: "", lastName: "", dateOfBirth: "" });
    }
    return list;
  });

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      toast.success(t.processing);
      // Redirect to Square checkout
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flightData) {
      toast.error(t.noFlightSelected);
      return;
    }

    // Validate passengers
    for (const p of passengers) {
      if (!p.firstName || !p.lastName) {
        toast.error(`Please fill in all required passenger information`);
        return;
      }
    }

    if (!contactEmail) {
      toast.error("Please provide a contact email");
      return;
    }

    // Convert price to cents
    const totalAmountCents = Math.round(parseFloat(flightData.flight.price.total) * 100);

    createBooking.mutate({
      origin: flightData.origin,
      originName: flightData.originName,
      destination: flightData.destination,
      destinationName: flightData.destinationName,
      departureDate: flightData.departureDate,
      returnDate: flightData.returnDate,
      adults: flightData.adults,
      children: flightData.children || 0,
      infants: flightData.infants || 0,
      travelClass: flightData.travelClass || "ECONOMY",
      flightOffer: flightData.flight,
      totalAmount: totalAmountCents,
      currency: flightData.flight.price.currency || "USD",
      passengerDetails: passengers,
      contactEmail,
      contactPhone,
    });
  };

  const serviceFee = 25.0;
  const flightPrice = flightData ? parseFloat(flightData.flight.price.total) : 0;
  const totalPrice = flightPrice + serviceFee;

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
            <CardDescription>
              {language === "en" && "Create an account or log in to book your flight"}
              {language === "pt" && "Crie uma conta ou faça login para reservar seu voo"}
              {language === "es" && "Cree una cuenta o inicie sesión para reservar su vuelo"}
            </CardDescription>
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

  if (!flightData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>{t.noFlightSelected}</CardTitle>
            <CardDescription>{t.selectFlight}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
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
            <h1 className="text-xl font-bold text-primary">{t.checkout}</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flight Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    {t.flightDetails}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">
                          {flightData.originName} → {flightData.destinationName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {flightData.flight.validatingAirline}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${flightData.flight.price.total}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {flightData.flight.price.currency}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {flightData.departureDate}
                          {flightData.returnDate && ` - ${flightData.returnDate}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {flightData.adults} {t.adult}
                          {flightData.children > 0 && `, ${flightData.children} ${t.child}`}
                          {flightData.infants > 0 && `, ${flightData.infants} ${t.infant}`}
                        </span>
                      </div>
                    </div>

                    {/* Outbound Flight */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium mb-2">
                        {flightData.flight.outbound.departure.iataCode} →{" "}
                        {flightData.flight.outbound.arrival.iataCode}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          {new Date(flightData.flight.outbound.departure.at).toLocaleString()} -{" "}
                          {new Date(flightData.flight.outbound.arrival.at).toLocaleString()}
                        </p>
                        <p>
                          {flightData.flight.outbound.duration} •{" "}
                          {flightData.flight.outbound.stops === 0
                            ? "Direct"
                            : `${flightData.flight.outbound.stops} stop(s)`}
                        </p>
                      </div>
                    </div>

                    {/* Inbound Flight */}
                    {flightData.flight.inbound && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium mb-2">
                          {flightData.flight.inbound.departure.iataCode} →{" "}
                          {flightData.flight.inbound.arrival.iataCode}
                        </p>
                        <div className="text-sm text-muted-foreground">
                          <p>
                            {new Date(flightData.flight.inbound.departure.at).toLocaleString()} -{" "}
                            {new Date(flightData.flight.inbound.arrival.at).toLocaleString()}
                          </p>
                          <p>
                            {flightData.flight.inbound.duration} •{" "}
                            {flightData.flight.inbound.stops === 0
                              ? "Direct"
                              : `${flightData.flight.inbound.stops} stop(s)`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Passenger Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {t.passengerInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {passengers.map((passenger, index) => (
                      <div key={index} className="space-y-4">
                        <h4 className="font-medium">
                          {t.passenger} {index + 1} -{" "}
                          {passenger.type === "adult"
                            ? t.adult
                            : passenger.type === "child"
                            ? t.child
                            : t.infant}
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`firstName-${index}`}>
                              {t.firstName} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`firstName-${index}`}
                              value={passenger.firstName}
                              onChange={(e) => updatePassenger(index, "firstName", e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor={`lastName-${index}`}>
                              {t.lastName} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`lastName-${index}`}
                              value={passenger.lastName}
                              onChange={(e) => updatePassenger(index, "lastName", e.target.value)}
                              required
                            />
                          </div>
                          {(passenger.type === "child" || passenger.type === "infant") && (
                            <div>
                              <Label htmlFor={`dob-${index}`}>
                                {t.dateOfBirth} <span className="text-muted-foreground text-xs">({t.optional})</span>
                              </Label>
                              <Input
                                id={`dob-${index}`}
                                type="date"
                                value={passenger.dateOfBirth || ""}
                                onChange={(e) => updatePassenger(index, "dateOfBirth", e.target.value)}
                              />
                            </div>
                          )}
                          <div>
                            <Label htmlFor={`passport-${index}`}>
                              {t.passport} <span className="text-muted-foreground text-xs">({t.optional})</span>
                            </Label>
                            <Input
                              id={`passport-${index}`}
                              value={passenger.passportNumber || ""}
                              onChange={(e) => updatePassenger(index, "passportNumber", e.target.value)}
                            />
                          </div>
                        </div>
                        {index < passengers.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.contactInfo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">
                        {t.email} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">
                        {t.phone} <span className="text-muted-foreground text-xs">({t.optional})</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      {t.paymentSummary}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>{t.flightPrice}</span>
                        <span>${flightPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t.serviceFee}</span>
                        <span>${serviceFee.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>{t.total}</span>
                        <span className="text-primary">${totalPrice.toFixed(2)}</span>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={createBooking.isPending}
                      >
                        {createBooking.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t.processing}
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            {t.proceedToPayment}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Badge */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">{t.secure}</p>
                        <p className="text-sm text-green-700">{t.secureDesc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What's Included */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          {language === "en" && "Instant booking confirmation"}
                          {language === "pt" && "Confirmação instantânea da reserva"}
                          {language === "es" && "Confirmación instantánea de la reserva"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          {language === "en" && "24/7 customer support"}
                          {language === "pt" && "Suporte ao cliente 24/7"}
                          {language === "es" && "Soporte al cliente 24/7"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>
                          {language === "en" && "E-ticket sent to your email"}
                          {language === "pt" && "E-ticket enviado para seu email"}
                          {language === "es" && "E-ticket enviado a su correo"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
