package com.example.SAPA.Repositories;

import com.example.SAPA.Models.SpecialityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpecialityRepository extends JpaRepository<SpecialityEntity, Long> {
    boolean existsByName(String name);
    boolean existsByNameIgnoreCase(String name);
    SpecialityEntity findByName(String name);
}
