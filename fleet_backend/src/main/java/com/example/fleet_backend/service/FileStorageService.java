package com.example.fleet_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Path ROOT = Paths.get("uploads");
    private static final Path OWNER_PAYMENT_DIR = ROOT.resolve(Paths.get("payments", "owner"));
    private static final Path ADMIN_PAYMENT_DIR = ROOT.resolve(Paths.get("payments", "admin"));

    public String savePaymentProof(MultipartFile file) {
        return save(file, OWNER_PAYMENT_DIR, "/uploads/payments/owner/");
    }

    public String saveAdminPaymentProof(MultipartFile file) {
        return save(file, ADMIN_PAYMENT_DIR, "/uploads/payments/admin/");
    }

    private String save(MultipartFile file, Path targetDir, String publicUrlPrefix) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier vide ou manquant");
        }

        try {
            Files.createDirectories(targetDir);

            String originalName = file.getOriginalFilename();
            String extension = getExtension(originalName);
            String generatedName = UUID.randomUUID() + extension;

            Path targetFile = targetDir.resolve(generatedName);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            return publicUrlPrefix + generatedName;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du fichier", e);
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}