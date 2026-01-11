/**
 * Environment Indicator Component
 * 
 * Shows a visual indicator (light) for the current environment (Sandbox/Production)
 * DOGMA 2: No Silent Failures - Clear visual feedback
 * DOGMA 1: Security First - Users must know which environment they're using
 */

import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function EnvironmentIndicator() {
  // Use public endpoint to get environment status (no admin required)
  const { data: envStatus, isLoading } = trpc.system.getEnvironmentStatus.useQuery(undefined, {
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const environment = envStatus?.environment || "sandbox";
  const isProduction = environment === "production";

  if (isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Verificando...</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Verificando ambiente do sistema...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              isProduction
                ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            }`}
          >
            {/* Animated Light Indicator */}
            <div className="relative">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isProduction ? "bg-red-500" : "bg-green-500"
                } animate-pulse`}
              />
              <div
                className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${
                  isProduction ? "bg-red-500" : "bg-green-500"
                } opacity-75 animate-ping`}
              />
            </div>
            
            {/* Status Icon */}
            {isProduction ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            
            {/* Environment Text */}
            <span className="text-xs font-semibold">
              {isProduction ? "PRODUÇÃO" : "SANDBOX"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">
              {isProduction ? "⚠️ Modo Produção Ativo" : "✅ Modo Sandbox Ativo"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isProduction
                ? "O sistema está usando credenciais de produção. Pagamentos reais serão processados."
                : "O sistema está em modo de teste. Nenhum pagamento real será processado."}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

