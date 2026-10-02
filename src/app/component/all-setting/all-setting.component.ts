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
  loadingBlocked = false;
  actionLoadingId: string | null = null;
  successMessage = '';
  errorMessage = '';

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
    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.userData = data;
        this.blockedUsers = data?.blockedUsers || [];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
