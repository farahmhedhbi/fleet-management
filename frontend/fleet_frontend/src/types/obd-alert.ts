export interface ObdAlertDTO {
  code: string;
  severity: "OK" | "WARNING" | "CRITICAL" | string;
  message: string;
}

export interface VehicleHealthSummaryDTO {
  vehicleId: number;
  registrationNumber: string;
  obdStatus: "OK" | "WARNING" | "CRITICAL" | string;
  activeAlertsCount: number;
  fuelLevel: number | null;
  engineTemperature: number | null;
  batteryVoltage: number | null;
  checkEngineOn: boolean;
  maintenanceHint: string;
}