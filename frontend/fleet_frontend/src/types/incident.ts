export interface IncidentDTO {
  id: number;
  title: string;
  description: string | null;

  type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: string;

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

export type IncidentStatus =
  | "REPORTED"
  | "VALIDATED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";