import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

export type MessageAction = 'edit' | 'delete' | 'star' | 'unstar';

const MESSAGE_MUTATION_WINDOW_MS = 30 * 60 * 1000;

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MessageBubbleComponent {
  @Input() message: any;
  @Input() userId: string | undefined;
  @Input() index = 0;
  @Output() mediaSelected = new EventEmitter<{ url: string; type: string }>();
  @Output() action = new EventEmitter<{ type: MessageAction; message: any }>();

  menuOpen = false;

  get isOwn(): boolean {
    return this.message?.sendBy?._id === this.userId || this.message?.sendBy === this.userId;
  }

  get isDeleted(): boolean {
    return !!this.message?.isDeleted;
  }

  get isStarred(): boolean {
    return !!this.message?.isStarred;
  }

  get mutationWindowOpen(): boolean {
    const createdAt = this.message?.createdAt;
    if (createdAt) {
      return Date.now() - new Date(createdAt).getTime() <= MESSAGE_MUTATION_WINDOW_MS;
    }

    if (this.message?.date && this.message?.time) {
      const [day, month, year] = String(this.message.date).split('/').map(Number);
      const [hour, minute, second = 0] = String(this.message.time).split(':').map(Number);
      const fallback = new Date(year, month - 1, day, hour, minute, second);
      return Date.now() - fallback.getTime() <= MESSAGE_MUTATION_WINDOW_MS;
    }

    return false;
  }

  get canEdit(): boolean {
    return this.isOwn &&
      !this.isDeleted &&
      this.mutationWindowOpen &&
      !!this.message?.content?.trim() &&
      !this.message?.fileType;
  }

  get canDelete(): boolean {
    return this.isOwn && !this.isDeleted && this.mutationWindowOpen;
  }

  formatDateDivider(value: any): string {
    if (!value) return '';
    const [day, month, year] = value.includes('/') ? value.split('/') : ['', '', ''];
    const date = new Date(+year, +month - 1, +day);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  formatTime(value: any): string {
    if (!value) return '';
    if (value instanceof Date || !isNaN(Date.parse(value))) {
      const d = new Date(value);
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
    const [hStr, m] = String(value).split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  openMedia(type: string): void {
    this.mediaSelected.emit({ url: this.message.fileUrl, type });
  }

  openMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  chooseAction(type: MessageAction): void {
    this.closeMenu();
    this.action.emit({ type, message: this.message });
  }
}
