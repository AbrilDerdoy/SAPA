import { Injectable } from '@angular/core';
import {
  Client,
  IMessage,
  StompSubscription
} from '@stomp/stompjs';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Message } from '../models/message.model';

interface JwtTokens {
  AccessToken?: string;
}

export interface PresenceUpdate {
  userId: number;
  online: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatWebSocketService {

  private readonly WS_URL = 'http://localhost:8080/ws';

  private client: Client | null = null;

  private conversationSubscription: StompSubscription | null = null;
  private presenceSubscription: StompSubscription | null = null;

  private pendingConversationId: number | null = null;
  private pendingOtherParticipantId: number | null = null;

  private initializing = false;

  private readonly incomingMessageSubject = new Subject<Message>();
  private readonly presenceSubject = new Subject<PresenceUpdate>();

  private readonly connectionSubject =
    new BehaviorSubject<boolean>(false);

  readonly incomingMessages$: Observable<Message> =
    this.incomingMessageSubject.asObservable();

  readonly presenceUpdates$: Observable<PresenceUpdate> =
    this.presenceSubject.asObservable();

  readonly connectionStatus$: Observable<boolean> =
    this.connectionSubject.asObservable();

  async connectToConversation(
    conversationId: number,
    otherParticipantId: number
  ): Promise<void> {

    this.pendingConversationId = conversationId;
    this.pendingOtherParticipantId = otherParticipantId;

    if (this.client?.connected) {
      this.subscribeToConversation(conversationId);
      this.subscribeToPresence(otherParticipantId);
      return;
    }

    if (this.client?.active || this.initializing) {
      return;
    }

    const accessToken = this.readAccessToken();

    if (!accessToken) {
      console.error('No se encontró el AccessToken.');
      this.connectionSubject.next(false);
      return;
    }

    this.initializing = true;
    this.connectionSubject.next(false);

    try {

      Reflect.set(globalThis, 'global', globalThis);

      const sockJsModule = await import('sockjs-client');
      const SockJS = sockJsModule.default;

      const client = new Client({

        webSocketFactory: () => new SockJS(this.WS_URL),

        connectHeaders: {
          Authorization: `Bearer ${accessToken}`
        },

        beforeConnect: (stompClient: Client) => {

          const latestToken = this.readAccessToken();

          if (latestToken) {
            stompClient.connectHeaders = {
              Authorization: `Bearer ${latestToken}`
            };
          }
        },

        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {

          this.connectionSubject.next(true);

          if (this.pendingConversationId !== null) {
            this.subscribeToConversation(
              this.pendingConversationId
            );
          }

          if (this.pendingOtherParticipantId !== null) {
            this.subscribeToPresence(
              this.pendingOtherParticipantId
            );
          }
        },

        onDisconnect: () => {
          this.connectionSubject.next(false);
        },

        onWebSocketClose: () => {
          this.connectionSubject.next(false);
          this.clearSubscriptions();
        },

        onStompError: frame => {

          this.connectionSubject.next(false);

          console.error(
            'Error STOMP:',
            frame.headers['message'],
            frame.body
          );
        },

        onWebSocketError: error => {

          this.connectionSubject.next(false);

          console.error('Error WebSocket:', error);
        }
      });

      this.client = client;
      client.activate();

    } catch (error) {

      this.connectionSubject.next(false);

      console.error(
        'Error al inicializar WebSocket:',
        error
      );

    } finally {
      this.initializing = false;
    }
  }

  private subscribeToConversation(
    conversationId: number
  ): void {

    if (!this.client?.connected) {
      return;
    }

    this.conversationSubscription?.unsubscribe();
    this.conversationSubscription = null;

    this.conversationSubscription = this.client.subscribe(
      `/queue/conversation/${conversationId}`,
      (frame: IMessage) => {

        try {

          const message = JSON.parse(frame.body) as Message;

          this.incomingMessageSubject.next(message);

        } catch (error) {

          console.error(
            'Error al procesar el mensaje recibido:',
            error
          );
        }
      }
    );
  }

  private subscribeToPresence(userId: number): void {

    if (!this.client?.connected) {
      return;
    }

    this.presenceSubscription?.unsubscribe();
    this.presenceSubscription = null;

    this.presenceSubscription = this.client.subscribe(
      `/topic/presence/${userId}`,
      (frame: IMessage) => {

        try {

          const update = JSON.parse(frame.body) as PresenceUpdate;

          if (
            typeof update.userId === 'number' &&
            typeof update.online === 'boolean'
          ) {
            this.presenceSubject.next(update);
          }

        } catch (error) {

          console.error(
            'Error al procesar la presencia:',
            error
          );
        }
      }
    );
  }

  private readAccessToken(): string | null {

    try {

      const tokens = JSON.parse(
        localStorage.getItem('jwt') ?? '{}'
      ) as JwtTokens;

      return tokens.AccessToken ?? null;

    } catch (error) {

      console.error(
        'Error al leer el token JWT:',
        error
      );

      return null;
    }
  }

  sendMessage(
    conversationId: number,
    content: string
  ): boolean {

    if (!this.client?.connected) {
      console.error('WebSocket no está conectado.');
      return false;
    }

    const cleanContent = content.trim();

    if (!cleanContent) {
      return false;
    }

    try {

      this.client.publish({
        destination: `/app/chat/${conversationId}`,
        body: JSON.stringify({
          content: cleanContent,
          type: 'TEXT'
        })
      });

      return true;

    } catch (error) {

      console.error(
        'Error al enviar el mensaje:',
        error
      );

      return false;
    }
  }

  private clearSubscriptions(): void {

    this.conversationSubscription = null;
    this.presenceSubscription = null;
  }

  disconnect(): void {

    this.conversationSubscription?.unsubscribe();
    this.presenceSubscription?.unsubscribe();

    this.clearSubscriptions();

    this.pendingConversationId = null;
    this.pendingOtherParticipantId = null;

    this.connectionSubject.next(false);

    if (this.client) {

      const currentClient = this.client;
      this.client = null;

      void currentClient.deactivate();
    }
  }
}