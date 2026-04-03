package com.example.fleet_backend.dto;

public class PlaceSuggestionDTO {

    private String placeId;
    private String label;
    private String value;
    private String displayName;
    private double lat;
    private double lon;

    public PlaceSuggestionDTO() {
    }

    public PlaceSuggestionDTO(String placeId, String label, String value, String displayName, double lat, double lon) {
        this.placeId = placeId;
        this.label = label;
        this.value = value;
        this.displayName = displayName;
        this.lat = lat;
        this.lon = lon;
    }

    public String getPlaceId() {
        return placeId;
    }

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLon() {
        return lon;
    }

    public void setLon(double lon) {
        this.lon = lon;
    }
}