
import { Injectable } from '@angular/core';
import {
  Client,
  IMessage,
  StompSubscription
} from '@stomp/stompjs';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Message } from '../models/message.model';

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

    const jwtData = localStorage.getItem('jwt');

    if (!jwtData) {
      console.error('No se encontró el token JWT.');
      this.connectionSubject.next(false);
      return;
    }

    let accessToken: string;

    try {
      const tokens = JSON.parse(jwtData);
      accessToken = tokens.AccessToken;

      if (!accessToken) {
        console.error('No se encontró AccessToken.');
        this.connectionSubject.next(false);
        return;
      }
    } catch (error) {
      console.error('Error al leer el token JWT:', error);
      this.connectionSubject.next(false);
      return;
    }

    this.initializing = true;
    this.connectionSubject.next(false);

    try {
      // Prepara la variable global antes de cargar SockJS.
      (globalThis as any).global = globalThis;

      // Carga SockJS únicamente cuando se necesita conectar.
      const sockJsModule = await import('sockjs-client');
      const SockJS = sockJsModule.default;

      this.client = new Client({

        webSocketFactory: () => new SockJS(this.WS_URL),

        connectHeaders: {
          Authorization: `Bearer ${accessToken}`
        },

        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {
          console.log('WebSocket conectado correctamente.');

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

      this.client.activate();

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
          const message: Message = JSON.parse(frame.body);
          this.incomingMessageSubject.next(message);

        } catch (error) {
          console.error(
            'Error al procesar el mensaje recibido:',
            error
          );
        }
      }
    );

    console.log(
      'Suscrito a la conversación:',
      conversationId
    );
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
