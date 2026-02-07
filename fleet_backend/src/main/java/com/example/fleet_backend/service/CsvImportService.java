package com.example.fleet_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Service
public class CsvImportService {

    private final RawIngestionService rawIngestionService;
    private final ObjectMapper objectMapper;

    public CsvImportService(RawIngestionService rawIngestionService, ObjectMapper objectMapper) {
        this.rawIngestionService = rawIngestionService;
        this.objectMapper = objectMapper;
    }

    public int importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("CSV file is empty");

        try (InputStreamReader reader =
                     new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser =
                     CSVFormat.DEFAULT.withFirstRecordAsHeader().withTrim().parse(reader)
        ) {
            int count = 0;
            for (CSVRecord record : parser) {
                ObjectNode rowJson = objectMapper.createObjectNode();
                for (String header : parser.getHeaderNames()) {
                    rowJson.put(header, record.get(header));
                }
                JsonNode rowNode = rowJson;
                rawIngestionService.saveCsvRow(rowNode);
                count++;
            }
            return count;
        } catch (Exception e) {
            throw new RuntimeException("CSV import failed: " + e.getMessage(), e);
        }
    }
}
