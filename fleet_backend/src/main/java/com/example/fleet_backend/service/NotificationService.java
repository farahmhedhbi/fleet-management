package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.NotificationDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Notification;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.NotificationRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    public static final String DRIVER_LATE_ALERT_TITLE = "Retard de mission";
    public static final String OWNER_LATE_START_TITLE = "Mission démarrée en retard";
    public static final String DRIVER_ASSIGNED_TITLE = "Nouvelle mission assignée";
    public static final String DRIVER_UPDATED_TITLE = "Mission modifiée";
    public static final String DRIVER_CANCELED_TITLE = "Mission annulée";
    public static final String OWNER_STARTED_TITLE = "Mission démarrée";
    public static final String OWNER_FINISHED_TITLE = "Mission terminée";

    public static final String VEHICLE_PROBLEM_TITLE = "Problème détecté sur véhicule";
    private static final long VEHICLE_PROBLEM_COOLDOWN_MINUTES = 30;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /*
     * Ancienne méthode gardée.
     * Elle sert encore pour retard mission, assignation mission, mission modifiée, annulée, etc.
     */
    public void createForUser(Long userId, String title, String message, Long missionId) {
        createForUser(userId, title, message, missionId, null);
    }

    /*
     * Nouvelle méthode interne avec vehicleId optionnel.
     * Ne casse pas l'ancien code.
     */
    public void createForUser(
            Long userId,
            String title,
            String message,
            Long missionId,
            Long vehicleId
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Notification notification = new Notification();
        notification.setRecipient(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setMissionId(missionId);
        notification.setVehicleId(vehicleId);
        notification.setRead(false);

        notificationRepository.save(notification);
    }

    /*
     * Ancienne méthode gardée.
     * Elle protège les notifications mission de sprint 1.
     */
    public void createUniqueForUser(Long userId, String title, String message, Long missionId) {
        if (missionId != null &&
                notificationRepository.existsByRecipientIdAndMissionIdAndTitle(userId, missionId, title)) {
            return;
        }

        createForUser(userId, title, message, missionId);
    }

    /*
     * Nouvelle méthode BF14.
     * Une notification générale par véhicule.
     * Les détails restent dans alerts/events/OBD page.
     */
    public void createVehicleProblemNotification(
            Long userId,
            Long vehicleId,
            String vehicleName,
            Long missionId
    ) {
        if (userId == null || vehicleId == null) {
            return;
        }

        LocalDateTime since = LocalDateTime.now()
                .minusMinutes(VEHICLE_PROBLEM_COOLDOWN_MINUTES);

        boolean existsRecent = notificationRepository
                .existsByRecipientIdAndVehicleIdAndTitleAndCreatedAtAfter(
                        userId,
                        vehicleId,
                        VEHICLE_PROBLEM_TITLE,
                        since
                );

        if (existsRecent) {
            return;
        }

        String displayVehicle =
                vehicleName != null && !vehicleName.isBlank()
                        ? vehicleName
                        : "#" + vehicleId;

        String message = "Le véhicule " + displayVehicle
                + " présente une ou plusieurs alertes techniques. Consultez les détails du véhicule.";

        createForUser(
                userId,
                VEHICLE_PROBLEM_TITLE,
                message,
                missionId,
                vehicleId
        );
    }

    public List<NotificationDTO> myNotifications(Authentication auth) {
        Long userId = AuthUtil.userId(auth);

        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::new)
                .collect(Collectors.toList());
    }

    public long myUnreadCount(Authentication auth) {
        Long userId = AuthUtil.userId(auth);
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    public void markRead(Long notificationId, Authentication auth) {
        Long userId = AuthUtil.userId(auth);

        Notification notification = notificationRepository
                .findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found: " + notificationId
                ));

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllRead(Authentication auth) {
        Long userId = AuthUtil.userId(auth);

        List<Notification> notifications =
                notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);

        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
            }
        }

        notificationRepository.saveAll(notifications);
    }

    public void clearNotificationByTitle(Long recipientId, Long missionId, String title) {
        if (recipientId == null || missionId == null || title == null || title.isBlank()) {
            return;
        }

        notificationRepository.deleteByRecipientIdAndMissionIdAndTitle(
                recipientId,
                missionId,
                title
        );
    }
}