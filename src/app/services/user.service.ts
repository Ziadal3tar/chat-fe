import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io } from 'socket.io-client';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  // private baseUrl = 'https://chat-be-production-6974.up.railway.app/api';
  private baseUrl = 'https://chat-be-px76.onrender.com/api';

  private userSubject = new BehaviorSubject<any>(null);
  user$: any = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) this.getUserData();
  }
  updateUser(user: any) {
    this.userSubject.next(user);
  }

  register(user: any): any {
    return this.http.post(`${this.baseUrl}/auth/register`, user);
  }
  login(user: any) {
    return this.http.post(`${this.baseUrl}/auth/signIn`, user);
  }
  getUserData(): any {
    const token = localStorage.getItem('token');
    return this.http
      .get(`${this.baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .subscribe((data: any) => {
        this.userSubject.next(data.user);
      },(err) => {
      console.error(err.error.message);
      if (err.error.message == 'User not found') {

localStorage.removeItem('token');
      }
    });
  }
  searchUser(data: { name: string }, token: string | null) {
    return this.http.post(`${this.baseUrl}/user/search`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getUserById(id: any): any {
    return this.http.get(`${this.baseUrl}/user/getUserById/${id}`);
  }
  initChat(data: any) {
    return this.http.post(`${this.baseUrl}/chat/send`, data);
  }
  getChat(data: any) {
    return this.http.post(`${this.baseUrl}/chat/getChat`, data);
  }
  getMyChats(data: any): any {
    return this.http.post(`${this.baseUrl}/chat/getMyChats`, data);
  }
  markOneMessagesAsRead(messageId: any) {
    return this.http.get(
      `${this.baseUrl}/chat/markOneMessagesAsRead/${messageId}`
    );
  }
  getOnlineFriends(data: any) {
    return this.http.post(`${this.baseUrl}/user/getOnlineFriends`, data);
  }
  markMessagesAsRead(data: any) {
    return this.http.post(`${this.baseUrl}/chat/markMessagesAsRead`, data);
  }
  updateProfile(formData: FormData) {
    return this.http.post(`${this.baseUrl}/user/update`, formData);
  }
  logout() {
    localStorage.removeItem('token');
    this.userSubject.next(null);
  }
}
