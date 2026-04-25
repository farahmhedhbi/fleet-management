"use client";

interface Props {
  status?: string | null;
}

export default function VehicleHealthBadge({ status }: Props) {
  const normalized = (status || "UNKNOWN").toUpperCase();

  const styles: Record<string, string> = {
    OK: "bg-emerald-100 text-emerald-700 border-emerald-200",
    WARNING: "bg-amber-100 text-amber-700 border-amber-200",
    CRITICAL: "bg-red-100 text-red-700 border-red-200",
    UNKNOWN: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[normalized] || styles.UNKNOWN
      }`}
    >
      {normalized}
    </span>
  );
}