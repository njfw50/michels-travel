import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AirportSearch } from "./AirportSearch";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Users, ArrowRightLeft, Search, Minus, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  type: string;
  label: string;
}

interface FlightSearchProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export interface SearchParams {
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  tripType: "roundTrip" | "oneWay";
}

export function FlightSearch({ onSearch, isLoading }: FlightSearchProps) {
  const { t } = useLanguage();
  const [tripType, setTripType] = useState<"roundTrip" | "oneWay">("roundTrip");
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelClass, setTravelClass] = useState<"ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST">("ECONOMY");
  const [passengersOpen, setPassengersOpen] = useState(false);

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    if (!origin || !destination || !departureDate) return;

    onSearch({
      origin: origin.code,
      originName: `${origin.city} (${origin.code})`,
      destination: destination.code,
      destinationName: `${destination.city} (${destination.code})`,
      departureDate: format(departureDate, "yyyy-MM-dd"),
      returnDate: tripType === "roundTrip" && returnDate ? format(returnDate, "yyyy-MM-dd") : undefined,
      adults,
      children,
      infants,
      travelClass,
      tripType,
    });
  };

  const totalPassengers = adults + children + infants;

  const classLabels = {
    ECONOMY: t("search.economy"),
    PREMIUM_ECONOMY: t("search.premiumEconomy"),
    BUSINESS: t("search.business"),
    FIRST: t("search.first"),
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
      {/* Trip Type Tabs */}
      <Tabs value={tripType} onValueChange={(v) => setTripType(v as "roundTrip" | "oneWay")} className="mb-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="roundTrip">{t("search.roundTrip")}</TabsTrigger>
          <TabsTrigger value="oneWay">{t("search.oneWay")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {/* Origin and Destination */}
        <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
          <AirportSearch
            value={origin}
            onChange={setOrigin}
            placeholder={t("search.from")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 hidden md:flex"
            onClick={swapLocations}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          <AirportSearch
            value={destination}
            onChange={setDestination}
            placeholder={t("search.to")}
          />
        </div>

        {/* Dates, Passengers, Class */}
        <div className="grid md:grid-cols-4 gap-4">
          {/* Departure Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 justify-start text-left font-normal",
                  !departureDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {departureDate ? format(departureDate, "MMM dd, yyyy") : t("search.departure")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={departureDate}
                onSelect={setDepartureDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Return Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 justify-start text-left font-normal",
                  !returnDate && "text-muted-foreground",
                  tripType === "oneWay" && "opacity-50"
                )}
                disabled={tripType === "oneWay"}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {returnDate ? format(returnDate, "MMM dd, yyyy") : t("search.return")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={returnDate}
                onSelect={setReturnDate}
                disabled={(date) => date < (departureDate || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Passengers */}
          <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 justify-start">
                <Users className="mr-2 h-4 w-4" />
                {totalPassengers} {t("search.passengers")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t("search.adults")}</div>
                    <div className="text-xs text-muted-foreground">{t("common.adult")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{adults}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAdults(Math.min(9, adults + 1))}
                      disabled={adults >= 9}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t("search.children")}</div>
                    <div className="text-xs text-muted-foreground">{t("common.child")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{children}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setChildren(Math.min(9, children + 1))}
                      disabled={children >= 9}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t("search.infants")}</div>
                    <div className="text-xs text-muted-foreground">{t("common.infant")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setInfants(Math.max(0, infants - 1))}
                      disabled={infants <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{infants}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setInfants(Math.min(adults, infants + 1))}
                      disabled={infants >= adults}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  * Infants must be accompanied by an adult
                </p>
              </div>
            </PopoverContent>
          </Popover>

          {/* Travel Class */}
          <Select value={travelClass} onValueChange={(v) => setTravelClass(v as typeof travelClass)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder={t("search.class")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ECONOMY">{t("search.economy")}</SelectItem>
              <SelectItem value="PREMIUM_ECONOMY">{t("search.premiumEconomy")}</SelectItem>
              <SelectItem value="BUSINESS">{t("search.business")}</SelectItem>
              <SelectItem value="FIRST">{t("search.first")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <Button
          size="lg"
          className="w-full md:w-auto md:ml-auto h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          onClick={handleSearch}
          disabled={!origin || !destination || !departureDate || isLoading}
        >
          {isLoading ? (
            <>
              <Search className="mr-2 h-5 w-5 animate-pulse" />
              {t("search.searching")}
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              {t("search.button")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
