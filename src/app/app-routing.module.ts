import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginGuard } from './services/login.guard';
import { GuestGuard } from './services/guest-guard.guard';
import { HomeComponent } from './component/home/home.component';
import { SignupComponent } from './component/signup/signup.component';
import { LoginComponent } from './component/login/login.component';

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
    loadChildren: () =>
      import('./component/settings/settings.module').then((m) => m.SettingsModule),
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
