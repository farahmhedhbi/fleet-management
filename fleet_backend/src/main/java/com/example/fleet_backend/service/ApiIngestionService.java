package com.example.fleet_backend.service;

import com.example.fleet_backend.model.RawData;
import com.example.fleet_backend.repository.RawDataRepository;
import com.example.fleet_backend.dto.TripPayload;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ApiIngestionService {

    private final RawDataRepository rawRepo;
    private final ObjectMapper objectMapper;

    // ✅ Injecter ObjectMapper (bonne pratique Spring)
    public ApiIngestionService(RawDataRepository rawRepo, ObjectMapper objectMapper) {
        this.rawRepo = rawRepo;
        this.objectMapper = objectMapper;
    }

    public void ingestTrip(TripPayload payload) {
        if (payload == null) {
            throw new IllegalArgumentException("Payload manquant");
        }

        // ✅ validation simple
        if (payload.getVehicle_id() == null || payload.getVehicle_id() <= 0 ||
                payload.getDriver_id() == null || payload.getDriver_id() <= 0) {
            throw new IllegalArgumentException("vehicle_id et driver_id doivent être > 0");
        }

        // ✅ IMPORTANT: stocker en JsonNode (pas String)
        JsonNode rawJson = objectMapper.valueToTree(payload);

        rawRepo.save(new RawData("API", rawJson));
    }
}
