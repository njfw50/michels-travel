import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Plane, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  type: string;
  label: string;
}

interface AirportSearchProps {
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder: string;
  className?: string;
}

export function AirportSearch({ value, onChange, placeholder, className }: AirportSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: airports, isLoading } = trpc.flights.searchLocations.useQuery(
    { keyword: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setQuery("");
    setIsOpen(false);
  };

  const displayValue = value ? `${value.city} (${value.code})` : query;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2 || (airports && airports.length > 0)) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 h-12 text-base"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && airports && airports.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-auto">
          {airports.map((airport) => (
            <button
              key={airport.code}
              type="button"
              onClick={() => handleSelect(airport)}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3 border-b last:border-b-0"
            >
              <MapPin className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {airport.city} ({airport.code})
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {airport.name}, {airport.country}
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {airport.type === "AIRPORT" ? "Airport" : "City"}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && debouncedQuery.length >= 2 && !isLoading && (!airports || airports.length === 0) && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center text-muted-foreground text-sm">
          No airports found
        </div>
      )}
    </div>
  );
}
