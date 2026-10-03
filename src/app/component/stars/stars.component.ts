import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { SocialFeaturesService } from "src/app/services/social-features.service";

@Component({
  selector: "app-stars",
  templateUrl: "./stars.component.html",
  styleUrls: ["./stars.component.scss"],
})
export class StarsComponent implements OnInit, OnDestroy {
  items: any[] = [];
  loading = false;
  errorMessage = "";

  confirmVisible = false;
  confirmTitle = "";
  confirmMessage = "";
  private itemToDelete: any = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly socialFeaturesService: SocialFeaturesService
  ) {}

  ngOnInit(): void {
    this.loadStars();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(["/home"]);
  }

  loadStars(): void {
    this.loading = true;
    this.errorMessage = "";

    this.socialFeaturesService
      .getStarredMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.items = Array.isArray(response?.items) ? response.items : [];
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message ||
            "Unable to load your starred messages.";
        },
      });
  }


  openInChat(item: any): void {
    const friendId = item?.friendId;
    if (!friendId) {
      this.errorMessage = "This conversation could not be identified.";
      return;
    }

    this.router.navigate(["/home"], {
      queryParams: {
        friend: friendId,
        message: item?._id || null,
      },
    });
  }

  trackById(_index: number, item: any): string { return item?._id || String(_index); }

  requestDelete(item: any): void {
    if (!item?._id) return;

    this.itemToDelete = item;
    this.confirmTitle = "Remove from Stars?";
    this.confirmMessage =
      "This message will remain in the conversation, but it will be removed from your saved collection.";
    this.confirmVisible = true;
  }

  closeConfirmation(): void {
    this.confirmVisible = false;
    this.itemToDelete = null;
  }

  confirm(): void {
    const item = this.itemToDelete;
    if (!item?._id) {
      this.closeConfirmation();
      return;
    }

    this.socialFeaturesService.unstarMessage(item._id).subscribe({
      next: () => {
        this.items = this.items.filter((entry) => entry._id !== item._id);
        this.closeConfirmation();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message ||
          "Unable to remove this message from Stars.";
        this.closeConfirmation();
      },
    });
  }
}
