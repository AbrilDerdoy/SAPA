package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.MedicalRecordResponseDTO;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {TreatmentMapper.class})
public interface MedicalRecordMapper {

    @Mapping(source = "id", target = "medicalRecordId")
    MedicalRecordResponseDTO toMedicalRecordResponse(MedicalRecordEntity medicalRecord);
}
