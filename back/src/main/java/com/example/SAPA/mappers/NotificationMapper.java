package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.NotificationResponseDTO;
import com.example.SAPA.Models.NotificationEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(source = "id", target = "notificationId")
    NotificationResponseDTO toResponse(NotificationEntity notification);
}
