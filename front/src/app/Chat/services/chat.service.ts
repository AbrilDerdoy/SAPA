import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly API_URL = 'http://localhost:8080/conversations';
  private readonly http = inject(HttpClient);

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(this.API_URL);
  }

  getMessages(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.API_URL}/${conversationId}/messages`
    );
  }

  uploadAttachment(
    conversationId: number,
    file: File
  ): Observable<Message> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Message>(
      `${this.API_URL}/${conversationId}/attachments`,
      formData
    );
  }
}
