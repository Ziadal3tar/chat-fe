import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AppNotification {
  _id: string;
  recipient: string;
  actor?: {
    _id: string;
    userName: string;
    profileImage?: string;
    isOnline?: boolean;
  } | null;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  success: boolean;
  notifications: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly baseUrl = `${environment.baseUrl}/notifications`;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
    });
  }

  getNotifications(page = 1, limit = 20): Observable<NotificationsResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get<NotificationsResponse>(this.baseUrl, {
      headers: this.authHeaders(),
      params,
    });
  }

  getUnreadCount(): Observable<{ success: boolean; unreadCount: number }> {
    return this.http.get<{ success: boolean; unreadCount: number }>(
      `${this.baseUrl}/unread-count`,
      { headers: this.authHeaders() }
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/${notificationId}/read`,
      {},
      { headers: this.authHeaders() }
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/read-all`,
      {},
      { headers: this.authHeaders() }
    );
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/${notificationId}`,
      { headers: this.authHeaders() }
    );
  }
}
