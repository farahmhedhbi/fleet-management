package com.example.fleet_backend.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class CsvImportService {

    private static final List<String> REQUIRED_HEADERS =
            List.of("vehicle_id", "driver_id", "distance", "duration", "date");

    private final RawIngestionService rawIngestionService;
    private final ObjectMapper mapper;

    public CsvImportService(RawIngestionService rawIngestionService, ObjectMapper mapper) {
        this.rawIngestionService = rawIngestionService;
        this.mapper = mapper;
    }

    public int importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty");
        }

        String fileName = file.getOriginalFilename();

        try (InputStreamReader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().withTrim().parse(reader)
        ) {
            List<String> headers = parser.getHeaderNames();
            if (!headers.containsAll(REQUIRED_HEADERS)) {
                throw new IllegalArgumentException("CSV missing required columns: " + REQUIRED_HEADERS);
            }

            int rowNumber = 1;
            int count = 0;

            for (CSVRecord record : parser) {
                ObjectNode row = mapper.createObjectNode();
                for (String h : headers) row.put(h, record.get(h));

                validateTripRow(row);

                rawIngestionService.saveCsvRow(row, fileName, rowNumber);
                rowNumber++;
                count++;
            }

            return count;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("CSV import failed: " + e.getMessage(), e);
        }
    }

    private void validateTripRow(ObjectNode row) {
        parsePositiveLong(row.get("vehicle_id").asText(), "vehicle_id");
        parsePositiveLong(row.get("driver_id").asText(), "driver_id");
        parsePositiveInt(row.get("distance").asText(), "distance");
        parsePositiveInt(row.get("duration").asText(), "duration");

        String date = row.get("date").asText();
        if (date == null || !date.matches("\\d{4}-\\d{2}-\\d{2}")) {
            throw new IllegalArgumentException("date must be YYYY-MM-DD");
        }
    }

    private int parsePositiveInt(String value, String field) {
        try {
            int v = Integer.parseInt(value);
            if (v <= 0) throw new IllegalArgumentException(field + " must be > 0");
            return v;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(field + " must be a number");
        }
    }

    private long parsePositiveLong(String value, String field) {
        try {
            long v = Long.parseLong(value);
            if (v <= 0) throw new IllegalArgumentException(field + " must be > 0");
            return v;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(field + " must be a number");
        }
    }
}
