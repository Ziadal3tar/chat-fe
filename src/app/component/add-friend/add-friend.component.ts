import { FriendsService } from 'src/app/services/friends.service';
import { ShareFunctionsService } from './../../services/share-functions.service';
import { UserService } from './../../services/user.service';
import { Component, OnInit } from '@angular/core';
import { SocketService } from 'src/app/services/socket.service';

@Component({
  selector: 'app-add-friend',
  templateUrl: './add-friend.component.html',
  styleUrls: ['./add-friend.component.scss'],
})
export class AddFriendComponent implements OnInit {
  name = '';
  allUser: any = [];
  online: any;
  userData: any;
  constructor(
    private UserService: UserService,
    private friendService: FriendsService,
    private ShareFunctionsService: ShareFunctionsService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.UserService.user$.subscribe((data: any) => {
      this.userData = data;
      this.socketService.connect(this.userData._id);
      setTimeout(() => {
        this.initializeSocketListeners();
      }, 500); // تأخير بسيط لتأكيد الاتصال
    });
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
    this.search()
  });
  this.socketService.listen('unBlockUser').subscribe((data: any) => {
    console.log('🚫 Friend Unblock u:');
    this.search()
  });
}

  search() {
    const token = localStorage.getItem('token');
    const name = this.name.trim();

    if (!name) {
      this.allUser = [];
      return;
    }

    this.UserService.searchUser({ name }, token).subscribe({
      next: (res: any) => {

        this.allUser = [
          ...new Map(res.allUser.map((user: any) => [user._id, user])).values(),
        ];
        console.log(this.allUser);
      },
      error: (err) => {
        console.error('Search error:', err);
      },
    });


  }

addFriend(friendId: string) {
  this.friendService.sendFriendRequest(this.userData._id, friendId).subscribe({
    next: (res) => {
      console.log('✅ Request sent');
      this.UserService.getUserData(); // تحديث الحالة
    },
    error: (err) => console.error(err),
  });
}

acceptRequest(id: string) {
  this.friendService.acceptFriendRequest(this.userData._id, id).subscribe({
    next: (res) => {
      console.log('✅ Request accepted');
      this.UserService.getUserData(); // تحديث الحالة
    },
    error: (err) => console.error(err),
  });
}

rejectRequest(id: string) {
  this.friendService.rejectFriendRequest(this.userData._id, id).subscribe({
    next: (res) => {
      console.log('❌ Request rejected');
      this.UserService.getUserData(); // تحديث الحالة
    },
    error: (err) => console.error(err),
  });
}


  backHome() {
    this.ShareFunctionsService.sendClickEvent();
  }
 getFriendStatus(userId: string): 'friends' | 'pending_sent' | 'pending_received' | 'none' {
  if (!this.userData) return 'none';

  const friends = this.userData.friends || [];
  const sent = this.userData.friendRequestsSent || [];
  const received = this.userData.friendRequests || this.userData.receivedRequests || [];

  // ✅ 1) أصدقاء
  const isFriend = friends.some((f: any) => {
    const id = (f && f._id) ? f._id.toString() : f?.toString?.();
    return id === userId;
  });
  if (isFriend) return 'friends';

  // ✅ 2) أنا اللي بعتله طلب (ولسه pending فقط)
  const isSent = sent.some((r: any) => {
    const toId = (r && r.to) ? (r.to._id ? r.to._id.toString() : r.to.toString()) : null;
    return toId === userId && r.status === 'pending';
  });
  if (isSent) return 'pending_sent';

  // ✅ 3) هو اللي بعتلي طلب (ولسه pending فقط)
  const isReceived = received.some((r: any) => {
    const fromId = (r && r.from) ? (r.from._id ? r.from._id.toString() : r.from.toString()) : null;
    return fromId === userId && r.status === 'pending';
  });
  if (isReceived) return 'pending_received';

  // ✅ 4) في حالة الطلب مرفوض أو غير موجود → نرجع none
  return 'none';
}


cancelRequest(friendId: string) {
  this.friendService.cancelFriendRequest(this.userData._id, friendId).subscribe({
    next: (res) => {
      console.log('🚫 Request cancelled');
      this.UserService.getUserData(); // لتحديث الواجهة بعد الإلغاء
    },
    error: (err) => console.error(err),
  });
}

blockUser(friendId: string) {
  this.friendService.blockUser(this.userData._id, friendId).subscribe({
    next: (res) => {
      console.log('🚷 User blocked');
      this.search()
      this.UserService.getUserData(); // تحديث البيانات
    },
    error: (err) => console.error(err),
  });
}

}
