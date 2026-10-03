import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = environment.baseUrl;

  private readonly userSubject = new BehaviorSubject<any>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {
    const token = localStorage.getItem('token');
    if (token) {
      this.getUserData();
    }
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
    });
  }

  updateUser(user: any): void {
    this.userSubject.next(user);
  }

  register(user: any) {
    return this.http.post(`${this.baseUrl}/auth/register`, user);
  }

  login(user: any) {
    return this.http.post(`${this.baseUrl}/auth/signIn`, user);
  }

  getUserData(): void {
    this.http
      .get(`${this.baseUrl}/auth/me`, {
        headers: this.authHeaders(),
      })
      .subscribe({
        next: (data: any) => {
          this.userSubject.next(data.user);
        },
        error: (err) => {
          const message = err?.error?.message || '';

          if (
            [
              'User not found',
              'Invalid token',
              'Token expired',
              'Authentication required',
            ].includes(message)
          ) {
            this.logout();
          }
        },
      });
  }

  searchUser(data: { name: string }) {
    return this.http.post(`${this.baseUrl}/user/search`, data, {
      headers: this.authHeaders(),
    });
  }

  getUserById(id: string) {
    return this.http.get(`${this.baseUrl}/user/getUserById/${id}`, {
      headers: this.authHeaders(),
    });
  }

  initChat(data: FormData) {
    return this.http.post(`${this.baseUrl}/chat/send`, data, {
      headers: this.authHeaders(),
    });
  }

  getChat(data: any) {
    return this.http.post(`${this.baseUrl}/chat/getChat`, data, {
      headers: this.authHeaders(),
    });
  }

  getMyChats(data: any = {}) {
    return this.http.post(`${this.baseUrl}/chat/getMyChats`, data, {
      headers: this.authHeaders(),
    });
  }

  markOneMessagesAsRead(messageId: string) {
    return this.http.get(
      `${this.baseUrl}/chat/markOneMessagesAsRead/${messageId}`,
      { headers: this.authHeaders() }
    );
  }

  getOnlineFriends(data: any = {}) {
    return this.http.post(`${this.baseUrl}/user/getOnlineFriends`, data, {
      headers: this.authHeaders(),
    });
  }

  markMessagesAsRead(data: any) {
    return this.http.post(`${this.baseUrl}/chat/markMessagesAsRead`, data, {
      headers: this.authHeaders(),
    });
  }

  updateMessage(messageId: string, content: string) {
    return this.http.patch(
      `${this.baseUrl}/chat/messages/${messageId}`,
      { content },
      { headers: this.authHeaders() }
    );
  }

  deleteMessage(messageId: string) {
    return this.http.delete(`${this.baseUrl}/chat/messages/${messageId}`, {
      headers: this.authHeaders(),
    });
  }


  updateChatPreferences(chatBackground: string) {
    return this.http.patch(
      `${this.baseUrl}/user/preferences`,
      { chatBackground },
      { headers: this.authHeaders() }
    );
  }

  updateProfile(formData: FormData) {
    return this.http.post(`${this.baseUrl}/user/update`, formData, {
      headers: this.authHeaders(),
    });
  }

  logout(): void {
    this.socketService.disconnect();
    localStorage.removeItem('token');
    this.userSubject.next(null);
  }
}
