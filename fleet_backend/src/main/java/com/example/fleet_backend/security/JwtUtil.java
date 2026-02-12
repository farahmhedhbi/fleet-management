package com.example.fleet_backend.security;

import com.example.fleet_backend.service.UserDetailsImpl;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component // Rend cette classe injectable dans Spring (Bean géré par Spring)
public class JwtUtil {

    // Logger pour tracer les erreurs (utile en debug + prod)
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    // Clé secrète JWT récupérée depuis application.properties (ou env)
    // Exemple: jwt.secret=uneCleTresLongueDe32CaracteresMinimum...
    @Value("${jwt.secret}")
    private String jwtSecret;

    // Durée de validité du token (en millisecondes) depuis application.properties
    // Exemple: jwt.expiration=86400000 (1 jour)
    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    /**
     * Construit la clé de signature (HMAC SHA) à partir de jwt.secret.
     * HS256 exige une clé suffisamment longue (au moins 256 bits = 32 bytes).
     */
    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);

        // Sécurité: empêche d'utiliser une clé trop courte (faible)
        if (keyBytes.length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 bytes for HS256");
        }

        // Crée une clé HMAC compatible avec JJWT pour signer/valider le token
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Génère un token JWT après authentification (login réussi).
     * On récupère l'utilisateur depuis Authentication, puis on met des "claims"
     * (données) dans le token: id, firstName, lastName, role...
     */
    public String generateJwtToken(Authentication authentication) {

        // Principal = utilisateur authentifié (implémentation personnalisée)
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        // Récupère le 1er rôle trouvé dans les authorities, sinon valeur par défaut.
        // Attention: si l'utilisateur peut avoir plusieurs rôles, ici tu n'en gardes qu'un.
        String role = userPrincipal.getAuthorities()
                .stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("ROLE_DRIVER");

        // Construction du JWT
        return Jwts.builder()
                // "subject" est généralement l'identifiant principal (ici email)
                .setSubject(userPrincipal.getEmail())

                // Claims = informations ajoutées dans le payload du JWT
                .claim("id", userPrincipal.getId())
                .claim("firstName", userPrincipal.getFirstName())
                .claim("lastName", userPrincipal.getLastName())
                .claim("role", role)

                // Date de création
                .setIssuedAt(new Date())

                // Date d’expiration: maintenant + jwtExpirationMs
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))

                // Signature du token avec clé + algo HS256
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)

                // Convertit en String JWT final
                .compact();
    }

    /**
     * Extrait l'identité (subject) depuis le token.
     * Ici le subject = email.
     */
    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey()) // clé utilisée pour vérifier signature
                .build()
                .parseClaimsJws(token)          // parse + vérifie signature
                .getBody()
                .getSubject();                  // retourne le subject (email)
    }

    /**
     * Valide un JWT:
     * - signature correcte
     * - pas expiré
     * - structure JWT correcte
     * Si OK -> true, sinon false + logs d'erreur.
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken); // si une exception est levée -> token invalide

            return true;

        } catch (MalformedJwtException e) {
            // Token mal formé (structure invalide)
            logger.error("Invalid JWT token: {}", e.getMessage());

        } catch (ExpiredJwtException e) {
            // Token expiré
            logger.error("JWT token is expired: {}", e.getMessage());

        } catch (UnsupportedJwtException e) {
            // Algo/format non supporté
            logger.error("JWT token is unsupported: {}", e.getMessage());

        } catch (IllegalArgumentException e) {
            // Token vide/null ou claims vides
            logger.error("JWT claims string is empty: {}", e.getMessage());

        } catch (Exception e) {
            // Toute autre erreur (clé invalide, parsing, etc.)
            logger.error("JWT validation error: {}", e.getMessage());
        }

        return false;
    }
}
