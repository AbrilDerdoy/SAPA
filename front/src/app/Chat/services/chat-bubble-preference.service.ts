
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatBubblePreferenceService {

  private readonly STORAGE_KEY = 'sapa_chat_bubble_enabled';

  readonly enabled = signal<boolean>(true);

  constructor() {
    this.loadPreference();
  }

  loadPreference(): void {
    const savedPreference = localStorage.getItem(this.STORAGE_KEY);

    if (savedPreference === null) {
      this.enabled.set(true);
      return;
    }

    this.enabled.set(savedPreference === 'true');
  }

  setPreference(value: boolean): void {
    this.enabled.set(value);

    localStorage.setItem(
      this.STORAGE_KEY,
      String(value)
    );
  }

  togglePreference(): void {
    this.setPreference(!this.enabled());
  }
}
