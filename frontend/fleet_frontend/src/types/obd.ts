export interface VehicleObdLiveDTO {
  vehicleId: number;
  registrationNumber: string;
  engineOn: boolean;
  engineRpm: number | null;
  fuelLevel: number | null;
  engineTemperature: number | null;
  batteryVoltage: number | null;
  engineLoad: number | null;
  checkEngineOn: boolean | null;
  obdStatus: string;
  timestamp: string;
}

export interface ObdHistoryItem {
  id: number;
  vehicleId: number;
  engineRpm: number | null;
  fuelLevel: number | null;
  engineTemperature: number | null;
  batteryVoltage: number | null;
  engineLoad: number | null;
  checkEngineOn: boolean | null;
  timestamp: string;
}