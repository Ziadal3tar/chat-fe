import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginGuard } from './services/login.guard';
import { GuestGuard } from './services/guest-guard.guard';
import { HomeComponent } from './component/home/home.component';
import { SignupComponent } from './component/signup/signup.component';
import { LoginComponent } from './component/login/login.component';
import { SearchComponent } from './component/search/search.component';
import { AllSettingComponent } from './component/all-setting/all-setting.component';
import { FriendComponent } from './component/friend/friend.component';
import { AddFriendComponent } from './component/add-friend/add-friend.component';
import { PlansComponent } from './component/plans/plans.component';
import { StarsComponent } from './component/stars/stars.component';
import { ProfileComponent } from './component/profile/profile.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [GuestGuard],
    component: LoginComponent,
  },
  {
    path: 'register',
    canActivate: [GuestGuard],
    component: SignupComponent,
  },
  {
    path: 'home',
    canActivate: [LoginGuard],
    component: HomeComponent,
  },
  {
    path: 'settings',
    canActivate: [LoginGuard],
    component: SearchComponent,
    children: [
      {
        path: '',
        redirectTo: 'general',
        pathMatch: 'full',
      },
      {
        path: 'general',
        component: AllSettingComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'friends',
        component: FriendComponent,
      },
      {
        path: 'add-friend',
        component: AddFriendComponent,
      },
      {
        path: 'reminders',
        component: PlansComponent,
      },
      {
        path: 'stars',
        component: StarsComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
