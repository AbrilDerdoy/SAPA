import { Component, inject, input, OnInit, signal } from '@angular/core';
import { PostService } from '../../../post/post-service/post-service';
import { PostCommentResponse } from '../../post-comment-DTOs/post-comment-response';
import { DatePipe } from '@angular/common';
import { Auth } from '../../../Usuario/services/Auth/auth';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { ContentMenu } from '../../../content-menu/content-menu-component/content-menu/content-menu';

@Component({
  selector: 'app-post-comment',
  imports: [DatePipe, FormField, ContentMenu],
  templateUrl: './post-comment.html',
  styleUrl: './post-comment.css',
})
export class PostComment implements OnInit {
  private postService = inject(PostService)
  private authService = inject(Auth)

  postId = input.required<number>()

  comments = signal<PostCommentResponse[]>([])
  editingCommentId = signal<number | null>(null)
  error = signal('')
  loading = signal(false)

  commentsVisible = signal(false)
  commentFormVisible = signal(false)

  commentModel = signal({
    content: ''
  })
  commentForm = form(this.commentModel, path => {
    required(path.content, { message: 'El comentario no puede estar vacío.' })
    maxLength(path.content, 1000, { message: 'El comentario no puede superar los 1000 caracteres.' })
  })

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

  get sessionVersion(): number {
    return this.authService.sessionVersion()
  }

  ngOnInit(): void {
    this.loadComments()
  }

  loadComments(): void {
    this.loading.set(true)

    this.postService.getComments(this.postId()).subscribe({
      next: data => {
        this.comments.set(data)
        this.loading.set(false)
      },
      error: () => {
        this.error.set('Error al cargar los comentarios.')
        this.loading.set(false)
      }
    })
  }

  saveComment(): void {
    const text = this.commentModel().content.trim()

    if (!text) {
      this.error.set('El comentario no puede estar vacío.')
      return
    }

    if (text.length > 1000) {
      this.error.set('El comentario no puede superar los 1000 caracteres.')
      return
    }

    const commentId = this.editingCommentId()
    const request = { content: text }

    const operation = commentId !== null
      ? this.postService.updateComment(this.postId(), commentId, request)
      : this.postService.createComment(this.postId(), request)

    operation.subscribe({
      next: () => {
        this.commentModel.set({ content: '' })
        this.editingCommentId.set(null)
        this.commentFormVisible.set(false)
        this.error.set('')
        this.loadComments()
      },
      error: err => {
        this.error.set(
          err.status === 403
            ? 'No tenés permiso para realizar esta acción.'
            : 'No se pudo guardar el comentario.'
        )
      }
    })
  }

  editComment(comment: PostCommentResponse): void {
    this.editingCommentId.set(comment.commentId)
    this.commentModel.set({ content: comment.content })
    this.commentFormVisible.set(true)
    this.error.set('')
  }

  cancelComment(): void {
    this.commentFormVisible.set(false)
    this.editingCommentId.set(null)
    this.commentModel.set({ content: '' })
    this.error.set('')
  }

  deleteComment(commentId: number): void {
    if (!confirm('¿Estás seguro de que querés eliminar este comentario?')) {
      return
    }

    this.postService.deleteComment(this.postId(), commentId).subscribe({
      next: () => this.loadComments(),
      error: () => this.error.set('No se pudo eliminar el comentario.')
    })
  }

  esPropietario(comment: PostCommentResponse): boolean {
    return this.usuarioId === comment.authorId
  }

  toggleComments(): void {
    this.commentsVisible.update(value => !value)
  }

  openCommentForm(): void {
    this.commentFormVisible.set(true)
  }
}
