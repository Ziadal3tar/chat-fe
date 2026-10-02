import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StoryService {
  private readonly baseUrl = `${environment.baseUrl}/stories`;

  constructor(private readonly http: HttpClient) {}

  private options() {
    const token = localStorage.getItem('token') || '';
    return {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    };
  }

  getStories(): Observable<any> {
    return this.http.get(this.baseUrl, this.options());
  }

  createStory(file: File, caption = ''): Observable<any> {
    const body = new FormData();
    body.append('file', file);
    body.append('caption', caption);
    return this.http.post(this.baseUrl, body, this.options());
  }

  viewStory(storyId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${storyId}/view`, {}, this.options());
  }

  deleteStory(storyId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${storyId}`, this.options());
  }
}
