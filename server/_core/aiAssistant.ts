/**
 * AI Assistant Core - Advanced Travel Assistant with Agent Mode
 * 
 * This module provides the core AI assistant functionality with:
 * - Flight search integration via Duffel API
 * - Agent mode for screen navigation
 * - Special support for elderly users
 * - Multi-language support (pt, en, es)
 * - Context memory and session management
 */

import { invokeLLM, type Message, type Tool } from "./llm";
import { searchFlights, searchLocations, type FlightSearchParams } from "../duffel";
import { z } from "zod";

export interface AIContext {
  sessionId: string;
  language: "en" | "pt" | "es";
  userAge?: number;
  isElderly?: boolean;
  conversationHistory: Message[];
  userPreferences?: {
    preferredAirlines?: string[];
    preferredClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
    accessibilityNeeds?: string[];
  };
}

export interface AIResponse {
  message: string;
  actions?: AgentAction[];
  flightResults?: any;
  needsUserInput?: {
    field: string;
    question: string;
  };
}

export interface AgentAction {
  type: "scroll" | "click" | "fill" | "navigate" | "highlight";
  target: string;
  value?: string;
  description: string;
}

/**
 * Get system prompt based on language and user context
 */
function getSystemPrompt(language: "en" | "pt" | "es", context: AIContext): string {
  const basePrompts = {
    en: `You are an advanced AI travel assistant for Michel's Travel agency. You are highly efficient, empathetic, and professional.

CORE CAPABILITIES:
- Search for flights using the Duffel API (you have access to searchFlights function)
- Help with travel planning, destinations, documentation, visas
- Provide personalized recommendations
- Assist with booking processes

SPECIAL ATTENTION FOR ELDERLY USERS:
- Always ask for the user's age early in the conversation if not provided
- If the user is 60+ years old, provide EXTRA attention and care:
  * Speak more slowly and clearly
  * Use simpler language when appropriate
  * Offer step-by-step guidance
  * Be patient and reassuring
  * Ask if they need help with accessibility features
  * Provide larger text options if needed
- Show extra empathy and understanding

AGENT MODE:
You can control the interface to help users navigate:
- Scroll to specific sections (e.g., "scroll to search form")
- Click buttons or links
- Fill forms automatically
- Navigate to different pages
- Highlight important information

When you need to perform actions, return them in the actions array with clear descriptions.

MULTI-LANGUAGE:
You must respond in the user's preferred language (${language}). Always maintain consistency.

IMPORTANT RULES:
1. Always be friendly, professional, and helpful
2. If user asks about flights, use the searchFlights function
3. If user is elderly, be extra patient and clear
4. Ask clarifying questions when needed
5. Provide actionable information
6. Use agent mode to help users navigate when appropriate`,

    pt: `Você é um assistente de viagens avançado da agência Michel's Travel. Você é altamente eficiente, empático e profissional.

CAPACIDADES PRINCIPAIS:
- Buscar voos usando a API Duffel (você tem acesso à função searchFlights)
- Ajudar com planejamento de viagens, destinos, documentação, vistos
- Fornecer recomendações personalizadas
- Auxiliar com processos de reserva

ATENÇÃO ESPECIAL PARA IDOSOS:
- Sempre pergunte a idade do usuário no início da conversa se não fornecida
- Se o usuário tiver 60+ anos, forneça ATENÇÃO EXTRA e cuidado:
  * Fale mais devagar e claramente
  * Use linguagem mais simples quando apropriado
  * Ofereça orientação passo a passo
  * Seja paciente e tranquilizador
  * Pergunte se precisam de ajuda com recursos de acessibilidade
  * Forneça opções de texto maior se necessário
- Mostre empatia e compreensão extra

MODO AGENTE:
Você pode controlar a interface para ajudar usuários a navegar:
- Rolar para seções específicas (ex: "rolar para o formulário de busca")
- Clicar em botões ou links
- Preencher formulários automaticamente
- Navegar para diferentes páginas
- Destacar informações importantes

Quando precisar realizar ações, retorne-as no array actions com descrições claras.

MULTI-IDIOMA:
Você deve responder no idioma preferido do usuário (${language}). Sempre mantenha consistência.

REGRAS IMPORTANTES:
1. Sempre seja amigável, profissional e prestativo
2. Se o usuário perguntar sobre voos, use a função searchFlights
3. Se o usuário for idoso, seja extra paciente e claro
4. Faça perguntas esclarecedoras quando necessário
5. Forneça informações acionáveis
6. Use o modo agente para ajudar usuários a navegar quando apropriado`,

    es: `Eres un asistente de viajes avanzado de la agencia Michel's Travel. Eres altamente eficiente, empático y profesional.

CAPACIDADES PRINCIPALES:
- Buscar vuelos usando la API Duffel (tienes acceso a la función searchFlights)
- Ayudar con planificación de viajes, destinos, documentación, visas
- Proporcionar recomendaciones personalizadas
- Asistir con procesos de reserva

ATENCIÓN ESPECIAL PARA ADULTOS MAYORES:
- Siempre pregunta la edad del usuario al inicio de la conversación si no se proporciona
- Si el usuario tiene 60+ años, proporciona ATENCIÓN EXTRA y cuidado:
  * Habla más lento y claramente
  * Usa lenguaje más simple cuando sea apropiado
  * Ofrece orientación paso a paso
  * Sé paciente y tranquilizador
  * Pregunta si necesitan ayuda con características de accesibilidad
  * Proporciona opciones de texto más grande si es necesario
- Muestra empatía y comprensión extra

MODO AGENTE:
Puedes controlar la interfaz para ayudar a los usuarios a navegar:
- Desplazarse a secciones específicas (ej: "desplazarse al formulario de búsqueda")
- Hacer clic en botones o enlaces
- Llenar formularios automáticamente
- Navegar a diferentes páginas
- Resaltar información importante

Cuando necesites realizar acciones, devuélvelas en el array actions con descripciones claras.

MULTI-IDIOMA:
Debes responder en el idioma preferido del usuario (${language}). Siempre mantén consistencia.

REGLAS IMPORTANTES:
1. Siempre sé amigable, profesional y servicial
2. Si el usuario pregunta sobre vuelos, usa la función searchFlights
3. Si el usuario es mayor, sé extra paciente y claro
4. Haz preguntas aclaratorias cuando sea necesario
5. Proporciona información accionable
6. Usa el modo agente para ayudar a los usuarios a navegar cuando sea apropiado`,
  };

  let prompt = basePrompts[language];

  // Add context-specific information
  if (context.isElderly) {
    prompt += `\n\nCURRENT USER CONTEXT: The user is ${context.userAge} years old and requires extra attention and care.`;
  }

  if (context.userPreferences) {
    prompt += `\n\nUSER PREFERENCES: ${JSON.stringify(context.userPreferences)}`;
  }

  return prompt;
}

