package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.PatientResponseDTO;
import com.example.SAPA.Models.Entities.PatientEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PatientMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "medicalRecord.id", target = "medicalRecordId")
    PatientResponseDTO toResponseDTO(PatientEntity patientEntity);
}
