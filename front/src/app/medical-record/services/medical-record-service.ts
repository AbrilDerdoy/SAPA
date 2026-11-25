import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MedicalRecord } from '../interfaces/medical-record';
import { Medication } from '../interfaces/medication/medication';
import { AddMedicationRequest } from '../interfaces/medication/add-medication-request';
import { UpdateMedicationRequest } from '../interfaces/medication/update-medication-request';

import {
  MedicalRecordMovement,
  MedicalRecordMovementFilters,
  MedicalRecordMovementRequest,
} from '../interfaces/medical-record-movement';

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  private readonly BASE_URL = 'http://localhost:8080/medical-records';
  private readonly http = inject(HttpClient);

  private buildParams(patientId?: number | null): HttpParams {
    return patientId != null
      ? new HttpParams().set('patientId', patientId)
      : new HttpParams();
  }

  getMyMedicalRecord(patientId?: number | null): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${this.BASE_URL}/my`, {
      params: this.buildParams(patientId)
    });
  }

  getPatientMedicalRecord(patientId: number): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(
      `${this.BASE_URL}/patient/${patientId}`
    );
  }

  getMyMedications(patientId?: number | null): Observable<Medication[]> {
    return this.http.get<Medication[]>(
      `${this.BASE_URL}/my/medications`,
      { params: this.buildParams(patientId) }
    );
  }

  getPatientMedications(patientId: number): Observable<Medication[]> {
    return this.http.get<Medication[]>(
      `${this.BASE_URL}/patient/${patientId}/medications`
    );
  }

  addMedication(
    patientId: number,
    medication: AddMedicationRequest
  ): Observable<Medication> {
    return this.http.post<Medication>(
      `${this.BASE_URL}/patient/${patientId}/medications`,
      medication
    );
  }

  updateMedication(
    medicationId: number,
    medication: UpdateMedicationRequest
  ): Observable<Medication> {
    return this.http.put<Medication>(
      `${this.BASE_URL}/medications/${medicationId}`,
      medication
    );
  }

  deleteMedication(
    medicationId: number,
    justification: string
  ): Observable<void> {
    const params = new HttpParams()
      .set('justification', justification);

    return this.http.delete<void>(
      `${this.BASE_URL}/medications/${medicationId}`,
      { params }
    );
  }

  getRecentMovements(
    patientId: number
  ): Observable<MedicalRecordMovement[]> {
    return this.http.get<MedicalRecordMovement[]>(
      `${this.BASE_URL}/patient/${patientId}/movements/recent`
    );
  }

  getAllMovements(
    patientId: number
  ): Observable<MedicalRecordMovement[]> {
    // Sin filtros se devuelve también el historial anterior y retirado.
    return this.filterMovements(patientId, {});
  }

  filterMovements(
    patientId: number,
    filters: MedicalRecordMovementFilters
  ): Observable<MedicalRecordMovement[]> {
    let params = new HttpParams();

    if (filters.doctorId != null) {
      params = params.set('doctorId', filters.doctorId);
    }

    if (filters.type?.trim()) {
      params = params.set('type', filters.type.trim());
    }

    if (filters.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    return this.http.get<MedicalRecordMovement[]>(
      `${this.BASE_URL}/patient/${patientId}/movements/filter`,
      { params }
    );
  }

  addMovement(
    patientId: number,
    request: MedicalRecordMovementRequest
  ): Observable<MedicalRecordMovement> {
    return this.http.post<MedicalRecordMovement>(
      `${this.BASE_URL}/patient/${patientId}/movements`,
      request
    );
  }

  updateMovement(
    patientId: number,
    movementId: number,
    request: MedicalRecordMovementRequest
  ): Observable<MedicalRecordMovement> {
    return this.http.put<MedicalRecordMovement>(
      `${this.BASE_URL}/patient/${patientId}/movements/${movementId}`,
      request
    );
  }

  retireMovement(
    patientId: number,
    movementId: number,
    justification: string
  ): Observable<MedicalRecordMovement> {
    const params = new HttpParams()
      .set('justification', justification);

    return this.http.patch<MedicalRecordMovement>(
      `${this.BASE_URL}/patient/${patientId}/movements/${movementId}/retire`,
      null,
      { params }
    );
  }

  addMovementImage(
    patientId: number,
    movementId: number,
    file: File
  ): Observable<MedicalRecordMovement> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<MedicalRecordMovement>(
      `${this.BASE_URL}/patient/${patientId}/movements/${movementId}/attachments`,
      formData
    );
  }
}
