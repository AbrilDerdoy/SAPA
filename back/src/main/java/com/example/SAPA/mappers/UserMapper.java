package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.UserResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponseDTO toUserResponseDTO(UserEntity userEntity);
}
