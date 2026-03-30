export interface VehicleEventDTO {
  id: number;
  vehicleId: number;
  missionId: number | null;
  eventType: string;
  severity: string;
  message: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  createdAt: string;
  acknowledged: boolean;
}