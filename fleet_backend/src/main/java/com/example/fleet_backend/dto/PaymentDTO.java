package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Payment;
import java.time.LocalDateTime;

public class PaymentDTO {
    public Long id;
    public Long userId;
    public Payment.Method method;
    public Double amount;
    public Integer months;
    public String reference;
    public String note;
    public LocalDateTime paidAt;

    public PaymentDTO(Payment p) {
        this.id = p.getId();
        this.userId = (p.getUser() != null) ? p.getUser().getId() : null;
        this.method = p.getMethod();
        this.amount = p.getAmount();
        this.months = p.getMonths();
        this.reference = p.getReference();
        this.note = p.getNote();
        this.paidAt = p.getPaidAt();
    }
}