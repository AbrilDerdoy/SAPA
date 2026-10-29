package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<ConversationEntity, Long> {

    Optional<ConversationEntity> findByPatientAndDoctor(PatientEntity patient, DoctorEntity doctor);

    List<ConversationEntity> findByPatient(PatientEntity patient);

    List<ConversationEntity> findByDoctor(DoctorEntity doctor);
}
