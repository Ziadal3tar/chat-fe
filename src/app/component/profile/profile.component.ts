import { UserService } from 'src/app/services/user.service';
import { ShareFunctionsService } from './../../services/share-functions.service';
import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
userData:any
  constructor(private ShareFunctionsService :ShareFunctionsService,

    private UserService: UserService,

  ) { }
isEditing = false;

toggleEdit() {
  this.isEditing = !this.isEditing;
}
  ngOnInit(): void {
     this.UserService.user$.subscribe((data:any) => {
    this.userData = data;

  });
  }

  backHome(){
    this.ShareFunctionsService.sendClickEvent()
      }


      selectedFile: File | null = null;

onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
}

saveChanges() {
  if (this.selectedFile) {
    // ارفع الصورة لـ Cloudinary أو السيرفر
    console.log('Uploading new profile image...');
  }

  console.log('Saving new data:', this.userData);
  this.isEditing = false;
}

}
