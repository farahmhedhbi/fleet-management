package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.OwnerDepot;

public class OwnerDepotDTO {

    private Long id;
    private Boolean enabled;
    private String name;
    private String city;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer radiusMeters;

    public OwnerDepotDTO(OwnerDepot depot) {
        this.id = depot.getId();
        this.enabled = depot.getEnabled();
        this.name = depot.getName();
        this.city = depot.getCity();
        this.address = depot.getAddress();
        this.latitude = depot.getLatitude();
        this.longitude = depot.getLongitude();
        this.radiusMeters = depot.getRadiusMeters();
    }

    public Long getId() { return id; }
    public Boolean getEnabled() { return enabled; }
    public String getName() { return name; }
    public String getCity() { return city; }
    public String getAddress() { return address; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public Integer getRadiusMeters() { return radiusMeters; }
}