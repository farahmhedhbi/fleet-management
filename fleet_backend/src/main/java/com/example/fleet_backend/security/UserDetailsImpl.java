package com.example.fleet_backend.security;

import com.example.fleet_backend.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String firstName;
    private final String lastName;
    private final String email;

    @JsonIgnore
    private final String password;

    // ✅ utile pour debug
    private final String role;

    private final boolean enabled;


    private final Collection<? extends GrantedAuthority> authorities;

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

        // ✅ normalisation robuste
        String normalized = normalizeRole(roleName);

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

    private static String normalizeRole(String roleName) {
        String r = roleName.trim();

        // si DB contient "role_driver" ou "ROLE_driver"
        r = r.toUpperCase();

        // si DB contient déjà ROLE_ -> ok
        if (r.startsWith("ROLE_")) return r;

        // sinon -> ajoute ROLE_
        return "ROLE_" + r;
    }

    // Getters utiles
    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }

    // ✅ debug possible côté API si besoin
    public String getRole() { return role; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    // ✅ MAINTENANT ça respecte User.enabled
    @Override public boolean isEnabled() { return enabled; }

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
