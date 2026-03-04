package com.example.fleet_backend.dto;

import java.time.Instant;

public class PaymentResponse {
    public Long id;
    public String method;
    public Integer amount;
    public Integer months;
    public String reference;
    public String note;
    public Instant paidAt;
}