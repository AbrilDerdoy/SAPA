import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateReportRequest } from '../report-DTOs/create-report-request';
import { ReportResponse } from '../report-DTOs/report-response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private http = inject(HttpClient)
  private BASE_URL = 'http://localhost:8080/reports'

  // Crear un reporte.
  createReport(request: CreateReportRequest) {
    return this.http.post<ReportResponse>(this.BASE_URL, request)
  }

  // Obtener reportes pendientes.
  getUnreviewedReports() {
    return this.http.get<ReportResponse[]>(`${this.BASE_URL}/unreviewed`)
  }


  // Obtener todos los reportes.
  getAllReports() {
    return this.http.get<ReportResponse[]>(this.BASE_URL)
  }

  // Marcar un reporte como revisado.
  markAsReviewed(reportId: number): Observable<ReportResponse> {
    return this.http.patch<ReportResponse>(`${this.BASE_URL}/${reportId}/review`, null)
  }

  // Eliminar una publicación reportada (moderación ADMIN).
  deleteReportedPost(reportId: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE_URL}/${reportId}/delete-post`, null)
  }
}
