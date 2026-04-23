package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.GpsIncomingDTO;
import com.example.fleet_backend.dto.GpsPointDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.service.gps.GpsIngestionService;
import com.example.fleet_backend.service.gps.GpsQueryService;
import com.example.fleet_backend.service.gps.LiveStateService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class GpsService {

    private final GpsIngestionService gpsIngestionService;
    private final GpsQueryService gpsQueryService;
    private final LiveStateService liveStateService;

    public GpsService(GpsIngestionService gpsIngestionService,
                      GpsQueryService gpsQueryService,
                      LiveStateService liveStateService) {
        this.gpsIngestionService = gpsIngestionService;
        this.gpsQueryService = gpsQueryService;
        this.liveStateService = liveStateService;
    }

    public void processIncomingGps(GpsIncomingDTO dto) {
        gpsIngestionService.processIncomingGps(dto);
    }

    public Optional<GpsPointDTO> getLastPositionSecured(Long vehicleId, Authentication auth) {
        return gpsQueryService.getLastPositionSecured(vehicleId, auth);
    }

    public List<GpsPointDTO> getHistorySecured(Long vehicleId, Authentication auth) {
        return gpsQueryService.getHistorySecured(vehicleId, auth);
    }

    public List<GpsPointDTO> getHistoryRangeSecured(Long vehicleId,
                                                    LocalDateTime from,
                                                    LocalDateTime to,
                                                    Authentication auth) {
        return gpsQueryService.getHistoryRangeSecured(vehicleId, from, to, auth);
    }

    public List<VehicleLiveStatusDTO> getLiveFleetSecured(Authentication auth) {
        return gpsQueryService.getLiveFleetSecured(auth);
    }

    public VehicleLiveStatusDTO getMissionLiveSecured(Long missionId, Authentication auth) {
        return gpsQueryService.getMissionLiveSecured(missionId, auth);
    }

    public List<GpsPointDTO> getMissionHistorySecured(Long missionId,
                                                      LocalDateTime from,
                                                      LocalDateTime to,
                                                      Authentication auth) {
        return gpsQueryService.getMissionHistorySecured(missionId, from, to, auth);
    }

    public void clearLiveMissionContext(Long vehicleId) {
        liveStateService.clearLiveMissionContext(vehicleId);
    }
}