import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
    });
  }

  sendFriendRequest(fromId: string, toId: string) {
    return this.http.post(
      `${this.baseUrl}/friends/send`,
      { fromId, toId },
      { headers: this.authHeaders() }
    );
  }

  acceptFriendRequest(userId: string, fromId: string) {
    return this.http.post(
      `${this.baseUrl}/friends/accept`,
      { userId, fromId },
      { headers: this.authHeaders() }
    );
  }

  rejectFriendRequest(userId: string, fromId: string) {
    return this.http.post(
      `${this.baseUrl}/friends/reject`,
      { userId, fromId },
      { headers: this.authHeaders() }
    );
  }

  getFriendRequests() {
    return this.http.get(`${this.baseUrl}/friends/getFriendRequests`, {
      headers: this.authHeaders(),
    });
  }

  cancelFriendRequest(myId: string, friendId: string) {
    return this.http.post(
      `${this.baseUrl}/friends/cancel`,
      { userId: myId, friendId },
      { headers: this.authHeaders() }
    );
  }

  blockUser(myId: string, friendId: string) {
    return this.http.post(
      `${this.baseUrl}/friends/block`,
      { userId: myId, friendId },
      { headers: this.authHeaders() }
    );
  }

  unblockUser(myId: string, friendId: string) {
    return this.http.post(
      `${this.baseUrl}/friends/unblock`,
      { userId: myId, friendId },
      { headers: this.authHeaders() }
    );
  }

  unfriendUser(myId: string, friendId: string) {
    return this.http.post(
      `${this.baseUrl}/friends/unfriend`,
      { userId: myId, friendId },
      { headers: this.authHeaders() }
    );
  }
}
