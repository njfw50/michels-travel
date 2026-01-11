import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  flightResults?: any;
  actions?: Array<{
    type: string;
    target: string;
    value?: string;
    description: string;
  }>;
}

interface AgentAction {
  type: "scroll" | "click" | "fill" | "navigate" | "highlight";
  target: string;
  value?: string;
  description: string;
}

export function TravelChatbot() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => nanoid());
  const [userAge, setUserAge] = useState<number | null>(null);
  const [agentMode, setAgentMode] = useState(false);
  const [isElderly, setIsElderly] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get session context on mount
  const sessionContext = trpc.chat.getSession.useQuery(
    { sessionId },
    { enabled: isOpen }
  );

  useEffect(() => {
    if (sessionContext.data) {
      if (sessionContext.data.userAge) {
        setUserAge(sessionContext.data.userAge);
        setIsElderly(sessionContext.data.isElderly || false);
      }
    }
  }, [sessionContext.data]);

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      const newMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: data.response,
        flightResults: data.flightResults,
        actions: data.actions,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Update user age if provided
      if (data.userAge && !userAge) {
        setUserAge(data.userAge);
        setIsElderly(data.isElderly || false);
      }

      // Execute agent actions if agent mode is enabled
      if (agentMode && data.actions && data.actions.length > 0) {
        executeAgentActions(data.actions);
      }

      // Handle flight results - scroll to search results if available
      if (data.flightResults && data.flightResults.length > 0) {
        setTimeout(() => {
          const resultsSection = document.getElementById("results");
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 500);
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: t("common.error") || "Desculpe, ocorreu um erro. Por favor, tente novamente.",
        },
      ]);
    },
  });

  // Execute agent actions
  const executeAgentActions = (actions: AgentAction[]) => {
    actions.forEach((action) => {
      switch (action.type) {
        case "scroll":
          const targetElement = document.querySelector(action.target);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          break;
        case "click":
          const clickElement = document.querySelector(action.target) as HTMLElement;
          if (clickElement) {
            clickElement.click();
          }
          break;
        case "fill":
          const fillElement = document.querySelector(action.target) as HTMLInputElement;
          if (fillElement && action.value) {
            fillElement.value = action.value;
            fillElement.dispatchEvent(new Event("input", { bubbles: true }));
          }
          break;
        case "navigate":
          if (action.target.startsWith("/")) {
            window.location.href = action.target;
          } else {
            const link = document.querySelector(`a[href="${action.target}"]`) as HTMLElement;
            if (link) {
              link.click();
            }
          }
          break;
        case "highlight":
          const highlightElement = document.querySelector(action.target) as HTMLElement;
          if (highlightElement) {
            highlightElement.style.transition = "all 0.3s";
            highlightElement.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
            highlightElement.style.border = "2px solid rgb(59, 130, 246)";
            setTimeout(() => {
              highlightElement.style.backgroundColor = "";
              highlightElement.style.border = "";
            }, 3000);
          }
          break;
      }
    });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = isElderly
        ? language === "pt"
          ? "Olá! Sou seu assistente de viagens. Como posso ajudá-lo hoje? Para oferecer o melhor atendimento, poderia me informar sua idade?"
          : language === "es"
          ? "¡Hola! Soy su asistente de viajes. ¿Cómo puedo ayudarle hoy? Para ofrecer el mejor servicio, ¿podría informarme su edad?"
          : "Hello! I'm your travel assistant. How can I help you today? To provide the best service, could you tell me your age?"
        : t("chat.greeting") || "Hello! I'm your travel assistant. How can I help you today?";

      setMessages([
        {
          id: nanoid(),
          role: "assistant",
          content: greeting,
        },
      ]);
    }
  }, [isOpen, t, isElderly, language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: nanoid(), role: "user", content: userMessage },
    ]);
    setInput("");

    // Update age if mentioned in message
    const ageMatch = userMessage.match(/(\d+)\s*(?:anos?|years?|años?)/i);
    if (ageMatch && !userAge) {
      const age = parseInt(ageMatch[1], 10);
      if (age >= 0 && age <= 150) {
        setUserAge(age);
        setIsElderly(age >= 60);
        // Update age in backend
        await trpc.chat.updateUserAge.mutate({ sessionId, age });
      }
    }

    sendMessage.mutate({
      sessionId,
      message: userMessage,
      language: language as "en" | "pt" | "es",
      userAge: userAge || undefined,
      agentMode,
    });
  };

  // Apply elderly-friendly styles if user is elderly
  const elderlyStyles = isElderly
    ? {
        fontSize: "16px",
        lineHeight: "1.6",
      }
    : {};

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
          "transition-all duration-300 hover:scale-110",
          isOpen && "hidden"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[500px] z-50 flex flex-col shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{t("chat.title") || "Travel Assistant"}</h3>
                <p className="text-xs text-primary-foreground/80">Michel's Travel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Agent Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-primary-foreground hover:bg-white/20 h-8 w-8",
                  agentMode && "bg-white/30"
                )}
                onClick={() => setAgentMode(!agentMode)}
                title={agentMode ? "Desativar Modo Agente" : "Ativar Modo Agente"}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Agent Mode Indicator */}
          {agentMode && (
            <div className="bg-blue-500/20 text-blue-700 dark:text-blue-300 px-4 py-2 text-xs font-medium flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Modo Agente Ativo - Posso ajudar a navegar na página
            </div>
          )}

          {/* Elderly Mode Indicator */}
          {isElderly && (
            <div className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-2 text-xs font-medium">
              ✨ Modo de Atenção Especial Ativado
            </div>
          )}

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4" style={elderlyStyles}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "assistant"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 max-w-[80%]",
                      message.role === "assistant"
                        ? "bg-muted text-foreground rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Streamdown className="text-sm prose prose-sm max-w-none">
                        {message.content}
                      </Streamdown>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}

                    {/* Show flight results summary if available */}
                    {message.flightResults && message.flightResults.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          ✈️ Encontrei {message.flightResults.length} voo(s). 
                          Os resultados aparecerão abaixo.
                        </p>
                      </div>
                    )}

                    {/* Show agent actions if available */}
                    {message.actions && message.actions.length > 0 && agentMode && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          🤖 Executando ações: {message.actions.map((a) => a.description).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sendMessage.isPending && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder") || "Ask me about destinations, visas, best season"}
                disabled={sendMessage.isPending}
                className="flex-1"
                style={isElderly ? { fontSize: "16px", padding: "12px" } : {}}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || sendMessage.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
