import { UserService } from 'src/app/services/user.service';
import { ShareFunctionsService } from './../../services/share-functions.service';
import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  userData: any;
  selectedImage: File | null = null;
  isEditing = false;
  isLoading = false;

  constructor(
    private ShareFunctionsService: ShareFunctionsService,

    private userService: UserService
  ) {}

  ngOnInit(): void {
    // جلب بيانات المستخدم عند تحميل الصفحة
    this.userService.user$.subscribe((data: any) => {
      if (data) {
        this.userData = data;
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }
  backHome() {
    this.ShareFunctionsService.sendClickEvent();
  }

  onFileSelected(event: any): void {
    this.selectedImage = event.target.files[0];
  }
  updateProfile(): void {
    if (!this.userData?.userName && !this.selectedImage) return;

    this.isLoading = true;
    const formData = new FormData();
    formData.append('userId', this.userData._id);
    formData.append('userName', this.userData.userName || '');

    if (this.selectedImage) {
      formData.append('profileImage', this.selectedImage);
    }

    this.userService.updateProfile(formData).subscribe({
      next: (res: any) => {
        console.log('✅ Profile updated:', res);
        this.userService.getUserData(); // تحديث بيانات المستخدم
        this.isEditing = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Update error:', err);
        this.isLoading = false;
      },
    });
  }
}
