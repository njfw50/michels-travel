import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface Filters {
  stops: number[];
  airlines: string[];
  maxPrice: number;
  maxDuration: number;
  departureTime: [number, number];
}

interface FlightFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  availableAirlines: { code: string; name: string }[];
  priceRange: { min: number; max: number };
  durationRange: { min: number; max: number };
}

export function FlightFilters({
  filters,
  onChange,
  availableAirlines,
  priceRange,
  durationRange,
}: FlightFiltersProps) {
  const { t } = useLanguage();

  const toggleStop = (stop: number) => {
    const newStops = filters.stops.includes(stop)
      ? filters.stops.filter((s) => s !== stop)
      : [...filters.stops, stop];
    onChange({ ...filters, stops: newStops });
  };

  const toggleAirline = (code: string) => {
    const newAirlines = filters.airlines.includes(code)
      ? filters.airlines.filter((a) => a !== code)
      : [...filters.airlines, code];
    onChange({ ...filters, airlines: newAirlines });
  };

  const clearFilters = () => {
    onChange({
      stops: [],
      airlines: [],
      maxPrice: priceRange.max,
      maxDuration: durationRange.max,
      departureTime: [0, 24],
    });
  };

  const hasActiveFilters =
    filters.stops.length > 0 ||
    filters.airlines.length > 0 ||
    filters.maxPrice < priceRange.max ||
    filters.maxDuration < durationRange.max ||
    filters.departureTime[0] > 0 ||
    filters.departureTime[1] < 24;

  const formatTime = (hour: number) => {
    if (hour === 0) return "12:00 AM";
    if (hour === 12) return "12:00 PM";
    if (hour === 24) return "11:59 PM";
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className="p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">{t("filter.title")}</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            <X className="h-3 w-3 mr-1" />
            {t("filter.clear")}
          </Button>
        )}
      </div>

      {/* Stops Filter */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-sm">{t("filter.stops")}</h4>
        <div className="space-y-2">
          {[
            { value: 0, label: t("filter.direct") },
            { value: 1, label: t("filter.oneStop") },
            { value: 2, label: t("filter.twoPlus") },
          ].map((stop) => (
            <label
              key={stop.value}
              className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
            >
              <Checkbox
                checked={filters.stops.includes(stop.value)}
                onCheckedChange={() => toggleStop(stop.value)}
              />
              <span className="text-sm">{stop.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Price Filter */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{t("filter.price")}</h4>
          <span className="text-sm text-muted-foreground">
            Up to ${filters.maxPrice.toLocaleString()}
          </span>
        </div>
        <Slider
          value={[filters.maxPrice]}
          min={priceRange.min}
          max={priceRange.max}
          step={50}
          onValueChange={([value]) => onChange({ ...filters, maxPrice: value })}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${priceRange.min}</span>
          <span>${priceRange.max}</span>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Duration Filter */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{t("filter.duration")}</h4>
          <span className="text-sm text-muted-foreground">
            Up to {formatDuration(filters.maxDuration)}
          </span>
        </div>
        <Slider
          value={[filters.maxDuration]}
          min={durationRange.min}
          max={durationRange.max}
          step={30}
          onValueChange={([value]) => onChange({ ...filters, maxDuration: value })}
          className="mt-2"
        />
      </div>

      <Separator className="my-4" />

      {/* Departure Time Filter */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{t("filter.departure")}</h4>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          {formatTime(filters.departureTime[0])} - {formatTime(filters.departureTime[1])}
        </div>
        <Slider
          value={filters.departureTime}
          min={0}
          max={24}
          step={1}
          onValueChange={(value) =>
            onChange({ ...filters, departureTime: value as [number, number] })
          }
          className="mt-2"
        />
      </div>

      <Separator className="my-4" />

      {/* Airlines Filter */}
      {availableAirlines.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{t("filter.airlines")}</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableAirlines.map((airline) => (
              <label
                key={airline.code}
                className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
              >
                <Checkbox
                  checked={filters.airlines.includes(airline.code)}
                  onCheckedChange={() => toggleAirline(airline.code)}
                />
                <span className="text-sm truncate">{airline.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
