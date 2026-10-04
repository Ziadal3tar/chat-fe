import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject, switchMap } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socket?: Socket;
  private readonly socketSubject = new ReplaySubject<Socket>(1);
  private readonly connectionStateSubject = new Subject<'online' | 'offline' | 'reconnecting'>();
  readonly connectionState$ = this.connectionStateSubject.asObservable();
  private readonly socketUrl = environment.socketUrl;

  connect(_userId?: string): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (this.socket?.connected || this.socket?.active) return;

    this.socket = io(this.socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 8000,
      timeout: 20000,
      path: '/socket.io',
    });

    this.socket.on('connect', () => {
      console.info('[Socket] connected', this.socket?.id);
      this.connectionStateSubject.next('online');
      this.socket?.emit('join');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] connect_error', error?.message || error);
      this.connectionStateSubject.next('reconnecting');
    });

    this.socket.on('reconnect_attempt', () => this.connectionStateSubject.next('reconnecting'));
    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] disconnected', reason);
      this.connectionStateSubject.next(reason === 'io client disconnect' ? 'offline' : 'reconnecting');
    });

    this.socketSubject.next(this.socket);
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = undefined;
  }

  emit(event: string, data: any = {}): void {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  listen<T = any>(eventName: string): Observable<T> {
    return this.socketSubject.pipe(
      switchMap(
        (socket) =>
          new Observable<T>((subscriber) => {
            const handler = (data: T) => subscriber.next(data);
            socket.on(eventName, handler);
            return () => socket.off(eventName, handler);
          })
      )
    );
  }

  get connected(): boolean {
    return !!this.socket?.connected;
  }
}
