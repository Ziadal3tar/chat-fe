import { ShareFunctionsService } from './../../services/share-functions.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-stars',
  templateUrl: './stars.component.html',
  styleUrls: ['./stars.component.scss']
})
export class StarsComponent implements OnInit {

  constructor(private ShareFunctionsService:ShareFunctionsService) { }

  ngOnInit(): void {
  }



  backHome(){
    this.ShareFunctionsService.sendClickEvent()
      }
}
