import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './../../services/user.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  userName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(private userService: UserService, private router: Router) {}

  register(): void {
    if (this.loading) return;
    this.errorMessage = '';

    const user = {
      userName: this.userName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim(),
      password: this.password.trim(),
    };

    if (!user.userName || !user.email || !user.phone || !user.password || !this.confirmPassword.trim()) {
      this.errorMessage = 'من فضلك أكمل جميع البيانات المطلوبة.';
      return;
    }
    if (user.userName.length < 3) {
      this.errorMessage = 'اسم المستخدم يجب أن يحتوي على 3 أحرف على الأقل.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      this.errorMessage = 'أدخل بريدًا إلكترونيًا صحيحًا.';
      return;
    }
    if (!/^[0-9]{10,15}$/.test(user.phone)) {
      this.errorMessage = 'أدخل رقم هاتف صحيحًا من 10 إلى 15 رقمًا.';
      return;
    }
    if (user.password.length < 6) {
      this.errorMessage = 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.';
      return;
    }
    if (user.password !== this.confirmPassword.trim()) {
      this.errorMessage = 'كلمتا المرور غير متطابقتين.';
      return;
    }

    this.loading = true;
    this.userService.register(user).subscribe({
      next: (data: any) => {
        this.loading = false;
        if (data?.status === 'success') {
          this.router.navigate(['/login']);
          return;
        }
        this.errorMessage = data?.message || 'تعذر إنشاء الحساب.';
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'تعذر الاتصال بالخادم. حاول مرة أخرى.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
