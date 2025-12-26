import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { FlightSearch, SearchParams } from "@/components/FlightSearch";
import { FlightCard } from "@/components/FlightCard";
import { FlightFilters } from "@/components/FlightFilters";
import { BookingForm } from "@/components/BookingForm";
import { TravelChatbot } from "@/components/TravelChatbot";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plane,
  Globe,
  Shield,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Star,
  Briefcase,
  HeadphonesIcon,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Link } from "wouter";

interface Flight {
  id: string;
  price: { total: string; currency: string; base: string };
  outbound: any;
  inbound: any;
  cabinClass: string;
  baggage?: any;
  validatingAirline: string;
  validatingAirlineCode: string;
  seatsAvailable: number;
  lastTicketingDate: string;
}

export default function Home() {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [bookingType, setBookingType] = useState<"booking" | "quote">("quote");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const [filters, setFilters] = useState({
    stops: [] as number[],
    airlines: [] as string[],
    maxPrice: 10000,
    maxDuration: 1440,
    departureTime: [0, 24] as [number, number],
  });

  const [sortBy, setSortBy] = useState<"price" | "duration" | "best">("best");

  const searchQuery = trpc.flights.search.useQuery(
    searchParams
      ? {
          origin: searchParams.origin,
          destination: searchParams.destination,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.returnDate,
          adults: searchParams.adults,
          children: searchParams.children,
          infants: searchParams.infants,
          travelClass: searchParams.travelClass,
        }
      : { origin: "", destination: "", departureDate: "", adults: 1 },
    { enabled: !!searchParams && showResults }
  );

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success(t("booking.success"));
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setShowResults(true);
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    setBookingType("quote");
    setBookingOpen(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate({
      name: contactName,
      email: contactEmail,
      message: contactMessage,
      type: "contact",
      preferredLanguage: language,
    });
  };

  const filteredFlights = searchQuery.data?.flights
    ?.filter((flight) => {
      if (filters.stops.length > 0) {
        const stops = flight.outbound.stops;
        const matchesStops = filters.stops.some((s) =>
          s === 2 ? stops >= 2 : stops === s
        );
        if (!matchesStops) return false;
      }
      if (filters.airlines.length > 0) {
        if (!filters.airlines.includes(flight.validatingAirlineCode)) return false;
      }
      if (parseFloat(flight.price.total) > filters.maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") {
        return parseFloat(a.price.total) - parseFloat(b.price.total);
      }
      return parseFloat(a.price.total) - parseFloat(b.price.total);
    });

  const availableAirlines = searchQuery.data?.flights
    ? Array.from(new Map(
        searchQuery.data.flights.map((f) => [
          f.validatingAirlineCode,
          { code: f.validatingAirlineCode, name: f.validatingAirline },
        ])
      ).values())
    : [];

  const priceRange = searchQuery.data?.flights
    ? {
        min: Math.floor(
          Math.min(...searchQuery.data.flights.map((f) => parseFloat(f.price.total)))
        ),
        max: Math.ceil(
          Math.max(...searchQuery.data.flights.map((f) => parseFloat(f.price.total)))
        ),
      }
    : { min: 0, max: 10000 };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Michel's Travel
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#search" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                {t("nav.flights")}
              </a>
              <a href="#about" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                {t("nav.about")}
              </a>
              <a href="#services" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                {t("nav.services")}
              </a>
              <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                {t("nav.contact")}
              </a>
            </div>

            <LanguageSelector />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-primary to-gray-900 bg-clip-text text-transparent leading-tight">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>

          <div id="search" className="max-w-5xl mx-auto">
            <FlightSearch onSearch={handleSearch} isLoading={searchQuery.isLoading} />
          </div>

          <div className="flex justify-center mt-12">
            <a
              href="#about"
              className="flex flex-col items-center gap-2 text-gray-400 hover:text-primary transition-colors"
            >
              <span className="text-sm">{t("nav.about")}</span>
              <ChevronDown className="h-5 w-5 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {showResults && (
        <section id="results" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            {searchQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-gray-600">{t("search.searching")}</p>
              </div>
            ) : searchQuery.error ? (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">{t("common.error")}</p>
                <p className="text-gray-600">{searchQuery.error.message}</p>
              </div>
            ) : filteredFlights && filteredFlights.length > 0 ? (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-72 flex-shrink-0">
                  <FlightFilters
                    filters={filters}
                    onChange={setFilters}
                    availableAirlines={availableAirlines}
                    priceRange={priceRange}
                    durationRange={{ min: 60, max: 1440 }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                      {filteredFlights.length} {t("results.found")}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{t("results.sortBy")}:</span>
                      <div className="flex gap-1">
                        {(["best", "price"] as const).map((sort) => (
                          <Button
                            key={sort}
                            variant={sortBy === sort ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSortBy(sort)}
                          >
                            {t(`results.${sort === "price" ? "cheapest" : sort}`)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredFlights.map((flight) => (
                      <FlightCard
                        key={flight.id}
                        flight={flight}
                        onSelect={handleSelectFlight}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {t("results.noResults")}
                </h3>
                <p className="text-gray-500">{t("results.tryAgain")}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  {t("about.title")}
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {t("about.description")}
                </p>
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-2 text-primary">
                    {t("about.mission")}
                  </h3>
                  <p className="text-gray-600">{t("about.missionText")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, value: "150+", label: "Destinations" },
                  { icon: Users, value: "50K+", label: "Happy Travelers" },
                  { icon: Star, value: "4.9", label: "Rating" },
                  { icon: Clock, value: "24/7", label: "Support" },
                ].map((stat, idx) => (
                  <Card key={idx} className="text-center p-6 hover:shadow-lg transition-shadow">
                    <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              {t("services.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Plane,
                title: t("services.flights"),
                description: t("services.flightsDesc"),
              },
              {
                icon: HeadphonesIcon,
                title: t("services.support"),
                description: t("services.supportDesc"),
              },
              {
                icon: Shield,
                title: t("services.custom"),
                description: t("services.customDesc"),
              },
              {
                icon: Briefcase,
                title: t("services.corporate"),
                description: t("services.corporateDesc"),
              },
            ].map((service, idx) => (
              <Card
                key={idx}
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                  {t("contact.title")}
                </h2>
                <p className="text-gray-600 mb-8">{t("contact.subtitle")}</p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">contact@michelstravel.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Address</div>
                      <div className="font-medium">123 Travel Street, Suite 100</div>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="p-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">{t("contact.form.name")}</Label>
                    <Input
                      id="contact-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">{t("contact.form.email")}</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">{t("contact.form.message")}</Label>
                    <Textarea
                      id="contact-message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createLead.isPending}
                  >
                    {createLead.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {t("contact.form.send")}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Plane className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl">Michel's Travel</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                {t("footer.privacy")}
              </a>
              <a href="#" className="hover:text-white transition-colors">
                {t("footer.terms")}
              </a>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} Michel's Travel. {t("footer.rights")}.
            </div>
          </div>
        </div>
      </footer>

      <BookingForm
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        type={bookingType}
        flight={selectedFlight}
        searchParams={searchParams}
      />

      <TravelChatbot />
    </div>
  );
}
