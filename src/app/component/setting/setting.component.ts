import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { ShareFunctionsService } from './../../services/share-functions.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
})
export class SettingComponent implements OnInit {
  @ViewChild('name', { read: ElementRef, static: false }) name!: ElementRef;
  @ViewChild('status', { read: ElementRef, static: false }) status!: ElementRef;

  @Input() setting: any;

  disabled = 'disabled';
  userData: any;
  settingStyle = '';
  data: any = { mood: 'morning' };

  constructor(
    private shareFunctionsService: ShareFunctionsService,
    private userService: UserService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.userService.user$.subscribe((data: any) => {
      this.userData = data;
    });

    this.data = this.shareFunctionsService.getData() || this.data;
    this.applyTheme(this.data?.mood);
  }

  private applyTheme(mood: string): void {
    const isNight = mood === 'night';

    this.elementRef.nativeElement.style.setProperty(
      '--bgcolor',
      isNight ? 'rgb(0 0 0)' : 'rgb(240 240 240)'
    );

    this.elementRef.nativeElement.style.setProperty(
      '--color',
      isNight ? 'rgb(255 255 255)' : 'rgb(0 0 0)'
    );
  }

  actionInput(type: 'name' | 'status'): void {
    const target = type === 'name' ? this.name : this.status;

    if (!target?.nativeElement) return;

    target.nativeElement.classList.remove('disabled');
    target.nativeElement.focus();
  }
}
