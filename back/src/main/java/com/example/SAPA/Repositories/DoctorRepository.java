package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<DoctorEntity, Long>{
    Optional<DoctorEntity> findByUser(UserEntity user);
    Optional<DoctorEntity> findByUserId(Long userId);
    List<DoctorEntity> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName);
}
