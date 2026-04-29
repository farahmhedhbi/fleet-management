export interface IncidentDTO {
  id: number;
  title: string;
  description: string | null;

  type: string;
  severity: string;
  status: string;
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
}

export type IncidentStatus =
  | "REPORTED"
  | "VALIDATED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export type IncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";