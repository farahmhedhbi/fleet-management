package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.dto.GpsPointDTO;
import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.LiveStatus;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GpsMapperService {

    public GpsPointDTO toGpsPointDTO(GpsData gps) {
        return new GpsPointDTO(
                gps.getId(),
                gps.getVehicle().getId(),
                gps.getMissionId(),
                gps.getLatitude(),
                gps.getLongitude(),
                gps.getSpeed(),
                gps.isEngineOn(),
                gps.getTimestamp(),
                gps.getRouteId(),
                gps.getRouteSource()
        );
    }

    public VehicleLiveStatusDTO toVehicleLiveStatusDTO(Vehicle vehicle,
                                                       VehicleLiveState state,
                                                       boolean missionActive,
                                                       List<MissionRoutePointDTO> missionRoute) {
        return new VehicleLiveStatusDTO(
                vehicle.getId(),
                resolveVehicleName(vehicle),
                state.getLatitude(),
                state.getLongitude(),
                state.getSpeed(),
                state.isEngineOn(),
                state.getLastTimestamp(),
                state.getLiveStatus() != null ? state.getLiveStatus().name() : LiveStatus.NO_DATA.name(),
                missionActive,
                state.getMissionId(),
                state.getMissionStatus(),
                state.getDriverId(),
                state.getDriverName(),
                state.getRouteId(),
                state.getRouteSource(),
                missionRoute
        );
    }

    public VehicleLiveStatusDTO toNoDataVehicleLiveStatusDTO(Vehicle vehicle,
                                                             boolean missionActive,
                                                             Long missionId,
                                                             String missionStatus,
                                                             Long driverId,
                                                             String driverName,
                                                             List<MissionRoutePointDTO> missionRoute) {
        return new VehicleLiveStatusDTO(
                vehicle.getId(),
                resolveVehicleName(vehicle),
                null,
                null,
                0.0,
                false,
                null,
                LiveStatus.NO_DATA.name(),
                missionActive,
                missionId,
                missionStatus,
                driverId,
                driverName,
                null,
                null,
                missionRoute
        );
    }

    public String resolveVehicleName(Vehicle vehicle) {
        String registration = vehicle.getRegistrationNumber() != null ? vehicle.getRegistrationNumber() : "";
        String brand = vehicle.getBrand() != null ? vehicle.getBrand() : "";
        String model = vehicle.getModel() != null ? vehicle.getModel() : "";

        String joined = (brand + " " + model + " " + registration).trim();
        return joined.isBlank() ? "Vehicle #" + vehicle.getId() : joined;
    }
}