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
  constructor(
    private Router: Router,
    private ShareFunctionsService:ShareFunctionsService,
        private UserService: UserService,
        private friendService: FriendsService,

  ) {}

  ngOnInit(): void {}

  backHome(){
    this.ShareFunctionsService.sendClickEvent()
      }


  logout() {
   this.UserService.logout();
  this.Router.navigate(['/login']);
  }

  unblockUser(friendId: string) {
    this.UserService.user$.subscribe((data:any)=>{

      this.friendService.unblockUser(data._id, friendId).subscribe({
        next: (res) => {
          console.log('✅ User unblocked');
          this.UserService.getUserData(); // لتحديث الواجهة
        },
        error: (err) => console.error(err),
      });
    })
}

}
