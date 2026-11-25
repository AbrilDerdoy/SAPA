import { afterNextRender, Component, inject, Injector, input, signal, viewChild } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { PostComment } from '../../../post-comment/post-comment-component/post-comment/post-comment';
import { ReportedContentType } from '../../../report/report-DTOs/reported-content-type.type';
import { ContentMenu } from '../../../content-menu/content-menu-component/content-menu/content-menu';
import { ReportModal } from '../../../report/report-components/report-modal/report-modal';

@Component({
  selector: 'app-post',
  imports: [DatePipe, PostForm, PostAttachments, PostComment, ContentMenu, ReportModal],
  templateUrl: './post.html',
  styleUrl: './post.css',
})
export class Post {
  private postService = inject(PostService)
  private forumService = inject(ForumService)
  private authService = inject(Auth)
  private savedPostService = inject(SavedPostService)
  private injector = inject(Injector)
  private route = inject(ActivatedRoute)

  error = signal('')

  savedPostsId = signal<Set<number>>(new Set())

  forum = signal<ForumResponse | null>(null)
  forumId: number | null = null

  titleForum = input<string>()

  posts = signal<PostResponse[]>([])
  filteredPosts = signal<PostResponse[]>([])

  sharedPost = signal<PostResponse | null>(null)
  postUnavailable = signal(false)
  loadingSharedPost = signal(false)

  titleFilter = ''

  formVisible = signal(false)
  editingPost = signal<PostResponse | null>(null)

  showReportModal = signal(false)
  reportContentId = signal<number | null>(null)
  reportContentType = signal<ReportedContentType>('POST')

  ngOnInit(): void {
    if (this.isSharedPost) {
      this.loadSharedPost()
      this.loadSavedPosts()
    } else {
      this.loadForum()
      this.loadSavedPosts()
    }

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
    const title = this.titleForum()
    if (!title) return

    this.forumService.filterForums(title).subscribe({
      next: (datos) => {
        const foroEncontrado = datos.find(
          f => f.title.toLowerCase() === title.toLowerCase()
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

  async sharePost(postId: number): Promise<void> {
    const url = `${window.location.origin}/posts/${postId}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Compartir publicación',
          url
        })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error al compartir:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('Enlace copiado al portapapeles')
      } catch {
        alert('No se pudo copiar el enlace')
      }
    }
  }

  get isSharedPost(): boolean {
    return this.route.snapshot.paramMap.has('postId')
  }

  loadSharedPost(): void {
    const postId = Number(this.route.snapshot.paramMap.get('postId'))

    if (!Number.isInteger(postId) || postId <= 0) {
      this.postUnavailable.set(true)
      return
    }

    this.loadingSharedPost.set(true)

    this.postService.getPostById(postId).subscribe({
      next: (data) => {
        this.sharedPost.set(data)
        this.loadingSharedPost.set(false)
      },
      error: (err) => {
        this.loadingSharedPost.set(false)

        if (err.status === 404) {
          this.postUnavailable.set(true)
        } else {
          this.error.set('Error al cargar la publicación.')
        }
      }
    })
  }

  openReportModal(postId: number): void {
    this.reportContentId.set(postId)
    this.reportContentType.set('POST')
    this.showReportModal.set(true)
  }

  closeReportModal(): void {
    this.showReportModal.set(false)
  }

  esAdmin(): boolean {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}')
      return usuario.role === 'ADMIN'
    } catch {
      return false
    }
  }

  puedeReportar(post: PostResponse): boolean {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}')

      return usuario.role !== 'ADMIN' && usuario.id !== post.authorId
    } catch {
      return false
    }
  }
}
