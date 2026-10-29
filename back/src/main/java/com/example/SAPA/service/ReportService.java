package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.CreateReportRequestDTO;
import com.example.SAPA.DTOs.Response.ReportResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.ReportEntity;
import com.example.SAPA.Repositories.ForumRepository;
import com.example.SAPA.Repositories.PostRepository;
import com.example.SAPA.Repositories.ReportRepository;
import com.example.SAPA.enums.ReportedContentType;
import com.example.SAPA.exceptions.ResourceAlreadyExistsException;
import com.example.SAPA.mappers.ReportMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReportMapper reportMapper;
    private final UserContextService userContext;
    private final PostRepository postRepository;
    private final ForumRepository forumRepository;


    @Transactional
    public ReportResponseDTO createReport(CreateReportRequestDTO request) {
        UserEntity user = userContext.getAuthenticatedUser();

        validateContentExists(request.contentType(), request.contentId());

        boolean alreadyReported = reportRepository.existsByReportedByIdAndContentTypeAndContentId(
                user.getId(), request.contentType(), request.contentId());

        if (alreadyReported) {
            throw new ResourceAlreadyExistsException("Ya reportaste este contenido anteriormente.");
        }

        ReportEntity report = ReportEntity.builder()
                .reportedBy(user)
                .contentType(request.contentType())
                .contentId(request.contentId())
                .reason(request.reason())
                .build();

        ReportEntity saved = reportRepository.save(report);

        String reportedByName = userContext.resolveName(user);
        return reportMapper.toResponse(saved, reportedByName);
    }


    private void validateContentExists(ReportedContentType type, Long id) {

        if (type == ReportedContentType.POST) {
            if (!postRepository.existsById(id)) {
                throw new EntityNotFoundException("No se puede reportar el Post: El ID " + id + " no existe.");
            }

        } else if (type == ReportedContentType.FORUM) {
            if (!forumRepository.existsById(id)) {
                throw new EntityNotFoundException("No se puede reportar el Foro: El ID " + id + " no existe.");
            }
        }
    }


    @Transactional(readOnly = true)
    public List<ReportResponseDTO> getUnreviewed() {
        return reportRepository.findByReviewedFalseWithUser()
                .stream()
                .map(r -> reportMapper.toResponse(r, userContext.resolveName(r.getReportedBy())))
                .toList();
    }


    @Transactional
    public ReportResponseDTO markAsReviewed(Long reportId) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("Reporte no encontrado con id: " + reportId));

        report.setReviewed(true);
        ReportEntity saved = reportRepository.save(report);
        return reportMapper.toResponse(saved, userContext.resolveName(saved.getReportedBy()));
    }
}
