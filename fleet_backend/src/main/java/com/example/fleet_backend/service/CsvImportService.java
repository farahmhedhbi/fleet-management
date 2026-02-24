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

/**
 * ✅ CsvImportService
 *
 * Service responsable de l’importation des fichiers CSV.
 *
 * Objectif:
 * - Lire un fichier CSV uploadé (MultipartFile)
 * - Vérifier qu’il contient les colonnes obligatoires
 * - Valider chaque ligne (types + valeurs + format date)
 * - Sauvegarder chaque ligne en "données brutes" via RawIngestionService
 *
 * ✅ Choix d’architecture important:
 * - Ici on ne crée pas directement des entités métier.
 * - On stocke d’abord les données en raw_data (traçabilité / audit / retraitement).
 */
@Service
public class CsvImportService {

    /**
     * ✅ Colonnes obligatoires attendues dans le CSV.
     *
     * Exemple d’en-tête:
     * vehicle_id,driver_id,distance,duration,date
     */
    private static final List<String> REQUIRED_HEADERS =
            List.of("vehicle_id", "driver_id", "distance", "duration", "date");

    /**
     * ✅ RawIngestionService:
     * - utilisé pour sauvegarder chaque ligne du CSV dans la table raw_data
     */
    private final RawIngestionService rawIngestionService;

    /**
     * ✅ ObjectMapper (Jackson):
     * - permet de construire un JSON (ObjectNode) représentant une ligne CSV
     */
    private final ObjectMapper mapper;

    /**
     * ✅ Injection par constructeur (bonne pratique)
     */
    public CsvImportService(RawIngestionService rawIngestionService, ObjectMapper mapper) {
        this.rawIngestionService = rawIngestionService;
        this.mapper = mapper;
    }

    /**
     * ✅ Importer le CSV
     *
     * Étapes:
     * 1) Vérifier que le fichier existe et n'est pas vide
     * 2) Lire le fichier en UTF-8
     * 3) Parser le CSV (Apache Commons CSV) avec header
     * 4) Vérifier présence des colonnes obligatoires
     * 5) Parcourir chaque ligne:
     *    - convertir en JSON (ObjectNode)
     *    - valider les champs (types + valeurs + format date)
     *    - sauvegarder via RawIngestionService (source="CSV")
     * 6) Retourner le nombre de lignes importées
     *
     * @param file fichier CSV uploadé
     * @return nombre de lignes importées avec succès
     */
    public int importCsv(MultipartFile file) {

        // 1️⃣ Vérifier fichier
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty");
        }

        // Nom du fichier (utile pour audit / debug)
        String fileName = file.getOriginalFilename();

        /**
         * 2️⃣ Lecture + parsing
         * - InputStreamReader: lit le fichier en UTF-8
         * - CSVFormat.DEFAULT.withFirstRecordAsHeader(): première ligne = headers
         * - withTrim(): supprime espaces autour des valeurs
         *
         * try-with-resources:
         * - ferme automatiquement reader et parser (évite fuites mémoire)
         */
        try (InputStreamReader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.withFirstRecordAsHeader().withTrim().parse(reader)
        ) {

            // 3️⃣ Vérifier headers requis
            List<String> headers = parser.getHeaderNames();
            if (!headers.containsAll(REQUIRED_HEADERS)) {
                throw new IllegalArgumentException("CSV missing required columns: " + REQUIRED_HEADERS);
            }

            // rowNumber: numéro de ligne logique (pour tracer les erreurs)
            int rowNumber = 1;

            // count: nombre de lignes importées
            int count = 0;

            // 4️⃣ Parcours lignes CSV
            for (CSVRecord record : parser) {

                // Convertir une ligne CSV en JSON (ObjectNode)
                ObjectNode row = mapper.createObjectNode();

                // Pour chaque colonne, on met "clé=header" et "valeur=record.get(header)"
                for (String h : headers) row.put(h, record.get(h));

                // 5️⃣ Valider les champs (types, >0, date format)
                validateTripRow(row);

                // 6️⃣ Sauvegarder la ligne brute (table raw_data)
                rawIngestionService.saveCsvRow(row, fileName, rowNumber);

                rowNumber++;
                count++;
            }

            // ✅ Retourne nombre de lignes importées
            return count;

        } catch (RuntimeException e) {
            // ✅ On relance directement les erreurs métier (IllegalArgumentException, etc.)
            throw e;
        } catch (Exception e) {
            // ✅ Toutes les autres exceptions deviennent une erreur globale
            throw new RuntimeException("CSV import failed: " + e.getMessage(), e);
        }
    }

    /**
     * ✅ Validation d'une ligne "Trip" (trajet)
     *
     * Règles:
     * - vehicle_id : long > 0
     * - driver_id  : long > 0
     * - distance   : int > 0
     * - duration   : int > 0
     * - date       : format YYYY-MM-DD
     *
     * @param row ligne JSON construite à partir du CSV
     */
    private void validateTripRow(ObjectNode row) {

        // ✅ Conversion + validation numérique
        parsePositiveLong(row.get("vehicle_id").asText(), "vehicle_id");
        parsePositiveLong(row.get("driver_id").asText(), "driver_id");
        parsePositiveInt(row.get("distance").asText(), "distance");
        parsePositiveInt(row.get("duration").asText(), "duration");

        // ✅ Validation format date
        String date = row.get("date").asText();
        if (date == null || !date.matches("\\d{4}-\\d{2}-\\d{2}")) {
            throw new IllegalArgumentException("date must be YYYY-MM-DD");
        }
    }

    /**
     * ✅ Parse un entier positif (>0)
     *
     * @param value valeur texte depuis CSV
     * @param field nom du champ (pour message d'erreur clair)
     * @return int validé
     */
    private int parsePositiveInt(String value, String field) {
        try {
            int v = Integer.parseInt(value);

            // ✅ distance/duration doivent être > 0
            if (v <= 0) throw new IllegalArgumentException(field + " must be > 0");

            return v;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(field + " must be a number");
        }
    }

    /**
     * ✅ Parse un long positif (>0)
     *
     * @param value valeur texte depuis CSV
     * @param field nom du champ
     * @return long validé
     */
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