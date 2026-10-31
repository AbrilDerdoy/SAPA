import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Post } from '../post-component/post/post';
import { ForumRequest } from '../../forum/forum-DTOs/forum-request';
import { PostResponse } from '../post-DTOs/post-response';
import { popScheduler } from 'rxjs/internal/util/args';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly BASE_URL = 'http://localhost:8080/posts'
  private readonly http = inject(HttpClient)

    // Obtener publicaciones de un foro por id de foro.
  getPostsByForum(forumId: number): Observable<PostResponse[]>{
    return this.http.get<PostResponse[]>(`${this.BASE_URL}/${forumId}`)
  }

    // Filtrar publicaciones de un foro por título.
  filterPosts(forumId: number, title: string): Observable<PostResponse[]>{
    const params = new HttpParams().set('title', title)
    return this.http.get<PostResponse[]>(`${this.BASE_URL}/${forumId}/filter`, {params})
  }

    // Crear una publicación en un foro.
  createPost(forumId: number, request: ForumRequest): Observable<PostResponse>{
    return this.http.post<PostResponse>(`${this.BASE_URL}/${forumId}/create`, request)
  }

    // Modificar una publicación.
  updatePost(postId: number, request: ForumRequest): Observable<PostResponse>{
    return this.http.put<PostResponse>(`${this.BASE_URL}/${postId}`, request)
  }

    // Eliminar una publicación.
  deletePost(postId: number): Observable<boolean>{
    return this.http.delete<boolean>(`${this.BASE_URL}/${postId}`)
  }
  
}
