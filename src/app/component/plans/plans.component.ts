import { ShareFunctionsService } from './../../services/share-functions.service';
import { HomeComponent } from './../home/home.component';
import { Component, OnInit } from '@angular/core';

@Component({
  providers: [HomeComponent],

  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
})
export class PlansComponent implements OnInit {
  reply = false;
  send = false;
  date: any;
  time: any;
  dayIneed: any;
  houreIneed: any;
  minIneed: any;

  constructor(

    private ShareFunctionsService: ShareFunctionsService
  ) {}

  ngOnInit(): void {}

  backHome() {
    this.ShareFunctionsService.sendClickEvent();
  }
  vv() {
    //     let date =this.date.split('-')
    //     let time =this.time.split(':')
    //     let year =date[0]
    //     let month =date[1]
    //     let day =date[2]
    //     let houer =time[0]
    //     let min =time[1]
    //     let objectDate = new Date();
    //     let daynow = objectDate.getDate();
    //     let monthnow = objectDate.getMonth() + 1;
    //     let yearnow = objectDate.getFullYear();
    //     let hoursNow = objectDate.getHours()
    //     let minutesNow = objectDate.getMinutes()
    // let timeyear = year - yearnow -1
    // let timemonth = (12 - monthnow) + 5
    // let dayIneed = (timemonth * 30 ) + (30 - daynow)
    // this.houreIneed = houer - hoursNow
    // this.minIneed = min - minutesNow
    // console.log(dayIneed);
    // console.log(timemonth);
    // if (timeyear > 0) {
    //   this.dayIneed = this.dayIneed +(365*timeyear)
    // }else if(timemonth != 0){
    //   this.dayIneed = this.dayIneed +(30*timemonth)
    // }
  }
}
