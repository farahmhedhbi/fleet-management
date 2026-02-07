package com.example.fleet_backend.service;



import com.example.fleet_backend.model.RawData;
import com.example.fleet_backend.repository.RawDataRepository;
import com.example.fleet_backend.dto.TripPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ApiIngestionService {

    private final RawDataRepository rawRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ApiIngestionService(RawDataRepository rawRepo) {
        this.rawRepo = rawRepo;
    }

    public void ingestTrip(TripPayload payload) throws Exception {
        // Si besoin de validation supplémentaire simple:
        if (payload.getVehicle_id() <= 0 || payload.getDriver_id() <= 0) {
            throw new IllegalArgumentException("vehicle_id et driver_id doivent être > 0");
        }

        String rawJson = objectMapper.writeValueAsString(payload);
        rawRepo.save(new RawData("API", rawJson));
    }
}

