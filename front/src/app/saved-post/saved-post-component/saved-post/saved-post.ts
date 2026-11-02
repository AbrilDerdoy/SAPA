import { Component, inject, signal } from '@angular/core';
import { SavedPostService } from '../../saved-post-service/saved-post-service';
import { SavedPostResponse } from '../../saved-post-DTOs/saved-post-response';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-saved-post',
  imports: [DatePipe],
  templateUrl: './saved-post.html',
  styleUrl: './saved-post.css',
})
export class SavedPost {
  private savedPostService = inject(SavedPostService)
  private router = inject(Router)

  savedPosts = signal<SavedPostResponse[]>([])
  error = signal('')

  ngOnInit(): void {
    this.loadSavedPosts()
  }

  // Obtener publicaciones guardadas.
  loadSavedPosts(): void {
    this.savedPostService.getSavedPosts().subscribe({
      next: (posts) => {
        this.savedPosts.set(posts)
        this.error.set('')
      },
      error: () => {
        this.error.set('No se pudieron cargar las publicaciones guardadas.')
      }
    })
  }

  // Ver publicacion guardada.
  viewPost(post: SavedPostResponse['post']): void {
    this.router.navigate(['/forums', post.forumTitle])
  }

  // Quitar una publicación de guardados.
  unsavePost(postId: number): void {
    this.savedPostService.unsavePost(postId).subscribe({
      next: () => {
        this.savedPosts.update(posts =>
          posts.filter(saved => saved.post.postId !== postId)
        )
      },
      error: () => {
        this.error.set('No se pudo quitar la publicación de guardados.')
      }
    })
  }
}
