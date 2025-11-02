import { UserService } from '../../services/user.service';
import { Component, OnInit } from '@angular/core';
import { SocialAuthService } from '@abacritt/angularx-social-login';


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {
  constructor(
    private UserService:UserService
  ) {}

  ngOnInit() {

  }
  dd(){
// this.audio.play()
  }
}
