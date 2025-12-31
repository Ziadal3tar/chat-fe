import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private baseUrl = 'https://chat-be-px76.onrender.com/api';

  constructor(private http: HttpClient) {}

  sendFriendRequest(fromId: string, toId: string) {
    return this.http.post(`${this.baseUrl}/friends/send`, { fromId, toId });
  }

  acceptFriendRequest(userId: string, fromId: string) {
    return this.http.post(`${this.baseUrl}/friends/accept`, { userId, fromId });
  }

  rejectFriendRequest(userId: string, fromId: string) {
    return this.http.post(`${this.baseUrl}/friends/reject`, { userId, fromId });
  }
  getFriendRequests() {
    return this.http.get(`${this.baseUrl}/friends/getFriendRequests`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
  }
  cancelFriendRequest(myId: string, friendId: string) {
  return this.http.post(`${this.baseUrl}/friends/cancel`, { userId: myId, friendId });
}

blockUser(myId: string, friendId: string) {
  return this.http.post(`${this.baseUrl}/friends/block`, { userId: myId, friendId });
}

unblockUser(myId: string, friendId: string) {
  return this.http.post(`${this.baseUrl}/friends/unblock`, { userId: myId, friendId });
}
}
