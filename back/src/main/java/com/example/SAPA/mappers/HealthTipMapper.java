package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.HealthTipResponseDTO;
import com.example.SAPA.Models.HealthTipEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface HealthTipMapper {

    HealthTipResponseDTO toHealthTipResponseDTO(HealthTipEntity healthTipEntity);
}
