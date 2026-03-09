package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.CreateOwnerPaymentRequest;
import com.example.fleet_backend.dto.PaymentDecisionRequest;
import com.example.fleet_backend.dto.PaymentResponse;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Payment;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.PaymentRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@Transactional
public class PaymentProofService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public PaymentProofService(PaymentRepository paymentRepository,
                               UserRepository userRepository,
                               FileStorageService fileStorageService,
                               NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
    }

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("Utilisateur non authentifié");
        }

        return userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + auth.getName()));
    }

    public PaymentResponse createPaymentRequest(Authentication auth, CreateOwnerPaymentRequest req) {
        User owner = getCurrentUser(auth);

        if (!"ROLE_OWNER".equals(owner.getRoleName())) {
            throw new IllegalArgumentException("Seul un OWNER peut créer une demande de paiement");
        }

        if (req.getAmount() == null || req.getAmount() <= 0) {
            throw new IllegalArgumentException("Le montant doit être supérieur à 0");
        }

        if (req.getMonths() == null || req.getMonths() <= 0) {
            throw new IllegalArgumentException("Le nombre de mois doit être supérieur à 0");
        }

        Payment p = new Payment();
        p.setUser(owner);
        p.setMethod(Payment.Method.valueOf(req.getMethod().name()));
        p.setAmount(req.getAmount());
        p.setMonths(req.getMonths());
        p.setReference(req.getReference());
        p.setNote(req.getNote());
        p.setPaidAt(LocalDateTime.now());

        // Nouvelle logique
        if (p.getMethod() == Payment.Method.CASH) {
            // cash: l'owner ne charge rien, l'admin devra obligatoirement envoyer un reçu/justification
            p.setStatus(Payment.Status.PENDING_ADMIN_CASH_PROOF);
        } else {
            // virement / cheque: owner doit envoyer sa preuve
            p.setStatus(Payment.Status.PENDING_OWNER_PROOF);
        }

        paymentRepository.save(p);
        return toPaymentResponse(p);
    }

    public PaymentResponse uploadOwnerProof(Long paymentId, MultipartFile file, Authentication auth) {
        User owner = getCurrentUser(auth);

        if (!"ROLE_OWNER".equals(owner.getRoleName())) {
            throw new IllegalArgumentException("Seul un OWNER peut envoyer une preuve");
        }

        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));

        if (!p.getUser().getId().equals(owner.getId())) {
            throw new IllegalArgumentException("Ce paiement ne vous appartient pas");
        }

        if (p.getMethod() == Payment.Method.CASH) {
            throw new IllegalArgumentException("Pour CASH, l'owner n'envoie pas de justificatif. C'est l'admin qui doit envoyer une attestation.");
        }

        if (p.getStatus() != Payment.Status.PENDING_OWNER_PROOF && p.getStatus() != Payment.Status.REJECTED) {
            throw new IllegalArgumentException("Ce paiement n'accepte pas de justificatif owner pour le moment");
        }

        String fileUrl = fileStorageService.savePaymentProof(file);

        p.setProofFileName(file.getOriginalFilename());
        p.setProofFileUrl(fileUrl);
        p.setStatus(Payment.Status.PENDING_VERIFICATION);

        paymentRepository.save(p);
        return toPaymentResponse(p);
    }

    public List<PaymentResponse> getMyPayments(Authentication auth) {
        User owner = getCurrentUser(auth);

        if (!"ROLE_OWNER".equals(owner.getRoleName())) {
            throw new IllegalArgumentException("Seul un OWNER peut consulter ses paiements");
        }

        return paymentRepository.findByUserIdOrderByPaidAtDesc(owner.getId())
                .stream()
                .map(this::toPaymentResponse)
                .toList();
    }

    public List<PaymentResponse> getPendingPayments() {
        return paymentRepository.findByStatusInOrderByCreatedAtAsc(List.of(
                        Payment.Status.PENDING_ADMIN_CASH_PROOF,
                        Payment.Status.PENDING_VERIFICATION
                ))
                .stream()
                .map(this::toPaymentResponse)
                .toList();
    }

    public PaymentResponse approvePayment(Long paymentId,
                                          MultipartFile adminFile,
                                          String comment,
                                          Authentication auth) {
        User admin = getCurrentUser(auth);

        if (!"ROLE_ADMIN".equals(admin.getRoleName())) {
            throw new IllegalArgumentException("Seul un ADMIN peut approuver");
        }

        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));

        if (p.getStatus() == Payment.Status.APPROVED) {
            throw new IllegalArgumentException("Ce paiement est déjà approuvé");
        }

        if (p.getStatus() == Payment.Status.REJECTED) {
            throw new IllegalArgumentException("Ce paiement est refusé. Créez une nouvelle demande ou renvoyez une preuve selon votre logique métier.");
        }

        if (p.getMethod() == Payment.Method.CASH) {
            if (p.getStatus() != Payment.Status.PENDING_ADMIN_CASH_PROOF) {
                throw new IllegalArgumentException("Statut invalide pour un paiement cash");
            }
        } else {
            if (p.getStatus() != Payment.Status.PENDING_VERIFICATION) {
                throw new IllegalArgumentException("L'owner doit d'abord envoyer sa preuve pour virement/chèque");
            }
        }

        if (adminFile == null || adminFile.isEmpty()) {
            throw new IllegalArgumentException("L'admin doit obligatoirement envoyer un justificatif de confirmation");
        }

        String adminFileUrl = fileStorageService.saveAdminPaymentProof(adminFile);
        p.setAdminProofFileName(adminFile.getOriginalFilename());
        p.setAdminProofFileUrl(adminFileUrl);

        User owner = p.getUser();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = owner.getPaidUntil();

        if (base == null || base.isBefore(now)) {
            base = now;
        }

        LocalDateTime newPaidUntil = base.plusMonths(p.getMonths());

        owner.setPaidUntil(newPaidUntil);
        owner.setSubscriptionStatus(User.SubscriptionStatus.ACTIVE);

        p.setStatus(Payment.Status.APPROVED);
        p.setValidatedAt(now);
        p.setValidatedBy(admin);
        p.setAdminComment(
                comment != null && !comment.isBlank()
                        ? comment
                        : "Paiement validé. Le montant a bien été reçu et le compte a été activé."
        );

        userRepository.save(owner);
        paymentRepository.save(p);

        // notification owner
        notificationService.createForUser(
                owner.getId(),
                "Paiement approuvé",
                "Votre paiement a été validé. Votre compte est activé. Un justificatif admin est disponible.",
                null
        );

        return toPaymentResponse(p);
    }

    public PaymentResponse rejectPayment(Long paymentId, PaymentDecisionRequest req, Authentication auth) {
        User admin = getCurrentUser(auth);

        if (!"ROLE_ADMIN".equals(admin.getRoleName())) {
            throw new IllegalArgumentException("Seul un ADMIN peut refuser");
        }

        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));

        if (p.getStatus() == Payment.Status.APPROVED) {
            throw new IllegalArgumentException("Impossible de refuser un paiement déjà approuvé");
        }

        p.setStatus(Payment.Status.REJECTED);
        p.setValidatedAt(LocalDateTime.now());
        p.setValidatedBy(admin);
        p.setAdminComment(
                req != null && req.getComment() != null && !req.getComment().isBlank()
                        ? req.getComment()
                        : "Paiement refusé. Veuillez vérifier les informations ou renvoyer un justificatif valide."
        );

        paymentRepository.save(p);

        notificationService.createForUser(
                p.getUser().getId(),
                "Paiement refusé",
                "Votre paiement a été refusé. Consultez le commentaire de l'admin pour plus de détails.",
                null
        );

        return toPaymentResponse(p);
    }

    private PaymentResponse toPaymentResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.id = p.getId();
        r.userId = p.getUser() != null ? p.getUser().getId() : null;
        r.userEmail = p.getUser() != null ? p.getUser().getEmail() : null;
        r.userName = p.getUser() != null ? p.getUser().getFirstName() + " " + p.getUser().getLastName() : null;

        r.method = p.getMethod() != null ? p.getMethod().name() : null;
        r.status = p.getStatus() != null ? p.getStatus().name() : null;

        r.amount = p.getAmount();
        r.months = p.getMonths();
        r.reference = p.getReference();
        r.note = p.getNote();

        r.proofFileName = p.getProofFileName();
        r.proofFileUrl = p.getProofFileUrl();

        r.adminProofFileName = p.getAdminProofFileName();
        r.adminProofFileUrl = p.getAdminProofFileUrl();

        r.adminComment = p.getAdminComment();

        r.paidAt = p.getPaidAt() == null ? null : p.getPaidAt().toInstant(ZoneOffset.UTC);
        r.validatedAt = p.getValidatedAt() == null ? null : p.getValidatedAt().toInstant(ZoneOffset.UTC);

        return r;
    }
}