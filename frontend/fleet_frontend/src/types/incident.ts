export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentSource = "DRIVER" | "OWNER" | "SYSTEM";

export type IncidentType =
  | "ACCIDENT"
  | "VEHICLE_BREAKDOWN"
  | "ROAD_ISSUE"
  | "DANGER"
  | "MISSION_PROBLEM"
  | "GPS_ANOMALY"
  | "OBD_ALERT"
  | "DRIVER_BEHAVIOR"
  | "OTHER";

export interface IncidentDTO {
  id: number;
  title: string;
  description: string | null;

  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;

  vehicleId: number | null;
  vehicleRegistrationNumber: string | null;

  missionId: number | null;
  missionTitle: string | null;

  vehicleEventId: number | null;

  reportedByUserId: number | null;
  reportedByEmail: string | null;

  handledByUserId: number | null;
  handledByEmail: string | null;

  reportedAt: string | null;
  validatedAt: string | null;
  resolvedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  groupKey: string | null;
  eventCount: number | null;
  lastEventAt: string | null;

  latitude: number | null;
  longitude: number | null;
  emergency: boolean | null;
}