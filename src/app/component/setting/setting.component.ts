import { FriendsComponent } from './../friends/friends.component';
import { ShareFunctionsService } from './../../services/share-functions.service';
import { HomeComponent } from './../home/home.component';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  providers: [HomeComponent],
})
export class SettingComponent implements OnInit {
  @ViewChild('name', { read: ElementRef, static: false }) name:
    | ElementRef
    | any;
  @ViewChild('pass', { read: ElementRef, static: false }) pass:
    | ElementRef
    | any;
  @ViewChild('cPass', { read: ElementRef, static: false }) cPass:
    | ElementRef
    | any;
  @ViewChild('status', { read: ElementRef, static: false }) status:
    | ElementRef
    | any;

  disabled = 'disabled';
  @Input() setting: any;
  userData: any;
  settingStyle = '';
  data: any;
  constructor(
    private ShareFunctionsServic: ShareFunctionsService,
    private UserService: UserService,

    private elem: ElementRef
  ) {}

  ngOnInit(): void {
    this.UserService.user$.subscribe((data: any) => {
      this.userData = data;
    });
    this.data = this.ShareFunctionsServic.getData();

    if (this.data.mood == 'night') {
      this.elem.nativeElement.style.setProperty('--bgcolor', 'rgb(0 0 0)');
      this.elem.nativeElement.style.setProperty(
        '--color',
        'rgb(255, 255, 255)'
      );
    } else {
      this.elem.nativeElement.style.setProperty(
        '--bgcolor',
        'rgb(240, 240, 240)'
      );
      this.elem.nativeElement.style.setProperty('--color', 'rgb(0 0 0)');
    }
  }
  actionInput(type: any) {
    if (type == 'name') {
      this.name.nativeElement.classList.remove('disabled');
    } else {
      this.status.nativeElement.classList.remove('disabled');
    }
  }
}
