package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.LiveStatus;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LiveStateService {

    private final VehicleLiveStateRepository vehicleLiveStateRepository;

    public LiveStateService(VehicleLiveStateRepository vehicleLiveStateRepository) {
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
    }

    public void updateLiveState(Vehicle vehicle,
                                GpsData gpsData,
                                LiveStatus liveStatus,
                                ActiveMissionContext context,
                                String obdStatus) {
        VehicleLiveState state = vehicleLiveStateRepository.findByVehicleId(vehicle.getId())
                .orElseGet(VehicleLiveState::new);

        state.setVehicle(vehicle);

        state.setLatitude(gpsData.getLatitude());
        state.setLongitude(gpsData.getLongitude());
        state.setSpeed(gpsData.getSpeed());
        state.setEngineOn(gpsData.isEngineOn());
        state.setLastTimestamp(gpsData.getTimestamp());
        state.setLiveStatus(liveStatus);

        state.setMissionId(context.getMissionId());
        state.setMissionStatus(context.getMissionStatus());
        state.setDriverId(context.getDriverId());
        state.setDriverName(context.getDriverName());

        state.setRouteId(gpsData.getRouteId());
        state.setRouteSource(gpsData.getRouteSource());

        state.setEngineRpm(gpsData.getEngineRpm());
        state.setFuelLevel(gpsData.getFuelLevel());
        state.setEngineTemperature(gpsData.getEngineTemperature());
        state.setBatteryVoltage(gpsData.getBatteryVoltage());
        state.setEngineLoad(gpsData.getEngineLoad());
        state.setCheckEngineOn(gpsData.getCheckEngineOn());
        state.setObdStatus(obdStatus);

        vehicleLiveStateRepository.save(state);
    }

    public void clearLiveMissionContext(Long vehicleId) {
        VehicleLiveState state = vehicleLiveStateRepository.findByVehicleId(vehicleId).orElse(null);
        if (state == null) {
            return;
        }

        state.setMissionId(null);
        state.setMissionStatus(null);
        state.setDriverId(null);
        state.setDriverName(null);

        if (state.getLiveStatus() == LiveStatus.MISSION_COMPLETED) {
            state.setLiveStatus(state.isEngineOn() ? LiveStatus.STOPPED : LiveStatus.ENGINE_OFF);
        }

        vehicleLiveStateRepository.save(state);
    }
}