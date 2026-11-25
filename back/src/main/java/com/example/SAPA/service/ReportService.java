package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.CreateReportRequestDTO;
import com.example.SAPA.DTOs.Response.ReportResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.Forum.ForumEntity;
import com.example.SAPA.Models.Forum.PostEntity;
import com.example.SAPA.Models.ReportEntity;
import com.example.SAPA.Repositories.ForumRepository;
import com.example.SAPA.Repositories.PostRepository;
import com.example.SAPA.Repositories.ReportRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.enums.ReportedContentType;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.exceptions.ResourceAlreadyExistsException;
import com.example.SAPA.mappers.ReportMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReportMapper reportMapper;
    private final UserContextService userContext;
    private final PostRepository postRepository;
    private final ForumRepository forumRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;


    @Transactional
    public ReportResponseDTO createReport(CreateReportRequestDTO request) throws AccessDeniedException {
        UserEntity user = userContext.getAuthenticatedUser();

        if (user.getRole() == UserCategory.ADMIN) {
            throw new AccessDeniedException("Los administradores no pueden reportar contenido.");
        }

        validateContentExists(request.contentType(), request.contentId(), user);

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

        notifyAdmins(saved);
        return reportMapper.toResponse(saved, reportedByName);
    }


    private void validateContentExists(ReportedContentType type, Long id, UserEntity user) throws AccessDeniedException {
        if (type == ReportedContentType.POST) {
            PostEntity post = postRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "La publicación reportada no existe."));

            if (post.getAuthor().getId().equals(user.getId())) {
                throw new AccessDeniedException(
                        "No podés reportar tu propia publicación.");
            }

        } else if (type == ReportedContentType.FORUM) {
            ForumEntity forum = forumRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "El foro reportado no existe."));

            if (forum.getCreatedBy().getId().equals(user.getId())) {
                throw new AccessDeniedException(
                        "No podés reportar tu propio foro.");
            }
        }
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDTO> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(r -> reportMapper.toResponse(
                        r,
                        userContext.resolveName(r.getReportedBy())
                ))
                .toList();
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

    @Transactional
    public ReportResponseDTO markAsPending(Long reportId) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Reporte no encontrado con id: " + reportId));

        report.setReviewed(false);

        ReportEntity saved = reportRepository.save(report);

        return reportMapper.toResponse(
                saved,
                userContext.resolveName(saved.getReportedBy())
        );
    }

    private void notifyAdmins(ReportEntity report) {
        List<UserEntity> admins = userRepository.findByRole(UserCategory.ADMIN);

        String contentType = report.getContentType() == ReportedContentType.POST
                ? "una publicación"
                : "un foro";

        String title = "Nuevo reporte recibido";

        String msg = "Se reportó " + contentType
                + " (ID: " + report.getContentId() + ")."
                + " Motivo: " + report.getReason();

        admins.forEach(admin ->
                notificationService.createNotification(
                        admin,
                        title,
                        msg,
                        NotificationType.REPORT
                )
        );
    }

    @Transactional
    public void deleteReportedPost(Long reportId) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Reporte no encontrado con id: " + reportId));

        if (report.getContentType() != ReportedContentType.POST) {
            throw new IllegalArgumentException(
                    "Este reporte no corresponde a una publicación.");
        }

        Long postId = report.getContentId();

        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "La publicación reportada no existe."));

        post.setActive(false);
        postRepository.save(post);

        reportRepository.deleteAllByContentTypeAndContentId(
                ReportedContentType.POST,
                postId
        );
    }

    @Transactional
    public void deleteReportedForum(Long reportId) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Reporte no encontrado con id: " + reportId));

        if (report.getContentType() != ReportedContentType.FORUM) {
            throw new IllegalArgumentException(
                    "Este reporte no corresponde a un foro.");
        }

        Long forumId = report.getContentId();

        ForumEntity forum = forumRepository.findById(forumId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "El foro reportado no existe."));

        forum.setActive(false);
        forumRepository.save(forum);

        reportRepository.deleteAllByContentTypeAndContentId(
                ReportedContentType.FORUM,
                forumId
        );
    }
}
