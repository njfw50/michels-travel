import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  User,
  Users,
  CreditCard,
  Settings,
  Bell,
  Plane,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  Loader2,
  Save,
  Award,
} from "lucide-react";

const translations = {
  en: {
    profile: "My Profile",
    back: "Back to Dashboard",
    personalInfo: "Personal Info",
    travelers: "Travelers",
    frequentFlyer: "Frequent Flyer",
    preferences: "Preferences",
    notifications: "Notifications",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Changes saved",
    name: "Full Name",
    email: "Email",
    phone: "Phone",
    language: "Preferred Language",
    currency: "Preferred Currency",
    addTraveler: "Add Traveler",
    editTraveler: "Edit Traveler",
    firstName: "First Name",
    lastName: "Last Name",
    middleName: "Middle Name",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    nationality: "Nationality",
    documentType: "Document Type",
    documentNumber: "Document Number",
    documentCountry: "Issuing Country",
    documentExpiry: "Expiry Date",
    seatPreference: "Seat Preference",
    mealPreference: "Meal Preference",
    relationship: "Relationship",
    primary: "Primary Traveler",
    addProgram: "Add Program",
    airline: "Airline",
    memberNumber: "Member Number",
    tierStatus: "Tier Status",
    preferredAirlines: "Preferred Airlines",
    avoidedAirlines: "Avoided Airlines",
    preferredClass: "Preferred Cabin Class",
    maxStops: "Maximum Stops",
    homeAirports: "Home Airports",
    budgetRange: "Budget Range",
    priceDropThreshold: "Price Drop Alert Threshold",
    emailNotifications: "Email Notifications",
    priceAlertNotifications: "Price Alert Notifications",
    marketingEmails: "Marketing Emails",
    loginRequired: "Please log in to access your profile",
    login: "Log In",
    delete: "Delete",
    cancel: "Cancel",
    confirm: "Confirm",
    noTravelers: "No travelers added yet",
    noPrograms: "No frequent flyer programs added",
  },
  pt: {
    profile: "Meu Perfil",
    back: "Voltar ao Painel",
    personalInfo: "Informações Pessoais",
    travelers: "Viajantes",
    frequentFlyer: "Milhagem",
    preferences: "Preferências",
    notifications: "Notificações",
    save: "Salvar Alterações",
    saving: "Salvando...",
    saved: "Alterações salvas",
    name: "Nome Completo",
    email: "Email",
    phone: "Telefone",
    language: "Idioma Preferido",
    currency: "Moeda Preferida",
    addTraveler: "Adicionar Viajante",
    editTraveler: "Editar Viajante",
    firstName: "Nome",
    lastName: "Sobrenome",
    middleName: "Nome do Meio",
    dateOfBirth: "Data de Nascimento",
    gender: "Gênero",
    nationality: "Nacionalidade",
    documentType: "Tipo de Documento",
    documentNumber: "Número do Documento",
    documentCountry: "País Emissor",
    documentExpiry: "Data de Validade",
    seatPreference: "Preferência de Assento",
    mealPreference: "Preferência de Refeição",
    relationship: "Parentesco",
    primary: "Viajante Principal",
    addProgram: "Adicionar Programa",
    airline: "Companhia Aérea",
    memberNumber: "Número de Membro",
    tierStatus: "Nível",
    preferredAirlines: "Companhias Preferidas",
    avoidedAirlines: "Companhias a Evitar",
    preferredClass: "Classe Preferida",
    maxStops: "Máximo de Escalas",
    homeAirports: "Aeroportos de Casa",
    budgetRange: "Faixa de Orçamento",
    priceDropThreshold: "Limite de Alerta de Queda de Preço",
    emailNotifications: "Notificações por Email",
    priceAlertNotifications: "Notificações de Alerta de Preço",
    marketingEmails: "Emails de Marketing",
    loginRequired: "Por favor, faça login para acessar seu perfil",
    login: "Entrar",
    delete: "Excluir",
    cancel: "Cancelar",
    confirm: "Confirmar",
    noTravelers: "Nenhum viajante adicionado ainda",
    noPrograms: "Nenhum programa de milhagem adicionado",
  },
  es: {
    profile: "Mi Perfil",
    back: "Volver al Panel",
    personalInfo: "Información Personal",
    travelers: "Viajeros",
    frequentFlyer: "Viajero Frecuente",
    preferences: "Preferencias",
    notifications: "Notificaciones",
    save: "Guardar Cambios",
    saving: "Guardando...",
    saved: "Cambios guardados",
    name: "Nombre Completo",
    email: "Email",
    phone: "Teléfono",
    language: "Idioma Preferido",
    currency: "Moneda Preferida",
    addTraveler: "Agregar Viajero",
    editTraveler: "Editar Viajero",
    firstName: "Nombre",
    lastName: "Apellido",
    middleName: "Segundo Nombre",
    dateOfBirth: "Fecha de Nacimiento",
    gender: "Género",
    nationality: "Nacionalidad",
    documentType: "Tipo de Documento",
    documentNumber: "Número de Documento",
    documentCountry: "País Emisor",
    documentExpiry: "Fecha de Vencimiento",
    seatPreference: "Preferencia de Asiento",
    mealPreference: "Preferencia de Comida",
    relationship: "Parentesco",
    primary: "Viajero Principal",
    addProgram: "Agregar Programa",
    airline: "Aerolínea",
    memberNumber: "Número de Miembro",
    tierStatus: "Nivel",
    preferredAirlines: "Aerolíneas Preferidas",
    avoidedAirlines: "Aerolíneas a Evitar",
    preferredClass: "Clase Preferida",
    maxStops: "Máximo de Escalas",
    homeAirports: "Aeropuertos de Casa",
    budgetRange: "Rango de Presupuesto",
    priceDropThreshold: "Umbral de Alerta de Caída de Precio",
    emailNotifications: "Notificaciones por Email",
    priceAlertNotifications: "Notificaciones de Alerta de Precio",
    marketingEmails: "Emails de Marketing",
    loginRequired: "Por favor, inicie sesión para acceder a su perfil",
    login: "Iniciar Sesión",
    delete: "Eliminar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    noTravelers: "Ningún viajero agregado aún",
    noPrograms: "Ningún programa de viajero frecuente agregado",
  },
};

