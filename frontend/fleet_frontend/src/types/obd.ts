export interface VehicleObdLiveDTO {
  vehicleId: number;
  registrationNumber: string;
  engineOn: boolean;
  engineRpm: number | null;
  fuelLevel: number | null;
  engineTemperature: number | null;
  batteryVoltage: number | null;
  engineLoad: number | null;
  checkEngineOn: boolean;
  obdStatus: string;
  timestamp: string;
}