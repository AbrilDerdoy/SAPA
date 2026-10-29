package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.UserCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    List<UserEntity> findByRoleAndStatus(UserCategory role, AccountStatus status);
    List<UserEntity> findByRole(UserCategory role);
    boolean existsByEmail(String email);
}
