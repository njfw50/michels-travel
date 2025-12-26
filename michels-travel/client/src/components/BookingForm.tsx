import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { SearchParams } from "./FlightSearch";

interface Flight {
  id: string;
  price: { total: string; currency: string };
  validatingAirline: string;
  cabinClass: string;
}

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  type: "booking" | "quote";
  flight?: Flight | null;
  searchParams?: SearchParams | null;
}

export function BookingForm({ open, onClose, type, flight, searchParams }: BookingFormProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit request");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createLead.mutate({
      name,
      email,
      phone: phone || undefined,
      type,
      origin: searchParams?.origin,
      originName: searchParams?.originName,
      destination: searchParams?.destination,
      destinationName: searchParams?.destinationName,
      departureDate: searchParams?.departureDate,
      returnDate: searchParams?.returnDate,
      adults: searchParams?.adults,
      children: searchParams?.children,
      infants: searchParams?.infants,
      travelClass: searchParams?.travelClass,
      flightDetails: flight ? {
        id: flight.id,
        airline: flight.validatingAirline,
        cabinClass: flight.cabinClass,
      } : undefined,
      estimatedPrice: flight?.price.total,
      message: message || undefined,
      preferredLanguage: language,
    });
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {t("booking.success")}
            </h3>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {type === "booking" ? t("booking.title") : t("booking.quote")}
          </DialogTitle>
          <DialogDescription>
            {flight && searchParams && (
              <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium text-foreground">
                  {searchParams.originName} → {searchParams.destinationName}
                </div>
                <div className="text-muted-foreground">
                  {searchParams.departureDate}
                  {searchParams.returnDate && ` - ${searchParams.returnDate}`}
                </div>
                <div className="text-muted-foreground">
                  {flight.validatingAirline} • {flight.cabinClass}
                </div>
                <div className="font-semibold text-primary mt-1">
                  ${parseFloat(flight.price.total).toLocaleString()} {flight.price.currency}
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("booking.name")} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("booking.email")} *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("booking.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("booking.message")}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any special requests or questions..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createLead.isPending}
          >
            {createLead.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              t("booking.submit")
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
