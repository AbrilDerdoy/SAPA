import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationResponse } from '../../models/notification-response';
import { NotificationRealtimeService } from '../../services/notification-realtime.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-menu',
  imports: [DatePipe],
  templateUrl: './notification-menu.html',
  styleUrl: './notification-menu.css',
})
export class NotificationMenu implements OnDestroy, OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly notificationRealtime = inject(NotificationRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuAbierto = signal(false);
  readonly notifications = signal<NotificationResponse[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly processingIds = signal<ReadonlySet<number>>(new Set());
  readonly unreadCount = computed(
    () => this.notifications().filter((notification) => !notification.readed).length,
  );

  ngOnInit(): void {
    this.loadNotifications();
    this.notificationRealtime.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => this.upsertNotification(notification));
    void this.notificationRealtime.connect();
  }

  ngOnDestroy(): void {
    this.notificationRealtime.disconnect();
  }

  toggleMenu(): void {
    this.menuAbierto.update((open) => !open);
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.notificationService.getMyNotifications().subscribe({
      next: (notifications) => {
        const currentNotifications = this.notifications();
        const mergedNotifications = new Map(
          notifications.map((notification) => [notification.notificationId, notification]),
        );
        currentNotifications.forEach((notification) => {
          mergedNotifications.set(notification.notificationId, notification);
        });
        this.notifications.set(
          [...mergedNotifications.values()].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          ),
        );
      },
      error: (error: unknown) => {
        console.error('Error al cargar las notificaciones:', error);
        this.errorMessage.set('No se pudieron cargar las notificaciones.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  markAsRead(notification: NotificationResponse): void {
    if (notification.readed || this.processingIds().has(notification.notificationId)) {
      return;
    }

    this.errorMessage.set(null);
    this.processingIds.update((ids) => new Set(ids).add(notification.notificationId));

    this.notificationService.markAsRead(notification.notificationId).subscribe({
      next: (updatedNotification) => {
        this.notifications.update((notifications) =>
          notifications.map((item) =>
            item.notificationId === updatedNotification.notificationId
              ? updatedNotification
              : item,
          ),
        );
      },
      error: (error: unknown) => {
        console.error('Error al marcar la notificación como leída:', error);
        this.errorMessage.set('No se pudo marcar la notificación como leída.');
        this.stopProcessing(notification.notificationId);
      },
      complete: () => this.stopProcessing(notification.notificationId),
    });
  }

  private stopProcessing(notificationId: number): void {
    this.processingIds.update((ids) => {
      const nextIds = new Set(ids);
      nextIds.delete(notificationId);
      return nextIds;
    });
  }

  private upsertNotification(notification: NotificationResponse): void {
    this.notifications.update((notifications) => {
      const updatedNotifications = new Map(
        notifications.map((item) => [item.notificationId, item]),
      );
      updatedNotifications.set(notification.notificationId, notification);
      return [...updatedNotifications.values()].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
    });
  }
}
