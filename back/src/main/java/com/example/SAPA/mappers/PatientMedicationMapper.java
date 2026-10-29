package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.PatientMedicationResponseDTO;
import com.example.SAPA.Models.MedicalRecord.PatientMedicationEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PatientMedicationMapper {

    @Mapping(source = "id", target = "medicationId")
    PatientMedicationResponseDTO toResponse(PatientMedicationEntity medication);
}
