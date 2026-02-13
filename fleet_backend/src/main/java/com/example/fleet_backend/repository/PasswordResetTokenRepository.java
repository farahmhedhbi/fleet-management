package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    @Modifying
    @Query("delete from PasswordResetToken t where t.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    java.util.Optional<PasswordResetToken> findByToken(String token);
}

