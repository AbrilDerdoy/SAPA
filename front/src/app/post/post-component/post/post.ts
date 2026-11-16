import { afterNextRender, Component, ElementRef, inject, Injector, input, signal, viewChild } from '@angular/core';
import { PostService } from '../../post-service/post-service';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { PostResponse } from '../../post-DTOs/post-response';
import { ForumRequest } from '../../../forum/forum-DTOs/forum-request';
import { ForumResponse } from '../../../forum/forum-DTOs/forum-response';
import { ForumService } from '../../../forum/forum-service/forum-service';
import { SavedPostService } from '../../../saved-post/saved-post-service/saved-post-service';
import { PostForm } from '../post-form/post-form';
import { PostAttachments } from '../post-attachments/post-attachments';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-post',
  imports: [DatePipe, PostForm, PostAttachments],
  templateUrl: './post.html',
  styleUrl: './post.css',
})
export class Post {
  private postService = inject(PostService)
  private forumService = inject(ForumService)
  private authService = inject(Auth)
  private savedPostService = inject(SavedPostService)
  private injector = inject(Injector)

  error = signal('')

  savedPostsId = signal<Set<number>>(new Set())

  forum = signal<ForumResponse | null>(null)
  forumId: number | null = null

  titleForum = input.required<string>()

  posts = signal<PostResponse[]>([])
  filteredPosts = signal<PostResponse[]>([])

  titleFilter = ''

  formVisible = signal(false)
  editingPost = signal<PostResponse | null>(null)

  ngOnInit(): void {
    this.loadForum()
    this.loadSavedPosts()
  }

  private scrollToForm(): void {
    afterNextRender(() => {
      document.getElementById('post-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, { injector: this.injector });
  }

  loadForum(): void {
    this.forumService.filterForums(this.titleForum()).subscribe({
      next: (datos) => {
        const foroEncontrado = datos.find(
          f => f.title.toLowerCase() === this.titleForum().toLowerCase()
        )

        this.forum.set(foroEncontrado ?? null)

        if (foroEncontrado) {
          this.forumId = foroEncontrado.forumId;
          this.loadPosts()
        }
      },
      error: () => this.error.set('Error al cargar el foro.')
    })
  }

  get sesionIniciada(): boolean {
    return this.authService.isAuthenticated()
  }

  get usuarioId(): number | null {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}')
      return usuario.id ?? null
    } catch {
      return null
    }
  }

  esPropietario(post: PostResponse): boolean {
    return this.usuarioId === post.authorId
  }

  loadPosts(): void {
    if (this.forumId === null) return

    this.postService.getPostsByForum(this.forumId).subscribe({
      next: (datos) => {
        this.posts.set(datos)
        this.filteredPosts.set(datos)
      },
      error: () => this.error.set('Error al cargar las publicaciones.')
    })
  }

  filterPosts(): void {
    if (!this.titleFilter.trim()) {
      this.loadPosts()
      return
    }

    if (this.forumId === null) return

    this.postService.filterPosts(this.forumId, this.titleFilter.trim()).subscribe({
      next: (datos) => this.filteredPosts.set(datos),
      error: () => this.error.set('Error al filtrar las publicaciones.')
    })
  }
  onTitleFilterInput(event: Event): void {
    this.titleFilter = (event.target as HTMLInputElement).value;
    this.filterPosts();
  }

  newPost(): void {
    this.editingPost.set(null)
    this.formVisible.set(true)
    this.scrollToForm()
  }

  editPost(post: PostResponse): void {
    this.editingPost.set(post)
    this.formVisible.set(true)
    this.scrollToForm()
  }

  closeForm(): void {
    this.formVisible.set(false)
    this.editingPost.set(null)
    this.error.set('')
  }

  savePost(data: {
    request: ForumRequest
    files: File[]
    removedAttachmentIds: number[]
  }): void {
    const post = this.editingPost()

    if (post) {
      this.postService.updatePost(post.postId, data.request, data.files, data.removedAttachmentIds).subscribe({
        next: () => {
          this.closeForm()
          this.loadPosts()
        },
        error: () => this.error.set('Error al actualizar la publicación.')
      })
      return
    }

    if (this.forumId === null) return

    this.postService.createPost(this.forumId, data.request, data.files).subscribe({
      next: () => {
        this.closeForm()
        this.loadPosts()
      },
      error: () => this.error.set('Error al crear la publicación.')
    })
  }

  deletePost(postId: number): void {
    if (!confirm('¿Estás seguro de que querés eliminar esta publicación?')) {
      return
    }

    this.postService.deletePost(postId).subscribe({
      next: () => this.loadPosts(),
      error: () => this.error.set('Error al eliminar la publicación.')
    })
  }

  loadSavedPosts(): void {
    if (!this.sesionIniciada) return

    this.savedPostService.getSavedPosts().subscribe({
      next: (datos) => {
        this.savedPostsId.set(new Set(datos.map(saved => saved.post.postId)))
      },
      error: () => {
        this.error.set('Error al cargar las publicaciones guardadas.')
      }
    })
  }

  estaGuardada(postId: number): boolean {
    return this.savedPostsId().has(postId)
  }

  toggleSavedPost(postId: number): void {
    if (this.estaGuardada(postId)) {
      this.savedPostService.unsavePost(postId).subscribe({
        next: () => {
          this.savedPostsId.update(ids => {
            const nuevosIds = new Set(ids)
            nuevosIds.delete(postId)
            return nuevosIds
          })
        },
        error: () => this.error.set('Error al quitar la publicación de guardados.')
      })
    } else {
      this.savedPostService.savePost(postId).subscribe({
        next: () => {
          this.savedPostsId.update(ids => new Set([...ids, postId]))
        },
        error: () => this.error.set('Error al guardar la publicación.')
      })
    }
  }
}
