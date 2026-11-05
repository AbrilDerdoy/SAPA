import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, retry } from 'rxjs';
import { MedicalRecord } from '../interfaces/medical-record';

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
}
