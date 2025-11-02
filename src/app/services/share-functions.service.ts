import { SettingComponent } from './../component/setting/setting.component';
import { UserService } from './user.service';
import { SignupComponent } from '../component/signup/signup.component';
import { Injectable, OnInit } from '@angular/core';
import { observable, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root',

})

export class ShareFunctionsService {
  private Subject = new Subject<any>()
  mood :any
  data={
    mood:'morning',
    lang:'english'
  }
  setting=true
  signOut: any ;
    constructor(private UserService:UserService
) { }

ngOnInit(): void {



}
sendClickEvent(){
  this.Subject.next('f')
}

getClickEvent():any{
return this.Subject.asObservable()
}










getData(){
  return this.data
}

  getmood(){
    return this.mood
  }
  changemood(){
    if (this.mood == "night") {
      this.mood = "morning"


    }else{
      this.mood = "night"


    }
  }
  getUserData() {
    const data = {
      token: localStorage.getItem('token'),
    };
    return this.UserService.getUserData()
  }

  sittingPage(){
    this.setting = !this.setting
    return this.setting
  }

}
