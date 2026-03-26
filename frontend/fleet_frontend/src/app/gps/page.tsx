import GpsMap from "@/components/GpsMap";

export default function GpsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Suivi GPS en temps réel
        </h1>
        <p className="text-sm text-gray-500">
          Dernière position du véhicule simulé
        </p>
      </div>

      <GpsMap />
    </div>
  );
}