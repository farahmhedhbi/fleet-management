package com.example.fleet_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DashboardKpiDTO {

    private long totalVehicles;
    private long availableVehicles;
    private long inUseVehicles;
    private long maintenanceVehicles;
    private long reservedVehicles;
    private long outOfServiceVehicles;

    private long plannedMissions;
    private long activeMissions;
    private long completedMissions;
    private long canceledMissions;

    private long openIncidents;
    private long inProgressIncidents;
    private long resolvedIncidents;
    private long criticalIncidents;

    private long plannedMaintenances;
    private long inProgressMaintenances;
    private long doneMaintenances;
    private long overdueMaintenances;
    private long canceledMaintenances;
    private BigDecimal maintenanceTotalCost;

    private long criticalAlertsToday;
    private long warningAlertsToday;

    private LocalDateTime generatedAt;

    public DashboardKpiDTO() {}

    public long getTotalVehicles() { return totalVehicles; }
    public void setTotalVehicles(long totalVehicles) { this.totalVehicles = totalVehicles; }

    public long getAvailableVehicles() { return availableVehicles; }
    public void setAvailableVehicles(long availableVehicles) { this.availableVehicles = availableVehicles; }

    public long getInUseVehicles() { return inUseVehicles; }
    public void setInUseVehicles(long inUseVehicles) { this.inUseVehicles = inUseVehicles; }

    public long getMaintenanceVehicles() { return maintenanceVehicles; }
    public void setMaintenanceVehicles(long maintenanceVehicles) { this.maintenanceVehicles = maintenanceVehicles; }

    public long getReservedVehicles() { return reservedVehicles; }
    public void setReservedVehicles(long reservedVehicles) { this.reservedVehicles = reservedVehicles; }

    public long getOutOfServiceVehicles() { return outOfServiceVehicles; }
    public void setOutOfServiceVehicles(long outOfServiceVehicles) { this.outOfServiceVehicles = outOfServiceVehicles; }

    public long getPlannedMissions() { return plannedMissions; }
    public void setPlannedMissions(long plannedMissions) { this.plannedMissions = plannedMissions; }

    public long getActiveMissions() { return activeMissions; }
    public void setActiveMissions(long activeMissions) { this.activeMissions = activeMissions; }

    public long getCompletedMissions() { return completedMissions; }
    public void setCompletedMissions(long completedMissions) { this.completedMissions = completedMissions; }

    public long getCanceledMissions() { return canceledMissions; }
    public void setCanceledMissions(long canceledMissions) { this.canceledMissions = canceledMissions; }

    public long getOpenIncidents() { return openIncidents; }
    public void setOpenIncidents(long openIncidents) { this.openIncidents = openIncidents; }

    public long getInProgressIncidents() { return inProgressIncidents; }
    public void setInProgressIncidents(long inProgressIncidents) { this.inProgressIncidents = inProgressIncidents; }

    public long getResolvedIncidents() { return resolvedIncidents; }
    public void setResolvedIncidents(long resolvedIncidents) { this.resolvedIncidents = resolvedIncidents; }

    public long getCriticalIncidents() { return criticalIncidents; }
    public void setCriticalIncidents(long criticalIncidents) { this.criticalIncidents = criticalIncidents; }

    public long getPlannedMaintenances() { return plannedMaintenances; }
    public void setPlannedMaintenances(long plannedMaintenances) { this.plannedMaintenances = plannedMaintenances; }

    public long getInProgressMaintenances() { return inProgressMaintenances; }
    public void setInProgressMaintenances(long inProgressMaintenances) { this.inProgressMaintenances = inProgressMaintenances; }

    public long getDoneMaintenances() { return doneMaintenances; }
    public void setDoneMaintenances(long doneMaintenances) { this.doneMaintenances = doneMaintenances; }

    public long getOverdueMaintenances() { return overdueMaintenances; }
    public void setOverdueMaintenances(long overdueMaintenances) { this.overdueMaintenances = overdueMaintenances; }

    public long getCanceledMaintenances() { return canceledMaintenances; }
    public void setCanceledMaintenances(long canceledMaintenances) { this.canceledMaintenances = canceledMaintenances; }

    public BigDecimal getMaintenanceTotalCost() { return maintenanceTotalCost; }
    public void setMaintenanceTotalCost(BigDecimal maintenanceTotalCost) { this.maintenanceTotalCost = maintenanceTotalCost; }

    public long getCriticalAlertsToday() { return criticalAlertsToday; }
    public void setCriticalAlertsToday(long criticalAlertsToday) { this.criticalAlertsToday = criticalAlertsToday; }

    public long getWarningAlertsToday() { return warningAlertsToday; }
    public void setWarningAlertsToday(long warningAlertsToday) { this.warningAlertsToday = warningAlertsToday; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}