package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity,Long> {
    List<NotificationEntity> findByUserOrderByCreatedAtDesc(UserEntity user);

    List<NotificationEntity> findByUserAndReadedFalse(UserEntity user);
}
