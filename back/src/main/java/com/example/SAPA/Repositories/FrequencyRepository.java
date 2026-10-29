package com.example.SAPA.Repositories;

import com.example.SAPA.Models.MedicalRecord.FrequencyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FrequencyRepository extends JpaRepository<FrequencyEntity, Long> {
}
