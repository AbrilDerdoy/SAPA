package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.TreatmentFrequencyDTO;
import com.example.SAPA.Models.MedicalRecord.FrequencyEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FrequencyMapper {

    @Mapping(source = "frequencyUnit", target = "unit")
    TreatmentFrequencyDTO toFrequencyResponse(FrequencyEntity frequency);
}
