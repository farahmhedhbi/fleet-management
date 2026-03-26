package com.example.fleet_backend.dto;

public class PaymentDecisionRequest {

    private String comment;
    public PaymentDecisionRequest() {}

    public PaymentDecisionRequest(String comment) {
        this.comment = comment;
    }

    // =========================
    // GETTERS & SETTERS
    // =========================
    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}