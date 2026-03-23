package com.example.fleet_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;


@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        try {

            MimeMessage mimeMessage = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("🔐 Réinitialisation de votre mot de passe");


            String html = """
                <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto">
                  <h2 style="color:#111;">Réinitialisation de mot de passe</h2>
                  <p>Bonjour,</p>
                  <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                  <p>Cliquez sur le bouton ci-dessous (valide 15 minutes) :</p>
                  <p style="margin: 30px 0;">
                    <a href="%s"
                       style="background:#111;color:#fff;padding:14px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">
                      Réinitialiser mon mot de passe
                    </a>
                  </p>
                  <p style="color:#666;font-size: 13px;">
                    Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.
                  </p>
                  <hr style="margin-top:30px;">
                  <p style="font-size:12px;color:#999;">Fleet Management System</p>
                </div>
            """.formatted(resetLink);

            helper.setText(html, true);

            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email de réinitialisation", e);
        }
    }

    public void sendOwnerInvitationEmail(String to, String firstName, String email, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Invitation à votre compte Fleet Management");
        message.setText("""
                Bonjour %s,

                Votre compte OWNER a été créé par l’administrateur.

                Email : %s
                Mot de passe temporaire : %s

                À votre première connexion, vous devrez obligatoirement changer votre mot de passe.

                Cordialement,
                Équipe Fleet Management
                """.formatted(safe(firstName), email, tempPassword));

        mailSender.send(message);
    }

    public void sendDriverCredentialsEmail(String to, String firstName, String email, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Votre compte conducteur Fleet Management");
        message.setText("""
                Bonjour %s,

                Votre compte DRIVER a été créé par votre propriétaire de flotte.

                Email : %s
                Mot de passe temporaire : %s

                À votre première connexion, vous devrez obligatoirement changer votre mot de passe.

                Cordialement,
                Équipe Fleet Management
                """.formatted(safe(firstName), email, tempPassword));

        mailSender.send(message);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "utilisateur" : value.trim();
    }
}