package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserIdOrderByPaidAtDesc(Long userId);

    List<Payment> findByUserEmailIgnoreCaseOrderByPaidAtDesc(String email);

    List<Payment> findByStatusOrderByCreatedAtAsc(Payment.Status status);

    List<Payment> findByStatusInOrderByCreatedAtAsc(Collection<Payment.Status> statuses);
}