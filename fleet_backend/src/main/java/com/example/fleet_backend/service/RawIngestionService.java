package com.example.fleet_backend.service;

import com.example.fleet_backend.model.RawData;
import com.example.fleet_backend.repository.RawDataRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RawIngestionService {

    private final RawDataRepository rawRepo;
    private final ObjectMapper mapper;

    public RawIngestionService(RawDataRepository rawRepo, ObjectMapper mapper) {
        this.rawRepo = rawRepo;
        this.mapper = mapper;
    }

    @Transactional
    public RawData saveApiPayload(Object payload) {
        JsonNode node = mapper.valueToTree(payload);
        return rawRepo.save(new RawData("API", node, null, null));
    }

    @Transactional
    public RawData saveCsvRow(JsonNode row, String fileName, int rowNumber) {
        return rawRepo.save(new RawData("CSV", row, fileName, rowNumber));
    }
}