/**
 * Define tools/functions available to the AI
 */
function getAITools(): Tool[] {
  return [
    {
      type: "function",
      function: {
        name: "searchFlights",
        description: "Search for flights using origin, destination, dates, and passenger information. Use this when the user wants to find flights.",
        parameters: {
          type: "object",
          properties: {
            origin: {
              type: "string",
              description: "IATA airport code for origin (e.g., 'JFK', 'GRU', 'MAD')",
            },
            destination: {
              type: "string",
              description: "IATA airport code for destination (e.g., 'JFK', 'GRU', 'MAD')",
            },
            departureDate: {
              type: "string",
              description: "Departure date in YYYY-MM-DD format",
            },
            returnDate: {
              type: "string",
              description: "Return date in YYYY-MM-DD format (optional for one-way trips)",
            },
            adults: {
              type: "number",
              description: "Number of adult passengers (default: 1)",
            },
            children: {
              type: "number",
              description: "Number of child passengers (optional)",
            },
            infants: {
              type: "number",
              description: "Number of infant passengers (optional)",
            },
            travelClass: {
              type: "string",
              enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
              description: "Travel class preference",
            },
            nonStop: {
              type: "boolean",
              description: "Whether to search only for non-stop flights",
            },
          },
          required: ["origin", "destination", "departureDate", "adults"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "searchLocations",
        description: "Search for airport locations by city name or airport code. Use this to help users find the correct airport codes.",
        parameters: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "City name or airport code to search for",
            },
          },
          required: ["keyword"],
        },
      },
    },
  ];
}

/**
 * Extract age from user message
 */
