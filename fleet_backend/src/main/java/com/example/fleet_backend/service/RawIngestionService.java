package com.example.fleet_backend.service;

import com.example.fleet_backend.model.RawData;
import com.example.fleet_backend.repository.RawDataRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RawIngestionService {

    private final RawDataRepository rawDataRepository;
    private final ObjectMapper objectMapper;

    public RawIngestionService(RawDataRepository rawDataRepository, ObjectMapper objectMapper) {
        this.rawDataRepository = rawDataRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public RawData saveApiPayload(Object payload) {
        JsonNode node = objectMapper.valueToTree(payload);
        return rawDataRepository.save(new RawData("API", node));
    }

    @Transactional
    public RawData saveCsvRow(JsonNode csvRowAsJson) {
        return rawDataRepository.save(new RawData("CSV", csvRowAsJson));
    }
}

