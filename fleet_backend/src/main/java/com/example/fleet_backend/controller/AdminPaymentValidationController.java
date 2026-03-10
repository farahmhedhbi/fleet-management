package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.PaymentDecisionRequest;
import com.example.fleet_backend.dto.PaymentResponse;
import com.example.fleet_backend.service.PaymentProofService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentValidationController {

    private final PaymentProofService paymentProofService;

    public AdminPaymentValidationController(PaymentProofService paymentProofService) {
        this.paymentProofService = paymentProofService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PaymentResponse>> pendingPayments() {
        return ResponseEntity.ok(paymentProofService.getPendingPayments());
    }

    @PutMapping(value = "/{paymentId}/approve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PaymentResponse> approve(
            @PathVariable Long paymentId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "comment", required = false) String comment,
            Authentication auth
    ) {
        return ResponseEntity.ok(paymentProofService.approvePayment(paymentId, file, comment, auth));
    }

    @PutMapping("/{paymentId}/reject")
    public ResponseEntity<PaymentResponse> reject(
            @PathVariable Long paymentId,
            @RequestBody(required = false) PaymentDecisionRequest req,
            Authentication auth
    ) {
        return ResponseEntity.ok(paymentProofService.rejectPayment(paymentId, req, auth));
    }
}