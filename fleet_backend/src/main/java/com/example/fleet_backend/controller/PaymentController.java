package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.CreateOwnerPaymentRequest;
import com.example.fleet_backend.dto.PaymentResponse;
import com.example.fleet_backend.service.PaymentProofService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentProofService paymentProofService;

    public PaymentController(PaymentProofService paymentProofService) {
        this.paymentProofService = paymentProofService;
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PaymentResponse> createPaymentRequest(
            @Valid @RequestBody CreateOwnerPaymentRequest req,
            Authentication auth
    ) {
        return ResponseEntity.ok(paymentProofService.createPaymentRequest(auth, req));
    }

    // owner envoie sa preuve uniquement pour BANK_TRANSFER / CHEQUE
    @PostMapping(value = "/{paymentId}/owner-proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PaymentResponse> uploadOwnerProof(
            @PathVariable Long paymentId,
            @RequestParam("file") MultipartFile file,
            Authentication auth
    ) {
        return ResponseEntity.ok(paymentProofService.uploadOwnerProof(paymentId, file, auth));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<PaymentResponse>> myPayments(Authentication auth) {
        return ResponseEntity.ok(paymentProofService.getMyPayments(auth));
    }
}