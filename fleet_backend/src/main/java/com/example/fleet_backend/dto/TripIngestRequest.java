package com.example.fleet_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class TripIngestRequest {

    @NotNull
    private Long vehicle_id;

    @NotNull
    private Long driver_id;

    @NotNull @Positive
    private Integer distance;

    @NotNull @Positive
    private Integer duration;

    @NotNull
    private String date; // "YYYY-MM-DD"

    public Long getVehicle_id() { return vehicle_id; }
    public void setVehicle_id(Long vehicle_id) { this.vehicle_id = vehicle_id; }
    public Long getDriver_id() { return driver_id; }
    public void setDriver_id(Long driver_id) { this.driver_id = driver_id; }
    public Integer getDistance() { return distance; }
    public void setDistance(Integer distance) { this.distance = distance; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}
