import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import { ForumService } from '../../forum-service/forum-service';
import { ForumRequest } from '../../forum-DTOs/forum-request';
import { ForumResponse } from '../../forum-DTOs/forum-response';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-update-forum',
  imports: [FormField],
  templateUrl: './update-forum.html',
  styleUrl: './update-forum.css',
})
export class UpdateForum implements OnInit {
  private forumService = inject(ForumService)
  private route = inject(ActivatedRoute)
  private router = inject(Router)

  forum = signal<ForumResponse | null>(null)

  error = signal('')
  cargando = signal(true)

  imagenSeleccionada = signal<File | null>(null)
  imagenPreview = signal<string | null>(null)

  // Datos del frormulario.
  modelo = signal<ForumRequest>({
    title: '',
    content: ''
  })

  formulario = form(this.modelo, path => {
    required(path.title, { message: 'El título es obligatorio.' })
    minLength(path.title, 3, { message: 'El título debe tener al menos 3 caracteres.' })
    maxLength(path.title, 150, { message: 'El título no puede tener más de 150 caracteres.' })
    required(path.content, { message: 'El contenido es obligatorio.' })
    minLength(path.content, 10, { message: 'El contenido debe tener al menos 10 caracteres.' })
    maxLength(path.content, 5000, { message: 'El contenido no puede tener más de 5000 caracteres.' })
  })

  ngOnInit(): void {
    const titleForum = this.route.snapshot.paramMap.get('titleForum')

    if (!titleForum) {
      this.error.set('No se especificó el foro.')
      this.cargando.set(false)
      return
    }

    this.forumService.filterForums(titleForum).subscribe({
      next: (datos) => {
        const foro = datos.find(f => f.title === titleForum)

        if (!foro) {
          this.error.set('No se encontró el foro.')
          this.cargando.set(false)
          return
        }

        this.forum.set(foro)
        this.modelo.set({
          title: foro.title,
          content: foro.content
        })
        this.cargando.set(false)
      },
      error: () => {
        this.error.set('Error al cargar el foro.')
        this.cargando.set(false)
      }
    })
  }

  // Guardar formulario ya sea por creación o edición.
  guardar(): void {
    if (this.formulario().invalid()) return
    const foro = this.forum()

    if (!foro) return

    const formData = new FormData()

    const request: ForumRequest = {
      title: this.modelo().title,
      content: this.modelo().content
    }

    formData.append(
      'request', new Blob([JSON.stringify(request)], {type: 'application/json'})
    )

    if(this.imagenSeleccionada()) formData.append('image', this.imagenSeleccionada()!)

    this.forumService.updateForum(foro.forumId, formData).subscribe({
      next: () => this.router.navigate(['/forums']),
      error: () => this.error.set('Error al actualizar el foro.')
    })
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      this.error.set('El archivo seleccionado no es una imagen.')
      input.value = ''
      return
    }

    this.error.set('')
    this.imagenSeleccionada.set(file)
    this.imagenPreview.set(URL.createObjectURL(file))
  }

  cancelar(): void { this.router.navigate(['/forums']) }
}
