import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FriendsService } from 'src/app/services/friends.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-all-setting',
  templateUrl: './all-setting.component.html',
  styleUrls: ['./all-setting.component.scss'],
})
export class AllSettingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userData: any = null;
  blockedUsers: any[] = [];
  showBlockedUsers = false;
  chatBackground = 'aurora';
  savingChatBackground = false;
  readonly chatBackgroundOptions = [
    { id: 'aurora', name: 'Aurora', description: 'Soft violet and blue' },
    { id: 'midnight', name: 'Midnight', description: 'Dark and focused' },
    { id: 'paper', name: 'Paper', description: 'Bright and minimal' },
    { id: 'ocean', name: 'Ocean', description: 'Cool glassy tones' },
    { id: 'rose', name: 'Rose', description: 'Warm elegant blush' },
    { id: 'emerald', name: 'Emerald', description: 'Calm green tone' },
  ];
  loadingBlocked = false;
  actionLoadingId: string | null = null;
  successMessage = '';
  errorMessage = '';
  activeSessions: any[] = [];
  loadingSessions = false;
  emailDraft = '';
  currentPassword = '';
  newPassword = '';
  darkMode = false;

  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private friendService: FriendsService
  ) {}

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('chat-dark-mode') === '1';
    document.body.classList.toggle('dark-theme', this.darkMode);

    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.userData = data;
        this.emailDraft = data?.email || '';
        this.blockedUsers = data?.blockedUsers || [];
        this.chatBackground = data?.chatPreferences?.chatBackground || 'aurora';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateChatPreference(key: string, value: boolean): void {
    this.clearMessages();
    this.userService.updatePreferences({ [key]: value }).subscribe({
      next: (response: any) => { if (response?.user) this.userService.updateUser(response.user); this.successMessage = 'Chat preference saved.'; },
      error: (error) => this.errorMessage = error?.error?.message || 'Could not save chat preference.',
    });
  }

  updatePrivacyPreference(key: string, value: any): void {
    this.clearMessages();
    this.userService.updatePreferences({ privacyPreferences: { [key]: value } }).subscribe({
      next: (response: any) => { if (response?.user) this.userService.updateUser(response.user); this.successMessage = 'Privacy preference saved.'; },
      error: (error) => this.errorMessage = error?.error?.message || 'Could not save privacy preference.',
    });
  }

  updateNotificationPreference(key: string, value: boolean): void {
    this.clearMessages();
    this.userService.updatePreferences({ notificationPreferences: { [key]: value } }).subscribe({
      next: (response: any) => { if (response?.user) this.userService.updateUser(response.user); this.successMessage = 'Notification preference saved.'; },
      error: (error) => this.errorMessage = error?.error?.message || 'Could not save notification preference.',
    });
  }

  saveEmail(): void {
    const email = this.emailDraft.trim();
    this.clearMessages();
    this.userService.updateEmail(email).subscribe({
      next: (response: any) => { if (response?.user) this.userService.updateUser(response.user); this.successMessage = 'Email updated successfully.'; },
      error: (error) => this.errorMessage = error?.error?.message || 'Could not update email.',
    });
  }

  changePassword(): void {
    this.clearMessages();
    if (!this.currentPassword || this.newPassword.length < 6) { this.errorMessage = 'Enter your current password and a new password of at least 6 characters.'; return; }
    this.userService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => { this.successMessage = 'Password changed. Sign in again on this device.'; this.currentPassword = ''; this.newPassword = ''; setTimeout(() => this.logout(), 900); },
      error: (error) => this.errorMessage = error?.error?.message || 'Could not change password.',
    });
  }

  loadSessions(): void {
    this.loadingSessions = true;
    this.userService.getSessions().subscribe({
      next: (response: any) => { this.activeSessions = response?.sessions || []; this.loadingSessions = false; },
      error: () => { this.activeSessions = []; this.loadingSessions = false; },
    });
  }

  revokeSession(sessionId: string): void {
    this.userService.revokeSession(sessionId).subscribe({ next: () => this.loadSessions() });
  }

  logoutAllDevices(): void {
    this.openConfirmation('Sign out everywhere?', 'This will revoke every active session, including this device.', () => {
      this.userService.logoutAllDevices().subscribe({ next: () => this.logout() });
    });
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    document.body.classList.toggle('dark-theme', this.darkMode);
    localStorage.setItem('chat-dark-mode', this.darkMode ? '1' : '0');
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goTo(path: string): void {
    this.router.navigate(['/settings', path]);
  }

  toggleBlockedUsers(): void {
    this.showBlockedUsers = !this.showBlockedUsers;
  }

  saveChatBackground(background: string): void {
    if (!background || this.savingChatBackground) return;

    this.savingChatBackground = true;
    this.clearMessages();
    this.chatBackground = background;

    this.userService.updateChatPreferences(background).subscribe({
      next: (response: any) => {
        this.savingChatBackground = false;
        if (response?.user) {

          this.userData.chatPreferences = response.user.chatPreferences;

          this.userService.updateUser(this.userData);
        }
        this.successMessage = 'Chat background saved.';
      },
      error: (error) => {
        this.savingChatBackground = false;
        this.errorMessage = error?.error?.message || 'Could not save chat background.';
      },
    });
  }

  requestUnblock(user: any): void {
    this.openConfirmation(
      'Unblock user?',
      `Are you sure you want to unblock ${user?.userName || 'this user'}?`,
      () => this.unblockUser(user._id)
    );
  }

  private unblockUser(friendId: string): void {
    if (!this.userData?._id) return;

    this.actionLoadingId = friendId;
    this.clearMessages();

    this.friendService.unblockUser(this.userData._id, friendId).subscribe({
      next: () => {
        this.blockedUsers = this.blockedUsers.filter((user) => user._id !== friendId);
        this.actionLoadingId = null;
        this.successMessage = 'User unblocked successfully.';
        this.userService.getUserData();
      },
      error: () => {
        this.actionLoadingId = null;
        this.errorMessage = 'Could not unblock this user. Please try again.';
      },
    });
  }

  requestLogout(): void {
    this.openConfirmation(
      'Log out?',
      'You will need to sign in again to access your account.',
      () => this.logout()
    );
  }

  private logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  openConfirmation(title: string, message: string, action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmAction = action;
    this.confirmVisible = true;
  }

  closeConfirmation(): void {
    this.confirmVisible = false;
    this.confirmAction = null;
  }

  confirm(): void {
    const action = this.confirmAction;
    this.closeConfirmation();
    action?.();
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
