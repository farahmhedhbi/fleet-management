package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.AiPredictionRequest;
import com.example.fleet_backend.dto.AiPredictionResponse;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiPredictionService {

    private static final String AI_API_URL =
            "http://localhost:8000/predict";

    private final RestTemplate restTemplate;

    public AiPredictionService() {
        this.restTemplate = new RestTemplate();
    }

    public AiPredictionResponse predict(AiPredictionRequest request) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<AiPredictionRequest> entity =
                new HttpEntity<>(request, headers);

        return restTemplate.postForObject(
                AI_API_URL,
                entity,
                AiPredictionResponse.class
        );
    }
}