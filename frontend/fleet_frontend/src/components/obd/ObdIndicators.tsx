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

function getCardClass(label: string, value: number | null, checkEngineOn: boolean) {
  if (label === "Check engine" && checkEngineOn) {
    return "border-red-200 bg-red-50";
  }

  if (label === "Température" && value !== null && value >= 115) {
    return "border-red-200 bg-red-50";
  }

  if (label === "Température" && value !== null && value >= 105) {
    return "border-amber-200 bg-amber-50";
  }

  if (label === "Carburant" && value !== null && value <= 8) {
    return "border-red-200 bg-red-50";
  }

  if (label === "Carburant" && value !== null && value <= 15) {
    return "border-amber-200 bg-amber-50";
  }

  if (label === "Batterie" && value !== null && value <= 11.2) {
    return "border-red-200 bg-red-50";
  }

  if (label === "Batterie" && value !== null && value <= 11.8) {
    return "border-amber-200 bg-amber-50";
  }

  return "border-slate-200 bg-white";
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
    { label: "RPM", value: formatValue(engineRpm), raw: engineRpm },
    { label: "Carburant", value: formatValue(fuelLevel, "%"), raw: fuelLevel },
    {
      label: "Température",
      value: formatValue(engineTemperature, "°C"),
      raw: engineTemperature,
    },
    { label: "Batterie", value: formatValue(batteryVoltage, "V"), raw: batteryVoltage },
    { label: "Charge moteur", value: formatValue(engineLoad, "%"), raw: engineLoad },
    { label: "Check engine", value: checkEngineOn ? "ON" : "OFF", raw: null },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border p-4 shadow-sm ${getCardClass(
            item.label,
            item.raw,
            checkEngineOn
          )}`}
        >
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}