function extractAge(message: string): number | null {
  // Try to find age patterns
  const agePatterns = [
    /(?:tenho|tenho|sou|I am|I'm|tengo|soy)\s+(\d+)\s*(?:anos?|years?|años?)/i,
    /(\d+)\s*(?:anos?|years?|años?)\s*(?:de idade|old|de edad)?/i,
    /(?:idade|age|edad)[\s:]+(\d+)/i,
  ];

  for (const pattern of agePatterns) {
    const match = message.match(pattern);
    if (match) {
      const age = parseInt(match[1], 10);
      if (age >= 0 && age <= 150) {
        return age;
      }
    }
  }

  return null;
}

/**
 * Process AI assistant request
 */
export async function processAIRequest(
  userMessage: string,
  context: AIContext
): Promise<AIResponse> {
  // Extract age if mentioned
  const extractedAge = extractAge(userMessage);
  if (extractedAge !== null && !context.userAge) {
    context.userAge = extractedAge;
    context.isElderly = extractedAge >= 60;
  }

  // Check if we need to ask for age (especially for elderly support)
  if (!context.userAge && context.language === "pt") {
    const ageKeywords = ["voos", "viagem", "passagem", "reservar", "comprar"];
    const shouldAskAge = ageKeywords.some((keyword) =>
      userMessage.toLowerCase().includes(keyword)
    );
    if (shouldAskAge) {
      return {
        message: "Para oferecer o melhor atendimento, poderia me informar sua idade?",
        needsUserInput: {
          field: "age",
          question: "Qual é a sua idade?",
        },
      };
    }
  }

  // Build conversation history
  const messages: Message[] = [
    { role: "system", content: getSystemPrompt(context.language, context) },
    ...context.conversationHistory.slice(-10), // Keep last 10 messages for context
    { role: "user", content: userMessage },
  ];

  // Invoke LLM with tools
  let response;
  try {
    response = await invokeLLM({
      messages,
      tools: getAITools(),
      tool_choice: "auto",
    });
  } catch (error: any) {
    // If tools fail, try without tools as fallback
    console.warn("LLM with tools failed, trying without tools:", error);
    response = await invokeLLM({
      messages,
      // No tools on fallback
    });
  }

  const choice = response.choices[0];
  if (!choice) {
    throw new Error("No response from AI");
  }

  // Handle tool calls
  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    const toolResults: any[] = [];
    let flightResults: any = null;

    for (const toolCall of choice.message.tool_calls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      if (functionName === "searchFlights") {
        try {
          const searchParams: FlightSearchParams = {
            originLocationCode: args.origin,
            destinationLocationCode: args.destination,
            departureDate: args.departureDate,
            returnDate: args.returnDate,
            adults: args.adults || 1,
            children: args.children,
            infants: args.infants,
            travelClass: args.travelClass,
            nonStop: args.nonStop,
            max: 10, // Limit results for AI response
          };

          const searchResponse = await searchFlights(searchParams);
          flightResults = searchResponse.data;

          toolResults.push({
            role: "tool",
            content: JSON.stringify({
              success: true,
              results: searchResponse.data?.length || 0,
              flights: searchResponse.data?.slice(0, 5).map((offer: any) => ({
                id: offer.id,
                price: offer.total_amount,
                currency: offer.total_currency,
                slices: offer.slices,
              })),
            }),
            tool_call_id: toolCall.id,
          });
        } catch (error: any) {
          toolResults.push({
            role: "tool",
            content: JSON.stringify({
              success: false,
              error: error.message,
            }),
            tool_call_id: toolCall.id,
          });
        }
      } else if (functionName === "searchLocations") {
        try {
          const locations = await searchLocations(args.keyword);
          toolResults.push({
            role: "tool",
            content: JSON.stringify({
              success: true,
              locations: locations.slice(0, 5).map((loc) => ({
                iata_code: loc.iata_code,
                name: loc.name,
                city: loc.city_name,
              })),
            }),
            tool_call_id: toolCall.id,
          });
        } catch (error: any) {
          toolResults.push({
            role: "tool",
            content: JSON.stringify({
              success: false,
              error: error.message,
            }),
            tool_call_id: toolCall.id,
          });
        }
      }
    }

    // Get final response with tool results
    const finalMessages: Message[] = [
      ...messages,
      choice.message,
      ...toolResults,
    ];

    const finalResponse = await invokeLLM({
      messages: finalMessages,
      tools: getAITools(),
    });

    const finalChoice = finalResponse.choices[0];
    const rawContent = finalChoice?.message?.content;
    const assistantMessage =
      typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent)
          ? rawContent.map((c) => ("text" in c ? c.text : "")).join("")
          : "I apologize, I couldn't process your request. Please try again.";

    return {
      message: assistantMessage,
      flightResults: flightResults,
    };
  }

  // No tool calls, just return the message
  const rawContent = choice.message.content;
  const assistantMessage =
    typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((c) => ("text" in c ? c.text : "")).join("")
        : "I apologize, I couldn't process your request. Please try again.";

  return {
    message: assistantMessage,
  };
}

