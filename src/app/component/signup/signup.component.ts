import { AppComponent } from './../../app.component';
import { UserService } from './../../services/user.service';
import { Component, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  hello = '';
  loginArabic = 'd-none';
  loginEnglish = 'd-none';
  dir: any;
  colorValue: any;
  morning = 'url(./assets/img/white-abstract-background_23-2148817571.jpg)';
  night = 'url(./assets/img/6222603.jpg)';
  mood = 'morning';
  language = 'العربية';

  userName: any;
  email: any;
  phone: any;
  password: any;
  confirmPassword: any;
  constructor(
    private elem: ElementRef,
    private UserService: UserService,
    private Router: Router
  ) {}

  ngOnInit(): void {
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

errorMessage: string = ''; // متغير لتخزين الخطأ

register() {
  this.errorMessage = ''; // إعادة التهيئة في كل محاولة تسجيل
  const user = {
    userName: this.userName?.trim(),
    email: this.email?.trim(),
    phone: this.phone?.trim(),
    password: this.password?.trim(),
  };

  // ✅ التحقق المبدئي من الفراغ
  if (!user.userName || !user.email || !user.phone || !user.password) {
    this.errorMessage = 'الرجاء ملء جميع الحقول المطلوبة';
    return;
  }
 if (user.userName.length < 3) {
    this.errorMessage ='الاسم يجب أن يكون 3 أحرف على الأقل';
    return;
  }
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) {
    this.errorMessage ='البريد الإلكتروني غير صالح';
    return;
  }

 const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(user.phone)) {
    this.errorMessage ='رقم الهاتف غير صالح';
    return;
  }

  // ✅ التحقق من قوة كلمة السر
  if (user.password.length < 4) {
    this.errorMessage ='كلمة السر يجب أن تكون 6 أحرف على الأقل';
    return;
  }
  if (user.password !== this.confirmPassword) {
    this.errorMessage ='كلمتا السر غير متطابقتين';
    return;
  }

  // ✅ استدعاء الـ API
  this.UserService.register(user).subscribe({
    next: (data: any) => {
      if (data.status === 'success') {
        this.Router.navigate(['/login']);
      } else {
        this.errorMessage = data.message || 'حدث خطأ غير متوقع';
      }
    },
    error: (err:any) => {
      console.error(err);
      this.errorMessage =
        err?.error?.message || 'تعذر الاتصال بالخادم، حاول لاحقًا.';
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
