import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plane, Clock, Luggage, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FlightSegment {
  departure: { iataCode: string; at: string; terminal?: string };
  arrival: { iataCode: string; at: string; terminal?: string };
  carrier: string;
  carrierCode: string;
  flightNumber: string;
  duration: string;
  aircraft: string;
}

interface FlightLeg {
  departure: { iataCode: string; at: string; terminal?: string };
  arrival: { iataCode: string; at: string; terminal?: string };
  duration: string;
  stops: number;
  segments: FlightSegment[];
}

interface Flight {
  id: string;
  price: { total: string; currency: string; base: string };
  outbound: FlightLeg;
  inbound: FlightLeg | null;
  cabinClass: string;
  baggage?: { weight?: number; weightUnit?: string; quantity?: number };
  validatingAirline: string;
  validatingAirlineCode: string;
  seatsAvailable: number;
  lastTicketingDate: string;
}

interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  onBuyNow?: (flight: Flight) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FlightLegDisplay({ leg, label }: { leg: FlightLeg; label: string }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const getStopsText = (stops: number) => {
    if (stops === 0) return t("flight.direct");
    if (stops === 1) return `1 ${t("flight.stop")}`;
    return `${stops} ${t("flight.stops")}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
        <Plane className="h-3 w-3" />
        {label}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Departure */}
        <div className="text-center min-w-[60px]">
          <div className="text-xl font-bold">{formatTime(leg.departure.at)}</div>
          <div className="text-sm text-muted-foreground">{leg.departure.iataCode}</div>
        </div>

        {/* Flight Path */}
        <div className="flex-1 relative">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="flex-1 h-px bg-gradient-to-r from-primary via-primary/50 to-primary relative">
              {leg.stops > 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1">
                  {Array.from({ length: leg.stops }).map((_, i) => (
                    <div key={i} className="h-2 w-2 rounded-full bg-orange-400 border-2 border-white" />
                  ))}
                </div>
              )}
            </div>
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{formatDate(leg.departure.at)}</span>
            <span className={cn(
              "text-xs font-medium",
              leg.stops === 0 ? "text-green-600" : "text-orange-500"
            )}>
              {getStopsText(leg.stops)}
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(leg.arrival.at)}</span>
          </div>
        </div>

        {/* Arrival */}
        <div className="text-center min-w-[60px]">
          <div className="text-xl font-bold">{formatTime(leg.arrival.at)}</div>
          <div className="text-sm text-muted-foreground">{leg.arrival.iataCode}</div>
        </div>

        {/* Duration */}
        <div className="text-center min-w-[70px] pl-4 border-l">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {leg.duration}
          </div>
        </div>
      </div>

      {/* Expandable Segments */}
      {leg.segments.length > 1 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Hide details" : "Show flight details"}
        </button>
      )}

      {expanded && (
        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
          {leg.segments.map((segment, idx) => (
            <div key={idx} className="text-xs space-y-1 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {segment.flightNumber}
                </Badge>
                <span className="text-muted-foreground">{segment.carrier}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{formatTime(segment.departure.at)} {segment.departure.iataCode}</span>
                <span>→</span>
                <span>{formatTime(segment.arrival.at)} {segment.arrival.iataCode}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {segment.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlightCard({ flight, onSelect, onBuyNow }: FlightCardProps) {
  const { t } = useLanguage();

  const cabinLabels: Record<string, string> = {
    ECONOMY: t("search.economy"),
    PREMIUM_ECONOMY: t("search.premiumEconomy"),
    BUSINESS: t("search.business"),
    FIRST: t("search.first"),
  };

  const getBaggageText = () => {
    if (!flight.baggage) return null;
    if (flight.baggage.quantity) return `${flight.baggage.quantity} bag(s) ${t("flight.included")}`;
    if (flight.baggage.weight) return `${flight.baggage.weight}${flight.baggage.weightUnit} ${t("flight.included")}`;
    return null;
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-primary">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Flight Details */}
        <div className="flex-1 space-y-6">
          {/* Airline Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{flight.validatingAirlineCode}</span>
            </div>
            <div>
              <div className="font-medium">{flight.validatingAirline}</div>
              <div className="text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {cabinLabels[flight.cabinClass] || flight.cabinClass}
                </Badge>
              </div>
            </div>
          </div>

          {/* Outbound */}
          <FlightLegDisplay leg={flight.outbound} label={t("flight.outbound")} />

          {/* Inbound */}
          {flight.inbound && (
            <>
              <Separator />
              <FlightLegDisplay leg={flight.inbound} label={t("flight.inbound")} />
            </>
          )}

          {/* Baggage Info */}
          {getBaggageText() && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Luggage className="h-4 w-4" />
              {getBaggageText()}
            </div>
          )}
        </div>

        {/* Price and Action */}
        <div className="lg:w-48 flex flex-col items-center justify-center gap-4 lg:border-l lg:pl-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              ${parseFloat(flight.price.total).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">{t("flight.perPerson")}</div>
          </div>
          
          {flight.seatsAvailable <= 5 && (
            <Badge variant="destructive" className="text-xs">
              Only {flight.seatsAvailable} seats left
            </Badge>
          )}

          <div className="space-y-2 w-full">
            {onBuyNow && (
              <Button 
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                onClick={() => onBuyNow(flight)}
              >
                {t("results.buyNow")}
              </Button>
            )}
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => onSelect(flight)}
            >
              {t("results.requestQuote")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
