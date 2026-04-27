package com.example.fleet_backend.model;

public enum VehicleEventType {
    ENGINE_ON,
    ENGINE_OFF,
    OVERSPEED,
    STOP_LONG,
    OFF_ROUTE,
    MISSION_STARTED,
    MISSION_COMPLETED,
    NO_SIGNAL,

    OBD_LOW_FUEL,
    OBD_HIGH_TEMP,
    OBD_LOW_BATTERY,
    OBD_CHECK_ENGINE,

    ENGINE_FAILURE,
    SUDDEN_STOP,
    MISSION_INTERRUPTED
}