package com.example.SAPA.Repositories;

import com.example.SAPA.Models.SpecialityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SpecialityRepository extends JpaRepository<SpecialityEntity, Long> {
    boolean existsByName(String name);
    boolean existsByNameIgnoreCase(String name);
    SpecialityEntity findByName(String name);

    @Modifying
    @Query(value = "DELETE FROM doctor_speciality WHERE speciality_id = :specialityId", nativeQuery = true)
    void deleteDoctorRelations(@Param("specialityId") Long specialityId);
}
