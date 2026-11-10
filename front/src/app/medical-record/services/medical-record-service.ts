import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MedicalRecord } from '../interfaces/medical-record';
import { Medication } from '../interfaces/medication/medication';
import { AddMedicationRequest } from '../interfaces/medication/add-medication-request';
import { UpdateMedicationRequest } from '../interfaces/medication/update-medication-request';

@Injectable({
  providedIn: 'root',
})
export class MedicalRecordService {
  private readonly BASE_URL = 'http://localhost:8080/medical-records'
  private readonly http = inject(HttpClient)

  private buildParams(patientId?: number | null): HttpParams {
    return patientId ? new HttpParams().set('patientId', patientId) : new HttpParams();
  }

    // Obtener la ficha médica del paciente autenticado o del paciente tutelado.
  getMyMedicalRecord(patientId?: number | null): Observable<MedicalRecord>{
    return this.http.get<MedicalRecord>(`${this.BASE_URL}/my`, {
      params: this.buildParams(patientId)
    })
  }

    // Obtener la ficha médica de un paciente desde la cuenta del médico o tutor.
  getPatientMedicalRecord(patientId: number): Observable<MedicalRecord>{
    return this.http.get<MedicalRecord>(`${this.BASE_URL}/patient/${patientId}`)
  }

    // Medicaciones del paciente autenticado o del paciente tutelado.
  getMyMedications(patientId?: number | null): Observable<Medication[]> {
    return this.http.get<Medication[]>(
      `${this.BASE_URL}/my/medications`,
      { params: this.buildParams(patientId) }
    );
  }

    // Medicaciones de un paciente desde la cuenta del médico o tutor.
  getPatientMedications(patientId: number): Observable<Medication[]> {
    return this.http.get<Medication[]>(
      `${this.BASE_URL}/patient/${patientId}/medications`
    );
  }

    // Agregar medicación
  addMedication(
    patientId: number,
    medication: AddMedicationRequest
  ): Observable<Medication> {
    return this.http.post<Medication>(
      `${this.BASE_URL}/patient/${patientId}/medications`,
      medication
    );
  }

    // Modificar medicación
  updateMedication(
    medicationId: number,
    medication: UpdateMedicationRequest
  ): Observable<Medication> {
    return this.http.put<Medication>(
      `${this.BASE_URL}/medications/${medicationId}`,
      medication
    );
  }

    // Eliminar medicación
  deleteMedication(medicationId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_URL}/medications/${medicationId}`
    );
  }
  
}
