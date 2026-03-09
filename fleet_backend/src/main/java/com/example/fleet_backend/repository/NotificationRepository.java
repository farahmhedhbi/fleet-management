package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndReadFalse(Long recipientId);

    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

    boolean existsByRecipientIdAndMissionIdAndTitle(Long recipientId, Long missionId, String title);

    List<Notification> findByRecipientIdAndMissionIdAndTitle(Long recipientId, Long missionId, String title);

    void deleteByRecipientIdAndMissionIdAndTitle(Long recipientId, Long missionId, String title);
}