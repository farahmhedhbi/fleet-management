package com.example.fleet_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
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

    public void sendAccountActivationEmail(String to, String activationLink) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("👤 Activation de votre compte Fleet");

            String html = """
                <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto">
                  <h2 style="color:#111;">Activation de votre compte</h2>
                  <p>Bonjour,</p>
                  <p>Un administrateur a créé un compte pour vous sur la plateforme Fleet.</p>
                  <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
                  <p style="margin: 30px 0;">
                    <a href="%s"
                       style="background:#111;color:#fff;padding:14px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">
                      Activer mon compte
                    </a>
                  </p>
                  <p style="color:#666;font-size: 13px;">Ce lien est valide pendant 24 heures.</p>
                  <hr style="margin-top:30px;">
                  <p style="font-size:12px;color:#999;">Fleet Management System</p>
                </div>
            """.formatted(activationLink);

            helper.setText(html, true);
            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email d'activation", e);
        }
    }
}