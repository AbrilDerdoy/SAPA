package com.example.SAPA.security.repositories;

import com.example.SAPA.security.entities.CredentialEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CredentialRepository extends JpaRepository<CredentialEntity, Long> {
    Optional<CredentialEntity> findByEmail(String email);
    Optional<CredentialEntity> findByResetPasswordToken(String token);
    void deleteByUserId(Long userId);
}
