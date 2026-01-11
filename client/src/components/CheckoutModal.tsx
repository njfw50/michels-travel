import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowLeft, ArrowRight, CreditCard, User, FileText } from "lucide-react";
import { SearchParams } from "./FlightSearch";
// Square Payment Links - no client-side SDK needed

interface Flight {
  id: string;
  price: { total: string; currency: string };
  validatingAirline: string;
  cabinClass: string;
  outbound?: any;
  inbound?: any;
}

interface Passenger {
  type: "adult" | "child" | "infant";
  given_name: string;
  family_name: string;
  born_on?: string; // YYYY-MM-DD
  gender?: "m" | "f";
  title?: "mr" | "ms" | "mrs" | "miss";
  email?: string;
  phone_number?: string;
  // Additional fields for customer database
  nationality?: string; // ISO country code (e.g., "US", "BR")
  country_of_residence?: string; // ISO country code
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  special_requests?: string; // Dietary, accessibility, etc.
  identity_documents?: Array<{
    type: "passport" | "identity_card" | "driving_licence";
    unique_identifier?: string;
    issuing_country_code?: string;
    expires_on?: string;
  }>;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  flight: Flight | null;
  searchParams: SearchParams | null;
  onRequestQuote?: () => void; // Callback to open Request Quote modal
}

type CheckoutStep = "review" | "passengers" | "payment" | "confirmation";

