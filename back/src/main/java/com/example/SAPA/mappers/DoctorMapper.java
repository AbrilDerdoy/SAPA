package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.DoctorResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DoctorMapper {

    DoctorResponseDTO toDoctorResponseDTO(DoctorEntity doctorEntity);
}
