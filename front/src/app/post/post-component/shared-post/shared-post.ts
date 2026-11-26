import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../post-service/post-service';
import { PostResponse } from '../../post-DTOs/post-response';
import { PostComment } from '../../../post-comment/post-comment-component/post-comment/post-comment';

@Component({
  selector: 'app-shared-post',
  imports: [PostComment],
  templateUrl: './shared-post.html',
  styleUrl: './shared-post.css',
})
export class SharedPost implements OnInit{
  private route = inject(ActivatedRoute)
  private postService = inject(PostService)

  post = signal<PostResponse | null>(null)
  loading = signal(true)
  unavailable = signal(false)
  error = signal(false)

  ngOnInit(): void {
    const postId = Number(this.route.snapshot.paramMap.get('postId'))

    if (!Number.isInteger(postId) || postId <= 0) {
      this.loading.set(false)
      this.unavailable.set(true)
      return
    }

    this.postService.getPostById(postId).subscribe({
      next: response => {
        this.post.set(response)
        this.loading.set(false)
      },
      error: err => {
        this.loading.set(false)

        if (err.status === 404) {
          this.unavailable.set(true)
        } else {
          this.error.set(true)
        }
      }
    })
  }
}
