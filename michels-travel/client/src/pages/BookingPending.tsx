import { useLocation, useSearch } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Home, CreditCard, RefreshCw } from "lucide-react";

const translations = {
  en: {
    pending: "Payment in Progress",
    pendingDesc: "Please complete your payment in the new tab that opened",
    instructions: "If the payment window didn't open, click the button below to try again",
    retryPayment: "Retry Payment",
    backToHome: "Back to Home",
    checkStatus: "Check Payment Status",
    tip: "Once your payment is complete, you'll receive a confirmation email",
  },
  pt: {
    pending: "Pagamento em Andamento",
    pendingDesc: "Por favor, complete seu pagamento na nova aba que foi aberta",
    instructions: "Se a janela de pagamento não abriu, clique no botão abaixo para tentar novamente",
    retryPayment: "Tentar Novamente",
    backToHome: "Voltar ao Início",
    checkStatus: "Verificar Status do Pagamento",
    tip: "Assim que seu pagamento for concluído, você receberá um email de confirmação",
  },
  es: {
    pending: "Pago en Progreso",
    pendingDesc: "Por favor, complete su pago en la nueva pestaña que se abrió",
    instructions: "Si la ventana de pago no se abrió, haga clic en el botón de abajo para intentar de nuevo",
    retryPayment: "Reintentar Pago",
    backToHome: "Volver al Inicio",
    checkStatus: "Verificar Estado del Pago",
    tip: "Una vez que su pago esté completo, recibirá un correo de confirmación",
  },
};

export default function BookingPending() {
  const { language } = useLanguage();
  const t = translations[language];
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const bookingId = params.get("booking_id");

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-yellow-800">{t.pending}</CardTitle>
          <CardDescription>{t.pendingDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">{t.instructions}</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center">{t.tip}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.checkStatus}
            </Button>
            <Button onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />
              {t.backToHome}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
