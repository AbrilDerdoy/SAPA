import { HttpClient } from '@angular/common/http';
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

    // Obtener la ficha médica del paciente autenticado.
  getMyMedicalRecord(): Observable<MedicalRecord>{
    return this.http.get<MedicalRecord>(`${this.BASE_URL}/my`)
  }

    // Obtener la ficha médica de un paciente desde la cuenta del médico.
  getPatientMedicalRecord(patientId: number): Observable<MedicalRecord>{
    return this.http.get<MedicalRecord>(`${this.BASE_URL}/patient/${patientId}`)
  }

    // Medicaciones del paciente autenticado
  getMyMedications(): Observable<Medication[]> {
    return this.http.get<Medication[]>(
      `${this.BASE_URL}/my/medications`
    );
  }

    // Medicaciones de un paciente desde la cuenta del médico
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
