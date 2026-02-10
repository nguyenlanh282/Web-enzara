"use client";

import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

type AnimationType =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "fade"
  | "scale"
  | "blur";

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const animationStyles: Record<AnimationType, { hidden: string; visible: string }> = {
  "fade-up": {
    hidden: "opacity-0 translate-y-8",
    visible: "opacity-100 translate-y-0",
  },
  "fade-down": {
    hidden: "opacity-0 -translate-y-8",
    visible: "opacity-100 translate-y-0",
  },
  "fade-left": {
    hidden: "opacity-0 translate-x-8",
    visible: "opacity-100 translate-x-0",
  },
  "fade-right": {
    hidden: "opacity-0 -translate-x-8",
    visible: "opacity-100 translate-x-0",
  },
  fade: {
    hidden: "opacity-0",
    visible: "opacity-100",
  },
  scale: {
    hidden: "opacity-0 scale-95",
    visible: "opacity-100 scale-100",
  },
  blur: {
    hidden: "opacity-0 blur-sm",
    visible: "opacity-100 blur-0",
  },
};

export function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 600,
  className,
  once = true,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollAnimation({ once });
  const { hidden, visible } = animationStyles[animation];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all will-change-[transform,opacity]",
        isVisible ? visible : hidden,
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </div>
  );
}

interface StaggerRevealProps {
  children: React.ReactNode[];
  animation?: AnimationType;
  staggerDelay?: number;
  duration?: number;
  className?: string;
  childClassName?: string;
}

export function StaggerReveal({
  children,
  animation = "fade-up",
  staggerDelay = 100,
  duration = 600,
  className,
  childClassName,
}: StaggerRevealProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <ScrollReveal
          key={i}
          animation={animation}
          delay={i * staggerDelay}
          duration={duration}
          className={childClassName}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
