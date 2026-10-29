package com.example.SAPA.Repositories;

import com.example.SAPA.Models.MedicalRecord.DurationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DurationRepository extends JpaRepository<DurationEntity, Long> {
}

