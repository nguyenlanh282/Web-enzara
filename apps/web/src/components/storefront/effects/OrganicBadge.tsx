import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", "mb-8", className)}>
      <h2 className="text-2xl lg:text-3xl font-heading font-bold text-neutral-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-neutral-500 font-body max-w-xl mx-auto text-sm sm:text-base">
          {subtitle}
        </p>
      )}
      <div className={cn("mt-4 flex items-center gap-2", align === "center" && "justify-center")}>
        <span className="h-1 w-12 rounded-full bg-primary-500" />
        <span className="h-1 w-3 rounded-full bg-primary-300" />
      </div>
    </div>
  );
}

// Keep backwards compatibility
export { SectionHeading as OrganicSectionHeading };
