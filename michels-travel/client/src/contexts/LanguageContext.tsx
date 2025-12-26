import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "pt" | "es";

interface Translations {
  [key: string]: {
    en: string;
    pt: string;
    es: string;
  };
}

export const translations: Translations = {
  // Navigation
  "nav.home": { en: "Home", pt: "Início", es: "Inicio" },
  "nav.flights": { en: "Search Flights", pt: "Buscar Voos", es: "Buscar Vuelos" },
  "nav.about": { en: "About Us", pt: "Sobre Nós", es: "Sobre Nosotros" },
  "nav.services": { en: "Services", pt: "Serviços", es: "Servicios" },
  "nav.contact": { en: "Contact", pt: "Contato", es: "Contacto" },
  "nav.login": { en: "Login", pt: "Entrar", es: "Iniciar Sesión" },
  "nav.dashboard": { en: "My Account", pt: "Minha Conta", es: "Mi Cuenta" },

  // Hero Section
  "hero.title": { en: "Your Journey Begins Here", pt: "Sua Jornada Começa Aqui", es: "Tu Viaje Comienza Aquí" },
  "hero.subtitle": { en: "Discover the world with Michel's Travel. We find the best flights for your perfect trip.", pt: "Descubra o mundo com a Michel's Travel. Encontramos os melhores voos para sua viagem perfeita.", es: "Descubre el mundo con Michel's Travel. Encontramos los mejores vuelos para tu viaje perfecto." },
  "hero.cta": { en: "Search Flights", pt: "Buscar Voos", es: "Buscar Vuelos" },

  // Flight Search
  "search.title": { en: "Find Your Perfect Flight", pt: "Encontre Seu Voo Perfeito", es: "Encuentra Tu Vuelo Perfecto" },
  "search.roundTrip": { en: "Round Trip", pt: "Ida e Volta", es: "Ida y Vuelta" },
  "search.oneWay": { en: "One Way", pt: "Somente Ida", es: "Solo Ida" },
  "search.from": { en: "From", pt: "De", es: "Desde" },
  "search.to": { en: "To", pt: "Para", es: "Hasta" },
  "search.departure": { en: "Departure", pt: "Partida", es: "Salida" },
  "search.return": { en: "Return", pt: "Retorno", es: "Regreso" },
  "search.passengers": { en: "Passengers", pt: "Passageiros", es: "Pasajeros" },
  "search.adults": { en: "Adults", pt: "Adultos", es: "Adultos" },
  "search.children": { en: "Children", pt: "Crianças", es: "Niños" },
  "search.infants": { en: "Infants", pt: "Bebês", es: "Bebés" },
  "search.class": { en: "Class", pt: "Classe", es: "Clase" },
  "search.economy": { en: "Economy", pt: "Econômica", es: "Económica" },
  "search.premiumEconomy": { en: "Premium Economy", pt: "Econômica Premium", es: "Económica Premium" },
  "search.business": { en: "Business", pt: "Executiva", es: "Ejecutiva" },
  "search.first": { en: "First Class", pt: "Primeira Classe", es: "Primera Clase" },
  "search.button": { en: "Search Flights", pt: "Buscar Voos", es: "Buscar Vuelos" },
  "search.searching": { en: "Searching...", pt: "Buscando...", es: "Buscando..." },

  // Filters
  "filter.title": { en: "Filters", pt: "Filtros", es: "Filtros" },
  "filter.stops": { en: "Stops", pt: "Escalas", es: "Escalas" },
  "filter.direct": { en: "Direct", pt: "Direto", es: "Directo" },
  "filter.oneStop": { en: "1 Stop", pt: "1 Escala", es: "1 Escala" },
  "filter.twoPlus": { en: "2+ Stops", pt: "2+ Escalas", es: "2+ Escalas" },
  "filter.airlines": { en: "Airlines", pt: "Companhias", es: "Aerolíneas" },
  "filter.price": { en: "Price Range", pt: "Faixa de Preço", es: "Rango de Precio" },
  "filter.duration": { en: "Duration", pt: "Duração", es: "Duración" },
  "filter.departure": { en: "Departure Time", pt: "Horário de Partida", es: "Hora de Salida" },
  "filter.clear": { en: "Clear Filters", pt: "Limpar Filtros", es: "Limpiar Filtros" },

  // Results
  "results.found": { en: "flights found", pt: "voos encontrados", es: "vuelos encontrados" },
  "results.noResults": { en: "No flights found", pt: "Nenhum voo encontrado", es: "No se encontraron vuelos" },
  "results.tryAgain": { en: "Try adjusting your search criteria", pt: "Tente ajustar seus critérios de busca", es: "Intenta ajustar tus criterios de búsqueda" },
  "results.sortBy": { en: "Sort by", pt: "Ordenar por", es: "Ordenar por" },
  "results.cheapest": { en: "Cheapest", pt: "Mais Barato", es: "Más Barato" },
  "results.fastest": { en: "Fastest", pt: "Mais Rápido", es: "Más Rápido" },
  "results.best": { en: "Best", pt: "Melhor", es: "Mejor" },
  "results.select": { en: "Select", pt: "Selecionar", es: "Seleccionar" },
  "results.details": { en: "View Details", pt: "Ver Detalhes", es: "Ver Detalles" },
  "results.buyNow": { en: "Buy Now", pt: "Comprar Agora", es: "Comprar Ahora" },
  "results.requestQuote": { en: "Request Quote", pt: "Solicitar Cotação", es: "Solicitar Cotización" },

  // Flight Card
  "flight.departure": { en: "Departure", pt: "Partida", es: "Salida" },
  "flight.arrival": { en: "Arrival", pt: "Chegada", es: "Llegada" },
  "flight.duration": { en: "Duration", pt: "Duração", es: "Duración" },
  "flight.stops": { en: "stops", pt: "escalas", es: "escalas" },
  "flight.stop": { en: "stop", pt: "escala", es: "escala" },
  "flight.direct": { en: "Direct", pt: "Direto", es: "Directo" },
  "flight.baggage": { en: "Baggage", pt: "Bagagem", es: "Equipaje" },
  "flight.included": { en: "included", pt: "incluída", es: "incluido" },
  "flight.perPerson": { en: "per person", pt: "por pessoa", es: "por persona" },
  "flight.total": { en: "Total", pt: "Total", es: "Total" },
  "flight.outbound": { en: "Outbound", pt: "Ida", es: "Ida" },
  "flight.inbound": { en: "Return", pt: "Volta", es: "Vuelta" },

  // Booking Form
  "booking.title": { en: "Request Booking", pt: "Solicitar Reserva", es: "Solicitar Reserva" },
  "booking.quote": { en: "Request Quote", pt: "Solicitar Cotação", es: "Solicitar Cotización" },
  "booking.name": { en: "Full Name", pt: "Nome Completo", es: "Nombre Completo" },
  "booking.email": { en: "Email", pt: "E-mail", es: "Correo Electrónico" },
  "booking.phone": { en: "Phone", pt: "Telefone", es: "Teléfono" },
  "booking.message": { en: "Additional Message", pt: "Mensagem Adicional", es: "Mensaje Adicional" },
  "booking.submit": { en: "Submit Request", pt: "Enviar Solicitação", es: "Enviar Solicitud" },
  "booking.success": { en: "Request sent successfully! We'll contact you soon.", pt: "Solicitação enviada com sucesso! Entraremos em contato em breve.", es: "¡Solicitud enviada con éxito! Nos pondremos en contacto pronto." },

  // About Section
  "about.title": { en: "About Michel's Travel", pt: "Sobre a Michel's Travel", es: "Sobre Michel's Travel" },
  "about.description": { en: "With years of experience in the travel industry, Michel's Travel is your trusted partner for finding the best flight deals worldwide. Our team of experts is dedicated to making your travel dreams come true.", pt: "Com anos de experiência no setor de viagens, a Michel's Travel é sua parceira de confiança para encontrar as melhores ofertas de voos em todo o mundo. Nossa equipe de especialistas está dedicada a tornar seus sonhos de viagem realidade.", es: "Con años de experiencia en la industria de viajes, Michel's Travel es su socio de confianza para encontrar las mejores ofertas de vuelos en todo el mundo. Nuestro equipo de expertos está dedicado a hacer realidad sus sueños de viaje." },
  "about.mission": { en: "Our Mission", pt: "Nossa Missão", es: "Nuestra Misión" },
  "about.missionText": { en: "To provide exceptional travel experiences by offering personalized service, competitive prices, and expert guidance for every journey.", pt: "Proporcionar experiências de viagem excepcionais, oferecendo serviço personalizado, preços competitivos e orientação especializada para cada jornada.", es: "Proporcionar experiencias de viaje excepcionales ofreciendo servicio personalizado, precios competitivos y orientación experta para cada viaje." },

  // Services
  "services.title": { en: "Our Services", pt: "Nossos Serviços", es: "Nuestros Servicios" },
  "services.flights": { en: "Flight Booking", pt: "Reserva de Voos", es: "Reserva de Vuelos" },
  "services.flightsDesc": { en: "Find and book the best flights at competitive prices", pt: "Encontre e reserve os melhores voos a preços competitivos", es: "Encuentra y reserva los mejores vuelos a precios competitivos" },
  "services.support": { en: "24/7 Support", pt: "Suporte 24/7", es: "Soporte 24/7" },
  "services.supportDesc": { en: "Our team is always available to assist you", pt: "Nossa equipe está sempre disponível para ajudá-lo", es: "Nuestro equipo siempre está disponible para ayudarte" },
  "services.custom": { en: "Custom Packages", pt: "Pacotes Personalizados", es: "Paquetes Personalizados" },
  "services.customDesc": { en: "Tailored travel solutions for your unique needs", pt: "Soluções de viagem personalizadas para suas necessidades únicas", es: "Soluciones de viaje personalizadas para tus necesidades únicas" },
  "services.corporate": { en: "Corporate Travel", pt: "Viagens Corporativas", es: "Viajes Corporativos" },
  "services.corporateDesc": { en: "Professional travel management for businesses", pt: "Gestão profissional de viagens para empresas", es: "Gestión profesional de viajes para empresas" },

  // Contact
  "contact.title": { en: "Contact Us", pt: "Entre em Contato", es: "Contáctenos" },
  "contact.subtitle": { en: "Have questions? We're here to help!", pt: "Tem perguntas? Estamos aqui para ajudar!", es: "¿Tienes preguntas? ¡Estamos aquí para ayudar!" },
  "contact.form.name": { en: "Your Name", pt: "Seu Nome", es: "Tu Nombre" },
  "contact.form.email": { en: "Your Email", pt: "Seu E-mail", es: "Tu Correo" },
  "contact.form.subject": { en: "Subject", pt: "Assunto", es: "Asunto" },
  "contact.form.message": { en: "Message", pt: "Mensagem", es: "Mensaje" },
  "contact.form.send": { en: "Send Message", pt: "Enviar Mensagem", es: "Enviar Mensaje" },

  // Chatbot
  "chat.title": { en: "Travel Assistant", pt: "Assistente de Viagens", es: "Asistente de Viajes" },
  "chat.placeholder": { en: "Ask me about destinations, visas, best seasons...", pt: "Pergunte sobre destinos, vistos, melhores épocas...", es: "Pregúntame sobre destinos, visas, mejores temporadas..." },
  "chat.send": { en: "Send", pt: "Enviar", es: "Enviar" },
  "chat.greeting": { en: "Hello! I'm your travel assistant. How can I help you today?", pt: "Olá! Sou seu assistente de viagens. Como posso ajudá-lo hoje?", es: "¡Hola! Soy tu asistente de viajes. ¿Cómo puedo ayudarte hoy?" },

  // Footer
  "footer.rights": { en: "All rights reserved", pt: "Todos os direitos reservados", es: "Todos los derechos reservados" },
  "footer.privacy": { en: "Privacy Policy", pt: "Política de Privacidade", es: "Política de Privacidad" },
  "footer.terms": { en: "Terms of Service", pt: "Termos de Serviço", es: "Términos de Servicio" },

  // Common
  "common.loading": { en: "Loading...", pt: "Carregando...", es: "Cargando..." },
  "common.error": { en: "An error occurred", pt: "Ocorreu um erro", es: "Ocurrió un error" },
  "common.close": { en: "Close", pt: "Fechar", es: "Cerrar" },
  "common.save": { en: "Save", pt: "Salvar", es: "Guardar" },
  "common.cancel": { en: "Cancel", pt: "Cancelar", es: "Cancelar" },
  "common.years": { en: "years", pt: "anos", es: "años" },
  "common.adult": { en: "12+ years", pt: "12+ anos", es: "12+ años" },
  "common.child": { en: "2-11 years", pt: "2-11 anos", es: "2-11 años" },
  "common.infant": { en: "Under 2", pt: "Até 2 anos", es: "Menor de 2" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language;
      if (saved && ["en", "pt", "es"].includes(saved)) return saved;
      
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "pt") return "pt";
      if (browserLang === "es") return "es";
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
