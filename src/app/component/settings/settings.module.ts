import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SearchComponent } from '../search/search.component';
import { AllSettingComponent } from '../all-setting/all-setting.component';
import { FriendComponent } from '../friend/friend.component';
import { AddFriendComponent } from '../add-friend/add-friend.component';
import { PlansComponent } from '../plans/plans.component';
import { StarsComponent } from '../stars/stars.component';
import { ProfileComponent } from '../profile/profile.component';
import { FriendsComponent } from '../friends/friends.component';

const routes: Routes = [
  {
    path: '',
    component: SearchComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general', component: AllSettingComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'friends', component: FriendComponent },
      { path: 'add-friend', component: AddFriendComponent },
      { path: 'reminders', component: PlansComponent },
      { path: 'stars', component: StarsComponent },
      { path: 'legacy-friends', component: FriendsComponent },
    ],
  },
];

@NgModule({
  declarations: [
    SearchComponent,
    AllSettingComponent,
    FriendComponent,
    AddFriendComponent,
    PlansComponent,
    StarsComponent,
    ProfileComponent,
    FriendsComponent,
  ],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class SettingsModule {}
