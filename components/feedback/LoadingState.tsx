type LoadingVariant = "inline" | "cards" | "table";

type LoadingStateProps = {
  variant?: LoadingVariant;
  /** Shown for `inline` or above skeletons when provided */
  label?: string;
};

export function LoadingState({
  variant = "inline",
  label = "Loading…",
}: LoadingStateProps) {
  if (variant === "cards") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-brand">{label}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-surface shadow-soft ring-1 ring-subtleBorder/40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-brand">{label}</p>
        <div className="overflow-hidden rounded-2xl bg-raised shadow-soft ring-1 ring-subtleBorder/50">
          <div className="divide-y divide-subtleBorder">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse bg-surface/80"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <p className="text-sm text-brand">{label}</p>
  );
}
