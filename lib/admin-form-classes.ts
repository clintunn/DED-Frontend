/** Shared Tailwind strings for admin panels, tables, auth (semantic tokens, Monitoring-adjacent). */

export const adminPanelClass =
  "rounded-2xl bg-raised p-4 shadow-soft ring-1 ring-subtleBorder/50 sm:p-6";

/** Login/register segmented control shell (active uses accent — see below). */
export const adminAuthModeShell =
  "flex flex-col gap-2 rounded-lg border border-subtleBorder bg-surface p-1 sm:grid sm:grid-cols-2 sm:gap-0";

export const adminAuthModeActive =
  "min-h-[2.5rem] rounded-md px-3 py-2 text-sm font-medium transition-colors bg-accent text-white";

export const adminAuthModeIdle =
  "min-h-[2.5rem] rounded-md px-3 py-2 text-sm font-medium transition-colors text-brand hover:bg-background";

export const adminInputClass =
  "mt-1 w-full rounded-lg border border-subtleBorder bg-raised px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-brand/60 focus:border-brand focus:ring-2 focus:ring-accent/25";

export const adminPrimaryButton =
  "rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50";

export const adminSecondaryButton =
  "rounded-lg border border-subtleBorder px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50";

export const adminSecondaryButtonCompact =
  "rounded-lg border border-subtleBorder px-3 py-1.5 text-sm text-brand transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50";

export const adminTableActionButton =
  "rounded-lg border border-subtleBorder px-2.5 py-1 text-xs font-medium text-brand transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export const adminDangerOutlineButton =
  "rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 disabled:opacity-50";

export const adminDangerOutlineButtonCompact =
  "rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 disabled:opacity-50";
