package com.example.fleet_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ActivateSubscriptionRequest {

    @NotNull @Min(1)
    private Integer months;

    @NotNull @Min(1)
    private Integer amount;

    @NotNull
    private Method method;

    private String reference;
    private String note;

    public enum Method { CASH, BANK_TRANSFER, CHEQUE }

    public Integer getMonths() { return months; }
    public void setMonths(Integer months) { this.months = months; }

    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }

    public Method getMethod() { return method; }
    public void setMethod(Method method) { this.method = method; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}