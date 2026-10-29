package com.example.SAPA.Repositories;

import com.example.SAPA.Models.HealthTipEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HealthTipRepository extends JpaRepository<HealthTipEntity, Long> {
    List<HealthTipEntity> findByDoctorId(Long doctorId);
}
