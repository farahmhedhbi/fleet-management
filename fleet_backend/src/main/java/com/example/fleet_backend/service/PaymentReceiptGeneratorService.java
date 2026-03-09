package com.example.fleet_backend.service;

import com.example.fleet_backend.model.Payment;
import com.example.fleet_backend.model.User;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class PaymentReceiptGeneratorService {

    private final Path cashProofRoot = Paths.get("uploads/generated-cash-receipts");

    public GeneratedReceipt generateCashReceipt(Payment payment, User owner, String adminComment) {
        try {
            Files.createDirectories(cashProofRoot);

            String fileName = "cash-receipt-" + payment.getId() + "-" + UUID.randomUUID() + ".txt";
            Path target = cashProofRoot.resolve(fileName);

            String content = buildReceiptContent(payment, owner, adminComment);

            Files.writeString(
                    target,
                    content,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING
            );

            return new GeneratedReceipt(fileName, "/uploads/generated-cash-receipts/" + fileName);

        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la génération du justificatif cash", e);
        }
    }

    private String buildReceiptContent(Payment payment, User owner, String adminComment) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        String ownerName = ((owner.getFirstName() != null ? owner.getFirstName() : "") + " " +
                (owner.getLastName() != null ? owner.getLastName() : "")).trim();

        return """
                ==============================
                JUSTIFICATIF DE PAIEMENT CASH
                ==============================

                Owner : %s
                Email : %s

                Méthode : CASH
                Montant : %s DT
                Durée : %s mois
                Référence : %s
                Note owner : %s

                Date de création du paiement : %s
                Date de validation : %s

                Commentaire admin :
                %s

                Confirmation :
                Le paiement en espèces a bien été reçu et validé.
                Le compte owner est activé.

                ==============================
                """.formatted(
                ownerName.isBlank() ? "Owner inconnu" : ownerName,
                owner.getEmail() != null ? owner.getEmail() : "—",
                payment.getAmount() != null ? payment.getAmount() : "—",
                payment.getMonths() != null ? payment.getMonths() : "—",
                payment.getReference() != null ? payment.getReference() : "—",
                payment.getNote() != null ? payment.getNote() : "—",
                payment.getPaidAt() != null ? payment.getPaidAt().format(fmt) : "—",
                java.time.LocalDateTime.now().format(fmt),
                adminComment != null && !adminComment.isBlank()
                        ? adminComment
                        : "Paiement cash reçu et validé par l'administration."
        );
    }

    public record GeneratedReceipt(String fileName, String fileUrl) {
    }
}