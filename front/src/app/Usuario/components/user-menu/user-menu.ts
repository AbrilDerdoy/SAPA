import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Auth } from '../../services/Auth/auth';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../Theme/Service/theme-service';

@Component({
  selector: 'app-user-menu',
  imports: [RouterLink],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  readonly theme = inject(ThemeService);
  readonly auth = inject(Auth)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  menuAbierto = signal<boolean>(false);

  toggleMenu(){
    this.menuAbierto.update(valor => !valor);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuAbierto()) return;

    const target = event.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) return;

    this.menuAbierto.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuAbierto.set(false);
  }

}
