package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Payment;
import java.time.LocalDateTime;

public class PaymentDTO {
    public Long id;
    public Long userId;
    public String userEmail;
    public String userName;

    public Payment.Method method;
    public Payment.Status status;

    public Double amount;
    public Integer months;
    public String reference;
    public String note;

    public String proofFileName;
    public String proofFileUrl;
    public String adminComment;

    public LocalDateTime paidAt;
    public LocalDateTime validatedAt;

    public PaymentDTO(Payment p) {
        this.id = p.getId();
        this.userId = (p.getUser() != null) ? p.getUser().getId() : null;
        this.userEmail = (p.getUser() != null) ? p.getUser().getEmail() : null;
        this.userName = (p.getUser() != null)
                ? (p.getUser().getFirstName() + " " + p.getUser().getLastName())
                : null;
        this.method = p.getMethod();
        this.status = p.getStatus();
        this.amount = p.getAmount();
        this.months = p.getMonths();
        this.reference = p.getReference();
        this.note = p.getNote();
        this.proofFileName = p.getProofFileName();
        this.proofFileUrl = p.getProofFileUrl();
        this.adminComment = p.getAdminComment();
        this.paidAt = p.getPaidAt();
        this.validatedAt = p.getValidatedAt();
    }
}