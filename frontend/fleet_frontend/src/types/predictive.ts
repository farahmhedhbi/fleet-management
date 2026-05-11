export interface PredictiveAlertDTO {
  id: number;
  vehicleId: number;

  type: string;
  riskLevel: string;
  riskScore: number;

  title: string;
  message: string;
  recommendation: string;

  resolved: boolean;

  createdAt: string;
  resolvedAt?: string | null;
}