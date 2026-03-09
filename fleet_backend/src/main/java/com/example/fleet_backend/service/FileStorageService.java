package com.example.fleet_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path ownerProofRoot = Paths.get("uploads/payment-proofs");
    private final Path adminProofRoot = Paths.get("uploads/admin-payment-proofs");

    public String savePaymentProof(MultipartFile file) {
        return save(file, ownerProofRoot, "/uploads/payment-proofs/");
    }

    public String saveAdminPaymentProof(MultipartFile file) {
        return save(file, adminProofRoot, "/uploads/admin-payment-proofs/");
    }

    private String save(MultipartFile file, Path root, String publicPrefix) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("Fichier vide");
            }

            Files.createDirectories(root);

            String originalName = StringUtils.cleanPath(file.getOriginalFilename());
            String extension = "";

            int idx = originalName.lastIndexOf('.');
            if (idx >= 0) {
                extension = originalName.substring(idx);
            }

            String storedName = UUID.randomUUID() + extension;
            Path target = root.resolve(storedName);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return publicPrefix + storedName;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors du stockage du fichier", e);
        }
    }
}