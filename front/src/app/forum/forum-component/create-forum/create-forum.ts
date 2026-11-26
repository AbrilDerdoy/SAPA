import { Component, inject, signal } from '@angular/core';
import { ForumService } from '../../forum-service/forum-service';
import { Router } from '@angular/router';
import { ForumRequest } from '../../forum-DTOs/forum-request';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';

@Component({
  selector: 'app-create-forum',
  imports: [FormField],
  templateUrl: './create-forum.html',
  styleUrl: './create-forum.css',
})
export class CreateForum {
  private forumService = inject(ForumService);
  private router = inject(Router);

  error = signal('');
  imagenSeleccionada = signal<File | null>(null)
  imagenPreview = signal<string | null>(null);

  modelo = signal<ForumRequest>({
    title: '',
    content: ''
  });

  formulario = form(this.modelo, path => {
    required(path.title, { message: 'El título es obligatorio.' });
    minLength(path.title, 3, { message: 'El título debe tener al menos 3 caracteres.' });
    maxLength(path.title, 150, { message: 'El título no puede tener más de 150 caracteres.' });

    required(path.content, { message: 'El contenido es obligatorio.' });
    minLength(path.content, 10, { message: 'El contenido debe tener al menos 10 caracteres.' });
    maxLength(path.content, 5000, { message: 'El contenido no puede tener más de 5000 caracteres.' });
  });

  guardar(): void {
    if (this.formulario().invalid()) return;

    const formData = new FormData()
    formData.append(
      'request',
      new Blob([JSON.stringify(this.modelo())], { type: 'application/json' })
    )

    const imagen = this.imagenSeleccionada()

    if (imagen) {
      formData.append('image', imagen)
    }
    this.forumService.createForum(formData).subscribe({
      next: () => this.router.navigate(['/forums']),
      error: () => this.error.set('Error al crear el foro.')
    });
  }

  cancelar(): void {
    this.router.navigate(['/forums']);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0] ?? null

    if (!file) {
      this.imagenSeleccionada.set(null)
      return
    }

    if (file) {
      this.imagenSeleccionada.set(file);
      this.imagenPreview.set(URL.createObjectURL(file));
    }

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]

    if (!tiposPermitidos.includes(file.type)) {
      this.error.set('Solo se permiten imágenes JPG, PNG, WEBP o GIF.')
      input.value = ''
      this.imagenSeleccionada.set(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      this.error.set('La imagen no puede superar los 10 MB.')
      input.value = ''
      this.imagenSeleccionada.set(null)
      return
    }

    this.error.set('')
    this.imagenSeleccionada.set(file)
  }
}
