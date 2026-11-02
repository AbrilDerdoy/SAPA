import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SavedPostResponse } from '../saved-post-DTOs/saved-post-response';

@Injectable({
  providedIn: 'root',
})
export class SavedPostService {
  private BASE_URL = 'http://localhost:8080/savedposts'
  private http = inject(HttpClient)

    // Obtener publicaciones guardadas.
  getSavedPosts(): Observable<SavedPostResponse[]>{
    return this.http.get<SavedPostResponse[]>(this.BASE_URL)
  }

    // Guardar una publicación a lista de guardados.
  savePost(postId: number): Observable<SavedPostResponse> {
    return this.http.post<SavedPostResponse>(`${this.BASE_URL}/${postId}`, null)
  }

    // Eliminar publicacion guardada.
  unsavePost(postId: number): Observable<void>{
    return this.http.delete<void>(`${this.BASE_URL}/${postId}`)
  }
}
