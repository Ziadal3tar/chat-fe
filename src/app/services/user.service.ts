import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = environment.baseUrl;

  private readonly userSubject = new BehaviorSubject<any>(null);
  readonly user$ = this.userSubject.asObservable();
  private userRequest$: any = null;

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
    const previous = this.userSubject.value;
    if (!user) {
      this.userSubject.next(user);
      return;
    }
    this.userSubject.next({
      ...previous,
      ...user,
      friends: user.friends ?? previous?.friends ?? [],
      chats: user.chats ?? previous?.chats ?? [],
      blockedUsers: user.blockedUsers ?? previous?.blockedUsers ?? [],
      chatPreferences: { ...(previous?.chatPreferences || {}), ...(user.chatPreferences || {}) },
      privacyPreferences: { ...(previous?.privacyPreferences || {}), ...(user.privacyPreferences || {}) },
      notificationPreferences: { ...(previous?.notificationPreferences || {}), ...(user.notificationPreferences || {}) },
    });
  }

  register(user: any) {
    return this.http.post(`${this.baseUrl}/auth/register`, user);
  }

  login(user: any) {
    return this.http.post(`${this.baseUrl}/auth/signIn`, user);
  }

  getUserData(): void {
    if (this.userRequest$) return;

    this.userRequest$ = this.http
      .get(`${this.baseUrl}/auth/me`, { headers: this.authHeaders() })
      .pipe(shareReplay(1), finalize(() => { this.userRequest$ = null; }));

    this.userRequest$.subscribe({
      next: (data: any) => this.updateUser(data.user),
      error: (err: any) => {
        const message = err?.error?.message || '';
        console.log(message);

        if (['User not found', 'Invalid token', 'Token expired', 'Authentication required', 'Session has been revoked', 'Session is no longer active','User associated with token no longer exists'].includes(message)){
          this.logout();
        }



          // this.logout();
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

  initChatWithProgress(data: FormData) {
    return this.http.post(`${this.baseUrl}/chat/send`, data, {
      headers: this.authHeaders(),
      observe: 'events',
      reportProgress: true,
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
    return this.updatePreferences({ chatBackground });
  }

  updatePreferences(payload: any) {
    return this.http.patch(`${this.baseUrl}/user/preferences`, payload, { headers: this.authHeaders() });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch(`${this.baseUrl}/auth/password`, { currentPassword, newPassword }, { headers: this.authHeaders() });
  }

  updateEmail(email: string) {
    return this.http.patch(`${this.baseUrl}/auth/email`, { email }, { headers: this.authHeaders() });
  }

  getSessions() {
    return this.http.get(`${this.baseUrl}/auth/sessions`, { headers: this.authHeaders() });
  }

  revokeSession(sessionId: string) {
    return this.http.delete(`${this.baseUrl}/auth/sessions/${sessionId}`, { headers: this.authHeaders() });
  }

  logoutAllDevices() {
    return this.http.post(`${this.baseUrl}/auth/logout-all`, {}, { headers: this.authHeaders() });
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
