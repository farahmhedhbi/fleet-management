package com.example.fleet_backend.security;

import com.example.fleet_backend.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

/**
 * ✅ UserDetailsImpl
 *
 * Classe d’adaptation entre ton entité User (base de données)
 * et Spring Security.
 *
 * Spring Security ne travaille pas directement avec ton modèle User.
 * Il a besoin d’un objet qui implémente l’interface UserDetails.
 *
 * 👉 Cette classe fait le pont entre:
 * - User (entité JPA)
 * - Le système d’authentification Spring Security
 */
public class UserDetailsImpl implements UserDetails {

    /**
     * 🔹 Champs principaux exposés à Spring Security
     */
    private final Long id;
    private final String firstName;
    private final String lastName;
    private final String email;

    /**
     * 🔒 Mot de passe (ignoré dans les réponses JSON)
     * @JsonIgnore empêche l’exposition du password si l’objet est sérialisé.
     */
    @JsonIgnore
    private final String password;

    /**
     * ✅ Rôle sous forme String (ex: ROLE_ADMIN)
     * Utile pour debug ou retour API.
     */
    private final String role;

    /**
     * ✅ Correspond directement au champ User.enabled
     * Permet de bloquer login si compte désactivé.
     */
    private final boolean enabled;

    /**
     * 🔐 Authorities = rôles utilisés par Spring Security
     * Exemple: ROLE_ADMIN, ROLE_OWNER, ROLE_DRIVER
     */
    private final Collection<? extends GrantedAuthority> authorities;

    /**
     * ✅ Constructeur complet
     */
    public UserDetailsImpl(Long id,
                           String firstName,
                           String lastName,
                           String email,
                           String password,
                           String role,
                           boolean enabled,
                           Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.enabled = enabled;
        this.authorities = authorities;
    }

    /**
     * ✅ Méthode factory statique
     *
     * Transforme un User (entité JPA) en UserDetailsImpl.
     *
     * Étapes:
     * 1) Vérifications de sécurité (user null, role null)
     * 2) Normalisation du rôle (ROLE_XXX en majuscule)
     * 3) Création de GrantedAuthority
     * 4) Construction de UserDetailsImpl
     */
    public static UserDetailsImpl build(User user) {

        if (user == null) {
            throw new RuntimeException("User is null");
        }
        if (user.getRole() == null) {
            throw new RuntimeException("User has no role assigned");
        }

        String roleName = user.getRole().getName();
        if (roleName == null || roleName.trim().isEmpty()) {
            throw new RuntimeException("User role name is null or empty");
        }

        // ✅ Normalisation robuste du rôle
        String normalized = normalizeRole(roleName);

        // Spring Security exige une GrantedAuthority
        GrantedAuthority authority = new SimpleGrantedAuthority(normalized);

        return new UserDetailsImpl(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPassword(),
                normalized,
                user.isEnabled(),
                List.of(authority)
        );
    }

    /**
     * ✅ Normalisation du rôle
     *
     * Cas gérés:
     * - "role_driver"
     * - "ROLE_driver"
     * - "driver"
     *
     * Résultat final:
     * - "ROLE_DRIVER"
     */
    private static String normalizeRole(String roleName) {
        String r = roleName.trim();

        // tout en majuscule
        r = r.toUpperCase();

        // si déjà prefixé par ROLE_
        if (r.startsWith("ROLE_")) return r;

        // sinon on ajoute ROLE_
        return "ROLE_" + r;
    }

    /**
     * 🔹 Getters utiles
     */
    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }

    /**
     * ✅ Permet éventuellement d'exposer le rôle dans une réponse API
     */
    public String getRole() { return role; }

    /**
     * 🔐 Retourne les authorities pour Spring Security
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    /**
     * 🔒 Mot de passe pour comparaison lors de l’authentification
     */
    @Override
    public String getPassword() { return password; }

    /**
     * 🔑 Username utilisé par Spring Security
     * Ici on utilise l’email comme identifiant.
     */
    @Override
    public String getUsername() { return email; }

    /**
     * ✅ Ces méthodes contrôlent l’état du compte.
     * Ici tout est toujours "true" sauf isEnabled().
     */

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    /**
     * ✅ IMPORTANT:
     * Cette méthode est utilisée par Spring Security pour autoriser
     * ou refuser le login.
     *
     * Si enabled=false → login bloqué.
     */
    @Override
    public boolean isEnabled() { return enabled; }

    /**
     * ✅ equals basé sur ID
     * Important pour la gestion interne Spring Security.
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserDetailsImpl that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}