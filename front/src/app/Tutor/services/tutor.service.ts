import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  Tutor,
  TutorInvitation,
  TutorPatient,
} from '../models/tutor.model';

@Injectable({
  providedIn: 'root',
})
export class TutorService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = 'http://localhost:8080/tutors';

  getMyProfile(): Observable<Tutor> {
    return this.http.get<Tutor>(`${this.BASE_URL}/me`);
  }

  getMyPatients(): Observable<TutorPatient[]> {
    return this.http.get<TutorPatient[]>(`${this.BASE_URL}/patients`);
  }

  getLinkedPatient(patientId: number): Observable<TutorPatient> {
    return this.http.get<TutorPatient>(
      `${this.BASE_URL}/patients/${patientId}`,
    );
  }

  getMyTutor(): Observable<Tutor | null> {
    return this.http
      .get<Tutor>(`${this.BASE_URL}/my-tutor`, { observe: 'response' })
      .pipe(map((response) => response.body ?? null));
  }

  createInvitation(email: string): Observable<TutorInvitation> {
    return this.http.post<TutorInvitation>(`${this.BASE_URL}/invitations`, {
      email,
    });
  }

  acceptInvitation(token: string): Observable<TutorInvitation> {
    return this.http.post<TutorInvitation>(
      `${this.BASE_URL}/invitations/${encodeURIComponent(token)}/accept`,
      {},
    );
  }

  rejectInvitation(token: string): Observable<void> {
    return this.http.post<void>(
      `${this.BASE_URL}/invitations/${encodeURIComponent(token)}/reject`,
      {},
    );
  }

  getReceivedInvitations(): Observable<TutorInvitation[]> {
    return this.http.get<TutorInvitation[]>(
      `${this.BASE_URL}/invitations/received`,
    );
  }

  getSentInvitations(): Observable<TutorInvitation[]> {
    return this.http.get<TutorInvitation[]>(
      `${this.BASE_URL}/invitations/sent`,
    );
  }

  cancelInvitation(invitationId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_URL}/invitations/${invitationId}`,
    );
  }

  revokeLink(patientId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_URL}/patients/${patientId}/link`,
    );
  }
}
