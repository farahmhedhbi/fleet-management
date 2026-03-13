package com.example.fleet_backend.service;

import com.example.fleet_backend.model.Payment;
import com.example.fleet_backend.model.User;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class PaymentReceiptPdfService {

    private static final Color PRIMARY = new Color(15, 23, 42);
    private static final Color SECONDARY = new Color(71, 85, 105);
    private static final Color BORDER = new Color(203, 213, 225);
    private static final Color LIGHT_BG = new Color(248, 250, 252);
    private static final Color SUCCESS = new Color(5, 150, 105);

    private final Path outputRoot = Paths.get("uploads/generated-payment-receipts");

    public GeneratedReceipt generateReceipt(Payment payment, User owner, String adminComment) {
        try {
            Files.createDirectories(outputRoot);

            String methodLabel = resolveMethodLabel(payment);
            String fileName = "payment-receipt-" + methodLabel.toLowerCase() + "-" + payment.getId() + "-" + UUID.randomUUID() + ".pdf";
            Path filePath = outputRoot.resolve(fileName);

            try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                Document document = new Document(PageSize.A4, 48, 48, 56, 56);
                PdfWriter.getInstance(document, fos);

                document.open();

                addHeader(document, methodLabel);
                addTitle(document, methodLabel);
                addOwnerBlock(document, owner);
                addPaymentBlock(document, payment, methodLabel);
                addAdminBlock(document, adminComment, methodLabel);
                addFooterNote(document, methodLabel);

                document.close();
            }

            return new GeneratedReceipt(
                    fileName,
                    "/uploads/generated-payment-receipts/" + fileName
            );

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF justificatif de paiement", e);
        }
    }

    private void addHeader(Document document, String methodLabel) throws Exception {
        PdfPTable header = new PdfPTable(new float[]{1.2f, 3.8f});
        header.setWidthPercentage(100);
        header.setSpacingAfter(18f);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        try {
            ClassPathResource resource = new ClassPathResource("static/assets/logo.png");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    byte[] bytes = is.readAllBytes();
                    Image logo = Image.getInstance(bytes);
                    logo.scaleToFit(90, 90);
                    logoCell.addElement(logo);
                }
            } else {
                logoCell.addElement(new Paragraph("LOGO", fontBold(12, SECONDARY)));
            }
        } catch (Exception e) {
            logoCell.addElement(new Paragraph("LOGO", fontBold(12, SECONDARY)));
        }

        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        companyCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph company = new Paragraph();
        company.add(new Chunk("Fleet Management Platform\n", fontBold(18, PRIMARY)));
        company.add(new Chunk("Justificatif officiel de paiement " + methodLabel + "\n", fontRegular(11, SECONDARY)));
        company.add(new Chunk("Document généré automatiquement par le système", fontRegular(10, SECONDARY)));
        companyCell.addElement(company);

        header.addCell(logoCell);
        header.addCell(companyCell);

        document.add(header);

        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);

        PdfPCell lineCell = new PdfPCell();
        lineCell.setFixedHeight(2f);
        lineCell.setBorder(Rectangle.NO_BORDER);
        lineCell.setBackgroundColor(PRIMARY);

        line.addCell(lineCell);
        line.setSpacingAfter(20f);

        document.add(line);
    }

    private void addTitle(Document document, String methodLabel) throws Exception {
        Paragraph title = new Paragraph("REÇU DE PAIEMENT " + methodLabel, fontBold(20, PRIMARY));
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(6f);
        document.add(title);

        Paragraph subtitle = new Paragraph(
                "Confirmation de réception et validation administrative",
                fontRegular(11, SECONDARY)
        );
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(22f);
        document.add(subtitle);
    }

    private void addOwnerBlock(Document document, User owner) throws Exception {
        document.add(sectionTitle("Informations owner"));

        PdfPTable table = new PdfPTable(new float[]{1.5f, 3.5f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(16f);

        addInfoRow(table, "Nom complet", buildOwnerName(owner));
        addInfoRow(table, "Email", safe(owner.getEmail()));
        addInfoRow(table, "Téléphone", safe(owner.getPhone()));
        addInfoRow(table, "Rôle", owner.getRoleName() != null ? owner.getRoleName() : "ROLE_OWNER");

        document.add(table);
    }

    private void addPaymentBlock(Document document, Payment payment, String methodLabel) throws Exception {
        document.add(sectionTitle("Détails du paiement"));

        PdfPTable table = new PdfPTable(new float[]{1.7f, 3.3f});
        table.setWidthPercentage(100);
        table.setSpacingAfter(16f);

        addInfoRow(table, "Méthode", methodLabel);
        addInfoRow(table, "Montant", payment.getAmount() != null ? payment.getAmount() + " DT" : "—");
        addInfoRow(table, "Durée", payment.getMonths() != null ? payment.getMonths() + " mois" : "—");
        addInfoRow(table, "Référence", safe(payment.getReference()));
        addInfoRow(table, "Note owner", safe(payment.getNote()));
        addInfoRow(table, "Date demande", formatDate(payment.getPaidAt()));
        addInfoRow(table, "Date validation", formatDate(LocalDateTime.now()));

        if (payment.getProofFileName() != null && !payment.getProofFileName().isBlank()) {
            addInfoRow(table, "Justificatif owner", payment.getProofFileName());
        }

        document.add(table);
    }

    private void addAdminBlock(Document document, String adminComment, String methodLabel) throws Exception {
        document.add(sectionTitle("Validation administrative"));

        PdfPTable box = new PdfPTable(1);
        box.setWidthPercentage(100);
        box.setSpacingAfter(18f);

        PdfPCell textCell = new PdfPCell();
        textCell.setPadding(14f);
        textCell.setBorderColor(BORDER);
        textCell.setBackgroundColor(LIGHT_BG);

        Paragraph p = new Paragraph();
        p.add(new Chunk("Commentaire admin :\n", fontBold(11, PRIMARY)));
        p.add(new Chunk(
                (adminComment != null && !adminComment.isBlank())
                        ? adminComment
                        : defaultComment(methodLabel),
                fontRegular(11, PRIMARY)
        ));
        p.setLeading(16f);

        textCell.addElement(p);
        box.addCell(textCell);

        document.add(box);

        PdfPTable signatureTable = new PdfPTable(new float[]{1, 1});
        signatureTable.setWidthPercentage(100);
        signatureTable.setSpacingBefore(10f);

        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.setPadding(8f);
        left.addElement(new Paragraph("Date : " + formatDate(LocalDateTime.now()), fontRegular(11, PRIMARY)));

        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setPadding(8f);

        Paragraph sign = new Paragraph();
        sign.add(new Chunk("Signature / Cachet admin\n\n", fontBold(11, PRIMARY)));
        sign.add(new Chunk("______________________________", fontRegular(11, SECONDARY)));
        sign.setAlignment(Element.ALIGN_RIGHT);

        right.addElement(sign);

        signatureTable.addCell(left);
        signatureTable.addCell(right);

        document.add(signatureTable);
    }

    private void addFooterNote(Document document, String methodLabel) throws Exception {
        Paragraph footer = new Paragraph(
                "Ce document atteste que le paiement " + methodLabel + " a bien été validé par l’administration.",
                fontRegular(10, SUCCESS)
        );
        footer.setSpacingBefore(24f);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }

    private Paragraph sectionTitle(String text) {
        Paragraph p = new Paragraph(text, fontBold(13, PRIMARY));
        p.setSpacingBefore(8f);
        p.setSpacingAfter(8f);
        return p;
    }

    private void addInfoRow(PdfPTable table, String label, String value) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, fontBold(10, PRIMARY)));
        c1.setPadding(10f);
        c1.setBorderColor(BORDER);
        c1.setBackgroundColor(LIGHT_BG);
        c1.setVerticalAlignment(Element.ALIGN_MIDDLE);

        PdfPCell c2 = new PdfPCell(new Phrase(value, fontRegular(10, PRIMARY)));
        c2.setPadding(10f);
        c2.setBorderColor(BORDER);
        c2.setVerticalAlignment(Element.ALIGN_MIDDLE);

        table.addCell(c1);
        table.addCell(c2);
    }

    private Font fontRegular(float size, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA, size, Font.NORMAL, color);
    }

    private Font fontBold(float size, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA_BOLD, size, Font.BOLD, color);
    }

    private String buildOwnerName(User owner) {
        String first = owner.getFirstName() != null ? owner.getFirstName().trim() : "";
        String last = owner.getLastName() != null ? owner.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        return full.isBlank() ? "Owner inconnu" : full;
    }

    private String safe(String value) {
        return (value == null || value.isBlank()) ? "—" : value;
    }

    private String formatDate(LocalDateTime dt) {
        if (dt == null) return "—";
        return dt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }

    private String resolveMethodLabel(Payment payment) {
        if (payment == null || payment.getMethod() == null) {
            return "PAIEMENT";
        }

        return switch (payment.getMethod()) {
            case CASH -> "CASH";
            case BANK_TRANSFER -> "VIREMENT";
            case CHEQUE -> "CHÈQUE";
        };
    }

    private String defaultComment(String methodLabel) {
        return "Paiement " + methodLabel + " validé. Le compte owner est activé.";
    }

    public record GeneratedReceipt(String fileName, String fileUrl) {}
}