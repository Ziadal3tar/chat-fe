import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';

import { FriendsService } from 'src/app/services/friends.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-add-friend',
  templateUrl: './add-friend.component.html',
  styleUrls: ['./add-friend.component.scss'],
})
export class AddFriendComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  name = '';
  allUser: any[] = [];
  userData: any = null;
  loading = false;
  actionId: string | null = null;
  errorMessage = '';
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private userService: UserService,
    private friendService: FriendsService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        if (!user) return;
        this.userData = user;
        this.socketService.connect(user._id);
      });

    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((name) => {
          if (!name.trim()) {
            this.loading = false;
            return of({ allUser: [] });
          }
          this.loading = true;
          const token = localStorage.getItem('token');
          return this.userService.searchUser({ name: name.trim() })
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          this.allUser = [
            ...new Map((res?.allUser || []).map((user: any) => [user._id, user])).values(),
          ];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.allUser = [];
          this.errorMessage = 'Search failed. Please try again.';
        },
      });

    this.socketService
      .listen('friendRequestReceived')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.userService.getUserData());

    this.socketService
      .listen('friendRequestAccepted')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.userService.getUserData());

    this.socketService
      .listen('friendRequestRejected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.userService.getUserData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(value: string): void {
    this.errorMessage = '';
    this.searchSubject.next(value);
  }

  getFriendStatus(userId: string): 'friends' | 'pending_sent' | 'pending_received' | 'none' {
    if (!this.userData) return 'none';

    const friends = this.userData.friends || [];
    const sent = this.userData.friendRequestsSent || [];
    const received = this.userData.friendRequests || this.userData.receivedRequests || [];

    if (friends.some((friend: any) => this.getId(friend) === userId)) return 'friends';

    if (sent.some((request: any) => this.getId(request?.to) === userId && request.status === 'pending')) {
      return 'pending_sent';
    }

    if (received.some((request: any) => this.getId(request?.from) === userId && request.status === 'pending')) {
      return 'pending_received';
    }

    return 'none';
  }

  private getId(value: any): string | null {
    if (!value) return null;
    return typeof value === 'string' ? value : value._id?.toString?.() || null;
  }

  requestAddFriend(friendId: string, name: string): void { this.openConfirmation('Send friend request?', `Send a request to ${name}?`, () => this.addFriend(friendId)); }

  requestCancel(friendId: string): void { this.openConfirmation('Cancel request?', 'The pending request will be cancelled.', () => this.cancelRequest(friendId)); }

  requestAccept(id: string, name: string): void { this.openConfirmation('Accept request?', `Add ${name} to your friends?`, () => this.acceptRequest(id)); }

  requestReject(id: string): void { this.openConfirmation('Decline request?', 'This friend request will be removed.', () => this.rejectRequest(id)); }

  requestBlock(friendId: string, name: string): void { this.openConfirmation('Block user?', `${name} will be blocked and removed from search results.`, () => this.blockUser(friendId)); }

  addFriend(friendId: string): void {
    this.actionId = friendId;
    this.friendService.sendFriendRequest(this.userData._id, friendId).subscribe({
      next: () => {
        this.userService.getUserData();
        this.actionId = null;
      },
      error: () => {
        this.actionId = null;
        this.errorMessage = 'Could not send the friend request.';
      },
    });
  }

  cancelRequest(friendId: string): void {
    this.actionId = friendId;
    this.friendService.cancelFriendRequest(this.userData._id, friendId).subscribe({
      next: () => {
        this.userService.getUserData();
        this.actionId = null;
      },
      error: () => {
        this.actionId = null;
        this.errorMessage = 'Could not cancel the request.';
      },
    });
  }

  acceptRequest(id: string): void {
    this.actionId = id;
    this.friendService.acceptFriendRequest(this.userData._id, id).subscribe({
      next: () => {
        this.userService.getUserData();
        this.actionId = null;
      },
      error: () => {
        this.actionId = null;
        this.errorMessage = 'Could not accept the request.';
      },
    });
  }

  rejectRequest(id: string): void {
    this.actionId = id;
    this.friendService.rejectFriendRequest(this.userData._id, id).subscribe({
      next: () => {
        this.userService.getUserData();
        this.actionId = null;
      },
      error: () => {
        this.actionId = null;
        this.errorMessage = 'Could not decline the request.';
      },
    });
  }

  blockUser(friendId: string): void {
    this.actionId = friendId;
    this.friendService.blockUser(this.userData._id, friendId).subscribe({
      next: () => {
        this.allUser = this.allUser.filter((user) => user._id !== friendId);
        this.userService.getUserData();
        this.actionId = null;
      },
      error: () => {
        this.actionId = null;
        this.errorMessage = 'Could not block this user.';
      },
    });
  }

  openConfirmation(title: string, message: string, action: () => void): void { this.confirmTitle = title; this.confirmMessage = message; this.confirmAction = action; this.confirmVisible = true; }

  closeConfirmation(): void { this.confirmVisible = false; this.confirmAction = null; }

  confirm(): void { const action = this.confirmAction; this.closeConfirmation(); action?.(); }

  backToFriends(): void {
    this.router.navigate(['/settings/friends']);
  }

  backToSettings(): void {
    this.router.navigate(['/settings/general']);
  }
}
