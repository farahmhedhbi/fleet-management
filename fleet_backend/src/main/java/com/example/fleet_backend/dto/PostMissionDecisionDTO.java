package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.PostMissionDecision;

public class PostMissionDecisionDTO {

    private PostMissionDecision decision;
    private Long missionId;
    private Long vehicleId;
    private Long driverId;
    private String message;
    private boolean returnDepotSuggested;
    private boolean vehicleAssignable;
    private boolean driverAssignable;

    public PostMissionDecisionDTO() {}

    public PostMissionDecisionDTO(
            PostMissionDecision decision,
            Long missionId,
            Long vehicleId,
            Long driverId,
            String message,
            boolean returnDepotSuggested,
            boolean vehicleAssignable,
            boolean driverAssignable
    ) {
        this.decision = decision;
        this.missionId = missionId;
        this.vehicleId = vehicleId;
        this.driverId = driverId;
        this.message = message;
        this.returnDepotSuggested = returnDepotSuggested;
        this.vehicleAssignable = vehicleAssignable;
        this.driverAssignable = driverAssignable;
    }

    public PostMissionDecision getDecision() { return decision; }
    public void setDecision(PostMissionDecision decision) { this.decision = decision; }

    public Long getMissionId() { return missionId; }
    public void setMissionId(Long missionId) { this.missionId = missionId; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isReturnDepotSuggested() { return returnDepotSuggested; }
    public void setReturnDepotSuggested(boolean returnDepotSuggested) { this.returnDepotSuggested = returnDepotSuggested; }

    public boolean isVehicleAssignable() { return vehicleAssignable; }
    public void setVehicleAssignable(boolean vehicleAssignable) { this.vehicleAssignable = vehicleAssignable; }

    public boolean isDriverAssignable() { return driverAssignable; }
    public void setDriverAssignable(boolean driverAssignable) { this.driverAssignable = driverAssignable; }
}