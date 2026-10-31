import { Component, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { PostService } from '../../post-service/post-service';
import { Auth } from '../../../Usuario/service/auth';
import { Usuario } from '../../../Usuario/interfaces/usuario';
import { PostResponse } from '../../post-DTOs/post-response';
import { ForumRequest } from '../../../forum/forum-DTOs/forum-request';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { ForumResponse } from '../../../forum/forum-DTOs/forum-response';
import { ForumService } from '../../../forum/forum-service/forum-service';

@Component({
  selector: 'app-post',
  imports: [FormField, DatePipe],
  templateUrl: './post.html',
  styleUrl: './post.css',
})
export class Post {
  private postService = inject(PostService)
  private forumService = inject(ForumService)
  private authService = inject(Auth)
  error = signal<string>('')

    // Información de foros relacionados con publicaciones.
  forum = signal<ForumResponse | null>(null);
  forumId: number | null = null
  titleForum = input.required<string>()

  loadForum(): void {
    this.forumService.filterForums(this.titleForum()).subscribe({
      next: (datos) => {
        const foroEncontrado = datos.find(
          f => f.title.toLowerCase() === this.titleForum().toLowerCase()
        )
        this.forum.set(foroEncontrado ?? null)
        if(foroEncontrado){
          this.forumId = foroEncontrado.forumId
          this.loadPosts()
        }
      },
      error: () => this.error.set('Error al cargar el foro.')
    })
  }

    // Verificar la sesión para poder acceder a ABM de publicaciones.
  get sesionIniciada(): boolean {
    return this.authService.isAuthenticated()
  }

    // Obtener el usuario para la verificación de nombre de usuario y poder acceder a BM de publicaciones. 
  get username(): string | null {
    const usuario = localStorage.getItem('usuario')
    return usuario ? (JSON.parse(usuario) as Usuario).username : null
  }

    // Verificación de si el usuario autenticado es propietario de la publicación.
  esPropietario(post: PostResponse): boolean {
    return this.username === post.authorName
  }
    
    // Listas.
  posts = signal<PostResponse[]>([])
  filteredPosts = signal<PostResponse[]>([])

    // Filtro.
  titleFilter = ''

    //Formulario.
  formVisible = signal(false)
  postId: number | null = null

    // Datos del formulario.
  model = signal<ForumRequest>({
    title: '',
    content: ''
  })

  readonly formulario = form(this.model, (ruta) => {
    required(ruta.title, {
      message: 'El título es obligatorio.'
    })
    minLength(ruta.title, 3, {
      message: 'El título debe tener al menos 3 caracteres'
    })
    required(ruta.content, {
      message: 'El contenido debe tener al menos 10 caracteres.'
    })
  })

  constructor() {
    effect(() => {
      this.loadForum()
    })
  }

    // Obtener publicaciones activas.
  loadPosts(): void {
    if(this.forumId === null) return
    this.postService.getPostsByForum(this.forumId).subscribe({
      next: (datos) => {
        this.posts.set(datos)
        this.filteredPosts.set(datos)
      },
      error: () => this.error.set('Error al cargar las publicaciones.')
    })
  }
  
    // Filtrar publicaciones por título.
  filterPosts(): void {
    if (!this.titleFilter.trim()) {
      this.loadPosts()
      return
    }

    this.postService.filterPosts(this.forumId!, this.titleFilter.trim()).subscribe({
      next: (datos) => this.filteredPosts.set(datos),
      error: () => this.error.set('Error al filtrar las publicaciones.')
    })
  }

    // Cerrar formulario.
  closeForm(): void {
    this.formVisible.set(false)
    this.postId = null
    this.model.set({
      title: '',
      content: ''
    })
  }

    // Creaar una publicación.
  newPost(): void {
    this.postId = null
    this.model.set({
      title: '',
      content: ''
    })
    this.formVisible.set(true)
  }

    // Editar una publicación.
  editPost(postId: number, post: PostResponse): void{
    this.postId = postId
    this.model.set({
      title: post.title,
      content: post.content
    })
    this.formVisible.set(true)
  }

    // Guardar una publicación.
  savePost(): void {
    const datos = this.model()
    if(this.postId !== null){
      this.postService.updatePost(this.postId, datos).subscribe({
        next: () =>{
          this.closeForm()
          this.loadPosts()
        },
        error: () => this.error.set('Error al actualizar la publicación.')
      })
    } else {
      this.postService.createPost(this.forumId!, datos).subscribe({
        next: () => {
          this.closeForm()
          this.loadPosts()
        },
        error: () => this.error.set('Error al crear la publicación.')
      })
    }
  }

    // Eliminar publicación.
  deletePost(postId: number): void {
    if(!confirm('¿Estás seguro de que querés eliminar esta publicación?')){
      return
    }

    this.postService.deletePost(postId).subscribe({
      next: () => this.loadPosts(),
      error: () => this.error.set('Error al eliminar la publicación.')
    })
  }
}
