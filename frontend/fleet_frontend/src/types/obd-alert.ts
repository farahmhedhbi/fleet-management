export interface ObdAlertDTO {
  code: string;
  severity: string;
  message: string;
}

export interface VehicleHealthSummaryDTO {
  vehicleId: number;
  registrationNumber: string;
  obdStatus: string;
  activeAlertsCount: number;
  fuelLevel: number | null;
  engineTemperature: number | null;
  batteryVoltage: number | null;
  checkEngineOn: boolean;
  maintenanceHint: string;
}