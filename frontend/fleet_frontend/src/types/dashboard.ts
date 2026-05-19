export interface DashboardKpiDTO {
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  reservedVehicles: number;
  outOfServiceVehicles: number;

  plannedMissions: number;
  activeMissions: number;
  completedMissions: number;
  canceledMissions: number;

  openIncidents: number;
  inProgressIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;

  plannedMaintenances: number;
  inProgressMaintenances: number;
  doneMaintenances: number;
  overdueMaintenances: number;
  canceledMaintenances: number;

  maintenanceTotalCost: number;

  criticalAlertsToday: number;
  warningAlertsToday: number;

  generatedAt?: string;
}