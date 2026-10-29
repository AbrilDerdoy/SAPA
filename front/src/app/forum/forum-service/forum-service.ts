import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ForumResponse } from '../forum-DTOs/forum-response';
import { Observable } from 'rxjs';
import { ForumRequest } from '../forum-DTOs/forum-request';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private readonly BASE_URL = 'http://localhost:8080/forums'
  private readonly http = inject(HttpClient)

    //Obtener todos los foros existentes.
  getAllForums() : Observable<ForumResponse[]>{
    return this.http.get<ForumResponse[]>(this.BASE_URL + '/all')
  }

    // Obtener todos los foros activos.
  getAllActiveForums() : Observable<ForumResponse[]>{
    return this.http.get<ForumResponse[]>(this.BASE_URL + '/active')
  }

    // Obtener todos los foros inactivos.
  getInactiveForums() : Observable<ForumResponse[]>{
    return this.http.get<ForumResponse[]>(this.BASE_URL + '/inactive')
  }

    // Obtener todos los foros filtrados por título.
  filterForums(title: string) : Observable<ForumResponse[]>{
    const params = new HttpParams().set('title', title)
    return this.http.get<ForumResponse[]>(this.BASE_URL + '/filter', {params})
  }

    // Crear un nuevo foro.
  createForum(datosForo: ForumRequest){
    return this.http.post<ForumRequest>(this.BASE_URL, datosForo)
  }

    // Actualizar foro existente.
  updateForum(idForum: number, datosForo: ForumRequest){
    return this.http.put<ForumRequest>(`${this.BASE_URL}/${idForum}`, datosForo)
  }

    // Eliminar un foro.
    deleteForum(idForum: number) : Observable<void>{
      return this.http.delete<void>(`${this.BASE_URL}/${idForum}`)
    }
}
