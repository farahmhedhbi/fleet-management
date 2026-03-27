import { GpsFilterStatus, LiveStatus, VehicleLiveStatusDTO } from "@/types/gps";

export function getStatusLabel(status: LiveStatus): string {
  switch (status) {
    case "EN_MISSION":
      return "En mission";
    case "HORS_MISSION":
      return "Hors mission";
    case "INACTIF":
      return "Inactif";
    case "OFFLINE":
      return "Offline";
    default:
      return status;
  }
}

export function getStatusClasses(status: LiveStatus): string {
  switch (status) {
    case "EN_MISSION":
      return "border-green-200 bg-green-50 text-green-700";
    case "HORS_MISSION":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "INACTIF":
      return "border-gray-200 bg-gray-100 text-gray-700";
    case "OFFLINE":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-100 text-gray-700";
  }
}

export function formatTimestamp(value: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR");
}

export function filterVehicles(
  vehicles: VehicleLiveStatusDTO[],
  filter: GpsFilterStatus,
  search: string
): VehicleLiveStatusDTO[] {
  const normalizedSearch = search.trim().toLowerCase();

  return vehicles.filter((vehicle) => {
    const matchesFilter =
      filter === "ALL" ? true : vehicle.liveStatus === filter;

    const matchesSearch =
      normalizedSearch.length === 0
        ? true
        : vehicle.vehicleName.toLowerCase().includes(normalizedSearch) ||
          (vehicle.currentDriverName || "").toLowerCase().includes(normalizedSearch) ||
          (vehicle.routeId || "").toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });
}

export function countByStatus(
  vehicles: VehicleLiveStatusDTO[],
  status: LiveStatus
): number {
  return vehicles.filter((vehicle) => vehicle.liveStatus === status).length;
}