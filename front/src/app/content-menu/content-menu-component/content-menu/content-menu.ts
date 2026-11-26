import { Component, HostListener, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-content-menu',
  imports: [],
  templateUrl: './content-menu.html',
  styleUrl: './content-menu.css',
})
export class ContentMenu {
  canReport = input(false)
  canEdit = input(false)
  canDelete = input(false)

  report = output<void>()
  edit = output<void>()
  delete = output<void>()

  menuOpen = signal(false)

  toggleMenu() {
    this.menuOpen.update(open => !open)
  }

  closeMenu() {
    this.menuOpen.set(false)
  }

  @HostListener('document:click')
  cerrarMenuAlHacerClickFuera(): void {
    this.menuOpen.set(false)
  }

  onReport() {
    this.closeMenu()
    this.report.emit()
  }

  onEdit() {
    this.closeMenu()
    this.edit.emit()
  }

  onDelete() {
    this.closeMenu()
    this.delete.emit()
  }
}
