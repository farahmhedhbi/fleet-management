"use client";

interface Props {
  engineRpm: number | null;
  fuelLevel: number | null;
  engineTemperature: number | null;
  batteryVoltage: number | null;
  engineLoad: number | null;
  checkEngineOn: boolean;
}

function formatValue(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${value}${suffix}`;
}

export default function ObdIndicators({
  engineRpm,
  fuelLevel,
  engineTemperature,
  batteryVoltage,
  engineLoad,
  checkEngineOn,
}: Props) {
  const items = [
    { label: "RPM", value: formatValue(engineRpm) },
    { label: "Carburant", value: formatValue(fuelLevel, "%") },
    { label: "Température", value: formatValue(engineTemperature, "°C") },
    { label: "Batterie", value: formatValue(batteryVoltage, "V") },
    { label: "Charge moteur", value: formatValue(engineLoad, "%") },
    { label: "Check engine", value: checkEngineOn ? "ON" : "OFF" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}