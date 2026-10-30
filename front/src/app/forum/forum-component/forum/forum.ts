import { Component, inject, OnInit, signal } from '@angular/core';
import { ForumService } from '../../forum-service/forum-service';
import { ForumResponse } from '../../forum-DTOs/forum-response';
import { ForumRequest } from '../../forum-DTOs/forum-request';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { form, minLength, required, FormField } from '@angular/forms/signals';
import { Auth } from '../../../Usuario/service/auth';
import { Usuario } from '../../../Usuario/interfaces/usuario';

@Component({
  selector: 'app-forum',
  imports: [CommonModule, FormsModule, FormField],
  templateUrl: './forum.html',
  styleUrl: './forum.css',
})
export class Forum implements OnInit {
  private forumService = inject(ForumService)
  private authService = inject(Auth)
  error = signal<string>('')

  get usuarioId(): number | null{
    const usuario = localStorage.getItem('usuario')
    return usuario ? (JSON.parse(usuario) as Usuario).id : null
  }

  esPropietario(forum: ForumResponse): boolean{
    return this.usuarioId === forum.createdById
  }

  // Listas.
  forums = signal<ForumResponse[]>([])
  filteredForums = signal<ForumResponse[]>([])

  // Filtro.
  titleFilter = ''

  // Formulario.
  formVisible = signal(false)
  forumId: number | null = null

  // Datos del formulario.
  modelo = signal<ForumRequest>({
    title: '',
    content: ''
  });

  readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.title, {
      message: 'El título es obligatorio'
    });

    minLength(ruta.title, 3, {
      message: 'El título debe tener al menos 3 caracteres'
    });

    required(ruta.content, {
      message: 'El contenido es obligatorio'
    });

    minLength(ruta.content, 10, {
      message: 'El contenido debe tener al menos 10 caracteres'
    });
  });

  // Obtener foros activos.
  loadForums(): void {
    console.log('Se ejecutó wachin')
    this.forumService.getAllForums().subscribe({
      next: (datos) => {
        this.forums.set(datos)
        this.filteredForums.set(datos)
      },

      error: () => this.error.set('Error al cargar los foros.')
    })
  }

  ngOnInit(): void {
    this.loadForums()
  }

  // Obtener foros activos.
  loadActiveForums(): void {
    this.forumService.getAllActiveForums().subscribe({
      next: (datos) => {
        this.forums.set(datos),
          this.filteredForums.set(datos)
      },
      error: () => this.error.set('Error al cargar los foros activos.')
    })
  }

  // Obtener foros inactivos.
  loadInactiveForums(): void {
    this.forumService.getInactiveForums().subscribe({
      next: (datos) => {
        this.forums.set(datos),
          this.filteredForums.set(datos)
      },
      error: () => this.error.set('Error al cargar los foros inactivos.')
    })
  }

  // Filtrar foros por título.
  filterForums(): void {
    if (!this.titleFilter.trim()) {
      this.loadForums()
      return;
    }

    this.forumService.filterForums(this.titleFilter.trim()).subscribe({
      next: (datos) => this.filteredForums.set(datos),
      error: () => this.error.set('Error al filtrar los foros.')
    })
  }

  // Cerrar formulario.
  closeForm(): void {
    this.formVisible.set(false)
    this.forumId = null
    this.modelo.set({
      title: '',
      content: ''
    })
  }

    // Crear foro.
  newForum(): void {
    this.forumId = null;
    this.modelo.set({
      title: '',
      content: ''
    });
    this.formVisible.set(true);
  }

    // Editar un foro.
  editForum(forum: ForumResponse): void {
    this.forumId = forum.forumId;
    this.modelo.set({
      title: forum.title,
      content: forum.content
    });
    this.formVisible.set(true);
  }

    // Guardar un foro.
  saveForum(): void {
    const datos = this.modelo();
    if (this.forumId !== null) {
      this.forumService.updateForum(this.forumId, datos).subscribe({
        next: () => {
          this.closeForm();
          this.loadForums();
        },
        error: () => this.error.set('Error al actualizar el foro.')
      });
    } else {
      this.forumService.createForum(datos).subscribe({
        next: () => {
          this.closeForm();
          this.loadForums();
        },
        error: () => this.error.set('Error al crear el foro.')
      });
    }
  }

  // Eliminar foro.
  deleteForum(id: number): void {
    if (!confirm('¿Estás seguro de que querés eliminar este foro?')) {
      return
    }

    this.forumService.deleteForum(id).subscribe({
      next: () => this.loadForums(),
      error: () => this.error.set('Error al eliminar el foro.')
    })
  }
}
