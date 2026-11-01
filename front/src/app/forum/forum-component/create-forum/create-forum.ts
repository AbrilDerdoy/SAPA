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

  modelo = signal<ForumRequest>({
    title: '',
    content: ''
  });

  formulario = form(this.modelo, path => {
    required(path.title, { message: 'El título es obligatorio.' });
    minLength(path.title, 3, { message: 'El título debe tener al menos 3 caracteres.' });
    maxLength(path.title, 50, { message: 'El título no puede tener más de 50 caracteres.' });

    required(path.content, { message: 'El contenido es obligatorio.' });
    minLength(path.content, 10, { message: 'El contenido debe tener al menos 10 caracteres.' });
    maxLength(path.content, 100, { message: 'El contenido no puede tener más de 100 caracteres.' });
  });

  guardar(): void {
    if (this.formulario().invalid()) return;

    this.forumService.createForum(this.modelo()).subscribe({
      next: () => this.router.navigate(['/forums']),
      error: () => this.error.set('Error al crear el foro.')
    });
  }

  cancelar(): void {
    this.router.navigate(['/forums']);
  }
}
