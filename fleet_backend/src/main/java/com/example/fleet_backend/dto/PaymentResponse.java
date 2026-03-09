package com.example.fleet_backend.dto;

import java.time.Instant;

public class PaymentResponse {
    public Long id;

    public Long userId;
    public String userEmail;
    public String userName;

    public String method;
    public String status;

    public Double amount;
    public Integer months;
    public String reference;
    public String note;

    // preuve owner
    public String proofFileName;
    public String proofFileUrl;

    // preuve admin
    public String adminProofFileName;
    public String adminProofFileUrl;

    public String adminComment;

    public Instant paidAt;
    public Instant validatedAt;
}