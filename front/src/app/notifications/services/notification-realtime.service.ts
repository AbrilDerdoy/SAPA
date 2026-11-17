import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { NotificationResponse } from '../models/notification-response';

@Injectable({
  providedIn: 'root',
})
export class NotificationRealtimeService {
  private readonly wsUrl = 'http://localhost:8080/ws';
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private initializing = false;
  private connectionAttempt = 0;
  private readonly notificationSubject = new Subject<NotificationResponse>();

  readonly notifications$: Observable<NotificationResponse> =
    this.notificationSubject.asObservable();

  async connect(): Promise<void> {
    if (this.client?.active || this.initializing) {
      return;
    }

    const accessToken = this.readAccessToken();
    if (!accessToken) {
      return;
    }

    this.initializing = true;
    const connectionAttempt = ++this.connectionAttempt;
    try {
      (globalThis as any).global = globalThis;
      const sockJsModule = await import('sockjs-client');
      if (connectionAttempt !== this.connectionAttempt) {
        return;
      }
      const SockJS = sockJsModule.default;
      const client = new Client({
        webSocketFactory: () => new SockJS(this.wsUrl),
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        // Toma el token más reciente en cada reconexión, así el refresh
        // del interceptor también aplica a las notificaciones en tiempo real.
        beforeConnect: (stompClient: Client) => {
          const latestToken = this.readAccessToken();

          if (latestToken) {
            stompClient.connectHeaders = {
              Authorization: `Bearer ${latestToken}`,
            };
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          if (connectionAttempt !== this.connectionAttempt) {
            return;
          }
          this.subscription?.unsubscribe();
          this.subscription = client.subscribe(
            '/user/queue/notifications',
            (frame: IMessage) => this.handleNotification(frame),
          );
        },
        onStompError: (frame) => {
          console.error(
            'Error STOMP en notificaciones:',
            frame.headers['message'],
            frame.body,
          );
        },
        onWebSocketError: (error) => {
          console.error('Error WebSocket en notificaciones:', error);
        },
      });

      this.client = client;
      await client.activate();
    } catch (error) {
      console.error('Error al conectar las notificaciones en tiempo real:', error);
    } finally {
      this.initializing = false;
    }
  }

  disconnect(): void {
    this.connectionAttempt++;
    this.subscription?.unsubscribe();
    this.subscription = null;

    if (this.client) {
      const client = this.client;
      this.client = null;
      void client.deactivate();
    }
  }

  private readAccessToken(): string | null {
    try {
      const tokens = JSON.parse(localStorage.getItem('jwt') ?? '{}') as {
        AccessToken?: string;
      };

      return tokens.AccessToken ?? null;
    } catch (error) {
      console.error('Error al leer el token para las notificaciones:', error);
      return null;
    }
  }

  private handleNotification(frame: IMessage): void {
    try {
      this.notificationSubject.next(JSON.parse(frame.body) as NotificationResponse);
    } catch (error) {
      console.error('Error al procesar una notificación recibida:', error);
    }
  }
}
