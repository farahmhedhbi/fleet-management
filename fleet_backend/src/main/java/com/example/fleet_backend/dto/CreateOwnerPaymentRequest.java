package com.example.fleet_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CreateOwnerPaymentRequest {

    @NotNull
    private Method method;

    @NotNull
    @Min(1)
    private Double amount;

    @NotNull
    @Min(1)
    private Integer months;

    private String reference;
    private String note;

    public enum Method {
        CASH,
        BANK_TRANSFER,
        CHEQUE
    }

    public Method getMethod() {
        return method;
    }

    public void setMethod(Method method) {
        this.method = method;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Integer getMonths() {
        return months;
    }

    public void setMonths(Integer months) {
        this.months = months;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}