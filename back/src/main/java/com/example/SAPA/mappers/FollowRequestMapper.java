package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.FollowRequestResponseDTO;
import com.example.SAPA.Models.FollowRequestEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FollowRequestMapper {

    FollowRequestResponseDTO toResponse(FollowRequestEntity followRequestEntity);
}
