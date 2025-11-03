import { ShareFunctionsService } from './../../services/share-functions.service';
import { Component, OnInit } from '@angular/core';
import { FriendsService } from 'src/app/services/friends.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-friend',
  templateUrl: './friend.component.html',
  styleUrls: ['./friend.component.scss'],
})
export class FriendComponent implements OnInit {
  friendRequests: any = [];
  userData: any;
  friends: any[] = [];
  constructor(
    private ShareFunctionsService: ShareFunctionsService,
    private UserService: UserService,
    private friendService: FriendsService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.UserService.user$.subscribe((data: any) => {
      this.userData = data;

      if (data.friendRequests.length >= 0) {
        this.friendService.getFriendRequests().subscribe((data: any) => {

          this.friendRequests = data.friendRequests;
        });
      }
      if (data && data.friends) {
        this.friends = data.friends;
      }
    });

    this.socketService
      .listen('friendRequestAccepted')
      .subscribe((data: any) => {
        console.log(data);
      });
    this.socketService
      .listen('friendRequestRejected')
      .subscribe((data: any) => {
        console.log(data);
      });
  }

  acceptRequest(_id: any) {
    this.friendService.acceptFriendRequest(this.userData._id, _id).subscribe({
      next: (res) => {
        console.log('✅ Request accepted');
        // إزالة الطلب من الواجهة
        this.friendRequests = this.friendRequests.filter(
          (r: any) => r.from._id !== _id
        );
      },
      error: (err) => console.error(err),
    });
  }

  rejectRequest(_id: any) {
    console.log(_id);

    this.friendService.rejectFriendRequest(this.userData._id, _id).subscribe({
      next: (res) => {
        console.log('❌ Request rejected');
        this.friendRequests = this.friendRequests.filter(
          (r: any) => r.from._id !== _id
        );
      },
      error: (err) => console.error(err),
    });
  }
blockUser(friendId: string) {
  this.friendService.blockUser(this.userData._id, friendId).subscribe({
    next: (res) => {
      console.log('🚷 User blocked');

      this.UserService.getUserData(); // تحديث البيانات
    },
    error: (err) => console.error(err),
  });
}
  backHome() {
    this.ShareFunctionsService.sendClickEvent();
  }
}
