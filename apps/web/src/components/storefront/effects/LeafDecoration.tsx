"use client";

/**
 * Floating leaf SVG decorations.
 * Used as ambient background elements.
 */

interface LeafDecorationProps {
  className?: string;
  variant?: "leaf-1" | "leaf-2" | "leaf-3";
  size?: number;
  color?: string;
}

function LeafSVG({ variant, size, color }: { variant: string; size: number; color: string }) {
  if (variant === "leaf-2") {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path
          d="M20 4C20 4 8 12 8 24C8 32 13 36 20 36C27 36 32 32 32 24C32 12 20 4 20 4Z"
          fill={color}
          opacity="0.12"
        />
        <path d="M20 8V32" stroke={color} strokeWidth="0.8" opacity="0.2" />
        <path d="M20 16L14 20" stroke={color} strokeWidth="0.6" opacity="0.15" />
        <path d="M20 22L26 18" stroke={color} strokeWidth="0.6" opacity="0.15" />
      </svg>
    );
  }

  if (variant === "leaf-3") {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <ellipse
          cx="20"
          cy="20"
          rx="10"
          ry="16"
          transform="rotate(-30 20 20)"
          fill={color}
          opacity="0.1"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="10"
          ry="16"
          transform="rotate(30 20 20)"
          fill={color}
          opacity="0.08"
        />
      </svg>
    );
  }

  // leaf-1 (default)
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M10 30C10 30 12 8 30 4C30 4 28 26 10 30Z"
        fill={color}
        opacity="0.1"
      />
      <path
        d="M12 28C16 20 22 14 28 6"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.15"
      />
    </svg>
  );
}

export function LeafDecoration({
  className = "",
  variant = "leaf-1",
  size = 60,
  color = "#626c13",
}: LeafDecorationProps) {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <LeafSVG variant={variant} size={size} color={color} />
    </div>
  );
}

/**
 * A set of floating leaves for ambient decoration.
 */
export function FloatingLeaves({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <LeafDecoration
        variant="leaf-1"
        size={70}
        className="absolute top-[10%] left-[5%] animate-float opacity-60"
      />
      <LeafDecoration
        variant="leaf-2"
        size={50}
        className="absolute top-[20%] right-[8%] animate-float-reverse opacity-50"
        color="#8a9a4a"
      />
      <LeafDecoration
        variant="leaf-3"
        size={80}
        className="absolute bottom-[15%] left-[12%] animate-sway opacity-40"
      />
      <LeafDecoration
        variant="leaf-1"
        size={45}
        className="absolute bottom-[25%] right-[15%] animate-float opacity-50"
        color="#a4b760"
      />
    </div>
  );
}
