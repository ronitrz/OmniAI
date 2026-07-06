// src/app/core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    const token = localStorage.getItem('omni_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { headers: this.getHeaders() });
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: this.getHeaders() });
  }

  patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body, { headers: this.getHeaders() });
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body, { headers: this.getHeaders() });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, { headers: this.getHeaders() });
  }
}
