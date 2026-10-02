import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, switchMap } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socket?: Socket;
  private readonly socketSubject = new ReplaySubject<Socket>(1);

  private readonly socketUrl = environment.socketUrl;

  connect(_userId?: string): void {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socketSubject.next(this.socket);
  }

  disconnect(): void {
    if (!this.socket) return;

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

            return () => {
              socket.off(eventName, handler);
            };
          })
      )
    );
  }

  get connected(): boolean {
    return !!this.socket?.connected;
  }

}
