package com.example.fleet_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Réinitialisation de mot de passe");

            // ✅ Texte affiché sans montrer le token
            String html = """
                <div style="font-family: Arial, sans-serif; line-height:1.6">
                  <h2>Réinitialisation de mot de passe</h2>
                  <p>Bonjour,</p>
                  <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                  <p>Cliquez sur le bouton ci-dessous (valide 15 minutes) :</p>

                  <p style="margin: 20px 0;">
                    <a href="%s"
                       style="background:#111;color:#fff;padding:12px 18px;
                              text-decoration:none;border-radius:10px;display:inline-block;">
                      Réinitialiser mon mot de passe
                    </a>
                  </p>

                  <p style="color:#666;font-size: 13px;">
                    Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.
                  </p>
                </div>
            """.formatted(resetLink);

            helper.setText(html, true); // true => HTML
            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }
}
