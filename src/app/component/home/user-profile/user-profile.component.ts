import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent {
  @Input() user: any;
  @Input() currentUserId?: string;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() message = new EventEmitter<any>();

  get profileImage(): string {
    return this.user?.profileImage || 'assets/img/default-avatar.png';
  }

  get userName(): string {
    return this.user?.userName || 'Unknown user';
  }

  get isCurrentUser(): boolean {
    return !!this.user?._id && this.user._id === this.currentUserId;
  }

  get isOnline(): boolean {
    return !!(this.user?.isOnline || this.user?.online || this.user?.status === 'online');
  }

  get friendsCount(): number {
    return Number(this.user?.friendsCount ?? (Array.isArray(this.user?.friends) ? this.user.friends.length : 0));
  }

  get mutualFriendsCount(): number {
    return Number(this.user?.mutualFriendsCount || 0);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }

  close(): void {
    this.closed.emit();
  }

  startMessage(): void {
    this.message.emit(this.user);
    this.close();
  }
}
