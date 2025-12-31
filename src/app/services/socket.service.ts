import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket!: Socket;
  constructor() {
//    this.socket = io('https://your-backend-url.up.railway.app', {
//   transports: ['websocket', 'polling'],
// });
  }
  connect(userId: string): void {
   this.socket = io('https://chat-be-px76.onrender.com', {
  transports: ['websocket', 'polling'],
});
    this.socket.emit('userOnline', userId);
  }

  onMessageReceived(callback: (msg: any) => void): void {
    this.socket.on('receiveMessage', callback);
  }

  disconnect(): void {
    this.socket.disconnect();
  }

    emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  // ✅ استقبال الرسائل
  on(event: string, callback: any) {
    this.socket.on(event, callback);
  }

   listen(eventName:any){
    return new Observable((Subscriber)=>{
      this.socket.on(eventName,(data:any)=>{
        Subscriber.next(data)
      })

    })
  }
}
