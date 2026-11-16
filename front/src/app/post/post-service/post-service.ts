import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ForumRequest } from '../../forum/forum-DTOs/forum-request';
import { PostResponse } from '../post-DTOs/post-response';
import { Auth } from '../../Usuario/services/Auth/auth';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly BASE_URL = 'http://localhost:8080/posts'
  private readonly http = inject(HttpClient)
  private readonly auth = inject(Auth)

  // Obtener publicaciones de un foro por id de foro.
  getPostsByForum(forumId: number): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.BASE_URL}/${forumId}`)
  }

  // Filtrar publicaciones de un foro por título.
  filterPosts(forumId: number, title: string): Observable<PostResponse[]> {
    const params = new HttpParams().set('title', title)
    return this.http.get<PostResponse[]>(`${this.BASE_URL}/${forumId}/filter`, { params })
  }

  // Construir el multipart/form-data.
  private createFormData(request: ForumRequest, files: File[], removedAttachmentIds: number[] = []): FormData {
    const formData = new FormData()

    formData.append(
      'request', new Blob([JSON.stringify(request)], { type: 'application/json' })
    )

    files.forEach(file => formData.append('files', file))


    if (removedAttachmentIds.length > 0) {
      formData.append(
        'removedAttachmentIds', new Blob([JSON.stringify(removedAttachmentIds)], {type: 'application/json'})
      )
    }

    return formData
  }

  // Crear una publicación en un foro.
  createPost(forumId: number, request: ForumRequest, files: File[]): Observable<PostResponse> {
    const formData = this.createFormData(request, files)
    return this.http.post<PostResponse>(`${this.BASE_URL}/${forumId}/create`, formData)
  }

  // Obtener archivos.
  getAttachment(fileUrl: string): Observable<Blob> {
    const token = this.auth.getAccessToken();

    return this.http.get(`http://localhost:8080${fileUrl}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob'
    });
  }

  // Modificar una publicación.
  updatePost(postId: number, request: ForumRequest, files: File[], removedAttachmentIds: number[]): Observable<PostResponse> {
    const formData = this.createFormData(request, files, removedAttachmentIds)
    return this.http.put<PostResponse>(`${this.BASE_URL}/${postId}`, formData)
  }

  // Eliminar una publicación.
  deletePost(postId: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.BASE_URL}/${postId}`)
  }

}
