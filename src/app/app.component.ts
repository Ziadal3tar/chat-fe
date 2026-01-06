import { Router } from '@angular/router';
import { UserService } from './services/user.service';
import { Component, ElementRef } from '@angular/core';
import { NgwWowService } from 'ngx-wow';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'chat';
  userData: any;
  mood = 'morning';
  morning = 'url(./assets/img/white-abstract-background_23-2148817571.jpg)';
  night = 'url(./assets/img/6222603.jpg)';
  constructor(
    private wowService: NgwWowService,
    private elem: ElementRef,
    private UserService: UserService,
    private socketService: SocketService,
    private Router: Router
  ) {
    this.wowService.init();
    this.UserService.getUserData();
    this.UserService.user$.subscribe((data: any) => {
      this.userData = data;
    });
  }
  ngOnInit(): void {




    setTimeout(() => {

      if (this.socketService.socket) {
        this.initializeSocketListeners();
      } else {
        console.error('Socket not initialized!');
      }
    }, 500); // تأخير بسيط لتأكيد الاتصال

  }

  initializeSocketListeners() {


    this.socketService.listen('friendRequestReceived').subscribe((data: any) => {
      console.log('📩 Friend Request Received:', data);
      this.UserService.getUserData();

    });

    this.socketService.listen('friendRequestAccepted').subscribe((data: any) => {
      console.log('🎉 Friend Request Accepted:', data);
      this.UserService.getUserData();
    });

    this.socketService.listen('friendRequestRejected').subscribe((data: any) => {
      console.log('🚫 Friend Request Rejected:', data);
      this.UserService.getUserData();
    });
    this.socketService.listen('blockUser').subscribe((data: any) => {
      console.log('🚫 Friend block u:');
      this.UserService.getUserData();
    });
    this.socketService.listen('unBlockUser').subscribe((data: any) => {
      console.log('🚫 Friend Unblock u:');
      this.UserService.getUserData();
    });
  }
}
