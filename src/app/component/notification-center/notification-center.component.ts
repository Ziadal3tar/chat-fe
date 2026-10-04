import {
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  AppNotification,
  NotificationService,
} from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  @Output() notificationSelected = new EventEmitter<AppNotification>();

  notifications: AppNotification[] = [];
  unreadCount = 0;
  loading = false;
  loadingMore = false;
  error = '';
  panelOpen = false;
  page = 1;
  pages = 1;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
    this.subscribeToRealtimeEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePanel(event?: Event): void {
    event?.stopPropagation();
    this.panelOpen = !this.panelOpen;

    if (this.panelOpen && this.notifications.length === 0 && !this.loading) {
      this.loadNotifications();
    }
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  loadNotifications(append = false): void {
    if (append) {
      if (this.loadingMore || this.page >= this.pages) return;
      this.loadingMore = true;
    } else {
      this.loading = true;
      this.error = '';
      this.page = 1;
    }

    this.notificationService
      .getNotifications(append ? this.page + 1 : 1, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const incoming = response.notifications || [];
          const existingIds = new Set(this.notifications.map((item) => item._id));

          this.notifications = append
            ? [
                ...this.notifications,
                ...incoming.filter((item) => !existingIds.has(item._id)),
              ]
            : incoming;

          this.page = response.pagination?.page || 1;
          this.pages = response.pagination?.pages || 1;
          this.unreadCount = response.unreadCount ?? this.unreadCount;
          this.loading = false;
          this.loadingMore = false;
        },
        error: (error) => {
          this.loading = false;
          this.loadingMore = false;
          this.error =
            error?.error?.message ||
            'Unable to load notifications. Please try again.';
        },
      });
  }

  loadMore(): void {
    this.loadNotifications(true);
  }

  loadUnreadCount(): void {
    this.notificationService
      .getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.unreadCount = response.unreadCount || 0;
        },
      });
  }

  onNotificationKeydown(event: any, notification: AppNotification): void {
    event.preventDefault();
    this.onNotificationClick(notification);
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationService
        .markAsRead(notification._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.applyRead(notification._id),
          error: () => undefined,
        });
    }

    this.panelOpen = false;
    this.notificationSelected.emit(notification);
  }

  markAllAsRead(): void {
    if (!this.unreadCount) return;

    this.notificationService
      .markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications = this.notifications.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt || new Date().toISOString(),
          }));
          this.unreadCount = 0;
        },
      });
  }

  deleteNotification(event: Event, notification: AppNotification): void {
    event.stopPropagation();

    this.notificationService
      .deleteNotification(notification._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const wasUnread = !notification.isRead;
          this.notifications = this.notifications.filter(
            (item) => item._id !== notification._id
          );
          if (wasUnread) {
            this.unreadCount = Math.max(this.unreadCount - 1, 0);
          }
        },
      });
  }

  applyRead(notificationId: string): void {
    const target = this.notifications.find((item) => item._id === notificationId);
    if (!target || target.isRead) return;

    target.isRead = true;
    target.readAt = new Date().toISOString();
    this.unreadCount = Math.max(this.unreadCount - 1, 0);
  }

  private subscribeToRealtimeEvents(): void {
    this.socketService
      .listen('notificationCreated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: AppNotification) => {
        if (!notification?._id) return;

        this.notifications = [
          notification,
          ...this.notifications.filter((item) => item._id !== notification._id),
        ].slice(0, 50);

        if (!notification.isRead) {
          this.unreadCount += 1;
        }
      });

    this.socketService
      .listen('notificationRead')
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload: { notificationId: string }) => {
        if (payload?.notificationId) {
          this.applyRead(payload.notificationId);
        }
      });

    this.socketService
      .listen('notificationsReadAll')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        }));
        this.unreadCount = 0;
      });

    this.socketService
      .listen('notificationDeleted')
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload: { notificationId: string }) => {
        if (!payload?.notificationId) return;

        const target = this.notifications.find(
          (notification) => notification._id === payload.notificationId
        );

        if (!target) return;

        this.notifications = this.notifications.filter(
          (notification) => notification._id !== payload.notificationId
        );

        if (!target.isRead) {
          this.unreadCount = Math.max(this.unreadCount - 1, 0);
        }
      });
  }

  notificationIcon(type: string): string {
    switch (type) {
      case 'message':
      case 'message_edited':
      case 'message_deleted':
        return 'fa-regular fa-comment-dots';
      case 'friend_request':
        return 'fa-solid fa-user-plus';
      case 'friend_request_accepted':
        return 'fa-solid fa-user-check';
      case 'friend_request_rejected':
        return 'fa-solid fa-user-xmark';
      case 'friend_request_cancelled':
        return 'fa-solid fa-user-minus';
      case 'friend_removed':
        return 'fa-solid fa-user-minus';
      case 'story_view':
        return 'fa-regular fa-eye';
      case 'story_reaction':
        return 'fa-solid fa-heart';
      case 'call_incoming':
        return 'fa-solid fa-phone';
      case 'plan_reminder':
      case 'scheduled_message':
      case 'scheduled_message_sent':
      case 'plan_completed':
        return 'fa-regular fa-calendar-check';
      default:
        return 'fa-regular fa-bell';
    }
  }

  trackById(_index: number, notification: AppNotification): string {
    return notification._id;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.panelOpen = false;
  }
}
