import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {


  setting = '';
  profile = 'd-none';
  friend = 'd-none';
  addFriend = 'd-none';
  plans = 'd-none';
  stars = 'd-none';
  constructor() {}




  currentSection: string = 'setting'; // القسم الافتراضي



  ngOnInit(): void {

  }

  dnone(){
    this.setting='d-none'
    this.profile='d-none'
    this.friend='d-none'
    this.addFriend='d-none'
    this.plans='d-none'
    this.stars='d-none'
  }









  menuItems = [
  { label: 'Setting', section: 'setting', icon: 'fa-solid fa-gear' },
  { label: 'Profile', section: 'profile', icon: 'fa-solid fa-user' },
  { label: 'Friends', section: 'friend', icon: 'fa-solid fa-user-group' },
  { label: 'Add Friends', section: 'addFriend', icon: 'fa-solid fa-plus' },
  { label: 'Reminder', section: 'plans', icon: 'fa-solid fa-list-check' },
  { label: 'Stars', section: 'stars', icon: 'fa-solid fa-star' }
];

setSection(section: string) {
  this.currentSection = section;
}
}
