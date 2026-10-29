package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.TreatmentDurationDTO;
import com.example.SAPA.Models.MedicalRecord.DurationEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DurationMapper {

    @Mapping(source = "durationUnit", target = "unit")
    TreatmentDurationDTO toDurationResponse(DurationEntity duration);
}
