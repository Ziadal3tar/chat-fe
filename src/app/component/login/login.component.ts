import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './../../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  emailOrPhone = '';
  password = '';
  emailErr = '';
  passErr = '';
  message = '';
  loading = false;
  showPassword = false;

  // بيانات الحساب التجريبي — غيّرها لتطابق الحساب الموجود في قاعدة البيانات.
  readonly demoAccount = {
    emailOrPhone: 'user@gmail.com',
    password: '123456',
  };

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  login(): void {
    if (this.loading) return;

    this.emailErr = '';
    this.passErr = '';
    this.message = '';

    const emailOrPhone = this.emailOrPhone.trim();
    const password = this.password.trim();

    if (!emailOrPhone) {
      this.emailErr = 'أدخل البريد الإلكتروني أو رقم الهاتف.';
      return;
    }

    if (!password) {
      this.passErr = 'أدخل كلمة المرور.';
      return;
    }

    this.loading = true;

    this.userService.login({ emailOrPhone, password }).subscribe({
      next: (data: any) => {
        this.loading = false;

        if (data?.emailErr) {
          this.emailErr = data.emailErr;
          return;
        }

        if (data?.passErr) {
          this.passErr = data.passErr;
          return;
        }

        if (
          data?.message === 'error' &&
          data?.validationError?.[0]?.[0]?.message
        ) {
          const msg = data.validationError[0][0].message.replace(/"/g, '');
          const field = msg.split(' ')[0];

          if (field === 'emailOrPhone') {
            this.emailErr = msg;
          } else if (field === 'password') {
            this.passErr = msg;
          } else {
            this.message = msg;
          }

          return;
        }

        if (data?.token) {
          localStorage.setItem('token', data.token);
          this.userService.getUserData();
          this.router.navigate(['/home']);
          return;
        }

        this.message = data?.message || 'تعذر تسجيل الدخول.';
      },

      error: (err: any) => {
        this.loading = false;
        this.emailErr =
          err?.error?.message || 'تعذر الاتصال بالخادم. حاول مرة أخرى.';
      },
    });
  }

  useDemoAccount(): void {
    this.emailOrPhone = this.demoAccount.emailOrPhone;
    this.password = this.demoAccount.password;

    this.emailErr = '';
    this.passErr = '';
    this.message = '';
    this.showPassword = false;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
