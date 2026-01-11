/**
 * Security Badge Component
 * DOGMA 1: Security First - Visual indicators for security status
 */

import { Badge } from "@/components/ui/badge";
import { Shield, Lock, AlertTriangle } from "lucide-react";

interface SecurityBadgeProps {
  level: "high" | "medium" | "low";
  label: string;
}

export function SecurityBadge({ level, label }: SecurityBadgeProps) {
  const variants = {
    high: {
      className: "bg-green-100 text-green-700 border-green-300",
      icon: <Shield className="h-3 w-3" />,
    },
    medium: {
      className: "bg-yellow-100 text-yellow-700 border-yellow-300",
      icon: <Lock className="h-3 w-3" />,
    },
    low: {
      className: "bg-red-100 text-red-700 border-red-300",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const variant = variants[level];

  return (
    <Badge variant="outline" className={`${variant.className} flex items-center gap-1`}>
      {variant.icon}
      {label}
    </Badge>
  );
}