export default function Profile() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  const [travelerDialogOpen, setTravelerDialogOpen] = useState(false);
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<any>(null);

  // Form states
  const [personalForm, setPersonalForm] = useState<{
    name: string;
    phone: string;
    preferredLanguage: "en" | "pt" | "es";
    preferredCurrency: string;
  }>({
    name: user?.name || "",
    phone: "",
    preferredLanguage: language,
    preferredCurrency: "USD",
  });

  const [travelerForm, setTravelerForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    gender: "male" as "male" | "female" | "other",
    nationality: "",
    documentType: "passport" as "passport" | "id_card" | "drivers_license",
    documentNumber: "",
    documentCountry: "",
    documentExpiry: "",
    seatPreference: "no_preference" as "window" | "aisle" | "middle" | "no_preference",
    mealPreference: "regular" as "regular" | "vegetarian" | "vegan" | "halal" | "kosher" | "gluten_free" | "no_preference",
    relationship: "self" as "self" | "spouse" | "child" | "parent" | "sibling" | "friend" | "colleague" | "other",
    isPrimary: false,
  });

  const [programForm, setProgramForm] = useState({
    airlineCode: "",
    airlineName: "",
    memberNumber: "",
    tierStatus: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    priceAlertNotifications: true,
    marketingEmails: false,
  });

  // Queries
  const { data: profileData, isLoading } = trpc.userProfile.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: travelers, refetch: refetchTravelers } = trpc.travelers.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: ffPrograms, refetch: refetchPrograms } = trpc.frequentFlyer.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const updateBasicInfo = trpc.userProfile.updateBasicInfo.useMutation({
    onSuccess: () => toast.success(t.saved),
  });

  const createTraveler = trpc.travelers.create.useMutation({
    onSuccess: () => {
      toast.success(t.saved);
      setTravelerDialogOpen(false);
      refetchTravelers();
      resetTravelerForm();
    },
  });

  const updateTraveler = trpc.travelers.update.useMutation({
    onSuccess: () => {
      toast.success(t.saved);
      setTravelerDialogOpen(false);
      refetchTravelers();
      resetTravelerForm();
    },
  });

  const deleteTraveler = trpc.travelers.delete.useMutation({
    onSuccess: () => {
      toast.success("Traveler removed");
      refetchTravelers();
    },
  });

  const createProgram = trpc.frequentFlyer.create.useMutation({
    onSuccess: () => {
      toast.success(t.saved);
      setProgramDialogOpen(false);
      refetchPrograms();
      setProgramForm({ airlineCode: "", airlineName: "", memberNumber: "", tierStatus: "" });
    },
  });

  const deleteProgram = trpc.frequentFlyer.delete.useMutation({
    onSuccess: () => {
      toast.success("Program removed");
      refetchPrograms();
    },
  });

  const resetTravelerForm = () => {
    setTravelerForm({
      firstName: "",
      lastName: "",
      middleName: "",
      dateOfBirth: "",
      gender: "male",
      nationality: "",
      documentType: "passport",
      documentNumber: "",
      documentCountry: "",
      documentExpiry: "",
      seatPreference: "no_preference",
      mealPreference: "regular",
      relationship: "self",
      isPrimary: false,
    });
    setEditingTraveler(null);
  };

  const handleEditTraveler = (traveler: any) => {
    setEditingTraveler(traveler);
    setTravelerForm({
      firstName: traveler.firstName || "",
      lastName: traveler.lastName || "",
      middleName: traveler.middleName || "",
      dateOfBirth: traveler.dateOfBirth || "",
      gender: traveler.gender || "male",
      nationality: traveler.nationality || "",
      documentType: traveler.documentType || "passport",
      documentNumber: traveler.documentNumber || "",
      documentCountry: traveler.documentCountry || "",
      documentExpiry: traveler.documentExpiry || "",
      seatPreference: traveler.seatPreference || "no_preference",
      mealPreference: traveler.mealPreference || "regular",
      relationship: traveler.relationship || "self",
      isPrimary: traveler.isPrimary || false,
    });
    setTravelerDialogOpen(true);
  };

  const handleSaveTraveler = () => {
    if (editingTraveler) {
      updateTraveler.mutate({ id: editingTraveler.id, ...travelerForm });
    } else {
      createTraveler.mutate(travelerForm);
    }
  };

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
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>{t.login}</a>
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.back}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">{t.profile}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t.personalInfo}</span>
            </TabsTrigger>
            <TabsTrigger value="travelers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t.travelers}</span>
            </TabsTrigger>
            <TabsTrigger value="frequent" className="gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">{t.frequentFlyer}</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t.preferences}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t.notifications}</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.personalInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.name}</Label>
                    <Input
                      id="name"
                      value={personalForm.name}
                      onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t.phone}</Label>
                    <Input
                      id="phone"
                      value={personalForm.phone}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.language}</Label>
                    <Select
                      value={personalForm.preferredLanguage}
                      onValueChange={(v) => setPersonalForm({ ...personalForm, preferredLanguage: v as "en" | "pt" | "es" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.currency}</Label>
                    <Select
                      value={personalForm.preferredCurrency}
                      onValueChange={(v) => setPersonalForm({ ...personalForm, preferredCurrency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="BRL">BRL (R$)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => updateBasicInfo.mutate(personalForm)}
                  disabled={updateBasicInfo.isPending}
                >
                  {updateBasicInfo.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t.save}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Travelers Tab */}
          <TabsContent value="travelers" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t.travelers}</CardTitle>
                  <CardDescription>
                    {language === "en" && "Manage traveler profiles for faster booking"}
                    {language === "pt" && "Gerencie perfis de viajantes para reservas mais rápidas"}
                    {language === "es" && "Administra perfiles de viajeros para reservas más rápidas"}
                  </CardDescription>
                </div>
                <Dialog open={travelerDialogOpen} onOpenChange={(open) => {
                  setTravelerDialogOpen(open);
                  if (!open) resetTravelerForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t.addTraveler}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingTraveler ? t.editTraveler : t.addTraveler}</DialogTitle>
                    </DialogHeader>
                    <div className="grid sm:grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label>{t.firstName} *</Label>
                        <Input
                          value={travelerForm.firstName}
                          onChange={(e) => setTravelerForm({ ...travelerForm, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.lastName} *</Label>
                        <Input
                          value={travelerForm.lastName}
                          onChange={(e) => setTravelerForm({ ...travelerForm, lastName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.middleName}</Label>
                        <Input
                          value={travelerForm.middleName}
                          onChange={(e) => setTravelerForm({ ...travelerForm, middleName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.dateOfBirth} *</Label>
                        <Input
                          type="date"
                          value={travelerForm.dateOfBirth}
                          onChange={(e) => setTravelerForm({ ...travelerForm, dateOfBirth: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.gender}</Label>
                        <Select
                          value={travelerForm.gender}
                          onValueChange={(v: any) => setTravelerForm({ ...travelerForm, gender: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.nationality}</Label>
                        <Input
                          value={travelerForm.nationality}
                          onChange={(e) => setTravelerForm({ ...travelerForm, nationality: e.target.value })}
                        />
                      </div>
                      <Separator className="col-span-2" />
                      <div className="space-y-2">
                        <Label>{t.documentType}</Label>
                        <Select
                          value={travelerForm.documentType}
                          onValueChange={(v: any) => setTravelerForm({ ...travelerForm, documentType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="id_card">ID Card</SelectItem>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.documentNumber}</Label>
                        <Input
                          value={travelerForm.documentNumber}
                          onChange={(e) => setTravelerForm({ ...travelerForm, documentNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.documentCountry}</Label>
                        <Input
                          value={travelerForm.documentCountry}
                          onChange={(e) => setTravelerForm({ ...travelerForm, documentCountry: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.documentExpiry}</Label>
                        <Input
                          type="date"
                          value={travelerForm.documentExpiry}
                          onChange={(e) => setTravelerForm({ ...travelerForm, documentExpiry: e.target.value })}
                        />
                      </div>
                      <Separator className="col-span-2" />
                      <div className="space-y-2">
                        <Label>{t.seatPreference}</Label>
                        <Select
                          value={travelerForm.seatPreference}
                          onValueChange={(v: any) => setTravelerForm({ ...travelerForm, seatPreference: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="window">Window</SelectItem>
                            <SelectItem value="aisle">Aisle</SelectItem>
                            <SelectItem value="middle">Middle</SelectItem>
                            <SelectItem value="no_preference">No Preference</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.mealPreference}</Label>
                        <Select
                          value={travelerForm.mealPreference}
                          onValueChange={(v: any) => setTravelerForm({ ...travelerForm, mealPreference: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="halal">Halal</SelectItem>
                            <SelectItem value="kosher">Kosher</SelectItem>
                            <SelectItem value="gluten_free">Gluten Free</SelectItem>
                            <SelectItem value="no_preference">No Preference</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t.relationship}</Label>
                        <Select
                          value={travelerForm.relationship}
                          onValueChange={(v: any) => setTravelerForm({ ...travelerForm, relationship: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self">Self</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="colleague">Colleague</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={travelerForm.isPrimary}
                          onCheckedChange={(v) => setTravelerForm({ ...travelerForm, isPrimary: v })}
                        />
                        <Label>{t.primary}</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTravelerDialogOpen(false)}>
                        {t.cancel}
                      </Button>
                      <Button
                        onClick={handleSaveTraveler}
                        disabled={!travelerForm.firstName || !travelerForm.lastName || !travelerForm.dateOfBirth}
                      >
                        {t.save}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {travelers && travelers.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {travelers.map((traveler) => (
                      <Card key={traveler.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  {traveler.firstName} {traveler.middleName} {traveler.lastName}
                                </p>
                                {traveler.isPrimary && (
                                  <Badge variant="secondary">Primary</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground capitalize">
                                {traveler.relationship} • {traveler.gender}
                              </p>
                              {traveler.documentNumber && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {traveler.documentType}: {traveler.documentNumber}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditTraveler(traveler)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-500"
                                onClick={() => deleteTraveler.mutate({ id: traveler.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>{t.noTravelers}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Frequent Flyer Tab */}
          <TabsContent value="frequent" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t.frequentFlyer}</CardTitle>
                  <CardDescription>
                    {language === "en" && "Link your frequent flyer programs for automatic miles"}
                    {language === "pt" && "Vincule seus programas de milhagem para milhas automáticas"}
                    {language === "es" && "Vincula tus programas de viajero frecuente para millas automáticas"}
                  </CardDescription>
                </div>
                <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t.addProgram}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.addProgram}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>{t.airline} *</Label>
                        <Input
                          placeholder="e.g., American Airlines"
                          value={programForm.airlineName}
                          onChange={(e) => setProgramForm({ ...programForm, airlineName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Airline Code *</Label>
                        <Input
                          placeholder="e.g., AA"
                          maxLength={3}
                          value={programForm.airlineCode}
                          onChange={(e) => setProgramForm({ ...programForm, airlineCode: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.memberNumber} *</Label>
                        <Input
                          value={programForm.memberNumber}
                          onChange={(e) => setProgramForm({ ...programForm, memberNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.tierStatus}</Label>
                        <Input
                          placeholder="e.g., Gold, Platinum"
                          value={programForm.tierStatus}
                          onChange={(e) => setProgramForm({ ...programForm, tierStatus: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setProgramDialogOpen(false)}>
                        {t.cancel}
                      </Button>
                      <Button
                        onClick={() => createProgram.mutate(programForm)}
                        disabled={!programForm.airlineCode || !programForm.airlineName || !programForm.memberNumber}
                      >
                        {t.save}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {ffPrograms && ffPrograms.length > 0 ? (
                  <div className="space-y-4">
                    {ffPrograms.map((program) => (
                      <div
                        key={program.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Plane className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{program.airlineName}</p>
                            <p className="text-sm text-muted-foreground">
                              {program.memberNumber}
                              {program.tierStatus && ` • ${program.tierStatus}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => deleteProgram.mutate({ id: program.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>{t.noPrograms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.preferences}</CardTitle>
                <CardDescription>
                  {language === "en" && "Customize your flight search preferences"}
                  {language === "pt" && "Personalize suas preferências de busca de voos"}
                  {language === "es" && "Personaliza tus preferencias de búsqueda de vuelos"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.preferredClass}</Label>
                    <Select defaultValue="ECONOMY">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ECONOMY">Economy</SelectItem>
                        <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                        <SelectItem value="BUSINESS">Business</SelectItem>
                        <SelectItem value="FIRST">First Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.maxStops}</Label>
                    <Select defaultValue="2">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Direct only</SelectItem>
                        <SelectItem value="1">1 stop max</SelectItem>
                        <SelectItem value="2">2 stops max</SelectItem>
                        <SelectItem value="3">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.budgetRange}</Label>
                    <Select defaultValue="moderate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Budget</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t.priceDropThreshold}</Label>
                    <Select defaultValue="10">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="25">25%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  {t.save}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.notifications}</CardTitle>
                <CardDescription>
                  {language === "en" && "Manage your notification preferences"}
                  {language === "pt" && "Gerencie suas preferências de notificação"}
                  {language === "es" && "Administra tus preferencias de notificación"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.emailNotifications}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === "en" && "Receive booking confirmations and updates"}
                        {language === "pt" && "Receba confirmações de reserva e atualizações"}
                        {language === "es" && "Recibe confirmaciones de reserva y actualizaciones"}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, emailNotifications: v })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.priceAlertNotifications}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === "en" && "Get notified when prices drop for your alerts"}
                        {language === "pt" && "Seja notificado quando os preços caírem para seus alertas"}
                        {language === "es" && "Recibe notificaciones cuando bajen los precios de tus alertas"}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.priceAlertNotifications}
                      onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, priceAlertNotifications: v })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.marketingEmails}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === "en" && "Receive deals, promotions and travel tips"}
                        {language === "pt" && "Receba ofertas, promoções e dicas de viagem"}
                        {language === "es" && "Recibe ofertas, promociones y consejos de viaje"}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, marketingEmails: v })}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updateBasicInfo.mutate(notificationSettings)}
                  disabled={updateBasicInfo.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t.save}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
