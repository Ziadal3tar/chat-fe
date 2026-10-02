import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit {
  userData: any = null;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isEditing = false;
  isLoading = false;
  errorMessage = "";
  successMessage = "";

  constructor(
    private readonly userService: UserService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.userService.user$.subscribe((data: any) => {
      if (data) {

        this.userData = { ...data };
        
      }
    });
  }

  goBack(): void {
    this.router.navigate(["/settings"]);
  }

  goHome(): void {
    this.router.navigate(["/home"]);
  }

  startEditing(): void {
    this.errorMessage = "";
    this.successMessage = "";
    this.selectedImage = null;
    this.imagePreview = this.userData?.profileImage || null;
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.errorMessage = "";
    this.successMessage = "";
    this.selectedImage = null;
    this.imagePreview = null;
    this.isEditing = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.errorMessage = "Please select a valid image file.";
      return;
    }

    this.selectedImage = file;
    this.errorMessage = "";

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  updateProfile(): void {
    if (!this.userData?._id) return;

    const userName = (this.userData.userName || "").trim();
    const bio = (this.userData.bio || "").trim();

    if (!userName) {
      this.errorMessage = "Username cannot be empty.";
      return;
    }

    if (bio.length > 500) {
      this.errorMessage = "Bio cannot exceed 500 characters.";
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.successMessage = "";

    const formData = new FormData();
    formData.append("userId", this.userData._id);
    formData.append("userName", userName);
    formData.append("bio", bio);

    if (this.selectedImage) {
      formData.append("profileImage", this.selectedImage);
    }

    this.userService.updateProfile(formData).subscribe({
      next: (response: any) => {
        const nextUser = response?.user;
        if (nextUser) {
          this.userData = { ...this.userData, ...nextUser };
        }

        this.isEditing = false;
        this.selectedImage = null;
        this.imagePreview = null;
        this.isLoading = false;
        this.successMessage =
          response?.message || "Profile updated successfully.";
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message ||
          "Unable to update your profile. Please try again.";
      },
    });
  }
}
