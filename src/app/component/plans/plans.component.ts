import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  takeUntil,
} from "rxjs";
import { SocialFeaturesService } from "src/app/services/social-features.service";
import { SocketService } from "src/app/services/socket.service";

type PlanType = "Reply" | "Send" | "Scheduled";

interface PlanFriend {
  _id: string;
  userName: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  isOnline?: boolean;
}

@Component({
  selector: "app-plans",
  templateUrl: "./plans.component.html",
  styleUrls: ["./plans.component.scss"],
})
export class PlansComponent implements OnInit, OnDestroy {
  reminders: any[] = [];

  target = "";
  recipientId = "";
  selectedFriend: PlanFriend | null = null;

  date = "";
  time = "";
  description = "";

  friendSuggestions: PlanFriend[] = [];
  friendsLoading = false;
  friendSearchFocused = false;

  reply = true;
  send = false;
  scheduled = false;

  loading = false;
  saving = false;
  errorMessage = "";
  successMessage = "";
  liveNotice = "";

  confirmVisible = false;
  confirmTitle = "";
  confirmMessage = "";
  private pendingDeleteId: string | null = null;

  private readonly friendSearch$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly socialFeaturesService: SocialFeaturesService,
    private readonly socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.loadPlans();

    this.friendSearch$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((query) => {
          const value = query.trim();

          if (!value) {
            this.friendSuggestions = [];
            this.friendsLoading = false;
            return of({ success: true, friends: [] });
          }

          this.friendsLoading = true;

          return this.socialFeaturesService.searchPlanFriends(value);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.friendSuggestions = Array.isArray(response?.friends)
            ? response.friends
            : [];
          this.friendsLoading = false;
        },
        error: () => {
          this.friendSuggestions = [];
          this.friendsLoading = false;
        },
      });

    this.subscribeToPlanEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(["/home"]);
  }

  selectType(type: PlanType): void {
    this.reply = type === "Reply";
    this.send = type === "Send";
    this.scheduled = type === "Scheduled";
    this.description = "";
  }

  get selectedAction():
    | "reply_reminder"
    | "send_reminder"
    | "scheduled_message" {
    if (this.scheduled) return "scheduled_message";
    return this.send ? "send_reminder" : "reply_reminder";
  }

  get typeLabel(): string {
    if (this.scheduled) return "Scheduled message";
    return this.send ? "Send reminder" : "Reply reminder";
  }

  get descriptionPlaceholder(): string {
    if (this.scheduled) return "Write the message you want to send...";
    if (this.send) return "What do you want to remember before sending?";
    return "What do you want to remember before replying?";
  }

  get reminderPreview(): string {
    const friendName = this.selectedFriend?.userName || this.target.trim() || "your friend";
    const plannedTime = this.date && this.time ? `${this.date} at ${this.time}` : "the selected time";

    if (this.scheduled) {
      return this.description.trim()
        ? `At ${plannedTime}, this message will be sent automatically to ${friendName}.`
        : `At ${plannedTime}, a message will be sent automatically to ${friendName}.`;
    }

    if (this.send) {
      return `At ${plannedTime}, you will receive a reminder to send a message to ${friendName}.`;
    }

    return `At ${plannedTime}, you will receive a reminder to reply to ${friendName}.`;
  }

  get minDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  onTargetInput(value: string): void {
    this.target = value;

    if (
      this.selectedFriend &&
      value.trim().toLowerCase() !== this.selectedFriend.userName.toLowerCase()
    ) {
      this.selectedFriend = null;
      this.recipientId = "";
    }

    this.friendSearch$.next(value);
  }

  onTargetFocus(): void {
    this.friendSearchFocused = true;

    if (this.target.trim()) {
      this.friendSearch$.next(this.target);
    }
  }

  onTargetBlur(): void {
    // Delay closing so a suggestion click can complete before the list disappears.
    setTimeout(() => {
      this.friendSearchFocused = false;
    }, 160);
  }

  selectFriend(friend: PlanFriend): void {
    this.selectedFriend = friend;
    this.recipientId = friend._id;
    this.target = friend.userName;
    this.friendSuggestions = [];
    this.friendSearchFocused = false;
    this.errorMessage = "";
  }

  removeSelectedFriend(): void {
    this.selectedFriend = null;
    this.recipientId = "";
    this.target = "";
    this.friendSuggestions = [];
  }

  loadPlans(): void {
    this.loading = true;
    this.errorMessage = "";

    this.socialFeaturesService
      .getPlans()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.reminders = Array.isArray(response?.plans) ? response.plans : [];
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || "Unable to load your plans.";
        },
      });
  }

  requestAdd(): void {
    this.errorMessage = "";
    this.successMessage = "";
    this.liveNotice = "";

    const target = this.target.trim();
    const description = this.description.trim();

    if (!this.selectedFriend || !this.recipientId) {
      this.errorMessage = "Select a friend from the suggestions.";
      return;
    }

    if (!target) {
      this.errorMessage = "Select the friend you want to plan this for.";
      return;
    }

    if (!this.date || !this.time) {
      this.errorMessage = "Choose a date and time.";
      return;
    }

    const scheduledAt = new Date(`${this.date}T${this.time}`);

    if (Number.isNaN(scheduledAt.getTime())) {
      this.errorMessage = "Choose a valid date and time.";
      return;
    }

    if (scheduledAt.getTime() <= Date.now()) {
      this.errorMessage = "The planned time must be in the future.";
      return;
    }

    if (this.scheduled && !description) {
      this.errorMessage = "Write the message you want to schedule.";
      return;
    }

    this.saving = true;

    this.socialFeaturesService
      .createPlan({
        action: this.selectedAction,
        target,
        recipientId: this.recipientId,
        scheduledAt: scheduledAt.toISOString(),
        content: description,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.successMessage = this.scheduled
            ? `Scheduled message created for ${this.selectedFriend?.userName || 'your friend'}.`
            : this.send
              ? `Reminder created for ${this.selectedFriend?.userName || 'your friend'}.`
              : `Reply reminder created for ${this.selectedFriend?.userName || 'your friend'}.`;
          this.resetComposer();
          this.loadPlans();
        },
        error: (error) => {
          this.saving = false;
          this.errorMessage =
            error?.error?.message || "Unable to create this plan.";
        },
      });
  }

  requestDelete(id: string): void {
    if (!id) return;

    this.pendingDeleteId = id;
    this.confirmTitle = "Cancel this plan?";
    this.confirmMessage =
      "The reminder or scheduled message will not run after cancellation.";
    this.confirmVisible = true;
  }

  closeConfirmation(): void {
    this.confirmVisible = false;
    this.pendingDeleteId = null;
  }

  confirm(): void {
    const id = this.pendingDeleteId;
    if (!id) {
      this.closeConfirmation();
      return;
    }

    this.socialFeaturesService.cancelPlan(id).subscribe({
      next: () => {
        this.closeConfirmation();
        this.loadPlans();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || "Unable to cancel this plan.";
        this.closeConfirmation();
      },
    });
  }

  private subscribeToPlanEvents(): void {
    this.socketService
      .listen("planDue")
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: any) => {
        if (!event?.targetUserName) return;

        this.liveNotice =
          event.action === "reply_reminder"
            ? `It is time to reply to ${event.targetUserName}.`
            : `It is time to send a message to ${event.targetUserName}.`;
        setTimeout(() => { if (this.liveNotice) this.liveNotice = ""; }, 7000);
        this.loadPlans();
      });

    this.socketService
      .listen("planCompleted")
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: any) => {
        if (!event?.targetUserName) return;

        this.liveNotice =
          event.action === "scheduled_message"
            ? `Your scheduled message was sent to ${event.targetUserName}.`
            : `Your reminder for ${event.targetUserName} is complete.`;
        setTimeout(() => { if (this.liveNotice) this.liveNotice = ""; }, 7000);
        this.loadPlans();
      });
  }

  openPlanChat(item: any): void {
    const friendId = item?.target?._id;
    if (!friendId) return;
    this.router.navigate(['/home'], { queryParams: { friend: friendId } });
  }

  trackByPlan(_index: number, plan: any): string {
    return plan?._id || String(_index);
  }

  private resetComposer(): void {
    this.target = "";
    this.recipientId = "";
    this.selectedFriend = null;
    this.friendSuggestions = [];
    this.friendSearchFocused = false;
    this.date = "";
    this.time = "";
    this.description = "";
  }
}
