package com.example.fleet_backend.controller;

import com.example.fleet_backend.csv.CsvImportResult;
import com.example.fleet_backend.service.CsvImportService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/import")
public class CsvImportController {

    private final CsvImportService service;

    public CsvImportController(CsvImportService service) {
        this.service = service;
    }

    @PostMapping(value = "/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CsvImportResult> importCsv(@RequestParam("file") MultipartFile file) throws Exception {
        CsvImportResult res = service.importCsv(file);
        return ResponseEntity.ok(res);
    }
}
