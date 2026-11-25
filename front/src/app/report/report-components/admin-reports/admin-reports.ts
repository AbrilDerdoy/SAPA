import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ReportService } from '../../report-services/report-service';
import { ReportResponse } from '../../report-DTOs/report-response';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ForumService } from '../../../forum/forum-service/forum-service';

@Component({
  selector: 'app-admin-reports',
  imports: [DatePipe],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css',
})
export class AdminReports implements OnInit {
  private reportService = inject(ReportService)
  private readonly router = inject(Router)
  private readonly forumService = inject(ForumService)

  title = input('Reportes pendientes')

  reports = signal<ReportResponse[]>([])
  loading = signal(true)
  error = signal('')

  reportTab = signal<'PENDING' | 'REVIEWED'>('PENDING')

  readonly pendingReports = computed(() =>
    this.reports().filter(report => !report.reviewed)
  );

  readonly reviewedReports = computed(() =>
    this.reports().filter(report => report.reviewed)
  );

  readonly displayedReports = computed(() =>
    this.reportTab() === 'PENDING'
      ? this.pendingReports()
      : this.reviewedReports()
  );

  readonly currentPage = signal(1);
  readonly pageSize = 5;

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.displayedReports().length / this.pageSize))
  );

  readonly paginatedReports = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.displayedReports().slice(start, start + this.pageSize);
  });

  //
  ngOnInit() {
    this.loadReports()
  }

  loadReports(): void {
    this.loading.set(true)
    this.error.set('')

    this.reportService.getAllReports().subscribe({
      next: (reports: ReportResponse[]) => {
        this.reports.set(reports)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('No se pudieron cargar los reportes.')
        this.loading.set(false)
      }
    })
  }

  markAsReviewed(reportId: number): void {
    this.reportService.markAsReviewed(reportId).subscribe({
      next: (updatedReport: ReportResponse) => {
        this.reports.update(reports =>
          reports.map(report =>
            report.reportId === updatedReport.reportId
              ? updatedReport
              : report
          )
        )
      },
      error: () => {
        this.error.set('No se pudo actualizar el reporte.')
      }
    })
  }

  markAsPending(reportId: number): void {
    this.reportService.markAsPending(reportId).subscribe({
      next: (updatedReport: ReportResponse) => {
        this.reports.update(reports =>
          reports.map(report =>
            report.reportId === updatedReport.reportId
              ? updatedReport
              : report
          )
        )
      },
      error: () => {
        this.error.set('No se pudo quitar la revisión del reporte.')
      }
    })
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;

    this.currentPage.set(page);
  }

  changeTab(tab: 'PENDING' | 'REVIEWED'): void {
    this.reportTab.set(tab);
    this.currentPage.set(1);
  }

  viewReportedContent(report: ReportResponse): void {
    if (report.contentType === 'POST') {
      void this.router.navigate(['/posts', report.contentId]);
      return;
    }

    this.forumService.getAllForums().subscribe({
      next: forums => {
        const forum = forums.find(f => f.forumId === report.contentId);

        if (!forum) {
          this.error.set('No se encontró el foro reportado.');
          return;
        }

        void this.router.navigate(['/forums', forum.title]);
      },
      error: () => {
        this.error.set('No se pudo encontrar el foro reportado.');
      }
    });
  }

  deleteReportedPost(report: ReportResponse): void {
    if (report.contentType !== 'POST') return

    const confirmed = window.confirm(
      '¿Estás segura de que querés eliminar esta publicación? Dejará de estar visible para los usuarios.'
    )

    if (!confirmed) return

    this.reportService.deleteReportedPost(report.reportId).subscribe({
      next: () => {
        this.loadReports()
      },
      error: () => {
        this.error.set('No se pudo eliminar la publicación reportada.')
      }
    })
  }

  deleteReportedForum(report: ReportResponse): void {
    if (report.contentType !== 'FORUM') return

    const confirmed = window.confirm(
      '¿Estás segura de que querés eliminar este foro? Dejará de estar visible para los usuarios.'
    )

    if (!confirmed) return

    this.reportService.deleteReportedForum(report.reportId).subscribe({
      next: () => {
        this.loadReports()
      },
      error: () => {
        this.error.set('No se pudo eliminar el foro reportado.')
      }
    })
  }

}
