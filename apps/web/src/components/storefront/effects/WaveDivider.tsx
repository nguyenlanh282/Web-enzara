/**
 * SVG wave divider between sections.
 * Use to create organic, flowing transitions.
 */

interface WaveDividerProps {
  className?: string;
  fill?: string;
  flip?: boolean;
}

export function WaveDivider({
  className = "",
  fill = "#F5F5F0",
  flip = false,
}: WaveDividerProps) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""} ${className}`}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full h-[40px] sm:h-[60px] lg:h-[80px]"
      >
        <path
          d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

export function WaveDividerSoft({
  className = "",
  fill = "#f0f3e4",
  flip = false,
}: WaveDividerProps) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""} ${className}`}
    >
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="w-full h-[30px] sm:h-[45px] lg:h-[60px]"
      >
        <path
          d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,60 L0,60 Z"
          fill={fill}
          opacity="0.5"
        />
        <path
          d="M0,35 C300,10 600,50 900,30 C1100,15 1300,45 1440,35 L1440,60 L0,60 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
