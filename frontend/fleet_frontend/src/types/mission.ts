export type MissionStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELED";

export type Mission = {
  id: number;
  title: string;
  description?: string | null;
  startDate: string; // ISO
  endDate: string;   // ISO
  status: MissionStatus;

  vehicleId: number;
  vehicleRegistrationNumber?: string;

  driverId: number;
  driverName?: string;
  driverEmail?: string;
};

export type MissionDTO = {
  title: string;
  description?: string | null;
  startDate: string; // "YYYY-MM-DD" or ISO (better ISO)
  endDate: string;
  status?: MissionStatus;
  vehicleId: number;
  driverId: number;
};