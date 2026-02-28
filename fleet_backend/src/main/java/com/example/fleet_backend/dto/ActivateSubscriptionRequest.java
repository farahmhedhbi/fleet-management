package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Payment;

public class ActivateSubscriptionRequest {
    public Integer months = 1;          // par défaut 1 mois
    public Double amount;               // ex: 50.0
    public Payment.Method method;       // CASH / BANK_TRANSFER / CHEQUE
    public String reference;            // ex: REC-2026-001 / ref virement
    public String note;    // ref paiement / remarque
}
