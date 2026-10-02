import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-conversation-item',
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConversationItemComponent {
  @Input() item: any;
  @Input() index = 0;
  @Output() selected = new EventEmitter<number>();
  @Output() profileSelected = new EventEmitter<any>();

  get isChat(): boolean {
    return !!this.item?.lastMessage || (Array.isArray(this.item?.participants) && this.item.participants.length > 0);
  }

  get profileImage(): string {
    return this.isChat
      ? this.item?.participants?.[0]?.profileImage || 'assets/img/default-avatar.png'
      : this.item?.profileImage || 'assets/img/default-avatar.png';
  }

  get isOnline(): boolean {
    return !!(this.item?.isOnline || this.item?.online || this.item?.status === 'online');
  }

  get attachmentLabel(): string {
    if (this.item?.lastMessage?.fileType === 'video') return 'Video';
    if (this.item?.lastMessage?.fileType === 'audio') return 'Voice message';
    if (this.item?.lastMessage?.fileType === 'pdf') return 'PDF document';
    return 'Attachment';
  }

  get userName(): string {
    return this.isChat
      ? this.item?.participants?.[0]?.userName || 'Unknown user'
      : this.item?.userName || 'Unknown user';
  }

  select(): void {
    this.selected.emit(this.index);
  }

  viewProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.profileSelected.emit(this.isChat ? this.item?.participants?.[0] : this.item);
  }
}
