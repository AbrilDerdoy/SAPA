package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.ReportResponseDTO;
import com.example.SAPA.Models.ReportEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReportMapper {

    @Mapping(source = "report.id", target = "reportId")
    @Mapping(source = "report.reportedBy.id", target = "reportedById")
    ReportResponseDTO toResponse(ReportEntity report, String reportedByName);
}
