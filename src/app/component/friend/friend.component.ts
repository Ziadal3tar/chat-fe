import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { FriendsService } from 'src/app/services/friends.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-friend',
  templateUrl: './friend.component.html',
  styleUrls: ['./friend.component.scss'],
})
export class FriendComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  friendRequests: any[] = [];
  friends: any[] = [];

  userData: any = null;

  loading = true;
  actionId: string | null = null;
  errorMessage = '';

  // Confirmation modal
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private friendService: FriendsService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        if (!user) {
          return;
        }

        this.userData = user;
        this.friends = user.friends || [];

        this.loadFriendRequests();
      });

    this.socketService
      .listen('friendRequestReceived')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshUser());

    this.socketService
      .listen('friendRequestAccepted')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshUser());

    this.socketService
      .listen('friendRequestRejected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshUser());

    this.socketService
      .listen('friendRemoved')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshUser());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFriendRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.friendService.getFriendRequests().subscribe({
      next: (res: any) => {
        this.friendRequests = res?.friendRequests || [];
        this.loading = false;
      },

      error: () => {
        this.friendRequests = [];
        this.loading = false;
        this.errorMessage = 'Unable to load friend requests.';
      },
    });
  }

  private refreshUser(): void {
    this.userService.getUserData();
  }

  acceptRequest(id: string): void {
    if (!this.userData?._id || !id) {
      return;
    }

    this.actionId = id;
    this.errorMessage = '';

    this.friendService
      .acceptFriendRequest(this.userData._id, id)
      .subscribe({
        next: () => {
          this.friendRequests = this.friendRequests.filter(
            (request: any) => request.from?._id !== id
          );

          this.refreshUser();
          this.actionId = null;
        },

        error: () => {
          this.actionId = null;
          this.errorMessage = 'Could not accept the request.';
        },
      });
  }

  rejectRequest(id: string): void {
    if (!this.userData?._id || !id) {
      return;
    }

    this.actionId = id;
    this.errorMessage = '';

    this.friendService
      .rejectFriendRequest(this.userData._id, id)
      .subscribe({
        next: () => {
          this.friendRequests = this.friendRequests.filter(
            (request: any) => request.from?._id !== id
          );

          this.refreshUser();
          this.actionId = null;
        },

        error: () => {
          this.actionId = null;
          this.errorMessage = 'Could not decline the request.';
        },
      });
  }

  blockUser(friendId: string): void {
    if (!this.userData?._id || !friendId) {
      return;
    }

    this.actionId = friendId;
    this.errorMessage = '';

    this.friendService
      .blockUser(this.userData._id, friendId)
      .subscribe({
        next: () => {
          this.friends = this.friends.filter(
            (friend: any) => friend._id !== friendId
          );

          this.refreshUser();
          this.actionId = null;
        },

        error: () => {
          this.actionId = null;
          this.errorMessage = 'Could not block this user.';
        },
      });
  }

  /*
   * ----------------------------------------------------
   * Confirmation Actions
   * ----------------------------------------------------
   */

  requestAccept(id: string): void {
    this.openConfirmation(
      'Accept request?',
      'This person will be added to your friends list.',
      () => this.acceptRequest(id)
    );
  }

  requestReject(id: string): void {
    this.openConfirmation(
      'Decline request?',
      'This friend request will be removed.',
      () => this.rejectRequest(id)
    );
  }

  requestBlock(id: string): void {
    this.openConfirmation(
      'Block user?',
      'This person will be removed from your friends and blocked.',
      () => this.blockUser(id)
    );
  }

  requestRemoveFriend(id: string): void {
    this.openConfirmation(
      'Remove friend?',
      'This person will be removed from your friends list. You can send a new request later.',
      () => this.removeFriend(id)
    );
  }

  openConfirmation(
    title: string,
    message: string,
    action: () => void
  ): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmAction = action;
    this.confirmVisible = true;
  }

  closeConfirmation(): void {
    this.confirmVisible = false;
    this.confirmAction = null;
    this.confirmTitle = '';
    this.confirmMessage = '';
  }

  confirm(): void {
    const action = this.confirmAction;

    this.closeConfirmation();

    if (action) {
      action();
    }
  }

  /*
   * ----------------------------------------------------
   * Navigation
   * ----------------------------------------------------
   */

  openAddFriend(): void {
    this.router.navigate(['/settings/add-friend']);
  }

  backToSettings(): void {
    this.router.navigate(['/settings/general']);
  }

  /*
   * ----------------------------------------------------
   * Friend Actions
   * ----------------------------------------------------
   */

  removeFriend(friendId: string): void {
    if (!friendId) {
      return;
    }

    this.actionId = friendId;
    this.errorMessage = '';


    const service = this.friendService as any;

    const request =
      typeof service.unfriendUser === 'function'
        ? service.unfriendUser(this.userData._id , friendId)
        : typeof service.removeFriend === 'function'
          ? service.removeFriend(friendId)
          : null;

    if (!request) {
      this.actionId = null;
      this.errorMessage =
        'The friend removal method is not available in FriendsService.';
      return;
    }

    request.subscribe({
      next: () => {
        this.friends = this.friends.filter(
          (friend: any) => friend._id !== friendId
        );

        this.refreshUser();
        this.actionId = null;
      },

      error: () => {
        this.actionId = null;
        this.errorMessage = 'Could not remove this friend.';
      },
    });
  }
}
