import { Component, inject, OnInit, signal } from '@angular/core';
import { ForumService } from '../../forum-service/forum-service';
import { ForumResponse } from '../../forum-DTOs/forum-response';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { Usuario } from '../../../Usuario/models/usuario';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forum',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forum.html',
  styleUrl: './forum.css',
})
export class Forum implements OnInit {
  private forumService = inject(ForumService)
  private authService = inject(Auth)
  error = signal<string>('')

    // Foro seleccionado para editar.
  selectedForum = signal<ForumResponse | null>(null)

  // Verificar la sesión para poder acceder a ABM de foros.
  get sesionIniciada(): boolean{
    return this.authService.isAuthenticated()
  }
  
  // Obtener el usuario para la verificación de id y poder acceder a BM de foros. 
  get usuarioId(): number | null{
    const usuario = localStorage.getItem('usuario')
    return usuario ? (JSON.parse(usuario) as Usuario).id : null
  }
  
  // Verificación de si el usuario autenticado es propietario del foro.
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

  // Obtener todos los foros.
  loadForums(): void {
    this.forumService.getAllActiveForums().subscribe({
      next: (datos) => {
        this.forums.set(datos)
        this.filteredForums.set(datos)
      },
      error: () => this.error.set('Error al cargar los foros.')
    })
  }

  ngOnInit(): void {this.loadActiveForums()}

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
    this.selectedForum.set(null)
  }

    // Crear foro.
  newForum(): void {
    this.selectedForum.set(null)
    this.formVisible.set(true);
  }

    // Editar un foro.
  editForum(forum: ForumResponse): void {
    this.selectedForum.set(forum)
    this.formVisible.set(true);
  }

    // Guardar un foro.
  saveForum(): void {
    this.formVisible.set(false)
    this.selectedForum.set(null)
    this.loadActiveForums()
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
