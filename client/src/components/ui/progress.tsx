"use client";

type ProgressBarProps = {
  value: number; // 0-100
  color?: string; // np. "chart-1", "chart-2"
  className?: string;
};

export function ProgressBar({ value, color = "chart-2", className }: ProgressBarProps) {
  return (
    <div
      className={`w-full h-3 bg-muted rounded-md overflow-hidden ${className ?? ""}`}
      style={{ borderRadius: "var(--radius)" }}
    >
      <div
        className={`h-full transition-all duration-300`}
        style={{
          width: `${Math.min(value, 100)}%`,
          backgroundColor: `hsl(var(--${color}))`,
        }}
      />
    </div>
  );
}
