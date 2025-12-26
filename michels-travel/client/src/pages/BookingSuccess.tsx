import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Plane, Calendar, Users, Download, Home, Loader2, Mail } from "lucide-react";

const translations = {
  en: {
    success: "Booking Confirmed!",
    thankYou: "Thank you for booking with Michel's Travel",
    confirmationSent: "A confirmation email has been sent to your email address",
    bookingDetails: "Booking Details",
    bookingId: "Booking ID",
    status: "Status",
    paid: "Paid",
    confirmed: "Confirmed",
    pending: "Pending",
    flightDetails: "Flight Details",
    passengers: "Passengers",
    adult: "adult(s)",
    child: "child(ren)",
    infant: "infant(s)",
    totalPaid: "Total Paid",
    downloadReceipt: "Download Receipt",
    backToHome: "Back to Home",
    viewBookings: "View My Bookings",
    loading: "Loading booking details...",
    error: "Error loading booking",
    nextSteps: "Next Steps",
    step1: "Check your email for the booking confirmation",
    step2: "Review your flight details and passenger information",
    step3: "Arrive at the airport at least 2 hours before departure",
    questions: "Questions?",
    contactUs: "Contact our support team for any assistance",
    processingPayment: "Processing your payment...",
    paymentPending: "Payment is being processed. Please wait.",
  },
  pt: {
    success: "Reserva Confirmada!",
    thankYou: "Obrigado por reservar com a Michel's Travel",
    confirmationSent: "Um email de confirmação foi enviado para seu endereço de email",
    bookingDetails: "Detalhes da Reserva",
    bookingId: "ID da Reserva",
    status: "Status",
    paid: "Pago",
    confirmed: "Confirmado",
    pending: "Pendente",
    flightDetails: "Detalhes do Voo",
    passengers: "Passageiros",
    adult: "adulto(s)",
    child: "criança(s)",
    infant: "bebê(s)",
    totalPaid: "Total Pago",
    downloadReceipt: "Baixar Recibo",
    backToHome: "Voltar ao Início",
    viewBookings: "Ver Minhas Reservas",
    loading: "Carregando detalhes da reserva...",
    error: "Erro ao carregar reserva",
    nextSteps: "Próximos Passos",
    step1: "Verifique seu email para a confirmação da reserva",
    step2: "Revise os detalhes do voo e informações dos passageiros",
    step3: "Chegue ao aeroporto pelo menos 2 horas antes da partida",
    questions: "Dúvidas?",
    contactUs: "Entre em contato com nossa equipe de suporte",
    processingPayment: "Processando seu pagamento...",
    paymentPending: "O pagamento está sendo processado. Por favor, aguarde.",
  },
  es: {
    success: "¡Reserva Confirmada!",
    thankYou: "Gracias por reservar con Michel's Travel",
    confirmationSent: "Se ha enviado un correo de confirmación a su dirección de email",
    bookingDetails: "Detalles de la Reserva",
    bookingId: "ID de Reserva",
    status: "Estado",
    paid: "Pagado",
    confirmed: "Confirmado",
    pending: "Pendiente",
    flightDetails: "Detalles del Vuelo",
    passengers: "Pasajeros",
    adult: "adulto(s)",
    child: "niño(s)",
    infant: "bebé(s)",
    totalPaid: "Total Pagado",
    downloadReceipt: "Descargar Recibo",
    backToHome: "Volver al Inicio",
    viewBookings: "Ver Mis Reservas",
    loading: "Cargando detalles de la reserva...",
    error: "Error al cargar la reserva",
    nextSteps: "Próximos Pasos",
    step1: "Revise su correo para la confirmación de la reserva",
    step2: "Revise los detalles del vuelo e información de pasajeros",
    step3: "Llegue al aeropuerto al menos 2 horas antes de la salida",
    questions: "¿Preguntas?",
    contactUs: "Contacte a nuestro equipo de soporte",
    processingPayment: "Procesando su pago...",
    paymentPending: "El pago está siendo procesado. Por favor espere.",
  },
};

export default function BookingSuccess() {
  const { language } = useLanguage();
  const t = translations[language];
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const bookingIdParam = params.get("booking_id");
  const bookingId = bookingIdParam ? parseInt(bookingIdParam) : null;

  const { data, isLoading, error, refetch } = trpc.bookings.verifyPayment.useQuery(
    { bookingId: bookingId! },
    { 
      enabled: !!bookingId,
      refetchInterval: (query) => {
        // Keep polling if payment is still pending
        const status = query.state.data?.status;
        if (status === "pending" || status === "OPEN") {
          return 3000; // Poll every 3 seconds
        }
        return false;
      },
    }
  );

  // Show loading while checking payment
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !data || !bookingId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">{t.error}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              {t.backToHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const booking = data.booking;
  const isPaid = data.status === "paid" || data.status === "COMPLETED";
  const isPending = data.status === "pending" || data.status === "OPEN";

  // Show pending payment state
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">{t.processingPayment}</h2>
          <p className="text-muted-foreground mb-6">{t.paymentPending}</p>
          <Button onClick={() => refetch()} variant="outline">
            {language === "en" && "Check Status"}
            {language === "pt" && "Verificar Status"}
            {language === "es" && "Verificar Estado"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2">{t.success}</h1>
            <p className="text-lg text-muted-foreground">{t.thankYou}</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-green-700">
              <Mail className="h-4 w-4" />
              <p className="text-sm">{t.confirmationSent}</p>
            </div>
          </div>

          {/* Booking Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t.bookingDetails}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.bookingId}</p>
                  <p className="font-mono font-bold text-lg">#{booking.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.status}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <CheckCircle className="h-3 w-3" />
                    {isPaid ? t.paid : t.confirmed}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flight Details Card */}
          <Card className="mb-6">
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
                      {booking.originName || booking.origin} → {booking.destinationName || booking.destination}
                    </p>
                    <p className="text-muted-foreground">{booking.travelClass}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "en" && "Departure"}
                        {language === "pt" && "Partida"}
                        {language === "es" && "Salida"}
                      </p>
                      <p className="font-medium">{booking.departureDate}</p>
                    </div>
                  </div>
                  {booking.returnDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === "en" && "Return"}
                          {language === "pt" && "Retorno"}
                          {language === "es" && "Regreso"}
                        </p>
                        <p className="font-medium">{booking.returnDate}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p>
                    {booking.adults} {t.adult}
                    {booking.children && booking.children > 0 && `, ${booking.children} ${t.child}`}
                    {booking.infants && booking.infants > 0 && `, ${booking.infants} ${t.infant}`}
                  </p>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-medium">{t.totalPaid}</span>
                  <span className="text-2xl font-bold text-primary">
                    ${(booking.totalAmount / 100).toFixed(2)} {booking.currency}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t.nextSteps}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <p>{t.step1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <p>{t.step2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <p>{t.step3}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Card */}
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="font-medium text-blue-800">{t.questions}</p>
                <p className="text-sm text-blue-700">{t.contactUs}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/my-bookings")} variant="outline">
              {t.viewBookings}
            </Button>
            <Button onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />
              {t.backToHome}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
