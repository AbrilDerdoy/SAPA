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

@Injectable({
  providedIn: 'root'
})
export class ChatWebSocketService {

  private readonly WS_URL = 'http://localhost:8080/ws';

  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private pendingConversationId: number | null = null;
  private initializing = false;

  private readonly incomingMessageSubject = new Subject<Message>();

  private readonly connectionSubject =
    new BehaviorSubject<boolean>(false);

  readonly incomingMessages$: Observable<Message> =
    this.incomingMessageSubject.asObservable();

  readonly connectionStatus$: Observable<boolean> =
    this.connectionSubject.asObservable();

  async connectToConversation(conversationId: number): Promise<void> {
    this.pendingConversationId = conversationId;

    if (this.client?.connected) {
      this.subscribeToConversation(conversationId);
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

        // Se ejecuta en cada (re)conexión: toma el token más reciente,
        // incluyendo el que el interceptor haya renovado mientras tanto.
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
        },

        onDisconnect: () => {
          this.connectionSubject.next(false);
        },

        onWebSocketClose: () => {
          this.connectionSubject.next(false);
          this.subscription = null;
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
      console.error('Error al inicializar WebSocket:', error);

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

    this.subscription?.unsubscribe();
    this.subscription = null;

    this.subscription = this.client.subscribe(
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

  private readAccessToken(): string | null {
    try {
      const tokens = JSON.parse(localStorage.getItem('jwt') ?? '{}') as JwtTokens;
      return tokens.AccessToken ?? null;
    } catch (error) {
      console.error('Error al leer el token JWT:', error);
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
      console.error('Error al enviar el mensaje:', error);
      return false;
    }
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;

    this.pendingConversationId = null;
    this.connectionSubject.next(false);

    if (this.client) {
      const currentClient = this.client;
      this.client = null;

      void currentClient.deactivate();
    }
  }
}