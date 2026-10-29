package com.example.SAPA.Repositories;

import com.example.SAPA.Models.ReportEntity;
import com.example.SAPA.enums.ReportedContentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<ReportEntity, Long> {

    @Query("SELECT r FROM ReportEntity r JOIN FETCH r.reportedBy WHERE r.reviewed = false")
    List<ReportEntity> findByReviewedFalseWithUser();

    boolean existsByReportedByIdAndContentTypeAndContentId(Long reportedById, ReportedContentType contentType,
                                                           Long contentId);
}
