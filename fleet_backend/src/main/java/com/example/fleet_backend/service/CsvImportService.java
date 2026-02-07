package com.example.fleet_backend.service;



import com.example.fleet_backend.csv.CsvImportResult;
import com.example.fleet_backend.model.RawData;
import com.example.fleet_backend.repository.RawDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class CsvImportService {

    private final RawDataRepository rawRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CsvImportService(RawDataRepository rawRepo) {
        this.rawRepo = rawRepo;
    }

    public CsvImportResult importCsv(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier CSV vide ou manquant.");
        }
        if (!Objects.requireNonNull(file.getOriginalFilename()).toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Le fichier doit être un .csv");
        }

        // Lecture CSV : première ligne = header
        try (CSVParser parser = CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build()
                .parse(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            Map<String, Integer> headerMap = parser.getHeaderMap();
            if (headerMap == null || headerMap.isEmpty()) {
                throw new IllegalArgumentException("CSV invalide: header (noms de colonnes) manquant.");
            }

            // Validation minimale : exiger certaines colonnes (à adapter)
            // Exemple: trajets -> vehicle_id, driver_id, distance, duration, date
            List<String> required = List.of("vehicle_id","driver_id","distance","duration","date");
            for (String col : required) {
                if (!headerMap.containsKey(col)) {
                    throw new IllegalArgumentException("Colonne manquante: " + col);
                }
            }

            int count = 0;

            for (CSVRecord r : parser) {
                // Validation minimale sur champs obligatoires non vides
                for (String col : required) {
                    String v = r.get(col);
                    if (v == null || v.isBlank()) {
                        throw new IllegalArgumentException("Valeur vide pour '" + col + "' à la ligne " + r.getRecordNumber());
                    }
                }

                // Construire JSON brut: { "vehicle_id": "...", "driver_id": "...", ... }
                Map<String, Object> rowJson = new LinkedHashMap<>();
                for (String colName : headerMap.keySet()) {
                    rowJson.put(colName, r.get(colName));
                }

                String rawJson = objectMapper.writeValueAsString(rowJson);
                rawRepo.save(new RawData("CSV", rawJson));
                count++;
            }

            return new CsvImportResult(count);
        }
    }
}
