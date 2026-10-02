import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { NgbAlertModule, NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgwWowModule } from 'ngx-wow';
// import {
//   SocialLoginModule,
//   SocialAuthServiceConfig,
//   GoogleSigninButtonModule,
// } from '@abacritt/angularx-social-login';
// import { CoolSocialLoginButtonsModule } from '@angular-cool/social-login-buttons';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './component/login/login.component';
import { SignupComponent } from './component/signup/signup.component';
import { HomeComponent } from './component/home/home.component';
import { FriendsComponent } from './component/friends/friends.component';
import { TestComponent } from './component/test/test.component';
import { SettingComponent } from './component/setting/setting.component';
import { SearchComponent } from './component/search/search.component';
import { AllSettingComponent } from './component/all-setting/all-setting.component';
import { FriendComponent } from './component/friend/friend.component';
import { StarsComponent } from './component/stars/stars.component';
import { PlansComponent } from './component/plans/plans.component';
import { ProfileComponent } from './component/profile/profile.component';
import { AddFriendComponent } from './component/add-friend/add-friend.component';
import { ConversationItemComponent } from './component/home/conversation-item/conversation-item.component';
import { MessageBubbleComponent } from './component/home/message-bubble/message-bubble.component';
import { UserProfileComponent } from './component/home/user-profile/user-profile.component';
import { NotificationCenterComponent } from './component/notification-center/notification-center.component';
import { MessageTimePipe } from './pipes/pipes/message-time.pipe';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    HomeComponent,
    FriendsComponent,
    TestComponent,
    SettingComponent,
    SearchComponent,
    AllSettingComponent,
    FriendComponent,
    StarsComponent,
    PlansComponent,
    ProfileComponent,
    AddFriendComponent,
    ConversationItemComponent,
    MessageBubbleComponent,
    UserProfileComponent,
    NotificationCenterComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    NgbModule,
    NgbPaginationModule,
    NgbAlertModule,
    NgwWowModule,
    // SocialLoginModule,
    // GoogleSigninButtonModule,
    // CoolSocialLoginButtonsModule,
    MessageTimePipe,


  ],
  providers: [
    // {
    //   provide: 'SocialAuthServiceConfig',
    //   useValue: {
    //     autoLogin: false,
    //     providers: [],
    //   } as SocialAuthServiceConfig,
    // },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
