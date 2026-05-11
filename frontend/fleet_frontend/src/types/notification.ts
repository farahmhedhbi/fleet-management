export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  missionId?: number | null;
  vehicleId?: number | null;
}