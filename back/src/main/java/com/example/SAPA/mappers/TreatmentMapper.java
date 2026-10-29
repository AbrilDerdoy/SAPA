package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.TreatmentResponseDTO;
import com.example.SAPA.Models.MedicalRecord.TreatmentEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {DurationMapper.class, FrequencyMapper.class})
public interface TreatmentMapper {

    @Mapping(source = "id", target = "treatmentId")
    TreatmentResponseDTO toTreatmentResponse(TreatmentEntity treatment);
}
