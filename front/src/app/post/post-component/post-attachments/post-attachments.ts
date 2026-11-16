import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { PostAttachmentResponse } from '../../post-DTOs/post-attachment-response';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-post-attachments',
  imports: [],
  templateUrl: './post-attachments.html',
  styleUrl: './post-attachments.css',
})
export class PostAttachments implements OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(Auth);

  attachments = input.required<PostAttachmentResponse[]>();

  attachmentUrls = signal<Record<number, string>>({});
  private subscriptions: Subscription[] = [];
  private objectUrls = new Map<number, string>();

  constructor() {
    effect(() => {
      this.loadAttachments(this.attachments());
    });
  }

  private loadAttachments(attachments: PostAttachmentResponse[]): void {
    this.clearAttachments();

    const token = this.auth.getAccessToken();

    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    for (const attachment of attachments) {
      const subscription = this.http.get(
        `http://localhost:8080${attachment.fileUrl}`,
        {
          headers,
          responseType: 'blob'
        }
      ).subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);

          this.objectUrls.set(attachment.attachmentId, url);

          this.attachmentUrls.update(current => ({
            ...current,
            [attachment.attachmentId]: url
          }));
        }
      });

      this.subscriptions.push(subscription);
    }
  }

  isImage(attachment: PostAttachmentResponse): boolean {
    return attachment.contentType.startsWith('image/');
  }

  formatSize(size: number): string {
    return size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  private clearAttachments(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];

    for (const url of this.objectUrls.values()) {
      URL.revokeObjectURL(url);
    }

    this.objectUrls.clear();
    this.attachmentUrls.set({});
  }

  ngOnDestroy(): void {
    this.clearAttachments();
  }
}
