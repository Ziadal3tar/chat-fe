import { AppComponent } from './../../app.component';
import { UserService } from './../../services/user.service';
import { ShareFunctionsService } from './../../services/share-functions.service';
import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  hello: any;
  loginArabic = 'd-none';
  loginEnglish = 'd-none';
  dir: any;
  colorValue: any;
  mood = 'morning';
  emailOrPhone: any;
  password: any;
  passErr = '';
  emailErr = '';
  message: any;
  morning = 'url(./assets/img/white-abstract-background_23-2148817571.jpg)';
  night = 'url(./assets/img/6222603.jpg)';
  language = 'العربية';
  constructor(
    private ShareFunctionsService: ShareFunctionsService,
    private elem: ElementRef,
    private UserService: UserService,
    private Router: Router,
    private AppComponent: AppComponent,
  ) {

  }

  ngOnInit(): void {
    localStorage.clear()
    this.elem.nativeElement.style.setProperty('--bg', this.morning);
    this.elem.nativeElement.style.setProperty('--bgline', 'rgb(0 0 0 / 20%)');

    if (this.language == 'العربية') {
      setTimeout(() => {
        this.hello = 'opacity-0 transition';
        setTimeout(() => {
          this.hello = 'd-none';

          setTimeout(() => {
            this.loginEnglish = 'opacity-0 ';

            setTimeout(() => {
              this.loginEnglish = 'opacity-100 transition  ';
            }, 100);
          }, 10);
        }, 501);
      }, 2000);
    } else {
      setTimeout(() => {
        this.hello = 'opacity-0 transition';
        setTimeout(() => {
          this.hello = 'd-none';

          setTimeout(() => {
            this.loginArabic = 'opacity-0 ';
            setTimeout(() => {
              this.loginArabic = 'opacity-100 transition  ';
            }, 100);
          }, 10);
        }, 501);
      }, 2000);
    }


  }

  login() {
  const user = {
    emailOrPhone: this.emailOrPhone,
    password: this.password,
  };

  this.UserService.login(user).subscribe({
    next: (data: any) => {
      if (data.emailErr) {
        this.emailErr = data.emailErr;
        this.passErr = '';
        return;
      }

      if (data.passErr) {
        this.passErr = data.passErr;
        this.emailErr = '';
        return;
      }

      if (data.message === 'error' && data.validationError?.[0]?.[0]?.message) {
        const msg = data.validationError[0][0].message.replace(/"/g, '');
        const field = msg.split(' ')[0];

        if (field === 'emailOrPhone') {
          this.emailErr = msg;
          this.passErr = '';
        } else if (field === 'password') {
          this.passErr = msg;
          this.emailErr = '';
        }
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        this.emailErr = '';
        this.passErr = '';
        this.message = 'welcome';
        this.UserService.getUserData();
        this.Router.navigate(['/home']);
      }
    },
    error: (err) => {
      console.error('Login request failed:', err);
      this.emailErr = 'Server error. Please try again later.';
      this.passErr = '';
    },
  });
}


  changeMood() {
    if (this.mood == 'night') {
      this.mood = 'morning';
      this.elem.nativeElement.style.setProperty('--bg', this.morning);
      this.elem.nativeElement.style.setProperty('--bgline', 'rgb(0 0 0 / 20%)');
    } else {
      this.mood = 'night';
      this.elem.nativeElement.style.setProperty('--bg', this.night);
      this.elem.nativeElement.style.setProperty(
        '--bgline',
        'rgb(255, 255, 255)'
      );
    }
  }
  changeLang() {
    if (this.loginArabic == 'd-none') {
      this.loginArabic = '';
      this.language = 'English';
      this.dir = 'rtl';
      this.loginEnglish = 'd-none';
    } else {
      this.loginArabic = 'd-none';
      this.language = 'العربية';
      this.dir = 'ltr';

      this.loginEnglish = '';
    }
  }

}
