package com.example.fleet_backend.controller;

import com.example.fleet_backend.service.CsvImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/import")
public class CsvImportController {

    private final CsvImportService csvImportService;

    public CsvImportController(CsvImportService csvImportService) {
        this.csvImportService = csvImportService;
    }

    @PostMapping("/csv")
    @PreAuthorize("hasRole('ADMIN')") // ✅ avant: ADMIN/OWNER :contentReference[oaicite:7]{index=7}
    public ResponseEntity<?> importCsv(@RequestParam("file") MultipartFile file) {
        int stored = csvImportService.importCsv(file);
        return ResponseEntity.ok(Map.of("message", "CSV imported in RAW", "rows", stored));
    }
}
