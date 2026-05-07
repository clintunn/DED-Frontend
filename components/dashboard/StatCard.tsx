import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: number;
  trend?: number;
  tone?: "neutral" | "positive" | "danger";
  variant?: "default" | "hero";
  /** Lighter typography like secondary KPIs in Dribbble-style dashboards */
  valueEmphasis?: "primary" | "secondary";
  /** Omit elevated bordered chrome — sits inside a parent overview panel */
  inset?: boolean;
  helper?: string;
  icon?: ReactNode;
};

export function StatCard({
  title,
  value,
  trend,
  tone = "neutral",
  variant = "default",
  valueEmphasis = "primary",
  inset = false,
  helper,
  icon,
}: StatCardProps) {
  const formatted = value.toLocaleString();
  const trendPositive = typeof trend === "number" ? trend >= 0 : null;

  const chrome = inset
    ? "rounded-xl border-0 bg-transparent p-0 shadow-none hover:translate-y-0 hover:shadow-none"
    : `rounded-xl border border-subtleBorder/70 bg-raised p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        variant === "hero" ? "sm:p-6" : ""
      }`;

  const valueClass =
    valueEmphasis === "secondary"
      ? "text-2xl font-semibold tabular-nums text-brand/75"
      : variant === "hero"
        ? "text-4xl font-semibold tabular-nums text-ink"
        : "text-3xl font-semibold tabular-nums text-ink";

  const iconWrapClass =
    valueEmphasis === "secondary"
      ? "rounded-full bg-surface/90 text-brand/80"
      : tone === "positive"
        ? "rounded-full bg-emerald-100 text-emerald-700"
        : tone === "danger"
          ? "rounded-full bg-rose-100 text-rose-700"
          : "rounded-full bg-surface text-brand";

  return (
    <div className={`min-w-0 ${chrome}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-brand">{title}</p>
        {icon ? (
          <span
            className={`inline-flex h-9 w-9 items-center justify-center ${iconWrapClass}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-3 ${valueClass}`}>{formatted}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {typeof trend === "number" ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              trendPositive
                ? tone === "danger"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
                : tone === "danger"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
            }`}
          >
            <span aria-hidden="true">{trendPositive ? "↑" : "↓"}</span>
            {Math.abs(trend).toFixed(1)}%
          </span>
        ) : (
          <span className="text-xs text-brand">-</span>
        )}
        <span className="text-xs text-brand">{helper ?? "vs last 7 days"}</span>
      </div>
    </div>
  );
}
