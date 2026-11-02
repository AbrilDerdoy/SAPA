import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationResponse } from '../models/notification-response';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly baseUrl = 'http://localhost:8080/notifications';
  private readonly http = inject(HttpClient);

  getMyNotifications(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(this.baseUrl);
  }

  markAsRead(notificationId: number): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(
      `${this.baseUrl}/${notificationId}/read`,
      {},
    );
  }
}
