import { ShareFunctionsService } from './../../services/share-functions.service';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { FriendsService } from 'src/app/services/friends.service';

@Component({
  selector: 'app-all-setting',
  templateUrl: './all-setting.component.html',
  styleUrls: ['./all-setting.component.scss'],
})
export class AllSettingComponent implements OnInit {
showBlockedUsers: boolean = false; // للتحكم في ظهور السيكشن
  blockedUsers: any[] = []; // مثال على المستخدمين المحظورين
userData:any
  constructor(
    private Router: Router,
    private ShareFunctionsService:ShareFunctionsService,
        private UserService: UserService,
        private friendService: FriendsService,

  ) {}

  ngOnInit(): void {
    this.UserService.user$.subscribe((data:any)=>{
console.log(data);
if (data?.blockedUsers?.length>=0) {

  this.blockedUsers = data.blockedUsers
}
      this.userData = data
    })
  }

  toggleBlockedUsers() {
    this.showBlockedUsers = !this.showBlockedUsers;
  }
  backHome(){
    console.log('gf');

    this.ShareFunctionsService.sendClickEvent()
      }


  logout() {
   this.UserService.logout();
  this.Router.navigate(['/login']);
  }




  unblockUser(friendId: string) {


      this.friendService.unblockUser(this.userData._id, friendId).subscribe({
        next: (res) => {
          console.log(res);
          this.UserService.getUserData(); // لتحديث الواجهة
        },
        error: (err) => console.error(err),
      });

}

}
