import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';

export type MessageAction = 'edit' | 'delete' | 'star' | 'unstar' | 'reply' | 'focusReply' | 'react' | 'pin' | 'unpin';

const MESSAGE_MUTATION_WINDOW_MS = 30 * 60 * 1000;

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubbleComponent {
  @Input() message: any;
  @Input() userId: string | undefined;
  @Input() index = 0;
  @Input() autoDownloadMedia = true;
  @Output() mediaSelected = new EventEmitter<{ url: string; type: string }>();
  @Output() action = new EventEmitter<{ type: MessageAction; message: any; emoji?: string }>();

  menuOpen = false;
  audioPlaying = false;
  audioProgress = 0;
  audioDuration = 0;
  mediaRevealed = false;
  @ViewChild('voiceAudio') voiceAudio?: ElementRef<HTMLAudioElement>;

  get isOwn(): boolean {
    const senderId = this.message?.sendBy?._id || this.message?.sendBy;
    return String(senderId || '') === String(this.userId || '');
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


  get canAutoLoadMedia(): boolean {
    return true
    // return this.autoDownloadMedia || this.mediaRevealed;
  }

  revealMedia(): void {
    this.mediaRevealed = true;
  }

  toggleAudio(): void {
    const audio = this.voiceAudio?.nativeElement;
    if (!audio) return;
    if (audio.paused) { audio.play().then(() => this.audioPlaying = true).catch(() => {}); }
    else { audio.pause(); this.audioPlaying = false; }
  }

  onAudioTime(): void {
    const audio = this.voiceAudio?.nativeElement;
    if (!audio) return;
    this.audioProgress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  }

  onAudioLoaded(): void {
    const audio = this.voiceAudio?.nativeElement;
    if (audio) this.audioDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
  }

  onAudioEnded(): void { this.audioPlaying = false; this.audioProgress = 0; }

  seekAudio(event: MouseEvent): void {
    const audio = this.voiceAudio?.nativeElement;
    const target = event.currentTarget as HTMLElement;
    if (!audio || !audio.duration || !target.clientWidth) return;
    audio.currentTime = (event.offsetX / target.clientWidth) * audio.duration;
  }

  get currentAudioTime(): number {
    return this.voiceAudio?.nativeElement?.currentTime || 0;
  }

  formatDuration(seconds: any): string {
    if (!Number.isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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

  chooseReaction(emoji: any): void {
    this.closeMenu();
    this.action.emit({ type: 'react', message: this.message, emoji });
  }

  chooseAction(type: MessageAction): void {
    this.closeMenu();
    const emoji = this.message?.pendingReaction || undefined;
    if (type === 'react') this.message.pendingReaction = null;
    this.action.emit({ type, message: this.message, emoji });
  }
}
