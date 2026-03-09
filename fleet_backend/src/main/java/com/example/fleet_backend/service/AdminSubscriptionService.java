package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ActivateSubscriptionRequest;
import com.example.fleet_backend.dto.PaymentResponse;
import com.example.fleet_backend.dto.UserSubscriptionResponse;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Payment;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.PaymentRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@Transactional
public class AdminSubscriptionService {

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public AdminSubscriptionService(UserRepository userRepository,
                                    PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    public UserSubscriptionResponse activateByEmail(String email, ActivateSubscriptionRequest req) {
        String cleanEmail = email.trim().toLowerCase();

        User owner = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found: " + cleanEmail));

        if (!"ROLE_OWNER".equals(owner.getRoleName())) {
            throw new IllegalArgumentException("User is not an OWNER");
        }

        // ✅ 1) Enregistrer un paiement (traçabilité)
        Payment p = new Payment();
        p.setUser(owner);
        p.setMethod(Payment.Method.valueOf(req.getMethod().name())); // enum compatible
        p.setAmount(req.getAmount().doubleValue());
        p.setMonths(req.getMonths());
        p.setReference(req.getReference());
        p.setNote(req.getNote());
        p.setPaidAt(LocalDateTime.now());
        paymentRepository.save(p);

        // ✅ 2) Calcul paidUntil
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = owner.getPaidUntil();

        // Si paidUntil est null ou passé => base = now, sinon on prolonge
        if (base == null || base.isBefore(now)) base = now;

        LocalDateTime newPaidUntil = base.plusMonths(req.getMonths());
        owner.setPaidUntil(newPaidUntil);
        owner.setSubscriptionStatus(User.SubscriptionStatus.ACTIVE);

        userRepository.save(owner);

        return toUserSubscriptionResponse(owner);
    }

    public List<PaymentResponse> getPaymentsByEmail(String email) {
        String cleanEmail = email.trim().toLowerCase();
        return paymentRepository.findByUserEmailIgnoreCaseOrderByPaidAtDesc(cleanEmail)
                .stream()
                .map(this::toPaymentResponse)
                .toList();
    }

    private PaymentResponse toPaymentResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.id = p.getId();
        r.method = p.getMethod().name();
        r.amount = p.getAmount();
        r.months = p.getMonths();
        r.reference = p.getReference();
        r.note = p.getNote();
        r.paidAt = (p.getPaidAt() == null) ? null : p.getPaidAt().toInstant(ZoneOffset.UTC);
        return r;
    }

    private UserSubscriptionResponse toUserSubscriptionResponse(User u) {
        UserSubscriptionResponse r = new UserSubscriptionResponse();
        r.id = u.getId();
        r.firstName = u.getFirstName();
        r.lastName = u.getLastName();
        r.email = u.getEmail();
        r.role = u.getRoleName();

        r.subscriptionStatus = (u.getSubscriptionStatus() == null) ? null : u.getSubscriptionStatus().name();
        r.trialStartAt = (u.getTrialStartAt() == null) ? null : u.getTrialStartAt().toInstant(ZoneOffset.UTC);
        r.trialEndAt = (u.getTrialEndAt() == null) ? null : u.getTrialEndAt().toInstant(ZoneOffset.UTC);
        r.paidUntil = (u.getPaidUntil() == null) ? null : u.getPaidUntil().toInstant(ZoneOffset.UTC);
        return r;
    }
}