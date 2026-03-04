package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.ActivateSubscriptionRequest;
import com.example.fleet_backend.dto.PaymentResponse;
import com.example.fleet_backend.dto.UserSubscriptionResponse;
import com.example.fleet_backend.service.AdminSubscriptionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/owners")
public class AdminSubscriptionController {

    private final AdminSubscriptionService adminSubscriptionService;

    public AdminSubscriptionController(AdminSubscriptionService adminSubscriptionService) {
        this.adminSubscriptionService = adminSubscriptionService;
    }

    // ✅ IMPORTANT: email peut contenir "." -> need {email:.+}
    @PostMapping("/by-email/{email:.+}/activate-subscription")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserSubscriptionResponse> activateByEmail(
            @PathVariable("email") @NotBlank @Email String email,
            @Valid @RequestBody ActivateSubscriptionRequest req
    ) {
        return ResponseEntity.ok(adminSubscriptionService.activateByEmail(email, req));
    }

    @GetMapping("/by-email/{email:.+}/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaymentResponse>> paymentsByEmail(
            @PathVariable("email") @NotBlank @Email String email
    ) {
        return ResponseEntity.ok(adminSubscriptionService.getPaymentsByEmail(email));
    }
}