export function CheckoutModal({ open, onClose, flight, searchParams, onRequestQuote }: CheckoutModalProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<CheckoutStep>("review");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  // Initialize passengers based on search params
  const initializePassengers = () => {
    if (!searchParams) return [];
    const p: Passenger[] = [];
    for (let i = 0; i < (searchParams.adults || 1); i++) {
      p.push({
        type: "adult",
        given_name: "",
        family_name: "",
      });
    }
    for (let i = 0; i < (searchParams.children || 0); i++) {
      p.push({
        type: "child",
        given_name: "",
        family_name: "",
      });
    }
    for (let i = 0; i < (searchParams.infants || 0); i++) {
      p.push({
        type: "infant",
        given_name: "",
        family_name: "",
      });
    }
    return p;
  };

  // Create payment link mutation (Square)
  const createPaymentIntent = trpc.checkout.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      setOrderId(data.orderId);
      setPaymentIntentId(data.paymentIntentId);
      setClientSecret(data.clientSecret); // This is now the payment link URL
      // Redirect to Square payment link immediately after creation
      if (data.clientSecret) {
        // Redirect to Square payment page
        window.location.href = data.clientSecret;
      } else {
        toast.error("Payment link not available");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initialize payment");
      // Stay on passengers step if error occurs
      setStep("passengers");
    },
  });

  // Create order mutation
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      setStep("confirmation");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create order");
    },
  });

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleStartCheckout = () => {
    if (!flight || !searchParams) {
      toast.error("Flight or search parameters missing");
      return;
    }

    // Validate email before proceeding
    const trimmedEmail = customerEmail.trim();
    if (!trimmedEmail) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");

    // Initialize passengers and go to passenger data collection step
    const totalPassengers = (searchParams.adults || 1) + (searchParams.children || 0) + (searchParams.infants || 0);
    const p = initializePassengers();
    setPassengers(p);
    setCurrentPassengerIndex(0);
    
    // Go to passengers step to collect data
    setStep("passengers");
  };

  const handlePassengerNext = () => {
    // Validate current passenger before proceeding
    const currentPassenger = passengers[currentPassengerIndex];
    
    // Required validations
    if (!currentPassenger.given_name?.trim()) {
      toast.error("First name is required for this passenger");
      return;
    }
    
    if (!currentPassenger.family_name?.trim()) {
      toast.error("Last name is required for this passenger");
      return;
    }
    
    if (!currentPassenger.born_on) {
      toast.error("Date of birth is required for ticket issuance");
      return;
    }
    
    if (!currentPassenger.phone_number?.trim()) {
      toast.error("Phone number is required for this passenger");
      return;
    }
    
    // Validate date of birth makes sense
    if (currentPassenger.born_on) {
      const birthDate = new Date(currentPassenger.born_on);
      const today = new Date();
      if (birthDate > today) {
        toast.error("Date of birth cannot be in the future");
        return;
      }
      
      // Validate age matches passenger type
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      if (currentPassenger.type === "adult" && actualAge < 18) {
        toast.error("Adult passengers must be 18 years or older");
        return;
      }
      if (currentPassenger.type === "child" && (actualAge < 2 || actualAge >= 18)) {
        toast.error("Child passengers must be between 2 and 17 years old");
        return;
      }
      if (currentPassenger.type === "infant" && actualAge >= 2) {
        toast.error("Infant passengers must be under 2 years old");
        return;
      }
    }
    
    // Gender required for children and infants
    if (currentPassenger.type !== "adult" && !currentPassenger.gender) {
      toast.error("Gender is required for children and infants");
      return;
    }
    
    // Validate email format if provided
    if (currentPassenger.email && !validateEmail(currentPassenger.email)) {
      toast.error("Please enter a valid email address for this passenger");
      return;
    }
    
    // Validate phone number format (basic)
    if (currentPassenger.phone_number && currentPassenger.phone_number.trim().length < 10) {
      toast.error("Please enter a valid phone number with country code");
      return;
    }

    if (currentPassengerIndex < passengers.length - 1) {
      // Move to next passenger
      setCurrentPassengerIndex(currentPassengerIndex + 1);
    } else {
      // All passengers filled, validate all and proceed to create payment link
      const allPassengersValid = passengers.every(
        (p) => 
          p.given_name?.trim() && 
          p.family_name?.trim() &&
          p.born_on &&
          p.phone_number?.trim() &&
          (p.type === "adult" || p.gender)
      );

      if (!allPassengersValid) {
        toast.error("Please fill in all required passenger information");
        return;
      }

      // All passengers validated, create payment link
      createPaymentLinkWithPassengers();
    }
  };

  // Create payment link after all passengers are collected
  const createPaymentLinkWithPassengers = () => {
    if (!flight || !searchParams) {
      toast.error("Flight or search parameters missing");
      return;
    }

    const trimmedEmail = customerEmail.trim();
    const totalPassengers = (searchParams.adults || 1) + (searchParams.children || 0) + (searchParams.infants || 0);

    // Validate all passengers have required fields
    const validPassengers = passengers.filter(
      (p) => 
        p.given_name?.trim() && 
        p.family_name?.trim() &&
        p.born_on &&
        p.phone_number?.trim() &&
        (p.type === "adult" || p.gender)
    );

    if (validPassengers.length !== totalPassengers) {
      toast.error("Please fill in all required passenger information");
      return;
    }

    // Create payment link with validated email and passenger data (Square)
    createPaymentIntent.mutate({
      offerId: flight.id,
      amount: Math.round(parseFloat(flight.price.total) * 100), // Convert to cents
      currency: flight.price.currency || "USD",
      customerEmail: trimmedEmail,
      customerName: validPassengers[0]?.given_name + " " + validPassengers[0]?.family_name,
      flightDetails: {
        ...flight,
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate,
        cabinClass: flight.cabinClass,
      },
      passengerCount: totalPassengers,
      passengers: validPassengers.map((p) => ({
        type: p.type,
        given_name: p.given_name.trim(),
        family_name: p.family_name.trim(),
        ...(p.born_on && { born_on: p.born_on }),
        ...(p.gender && { gender: p.gender }),
        ...(p.title && { title: p.title }),
        ...(p.email && { email: p.email.trim() }),
        ...(p.phone_number && { phone_number: p.phone_number.trim() }),
        ...(p.nationality && { nationality: p.nationality }),
        ...(p.country_of_residence && { country_of_residence: p.country_of_residence }),
        ...(p.address && Object.keys(p.address).length > 0 && { address: p.address }),
        ...(p.emergency_contact && Object.keys(p.emergency_contact).length > 0 && { emergency_contact: p.emergency_contact }),
        ...(p.special_requests && { special_requests: p.special_requests }),
        ...(p.identity_documents && p.identity_documents.length > 0 && {
          identity_documents: p.identity_documents,
        }),
      })),
    });
  };

  const handlePassengerBack = () => {
    if (currentPassengerIndex > 0) {
      setCurrentPassengerIndex(currentPassengerIndex - 1);
    } else {
      setStep("review");
    }
  };

  const updatePassenger = (field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[currentPassengerIndex] = {
      ...updated[currentPassengerIndex],
      [field]: value,
    };
    setPassengers(updated);
  };

  // Note: Payment is handled via Square redirect after payment link creation
  // Order creation happens automatically in CheckoutComplete page after payment verification

  const handleClose = () => {
    setStep("review");
    setOrderId(null);
    setPaymentIntentId(null);
    setClientSecret(null);
    setPassengers([]);
    setCurrentPassengerIndex(0);
    setCustomerEmail("");
    setEmailError("");
    onClose();
  };

  if (!flight || !searchParams) {
    return null;
  }

  const currentPassenger = passengers[currentPassengerIndex];
  const totalAmount = parseFloat(flight.price.total);
  const isLastPassenger = currentPassengerIndex === passengers.length - 1;

  // Show loading state if creating payment link
  if (createPaymentIntent.isPending && step === "passengers") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Creating Payment Link...</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Please wait while we prepare your payment...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "review" && "Review Your Flight"}
            {step === "passengers" && `Passenger ${currentPassengerIndex + 1} of ${passengers.length}`}
            {step === "payment" && "Payment"}
            {step === "confirmation" && "Order Confirmed"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {step === "review" && "Review flight details before checkout"}
            {step === "passengers" && "Enter passenger information"}
            {step === "payment" && "Complete payment"}
            {step === "confirmation" && "Your order has been confirmed"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Review */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-medium text-lg mb-2">
                {searchParams.originName} → {searchParams.destinationName}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Departure: {searchParams.departureDate}</div>
                {searchParams.returnDate && <div>Return: {searchParams.returnDate}</div>}
                <div>
                  {searchParams.adults || 1} Adult(s)
                  {searchParams.children ? `, ${searchParams.children} Child(ren)` : ""}
                  {searchParams.infants ? `, ${searchParams.infants} Infant(s)` : ""}
                </div>
                <div className="font-semibold text-primary text-lg mt-2">
                  ${totalAmount.toLocaleString()} {flight.price.currency}
                </div>
              </div>
            </div>

            {/* Email input for contact */}
            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Contact Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomerEmail(value);
                  // Clear error when user starts typing
                  if (emailError) {
                    setEmailError("");
                  }
                }}
                onBlur={(e) => {
                  const trimmed = e.target.value.trim();
                  if (trimmed && !validateEmail(trimmed)) {
                    setEmailError("Please enter a valid email address");
                  } else {
                    setEmailError("");
                  }
                }}
                placeholder="your.email@example.com"
                className={emailError ? "border-destructive" : ""}
                required
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                We'll send your booking confirmation to this email address.
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleStartCheckout} 
                className="flex-1" 
                disabled={createPaymentIntent.isPending || !customerEmail.trim() || !!emailError}
              >
                {createPaymentIntent.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue to Checkout"
                )}
              </Button>
            </div>

            {onRequestQuote && (
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    handleClose();
                    onRequestQuote();
                  }}
                >
                  Request Quote instead
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Passengers */}
        {step === "passengers" && (
          currentPassenger ? (
            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    Passenger {currentPassengerIndex + 1} of {passengers.length} ({currentPassenger.type})
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(((currentPassengerIndex + 1) / passengers.length) * 100)}% Complete
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Basic Information</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title {currentPassenger.type === "adult" && <span className="text-destructive">*</span>}
                    </Label>
                    <select
                      id="title"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={currentPassenger.title || ""}
                      onChange={(e) => updatePassenger("title", e.target.value as "mr" | "ms" | "mrs" | "miss" | undefined)}
                      required={currentPassenger.type === "adult"}
                    >
                      <option value="">Select...</option>
                      <option value="mr">Mr</option>
                      <option value="mrs">Mrs</option>
                      <option value="ms">Ms</option>
                      <option value="miss">Miss</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Gender {currentPassenger.type !== "adult" && <span className="text-destructive">*</span>}
                    </Label>
                    <select
                      id="gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={currentPassenger.gender || ""}
                      onChange={(e) => updatePassenger("gender", e.target.value as "m" | "f" | undefined)}
                      required={currentPassenger.type !== "adult"}
                    >
                      <option value="">Select...</option>
                      <option value="m">Male</option>
                      <option value="f">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="given_name">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="given_name"
                      value={currentPassenger.given_name}
                      onChange={(e) => updatePassenger("given_name", e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family_name">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="family_name"
                      value={currentPassenger.family_name}
                      onChange={(e) => updatePassenger("family_name", e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="born_on">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="born_on"
                      type="date"
                      value={currentPassenger.born_on || ""}
                      onChange={(e) => updatePassenger("born_on", e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for ticket issuance
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={currentPassenger.nationality || ""}
                      onChange={(e) => updatePassenger("nationality", e.target.value.toUpperCase())}
                      placeholder="US, BR, etc."
                      maxLength={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      ISO country code (2 letters)
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Contact Information</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={currentPassenger.email || ""}
                      onChange={(e) => updatePassenger("email", e.target.value)}
                      placeholder="passenger@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      For flight updates and e-ticket
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={currentPassenger.phone_number || ""}
                      onChange={(e) => updatePassenger("phone_number", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country_of_residence">Country of Residence</Label>
                  <Input
                    id="country_of_residence"
                    value={currentPassenger.country_of_residence || ""}
                    onChange={(e) => updatePassenger("country_of_residence", e.target.value.toUpperCase())}
                    placeholder="US, BR, etc."
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Address Section (for customer database) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Address (Optional - for records)</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_street">Street Address</Label>
                  <Input
                    id="address_street"
                    value={currentPassenger.address?.street || ""}
                    onChange={(e) => updatePassenger("address", {
                      ...currentPassenger.address,
                      street: e.target.value,
                    })}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_city">City</Label>
                    <Input
                      id="address_city"
                      value={currentPassenger.address?.city || ""}
                      onChange={(e) => updatePassenger("address", {
                        ...currentPassenger.address,
                        city: e.target.value,
                      })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_state">State/Province</Label>
                    <Input
                      id="address_state"
                      value={currentPassenger.address?.state || ""}
                      onChange={(e) => updatePassenger("address", {
                        ...currentPassenger.address,
                        state: e.target.value,
                      })}
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_postal">Postal Code</Label>
                    <Input
                      id="address_postal"
                      value={currentPassenger.address?.postal_code || ""}
                      onChange={(e) => updatePassenger("address", {
                        ...currentPassenger.address,
                        postal_code: e.target.value,
                      })}
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_country">Country</Label>
                  <Input
                    id="address_country"
                    value={currentPassenger.address?.country || ""}
                    onChange={(e) => updatePassenger("address", {
                      ...currentPassenger.address,
                      country: e.target.value,
                    })}
                    placeholder="United States"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Emergency Contact (Optional)</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_name">Contact Name</Label>
                    <Input
                      id="emergency_name"
                      value={currentPassenger.emergency_contact?.name || ""}
                      onChange={(e) => updatePassenger("emergency_contact", {
                        ...currentPassenger.emergency_contact,
                        name: e.target.value,
                      })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Contact Phone</Label>
                    <Input
                      id="emergency_phone"
                      type="tel"
                      value={currentPassenger.emergency_contact?.phone || ""}
                      onChange={(e) => updatePassenger("emergency_contact", {
                        ...currentPassenger.emergency_contact,
                        phone: e.target.value,
                      })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_relationship">Relationship</Label>
                  <Input
                    id="emergency_relationship"
                    value={currentPassenger.emergency_contact?.relationship || ""}
                    onChange={(e) => updatePassenger("emergency_contact", {
                      ...currentPassenger.emergency_contact,
                      relationship: e.target.value,
                    })}
                    placeholder="Spouse, Parent, etc."
                  />
                </div>
              </div>

              {/* Special Requests Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Special Requests (Optional)</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_requests">Dietary, Accessibility, or Other Needs</Label>
                  <Textarea
                    id="special_requests"
                    className="min-h-[80px]"
                    value={currentPassenger.special_requests || ""}
                    onChange={(e) => updatePassenger("special_requests", e.target.value)}
                    placeholder="e.g., Vegetarian meal, wheelchair assistance, etc."
                    rows={3}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                <Button variant="outline" onClick={handlePassengerBack} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handlePassengerNext}
                  className="flex-1"
                  disabled={
                    !currentPassenger?.given_name?.trim() || 
                    !currentPassenger?.family_name?.trim() || 
                    !currentPassenger?.born_on ||
                    !currentPassenger?.phone_number?.trim() ||
                    (currentPassenger.type !== "adult" && !currentPassenger?.gender) ||
                    createPaymentIntent.isPending
                  }
                >
                  {createPaymentIntent.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Payment Link...
                    </>
                  ) : isLastPassenger ? (
                    <>
                      Continue to Payment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next Passenger
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading passenger information...</p>
            </div>
          )
        )}

        {/* Step 3: Payment (Redirecting) */}
        {step === "payment" && (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Redirecting to Payment...</h3>
              <p className="text-muted-foreground">
                You will be redirected to Square to complete your payment securely.
                <br />
                Please do not close this window.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === "confirmation" && (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Order Confirmed!</h3>
              <p className="text-muted-foreground">
                Your flight booking has been confirmed. You will receive a confirmation email shortly.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

