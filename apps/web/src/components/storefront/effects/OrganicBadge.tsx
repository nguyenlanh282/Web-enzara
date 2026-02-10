import { cn } from "@/lib/utils";
import { Leaf, Sparkles, ShieldCheck, Recycle, Droplets } from "lucide-react";

interface OrganicBadgeProps {
  variant?: "organic" | "natural" | "eco" | "pure" | "safe";
  size?: "sm" | "md";
  className?: string;
}

const badgeConfig = {
  organic: {
    icon: Leaf,
    label: "Huu co",
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    iconColor: "text-green-600",
  },
  natural: {
    icon: Sparkles,
    label: "Thien nhien",
    bg: "bg-primary-50 border-primary-200",
    text: "text-primary-700",
    iconColor: "text-primary-600",
  },
  eco: {
    icon: Recycle,
    label: "Than thien moi truong",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    iconColor: "text-emerald-600",
  },
  pure: {
    icon: Droplets,
    label: "Tinh khiet",
    bg: "bg-sky-50 border-sky-200",
    text: "text-sky-700",
    iconColor: "text-sky-600",
  },
  safe: {
    icon: ShieldCheck,
    label: "An toan",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    iconColor: "text-amber-600",
  },
};

export function OrganicBadge({
  variant = "organic",
  size = "sm",
  className,
}: OrganicBadgeProps) {
  const config = badgeConfig[variant];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border rounded-full font-body font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className,
      )}
    >
      <Icon className={cn("flex-shrink-0", config.iconColor, size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
      {config.label}
    </span>
  );
}

/**
 * Section heading with organic leaf accent.
 */
interface OrganicSectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

export function OrganicSectionHeading({
  title,
  subtitle,
  className,
  align = "center",
}: OrganicSectionHeadingProps) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      <div className={cn("flex items-center gap-2 mb-2", align === "center" && "justify-center")}>
        <span className="h-px w-8 bg-primary-300" />
        <Leaf className="w-4 h-4 text-primary-500" />
        <span className="h-px w-8 bg-primary-300" />
      </div>
      <h2 className="text-2xl lg:text-3xl font-heading font-bold text-neutral-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-neutral-600 font-body max-w-xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
