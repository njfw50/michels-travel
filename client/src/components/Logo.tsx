/**
 * Logo Component - Michel's Travel
 * 
 * Displays the official Michel's Travel logo image exactly as provided.
 */

import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "compact" | "full";
  showTagline?: boolean;
  className?: string;
  href?: string;
  onClick?: () => void;
  lightMode?: boolean; // For dark backgrounds
}

export function Logo({ 
  variant = "default", 
  showTagline = false,
  className,
  href = "/",
  onClick,
  lightMode = false
}: LogoProps) {
  // Use the actual logo image - SVG is available in public/images
  // In Vite, files in public folder are served from root
  const logoImagePath = "/images/michels-travel-logo.svg";
  
  const content = (
    <img
      src={logoImagePath}
      alt="Michel's Travel Logo"
      className={cn(
        "object-contain",
        variant === "compact" ? "h-10" : variant === "full" ? "h-20" : "h-12",
        "w-auto",
        className
      )}
      loading="eager"
    />
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="hover:opacity-80 transition-opacity">
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
}
