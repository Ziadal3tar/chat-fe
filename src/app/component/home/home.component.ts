import { Component, ElementRef, HostListener, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { filter, Subject, take, takeUntil } from 'rxjs';

import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from './../../services/user.service';
import { SocketService } from 'src/app/services/socket.service';
import { SocialFeaturesService } from 'src/app/services/social-features.service';
import { StoryService } from 'src/app/services/story.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // 🧩 Subscriptions & Cleanup
  private destroy$ = new Subject<void>();

  // 👥 Data
  userData: any;
  myChats: any[] = [];
  filteredFriends: any[] = [];
  onlineFriends: any[] = [];
  theChat: any[] = [];

  // 💬 Chat UI State
  chatItem = 'd-none';
  chat = 'chat';
  friend = '';
  searchStyle = 'd-none';
  settingStyle = 'd-none';
  theOpenedChatId: any;
  nameChat: string | null = null;
  imgChat: string | null = null;
  chatBackground = 'aurora';
  chatBackgroundPickerOpen = false;
  readonly chatBackgroundOptions = [
    { id: 'aurora', name: 'Aurora', description: 'Soft violet and blue glow' },
    { id: 'midnight', name: 'Midnight', description: 'Deep, low-light conversation' },
    { id: 'paper', name: 'Paper', description: 'Clean and bright minimal' },
    { id: 'ocean', name: 'Ocean', description: 'Cool glassy blue tones' },
    { id: 'rose', name: 'Rose', description: 'Warm elegant blush tones' },
    { id: 'emerald', name: 'Emerald', description: 'Calm green premium tone' },
  ];
  private pendingFriendId: string | null = null;
  private pendingMessageId: string | null = null;

  // ⏳ Loading / Error State
  isLoadingChat = false;
  isSendingMessage = false;
  chatError = '';
  actionError = '';
  fileError = '';
  recordingError = '';
  planNotice = '';
  private planNoticeTimer: ReturnType<typeof setTimeout> | null = null;

  // ✉️ Message Data
  message = '';
  editingMessage: any = null;
  profileUser: any = null;
  profileOpen = false;
  confirmation: { open: boolean; title: string; text: string; action: 'delete' | 'save-edit' | null; message?: any } = { open: false, title: '', text: '', action: null };
  searchTerm: any = '';

  // ⭐ Message utilities
  emojiOpen = false;
  readonly emojiList = ['😀', '😂', '😍', '🥰', '😎', '😭', '😅', '🤔', '😴', '😡', '👍', '❤️', '🔥', '🎉', '👏', '🙏', '💯', '✨', '🥳', '👀'];

  // 🎙️ Audio recording
  isRecording = false;
  recordingSeconds = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordingStream: MediaStream | null = null;
  private recordingChunks: BlobPart[] = [];
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private recordedAudioBlobUrl: string | null = null;

  // 📸 Stories
  stories: any[] = [];
  storyComposerOpen = false;
  storyViewerOpen = false;
  storyFile: File | null = null;
  storyPreviewUrl = '';
  storyCaption = '';
  storySaving = false;
  storyError = '';
  storyPreviewLoading = false;
  storyGroupIndex = 0;
  storyItemIndex = 0;

  // 📞 Voice / video calls
  callOpen = false;
  callMode: 'audio' | 'video' = 'audio';
  callState: 'idle' | 'calling' | 'incoming' | 'connected' = 'idle';
  callError = '';
  incomingCall: any = null;
  callId: string | null = null;
  callPeerId: string | null = null;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private callTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('storyFileInput') storyFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('localVideo') localVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteAudio') remoteAudio?: ElementRef<HTMLAudioElement>;

  // 📎 File handling
  selectedFile: File | null = null;
  filePreview: SafeUrl | null = null;
  fileType: 'image' | 'video' | 'audio' | 'pdf' | null = null;
  fileName: string | null = null;

  // 🎥 Video trimming
  videoUrl: SafeUrl | null = null;
  videoPreview: SafeUrl | null = null;
  videoBlobUrl: string | null = null;
  videoDuration = 0;
  trimStart = 0;
  trimEnd = 0;
activeList: any[] = [];
  // 🔈 Audio notification
  audio = new Audio('./assets/audio/ttn.mp3');

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  constructor(
    private elem: ElementRef,
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private userService: UserService,
    private sanitizer: DomSanitizer,
    private socialFeaturesService: SocialFeaturesService,
    private storyService: StoryService
  ) {
  }

  // 🟢 Initialization
  ngOnInit(): void {
    this.activeList = [];

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.pendingFriendId = params.get('friend');
        this.pendingMessageId = params.get('message');

        if (this.userData && this.pendingFriendId) {
          this.openPendingChat();
        }
      });

    this.userService.user$
      .pipe(takeUntil(this.destroy$), filter(Boolean), take(1))
      .subscribe((data: any) => {
        this.userData = data;
        console.log(data);

        this.chatBackground = data?.chatPreferences?.chatBackground || 'aurora';
        this.loadOnlineFriends();
        this.sortChats(data?.chats || []);
        this.loadStories();
        this.searchFriends();

        this.socketService.connect(this.userData._id);
        this.socketService.emit('join', this.userData._id);
        this.initializeSocketListeners();

        this.openPendingChat();
      });
  }

  // 🧹 Cleanup
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopRecording();
    this.closeCallResources(false);
    this.clearCallTimeout();
    this.clearPlanNotice();
    this.socketService.disconnect();
  }

  // 🧠 Socket Listeners
  initializeSocketListeners(): void {
    this.socketService.listen('receiveMessage').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      this.handleIncomingMessage(data);
      setTimeout(() => this.scrollToBottom(true), 0);
    });

    this.socketService.listen('planDue').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (!data?.targetUserName) return;
      this.showPlanNotice(
        data.action === 'reply_reminder'
          ? `It is time to reply to ${data.targetUserName}.`
          : `It is time to send a message to ${data.targetUserName}.`
      );
    });

    this.socketService.listen('planCompleted').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (!data?.targetUserName) return;
      this.showPlanNotice(
        data.action === 'scheduled_message'
          ? `Your scheduled message was sent to ${data.targetUserName}.`
          : `Your reminder for ${data.targetUserName} is complete.`
      );
    });

    this.socketService.listen('messagesRead').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.theChat.forEach((msg) => (msg.isRead = true));
    });

    this.socketService.listen('messageUpdated').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      this.applyUpdatedMessage(data?.message);
    });

    this.socketService.listen('messageDeleted').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      this.applyDeletedMessage(data?.messageId, data?.chatId);
    });

    this.socketService.listen('presenceChanged').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      this.applyPresenceChange(data?.userId, !!data?.isOnline);
    });

    this.socketService.listen('messageStarChanged').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      this.applyStarChanged(data);
    });

    this.socketService.listen('incomingCall').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      this.handleIncomingCall(data);
    });

    this.socketService.listen('callAccepted').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      void this.handleCallAccepted(data);
    });

    this.socketService.listen('callIceCandidate').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      void this.handleCallIceCandidate(data);
    });

    this.socketService.listen('callEnded').pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (!this.callId || !data?.callId || data.callId === this.callId) {
        this.endCall(false);
      }
    });
  }
  private idOf(value: any): string | undefined {
    return typeof value === 'string' ? value : value?._id;
  }
  // 💬 Handle Incoming Message
  handleIncomingMessage(data: any): void {
    const incomingMessage = data?.message;
    const chatId = data?.chatId ?? incomingMessage?.chatId;

    if (!incomingMessage || !chatId || !this.userData?._id) return;

    const chatIndex = this.myChats.findIndex((chat) => chat?._id === chatId);
    const senderId = this.idOf(incomingMessage.sendBy);
    const isFromCurrentUser = senderId === this.userData._id;
    const isCurrentChat = senderId === this.theOpenedChatId?._id || chatId === this.resolveCurrentChatId();
    const alreadyVisible = this.theChat.some((message) => message?._id === incomingMessage._id);

    if (chatIndex === -1) {
      const newChat = {
        _id: chatId,
        participants: [incomingMessage.sendBy, incomingMessage.sendTo],
        lastMessage: incomingMessage,
        unreadCount: !isFromCurrentUser && !isCurrentChat ? 1 : 0,
      };

      this.myChats.unshift(newChat);

      if (isCurrentChat) {
        if (!alreadyVisible) {
          this.upsertMessage(incomingMessage, true);
        }
        newChat.unreadCount = 0;
        this.markAsRead(chatId);
      }
    } else {
      const chat = this.myChats[chatIndex];
      chat.lastMessage = incomingMessage;

      if (isCurrentChat) {
        if (!alreadyVisible) {
          this.upsertMessage(incomingMessage, true);
        }
        chat.unreadCount = 0;
        this.markAsRead(chatId);
      } else if (!isFromCurrentUser) {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }

      this.myChats.splice(chatIndex, 1);
      this.myChats.unshift(chat);
    }

    this.activeList = this.searchTerm?.trim() ? this.filteredFriends : this.myChats;

    // 🔔 Play sound safely
    if (!isFromCurrentUser) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    }
  }

  private resolveCurrentChatId(): string | undefined {
    if (!this.theOpenedChatId?._id) return undefined;

    const chat = this.myChats.find(
      (item) => item?.participants?.[0]?._id === this.theOpenedChatId._id
    );

    return chat?._id;
  }

  // ✅ Mark messages as read on the server
  markAsRead(chatId: string): void {
    if (!this.userData || !this.theOpenedChatId) return;
    this.socketService.emit('markAsRead', {
      chatId,
      readerId: this.userData._id,
      friendId: this.theOpenedChatId._id,
    });
  }

  // 👥 Load online friends
  loadOnlineFriends(): void {
    if (!this.userData?._id) return;
    this.userService
      .getOnlineFriends({ userId: this.userData._id })
      .subscribe((res: any) => (this.onlineFriends = res.onlineFriends));
  }

  // 🧾 Sort chats by latest message
  sortChats(chats: any[] = []): void {
    this.myChats = (Array.isArray(chats) ? chats : [])
      .map((chat: any) => {
        const participants = Array.isArray(chat?.participants)
          ? chat.participants.filter(
              (participant: any) => this.idOf(participant) !== this.userData?._id
            )
          : [];

        return {
          ...chat,
          participants,
        };
      })
      .filter((chat: any) => !!chat?.participants?.[0]?._id)
      .sort(
        (a: any, b: any) =>
          this.messageTimestamp(b?.lastMessage) -
          this.messageTimestamp(a?.lastMessage)
      );

    if (this.theOpenedChatId?._id) {
      const i = this.myChats.findIndex(
        (c) => c?.participants?.[0]?._id === this.theOpenedChatId._id
      );
      if (i !== -1) this.myChats[i].unreadCount = 0;
    }

    this.activeList = this.searchTerm?.trim()
      ? this.filteredFriends
      : this.myChats;
  }

  private messageTimestamp(message: any): number {
    if (!message) return 0;

    if (message.createdAt) {
      const createdAt = new Date(message.createdAt).getTime();
      if (!Number.isNaN(createdAt)) return createdAt;
    }

    const date = typeof message.date === 'string' ? message.date : '';
    const time = typeof message.time === 'string' ? message.time : '';
    const match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (!match) return 0;

    const [, day, month, year] = match;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(time.split(':')[0] || 0),
      Number(time.split(':')[1] || 0),
      Number(time.split(':')[2] || 0)
    ).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private resolveFriendFromListItem(item: any): any | null {
    if (!item) return null;
    if (item?.participants?.length) return item.participants[0];
    if (item?._id && item?.userName) return item;
    return null;
  }

  // 📂 Open Chat
  openChat(i: number, data: any[]): void {
    this.theChat = [];
    this.chatError = '';
    this.actionError = '';
    this.cancelEdit();
    this.cancelPreview();
    this.emojiOpen = false;
    this.isLoadingChat = true;

    const myId = this.userData?._id;
    const friendData = this.resolveFriendFromListItem(data?.[i]);

    if (!myId || !friendData?._id) {
      this.isLoadingChat = false;
      this.chatError = 'Unable to identify this conversation.';
      return;
    }

    this.userService.getChat({ myId, friendId: friendData._id }).subscribe({
      next: (res: any) => {
        this.isLoadingChat = false;
        const chatData = res?.chat?.chat;
        this.theOpenedChatId = friendData;

        const messages = Array.isArray(chatData?.messages)
          ? chatData.messages
          : [];

        this.theChat = messages.map(
          (msg: any, index: number, arr: any[]) => ({
            ...msg,
            showDivider: this.shouldShowDateDividerOnce(index, arr),
          })
        );

        if (chatData?._id) {
          setTimeout(() => this.scrollToBottom(true), 0);
          this.markAsRead(chatData._id);
          this.markMessagesAsRead();
        }

        this.chat = '';
        this.searchStyle = 'd-none';
        this.friend = 'friend';
        this.chatItem = '';
        this.nameChat = friendData.userName || friendData.email || 'Chat';
        this.imgChat = friendData.profileImage || null;
        this.activeList = this.searchTerm?.trim()
          ? this.filteredFriends
          : this.myChats;
      },
      error: () => {
        this.isLoadingChat = false;
        this.chatError = 'Unable to load this conversation. Please try again.';
      },
    });
  }

  // 📭 Mark all messages as read
  markMessagesAsRead(): void {
    this.userService
      .markMessagesAsRead({
        chatId: this.theOpenedChatId?._id,
        userId: this.userData._id,
      })
      .subscribe((res: any) => {
        if (res.success) {
          const chatIndex = this.myChats.findIndex(
            (c) => c?.participants?.[0]?._id === this.theOpenedChatId?._id
          );
          if (chatIndex !== -1) this.myChats[chatIndex].unreadCount = 0;
        }
      });
  }


  handleNotificationSelected(notification: any): void {
    if (!notification) return;

    if (
      ['message', 'message_edited', 'message_deleted', 'scheduled_message'].includes(notification.type) &&
      notification.data?.chatId
    ) {
      this.openChatFromNotification(notification);
      return;
    }

    if (
      ['plan_reminder', 'scheduled_message_sent', 'plan_completed'].includes(notification.type) &&
      notification.data?.targetUserId
    ) {
      const friend = (this.userData?.friends || []).find(
        (item: any) => item?._id === notification.data.targetUserId
      );

      if (friend) {
        this.openChatByFriend(friend, notification.data?.messageId);
      }
      return;
    }

    if (
      notification.type?.startsWith('friend_request') ||
      notification.type === 'friend_removed'
    ) {
      this.router.navigate(['/settings/friends']);
    }
  }

  retryOpenChat(): void {
    const friend = this.theOpenedChatId;
    if (!friend?._id || !this.userData) return;

    this.chatError = '';
    this.openChatByFriend(friend);
  }

  private applyPresenceChange(userId: string | undefined, isOnline: boolean): void {
    if (!userId) return;

    this.myChats.forEach((chat) => {
      const participant = chat?.participants?.[0];
      if (participant?._id === userId) {
        participant.isOnline = isOnline;
      }
    });

    this.userData?.friends?.forEach((friend: any) => {
      if (friend?._id === userId) {
        friend.isOnline = isOnline;
      }
    });

    if (this.theOpenedChatId?._id === userId) {
      this.theOpenedChatId.isOnline = isOnline;
    }
  }

  private openChatFromNotification(notification: any): void {
    const chatId = notification.data?.chatId;
    if (!chatId) return;

    const openFromCurrentList = () => {
      const index = this.myChats.findIndex((chat) => chat._id === chatId);

      if (index !== -1) {
        this.openChat(index, this.myChats);
        return true;
      }

      return false;
    };

    if (openFromCurrentList()) return;

    this.userService.getMyChats({}).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        this.sortChats(response?.chats || []);
        this.activeList = this.myChats;
        openFromCurrentList();
      },
    });
  }

  // 📜 Scroll chat to bottom
  scrollToBottom(force: boolean = false): void {
    try {
      const container = this.chatContainer.nativeElement;
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        150;
      if (force || atBottom) container.scrollTop = container.scrollHeight;
    } catch {}
  }

  // 🚪 Close chat
  closeChat(): void {
    this.friend = '';
    this.chat = 'chat';
    this.chatItem = 'd-none';
    this.theOpenedChatId = undefined;
    this.nameChat = null;
    this.imgChat = null;
    this.theChat = [];
    this.chatError = '';
    this.actionError = '';
    this.isLoadingChat = false;
    this.emojiOpen = false;
    this.searchTerm = '';
    this.filteredFriends = [];
    this.activeList = this.myChats;
    this.cancelEdit();
    this.cancelPreview();
  }

  // ⚙️ Open the dedicated settings route.
  openSettings(): void {
    this.router.navigate(['/settings']);
  }

  get chatPresenceLabel(): string {
    if (this.theOpenedChatId?.isOnline) return 'Online now';
    const lastSeen = this.theOpenedChatId?.lastSeenAt;
    return lastSeen ? `Last seen ${this.formatTime(lastSeen)}` : 'Offline';
  }

  toggleEmojiPicker(): void {
    if (this.editingMessage) return;
    this.emojiOpen = !this.emojiOpen;
  }

  insertEmoji(emoji: string): void {
    this.message += emoji;
    this.emojiOpen = false;
  }

  async toggleRecording(): Promise<void> {
    if (this.editingMessage) return;
    if (this.isRecording) {
      this.stopRecording();
      return;
    }

    this.recordingError = '';
    try {
      this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((mime) => MediaRecorder.isTypeSupported(mime));
      this.recordingChunks = [];
      this.mediaRecorder = preferredMime
        ? new MediaRecorder(this.recordingStream, { mimeType: preferredMime })
        : new MediaRecorder(this.recordingStream);

      const recorder = this.mediaRecorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.recordingChunks.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const extension = type.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(this.recordingChunks, { type });
        this.selectedFile = new File([blob], `voice-${Date.now()}.${extension}`, { type });
        this.fileType = 'audio';
        this.fileName = this.selectedFile.name;
        if (this.recordedAudioBlobUrl) URL.revokeObjectURL(this.recordedAudioBlobUrl);
        this.recordedAudioBlobUrl = URL.createObjectURL(blob);
        this.filePreview = this.sanitizer.bypassSecurityTrustUrl(this.recordedAudioBlobUrl);
        this.videoUrl = null;
        this.videoPreview = null;
        this.recordingChunks = [];
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;
      this.recordingSeconds = 0;
      this.recordingTimer = setInterval(() => {
        this.recordingSeconds++;
        if (this.recordingSeconds >= 300) this.stopRecording();
      }, 1000);
    } catch (error) {
      this.recordingError = 'Microphone access was denied or is unavailable.';
      this.isRecording = false;
      this.recordingStream?.getTracks().forEach((track) => track.stop());
      this.recordingStream = null;
    }
  }

  stopRecording(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.recordingStream?.getTracks().forEach((track) => track.stop());
    this.recordingStream = null;
    this.mediaRecorder = null;
    this.isRecording = false;
  }

  formatRecordingTime(): string {
    const minutes = Math.floor(this.recordingSeconds / 60).toString().padStart(2, '0');
    const seconds = (this.recordingSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  // 📸 Stories
  loadStories(): void {
    this.storyService.getStories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => { this.stories = Array.isArray(response?.stories) ? response.stories : []; },
      error: () => { this.stories = []; },
    });
  }

  get currentStoryGroup(): any { return this.stories[this.storyGroupIndex] || null; }
  get currentStory(): any { return this.currentStoryGroup?.stories?.[this.storyItemIndex] || null; }

  openStoryComposer(): void {
    this.storyComposerOpen = true;
    this.storyError = '';
  }

  closeStoryComposer(): void {
    this.revokeObjectUrl(this.storyPreviewUrl);
    this.storyComposerOpen = false;
    this.storyFile = null;
    this.storyPreviewUrl = '';
    this.storyCaption = '';
    this.storyError = '';
    this.storyPreviewLoading = false;

    if (this.storyFileInput?.nativeElement) {
      this.storyFileInput.nativeElement.value = '';
    }
  }

  private revokeObjectUrl(url: string | SafeUrl | null | undefined): void {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') resolve(result);
        else reject(new Error('Unable to read file preview'));
      };
      reader.onerror = () => reject(new Error('Unable to read file preview'));
      reader.readAsDataURL(file);
    });
  }

  async onStoryFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.storyError = '';

    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      this.storyError = 'Stories support images and videos only.';
      if (input) input.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      this.storyError = 'Story files must be 15 MB or smaller.';
      if (input) input.value = '';
      return;
    }

    this.revokeObjectUrl(this.storyPreviewUrl);
    this.storyFile = file;
    this.storyPreviewUrl = '';
    this.storyPreviewLoading = true;

    try {
      if (file.type.startsWith('image/')) {
        // Data URL avoids blob/CSP preview issues on the deployed static app.
        this.storyPreviewUrl = await this.readFileAsDataUrl(file);
      } else {
        this.storyPreviewUrl = URL.createObjectURL(file);
      }
    } catch {
      this.storyFile = null;
      this.storyError = 'The selected file could not be previewed. Please choose another file.';
      if (input) input.value = '';
    } finally {
      this.storyPreviewLoading = false;
    }
  }

  resetStorySelection(): void {
    this.revokeObjectUrl(this.storyPreviewUrl);
    this.storyFile = null;
    this.storyPreviewUrl = '';
    this.storyError = '';
    this.storyPreviewLoading = false;

    if (this.storyFileInput?.nativeElement) {
      this.storyFileInput.nativeElement.value = '';
    }
  }

  publishStory(): void {
    if (!this.storyFile || this.storySaving || this.storyPreviewLoading) return;
    this.storySaving = true;
    this.storyError = '';
    this.storyService.createStory(this.storyFile, this.storyCaption.trim()).subscribe({
      next: () => {
        this.storySaving = false;
        this.closeStoryComposer();
        this.loadStories();
      },
      error: (error) => {
        this.storySaving = false;
        this.storyError = error?.error?.message || 'Story could not be uploaded. Please try again.';
      },
    });
  }

  openStoryGroup(groupIndex: number): void {
    const group = this.stories[groupIndex];
    if (!group?.stories?.length) return;
    const firstUnviewed = group.stories.findIndex((story: any) => !story.isViewed);
    this.storyGroupIndex = groupIndex;
    this.storyItemIndex = firstUnviewed >= 0 ? firstUnviewed : 0;
    this.storyViewerOpen = true;
    this.markCurrentStoryViewed();
  }

  closeStoryViewer(): void { this.storyViewerOpen = false; }

  nextStory(): void {
    const group = this.currentStoryGroup;
    if (!group) return;
    if (this.storyItemIndex < group.stories.length - 1) {
      this.storyItemIndex++;
      this.markCurrentStoryViewed();
      return;
    }
    if (this.storyGroupIndex < this.stories.length - 1) {
      this.storyGroupIndex++;
      this.storyItemIndex = 0;
      this.markCurrentStoryViewed();
      return;
    }
    this.closeStoryViewer();
  }

  previousStory(): void {
    if (this.storyItemIndex > 0) {
      this.storyItemIndex--;
      this.markCurrentStoryViewed();
      return;
    }
    if (this.storyGroupIndex > 0) {
      this.storyGroupIndex--;
      this.storyItemIndex = Math.max((this.currentStoryGroup?.stories?.length || 1) - 1, 0);
      this.markCurrentStoryViewed();
    }
  }

  private markCurrentStoryViewed(): void {
    const story = this.currentStory;
    if (!story?._id) return;
    story.isViewed = true;
    this.storyService.viewStory(story._id).pipe(take(1)).subscribe({ error: () => {} });
    const group = this.currentStoryGroup;
    if (group) group.hasUnviewed = group.stories.some((item: any) => !item.isViewed);
  }

  deleteOwnStory(storyId: string): void {
    this.storyService.deleteStory(storyId).pipe(take(1)).subscribe({
      next: () => { this.closeStoryViewer(); this.loadStories(); },
      error: () => {},
    });
  }

  // 📞 Voice / video calls
  async startCall(mode: 'audio' | 'video'): Promise<void> {
    if (!this.theOpenedChatId?._id || this.callState !== 'idle') return;
    this.callError = '';
    this.callMode = mode;
    this.callState = 'calling';
    this.callOpen = true;
    this.callPeerId = this.theOpenedChatId._id;
    this.callId = this.createCallId();
    this.pendingIceCandidates = [];

    try {
      await this.prepareCallMedia(mode);
      await this.setupPeerConnection();
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      this.socketService.emit('call:invite', {
        toUserId: this.callPeerId,
        callId: this.callId,
        type: mode,
        offer,
      });

      this.armCallTimeout();
    } catch (error) {
      this.callError = 'Could not start the call. Check your microphone/camera permissions.';
      this.endCall(false);
    }
  }

  private createCallId(): string {
    const cryptoApi = globalThis.crypto as Crypto & { randomUUID?: () => string };
    return cryptoApi.randomUUID ? cryptoApi.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private async prepareCallMedia(mode: 'audio' | 'video'): Promise<void> {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === 'video',
    });
    this.syncCallMediaElements();
  }

  private async setupPeerConnection(): Promise<void> {
    const peerId = this.callPeerId;
    if (!peerId) throw new Error('Missing call peer');
    this.peerConnection?.close();
    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ];

    if (environment.turn?.urls && environment.turn?.username && environment.turn?.credential) {
      iceServers.push({
        urls: environment.turn.urls,
        username: environment.turn.username,
        credential: environment.turn.credential,
      });
    }

    this.peerConnection = new RTCPeerConnection({ iceServers });

    this.localStream?.getTracks().forEach((track) => this.peerConnection!.addTrack(track, this.localStream!));
    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => this.remoteStream?.addTrack(track));
      this.syncCallMediaElements();
    };
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callId) {
        this.socketService.emit('call:ice', {
          toUserId: peerId,
          callId: this.callId,
          candidate: event.candidate.toJSON(),
        });
      }
    };
    this.syncCallMediaElements();
  }

  handleIncomingCall(data: any): void {
    if (!data?.callId || !data?.fromUserId || this.callState !== 'idle') {
      if (data?.fromUserId) {
        this.socketService.emit('call:end', { toUserId: data.fromUserId, callId: data.callId, reason: 'busy' });
      }
      return;
    }
    this.incomingCall = data;
    this.callId = data.callId;
    this.callPeerId = data.fromUserId;
    this.callMode = data.type === 'video' ? 'video' : 'audio';
    this.callState = 'incoming';
    this.callOpen = true;
    this.armCallTimeout();
  }

  async acceptIncomingCall(): Promise<void> {
    if (!this.incomingCall) return;
    this.callError = '';
    try {
      await this.prepareCallMedia(this.callMode);
      await this.setupPeerConnection();
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(this.incomingCall.offer));
      await this.flushPendingIceCandidates();
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      this.socketService.emit('call:accept', {
        toUserId: this.callPeerId,
        callId: this.callId,
        answer,
      });
      this.callState = 'connected';
      this.clearCallTimeout();
      this.incomingCall = null;
      this.syncCallMediaElements();
    } catch (error) {
      this.callError = 'The call could not be accepted.';
      this.endCall(true);
    }
  }

  private armCallTimeout(): void {
    this.clearCallTimeout();
    this.callTimeoutTimer = setTimeout(() => {
      this.callError = 'The call timed out.';
      this.endCall(true);
    }, 30_000);
  }

  private clearCallTimeout(): void {
    if (this.callTimeoutTimer) {
      clearTimeout(this.callTimeoutTimer);
      this.callTimeoutTimer = null;
    }
  }

  rejectIncomingCall(): void {
    if (this.incomingCall?.fromUserId) {
      this.socketService.emit('call:end', {
        toUserId: this.incomingCall.fromUserId,
        callId: this.incomingCall.callId,
        reason: 'rejected',
      });
    }
    this.closeCallResources(false);
  }

  private async handleCallAccepted(data: any): Promise<void> {
    if (!this.callId || data?.callId !== this.callId || !this.peerConnection) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      await this.flushPendingIceCandidates();
      this.callState = 'connected';
      this.syncCallMediaElements();
    } catch (error) {
      this.callError = 'The call connection failed.';
      this.endCall(false);
    }
  }

  private async handleCallIceCandidate(data: any): Promise<void> {
    if (!this.callId || data?.callId !== this.callId || !data?.candidate) return;
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      this.pendingIceCandidates.push(data.candidate);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch {}
  }

  private async flushPendingIceCandidates(): Promise<void> {
    if (!this.peerConnection) return;
    const candidates = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    for (const candidate of candidates) {
      try { await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    }
  }

  endCall(emitRemote = true): void {
    const peerId = this.callPeerId;
    const callId = this.callId;
    if (emitRemote && peerId && callId) {
      this.socketService.emit('call:end', { toUserId: peerId, callId, reason: 'ended' });
    }
    this.closeCallResources(false);
  }

  private closeCallResources(_emitRemote: boolean): void {
    this.clearCallTimeout();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.remoteStream?.getTracks().forEach((track) => track.stop());
    this.peerConnection?.close();
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.pendingIceCandidates = [];
    this.callOpen = false;
    this.callState = 'idle';
    this.incomingCall = null;
    this.callId = null;
    this.callPeerId = null;
  }

  private syncCallMediaElements(): void {
    setTimeout(() => {
      if (this.localVideo?.nativeElement) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = this.remoteStream;
      }
      if (this.remoteAudio?.nativeElement) {
        this.remoteAudio.nativeElement.srcObject = this.remoteStream;
      }
    }, 0);
  }

  private showPlanNotice(message: string): void {
    this.planNotice = message;
    if (this.planNoticeTimer) clearTimeout(this.planNoticeTimer);
    this.planNoticeTimer = setTimeout(() => this.clearPlanNotice(), 7000);
  }

  clearPlanNotice(): void {
    if (this.planNoticeTimer) {
      clearTimeout(this.planNoticeTimer);
      this.planNoticeTimer = null;
    }
    this.planNotice = '';
  }

  private updateConversationPreview(message: any): void {
    const chatId = message?.chatId;
    if (!chatId) return;

    const friendId = message?.sendTo?._id || message?.sendTo;
    const chatIndex = this.myChats.findIndex((chat) => chat?._id === chatId);

    if (chatIndex === -1) {
      const friend = (this.userData?.friends || []).find(
        (item: any) => item?._id === friendId
      );

      if (!friend) return;

      this.myChats.unshift({
        _id: chatId,
        participants: [friend],
        lastMessage: message,
        unreadCount: 0,
      });
    } else {
      const chat = this.myChats[chatIndex];
      chat.lastMessage = message;
      chat.unreadCount = 0;
      this.myChats.splice(chatIndex, 1);
      this.myChats.unshift(chat);
    }

    this.activeList = this.searchTerm?.trim() ? this.filteredFriends : this.myChats;
  }

  private upsertMessage(message: any, markRead = false): void {
    if (!message?._id) return;
    const index = this.theChat.findIndex((entry) => entry?._id === message._id);

    if (index === -1) {
      this.theChat.push({
        ...message,
        isRead: markRead ? true : message.isRead,
      });
      return;
    }

    this.theChat[index] = {
      ...this.theChat[index],
      ...message,
      isRead: markRead ? true : (message.isRead ?? this.theChat[index].isRead),
    };
  }

  private openPendingChat(): void {
    if (!this.pendingFriendId || !this.userData?._id) return;

    const friend = (this.userData?.friends || []).find(
      (item: any) => item?._id === this.pendingFriendId
    );
    if (!friend) return;

    const messageId = this.pendingMessageId || undefined;
    this.openChatByFriend(friend, messageId);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });

    this.pendingFriendId = null;
    this.pendingMessageId = null;
  }

  private focusMessage(messageId?: string): void {
    if (!messageId) return;
    setTimeout(() => {
      const node = this.chatContainer?.nativeElement?.querySelector(
        `[data-message-id="${messageId}"]`
      ) as HTMLElement | null;

      if (!node) return;
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      node.classList.add('focus-message');
      setTimeout(() => node.classList.remove('focus-message'), 1800);
    }, 180);
  }

  toggleChatBackgroundPicker(): void {
    this.chatBackgroundPickerOpen = !this.chatBackgroundPickerOpen;
  }

setChatBackground(value: string): void {
  const previous = this.chatBackground;
  const nextBackground = value || 'aurora';

  // Update the UI immediately
  this.chatBackground = nextBackground;

  this.userService.updateChatPreferences(nextBackground).subscribe({
    next: (response: any) => {
      const nextUser = response?.user;

      if (nextUser) {

        this.userData = {
          ...this.userData,
          ...nextUser,
          friends: nextUser.friends ?? this.userData?.friends ?? [],
          chats: nextUser.chats ?? this.userData?.chats ?? [],
          chatPreferences: {
            ...(this.userData?.chatPreferences || {}),
            ...(nextUser.chatPreferences || {}),
            chatBackground: nextBackground,
          },
        };

        // Keep the currently displayed conversations intact.
        this.sortChats(this.userData?.chats || this.myChats);
      }

      this.chatBackgroundPickerOpen = false;
      this.actionError = '';
    },

    error: () => {
      this.chatBackground = previous;
      this.actionError = 'Chat background could not be saved.';
    },
  });
}

  // ✉️ Send message or file
  sendMessage(): void {
    if (this.editingMessage) {
      this.saveEditedMessage();
      return;
    }
    const content = this.message.trim();
    if (!content && !this.selectedFile) return;
    if (!this.theOpenedChatId || this.isSendingMessage) return;
    this.isSendingMessage = true;
    this.actionError = '';
    this.emojiOpen = false;
    if (this.isRecording) this.stopRecording();

    const formData = new FormData();
    formData.append('sendBy', this.userData._id);
    formData.append('sendTo', this.theOpenedChatId._id);
    formData.append('content', content || '');
    formData.append('date', new Date().toLocaleDateString('en-GB'));
    formData.append(
      'time',
      new Date().toLocaleTimeString('en-US', { hour12: false })
    );
    if (this.selectedFile) formData.append('file', this.selectedFile);

    this.userService.initChat(formData).subscribe({
      next: (res: any) => {
      this.isSendingMessage = false;
      this.cancelPreview();
      this.message = '';

      const newMsg = res.message;
      if (typeof newMsg.sendBy === 'string')
        newMsg.sendBy = { _id: newMsg.sendBy };
      if (typeof newMsg.sendTo === 'string')
        newMsg.sendTo = { _id: newMsg.sendTo };

      this.upsertMessage(newMsg, true);
      this.updateConversationPreview(newMsg);
      setTimeout(() => this.scrollToBottom(true), 0);
      },
      error: () => {
        this.isSendingMessage = false;
        this.actionError = 'Message could not be sent. Please try again.';
      },
    });
  }


  // Message actions
  onMessageAction(event: { type: 'edit' | 'delete' | 'star' | 'unstar'; message: any }): void {
    const messageId = event.message?._id;
    if (!messageId) return;

    if (event.type === 'star' || event.type === 'unstar') {
      const request$ = event.type === 'star'
        ? this.socialFeaturesService.starMessage(messageId)
        : this.socialFeaturesService.unstarMessage(messageId);

      request$.subscribe({
        next: () => this.applyStarChanged({
          messageId,
          chatId: event.message?.chatId,
          userId: this.userData?._id,
          isStarred: event.type === 'star',
        }),
        error: (error) => {
          this.actionError = error?.error?.message || 'Unable to update the starred state.';
        },
      });
      return;
    }

    if (event.type === 'edit') {
      if (!event.message?.content || event.message?.fileType || !this.isWithinMessageWindow(event.message)) return;
      this.editingMessage = event.message;
      this.message = event.message.content;
      this.emojiOpen = false;
      return;
    }

    this.confirmation = {
      open: true,
      title: 'Delete message?',
      text: 'This message will be replaced by a deleted-message placeholder. Deletion is available for 30 minutes after sending.',
      action: 'delete',
      message: event.message,
    };
  }

  private isWithinMessageWindow(message: any): boolean {
    if (!message?.createdAt) return false;

    const createdAt = new Date(message.createdAt).getTime();
    if (Number.isNaN(createdAt)) return false;

    const age = Date.now() - createdAt;
    return age >= 0 && age <= 30 * 60 * 1000;
  }

  private applyStarChanged(data: any): void {
    if (!data?.messageId) return;
    const isForCurrentUser = !data.userId || data.userId === this.userData?._id;
    if (!isForCurrentUser) return;

    const update = (message: any) => {
      if (message?._id === data.messageId) {
        message.isStarred = !!data.isStarred;
      }
    };

    this.theChat.forEach(update);
    this.myChats.forEach((chat) => update(chat?.lastMessage));
  }

  saveEditedMessage(): void {
    const content = this.message.trim();
    if (!this.editingMessage || !content) return;
    this.confirmation = {
      open: true,
      title: 'Save changes?',
      text: 'The text of this message will be updated.',
      action: 'save-edit',
      message: this.editingMessage,
    };
  }

  confirmMessageAction(): void {
    const target = this.confirmation.message;
    if (!target) return;
    this.actionError = '';

    if (this.confirmation.action === 'delete') {
      if (!this.isWithinMessageWindow(target)) {
        this.actionError = 'Messages can only be deleted within 30 minutes of sending.';
        this.closeConfirmation();
        return;
      }
      this.userService.deleteMessage(target._id).subscribe({
        next: () => {
          this.applyDeletedMessage(target._id, target.chatId);
          this.closeConfirmation();
        },
        error: (error) => {
          this.actionError = error?.error?.message || 'Message could not be deleted. Please try again.';
          this.closeConfirmation();
        },
      });
      return;
    }

    if (this.confirmation.action === 'save-edit') {
      if (!this.isWithinMessageWindow(target)) {
        this.actionError = 'Messages can only be edited within 30 minutes of sending.';
        this.closeConfirmation();
        return;
      }
      const content = this.message.trim();
      this.userService.updateMessage(target._id, content).subscribe({
        next: (response: any) => {
          const updated = response?.message;
          this.applyUpdatedMessage(updated || { ...target, content, isEdited: true });
          this.message = '';
          this.editingMessage = null;
          this.closeConfirmation();
        },
        error: (error) => {
          this.actionError = error?.error?.message || 'Message could not be updated. Please try again.';
          this.closeConfirmation();
        },
      });
      return;
    }

    this.closeConfirmation();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmation.open) {
      this.closeConfirmation();
      return;
    }
    if (this.profileOpen) {
      this.closeProfile();
      return;
    }
    if (this.mediaViewer.open) {
      this.closeMediaViewer();
      return;
    }
    if (this.storyViewerOpen) {
      this.closeStoryViewer();
      return;
    }
    if (this.storyComposerOpen) {
      this.closeStoryComposer();
      return;
    }
    if (this.callOpen && this.callState === 'incoming') {
      this.rejectIncomingCall();
    }
  }

  private applyUpdatedMessage(updatedMessage: any): void {
    if (!updatedMessage?._id) return;

    const index = this.theChat.findIndex((msg: any) => msg._id === updatedMessage._id);
    if (index !== -1) {
      this.theChat[index] = { ...this.theChat[index], ...updatedMessage, isEdited: true };
    }

    for (const chat of this.myChats) {
      if (chat?.lastMessage?._id === updatedMessage._id) {
        chat.lastMessage = { ...chat.lastMessage, ...updatedMessage, isEdited: true };
      }
    }
  }

  private applyDeletedMessage(messageId: string, chatId?: string): void {
    if (!messageId) return;

    const index = this.theChat.findIndex((msg: any) => msg._id === messageId);
    if (index !== -1) {
      this.theChat[index] = {
        ...this.theChat[index],
        content: '',
        fileUrl: null,
        fileType: null,
        isDeleted: true,
        isEdited: false,
      };
    }

    for (const chat of this.myChats) {
      if (chat?.lastMessage?._id === messageId) {
        chat.lastMessage = {
          ...chat.lastMessage,
          content: '',
          fileUrl: null,
          fileType: null,
          isDeleted: true,
          isEdited: false,
        };
      }
    }
  }

  closeConfirmation(): void {
    this.confirmation = { open: false, title: '', text: '', action: null };
  }

  cancelEdit(): void {
    this.editingMessage = null;
    this.message = '';
  }

  viewProfile(user: any): void {
    if (!user?._id) return;
    this.profileUser = { ...user };
    this.profileOpen = true;

    this.userService.getUserById(user._id).subscribe({
      next: (response: any) => {
        this.profileUser = { ...this.profileUser, ...(response?.user || {}) };
      },
      error: () => {},
    });
  }

  closeProfile(): void {
    this.profileOpen = false;
    this.profileUser = null;
  }

  startChatFromProfile(user: any): void {
    const index = this.userData?.friends?.findIndex((friend: any) => friend._id === user?._id);
    if (index !== -1) {
      this.searchTerm = '';
      this.filteredFriends = [];
      this.activeList = this.myChats;
      this.openChatByFriend(user);
    }
  }

  openChatByFriend(friend: any, targetMessageId?: string): void {
    if (!friend?._id || !this.userData?._id) return;

    this.theChat = [];
    this.chatError = '';
    this.isLoadingChat = true;
    this.cancelEdit();
    this.cancelPreview();
    this.emojiOpen = false;

    this.userService
      .getChat({ myId: this.userData._id, friendId: friend._id })
      .subscribe({
        next: (res: any) => {
          this.isLoadingChat = false;
          const chatData = res?.chat?.chat;
          this.theOpenedChatId = friend;

          this.theChat = (Array.isArray(chatData?.messages)
            ? chatData.messages
            : []
          ).map((msg: any, index: number, arr: any[]) => ({
            ...msg,
            showDivider: this.shouldShowDateDividerOnce(index, arr),
          }));

          this.chat = '';
          this.friend = 'friend';
          this.chatItem = '';
          this.nameChat = friend.userName || friend.email || 'Chat';
          this.imgChat = friend.profileImage || null;
          this.profileOpen = false;

          if (chatData?._id) {
            this.markAsRead(chatData._id);
            this.markMessagesAsRead();
          }

          setTimeout(() => {
            this.scrollToBottom(true);
            this.focusMessage(targetMessageId);
          }, 0);
        },
        error: () => {
          this.isLoadingChat = false;
          this.chatError = 'Unable to load this conversation. Please try again.';
        },
      });
  }

  // 📎 Handle file selection (image / video / pdf)
  async onFileSelected(event: Event): Promise<void> {
    // Read the newly selected file BEFORE resetting the previous preview.
    // The previous implementation cleared input.value first, which could
    // empty input.files before the selected File was captured.
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) return;

    this.clearAttachmentPreview(false);
    this.fileError = '';

    if (file.size > 50 * 1024 * 1024) {
      this.fileError = 'Files must be 50 MB or smaller.';
      if (input) input.value = '';
      return;
    }

    const type = file.type;
    const supported =
      type.startsWith('image/') ||
      type.startsWith('video/') ||
      type.startsWith('audio/') ||
      type === 'application/pdf';

    if (!supported) {
      this.fileError = 'Only images, videos, audio, or PDF files are supported.';
      if (input) input.value = '';
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;

    const blobUrl = URL.createObjectURL(file);
    this.videoBlobUrl = blobUrl;
    const safeBlob = this.sanitizer.bypassSecurityTrustUrl(blobUrl);

    if (type.startsWith('image/')) {
      this.fileType = 'image';
      this.filePreview = safeBlob;
      return;
    }

    if (type.startsWith('audio/')) {
      this.fileType = 'audio';
      this.filePreview = safeBlob;
      return;
    }

    if (type === 'application/pdf') {
      this.fileType = 'pdf';
      this.filePreview = safeBlob;
      return;
    }

    await this.handleVideoFile(file, blobUrl, safeBlob);
  }

  // 🎥 Handle video logic
  async handleVideoFile(file: File, blobUrl?: string, safeBlob?: SafeUrl): Promise<void> {
    const objectUrl = blobUrl || URL.createObjectURL(file);
    const safeUrl = safeBlob || this.sanitizer.bypassSecurityTrustUrl(objectUrl);

    this.videoBlobUrl = objectUrl;
    this.fileType = 'video';
    this.videoUrl = safeUrl;
    this.videoPreview = safeUrl;
    this.filePreview = safeUrl;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;

    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('metadata'));
      });
    } catch {
      this.fileError = 'This video could not be previewed. Please choose another file.';
      this.cancelPreview();
      return;
    }

    this.videoDuration = video.duration || 0;

    if (this.videoDuration > 600) {
      this.fileError = 'Videos longer than 10 minutes are not supported.';
      this.cancelPreview();
      return;
    }

    if (this.videoDuration > 30) {
      this.trimStart = 0;
      this.trimEnd = this.videoDuration;
    }
  }

  // ✂️ Trim video
  async confirmTrim(): Promise<void> {
    if (!this.videoBlobUrl) return;
    const video = document.createElement('video');
    video.src = this.videoBlobUrl;

    await new Promise<void>(
      (resolve) => (video.onloadeddata = () => resolve())
    );
    const duration = Math.min(
      30,
      (this.trimEnd ?? this.trimStart + 30) - this.trimStart
    );
    const trimmedBlob = await this.trimVideoFrontend(
      video,
      this.trimStart,
      duration
    );

    const blobUrl = URL.createObjectURL(trimmedBlob);
    const safeBlob = this.sanitizer.bypassSecurityTrustUrl(blobUrl);

    this.videoPreview = safeBlob;
    this.filePreview = safeBlob;
    this.selectedFile = new File([trimmedBlob], 'trimmedVideo.webm', {
      type: 'video/webm',
    });
    this.videoUrl = null;
    this.videoDuration = 0;
  }

  // 🎞️ Actual trimming process
  async trimVideoFrontend(
    video: HTMLVideoElement,
    start: number,
    duration: number
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const recordedChunks: BlobPart[] = [];
      const stream = canvas.captureStream();
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      video.currentTime = start;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };
      recorder.onstop = () =>
        resolve(new Blob(recordedChunks, { type: 'video/webm' }));

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      };

      recorder.start();
      video.muted = true;
      video.play();

      const draw = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (video.currentTime < start + duration && !video.ended)
          requestAnimationFrame(draw);
      };
      draw();

      setTimeout(() => {
        recorder.stop();
        video.pause();
        video.muted = false;
      }, duration * 1000);
    });
  }

  // 🧹 Cancel attachment preview
  private clearAttachmentPreview(clearInput = true): void {
    this.revokeObjectUrl(this.videoBlobUrl);
    this.revokeObjectUrl(this.recordedAudioBlobUrl);
    this.videoBlobUrl = null;
    this.recordedAudioBlobUrl = null;

    this.videoUrl = this.videoPreview = this.filePreview = null;
    this.fileType = this.selectedFile = this.fileName = null;
    this.videoDuration = 0;
    this.trimStart = 0;
    this.trimEnd = 0;

    if (clearInput && this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  cancelPreview(): void {
    this.clearAttachmentPreview(true);
    this.fileError = '';
  }

  // 🔍 Search
  searchFriends(): void {
    const term = String(this.searchTerm || '').toLowerCase().trim();
    const friends = Array.isArray(this.userData?.friends)
      ? this.userData.friends
      : [];

    this.filteredFriends = term
      ? friends.filter((friend: any) =>
          String(friend?.userName || '').toLowerCase().includes(term)
        )
      : [];

    this.activeList = term ? this.filteredFriends : this.myChats;
  }

  isChat(item: any): boolean {
    return Array.isArray(item?.participants) && item.participants.length > 0;
  }

  // جلب الصورة حسب نوع العنصر
  getProfileImage(item: any): string {
    if (this.isChat(item)) {
      return item.participants[0]?.profileImage || 'default.png';
    }

    return item?.profileImage || 'default.png';
  }

  // جلب اسم المستخدم
  getUserName(item: any): string {
    if (this.isChat(item)) {
      return item.participants[0]?.userName || item.participants[0]?.email || 'Friend';
    }

    return item?.userName || item?.email || 'Friend';
  }

  trackById(_index: number, item: any): string {
    return item?._id || `${_index}`;
  }

  trackByStoryGroup(_index: number, item: any): string {
    return item?.user?._id || `${_index}`;
  }

  // 📅 Divider Logic
  shouldShowDateDividerOnce(index: number, messages: any[]): boolean {
    if (index === 0) return true;
    const current = messages[index];
    const previous = messages[index - 1];
    if (!current?.date || !previous?.date) return false;

    const parseDate = (d: string) => {
      const [day, month, year] = d.includes('/') ? d.split('/') : [0, 0, 0];
      return new Date(+year, +month - 1, +day);
    };

    return (
      parseDate(current.date).toDateString() !==
      parseDate(previous.date).toDateString()
    );
  }

  // 📆 Format Date Divider
  formatDateDivider(dateValue: any): string {
    if (!dateValue) return '';
    const [day, month, year] = dateValue.includes('/')
      ? dateValue.split('/')
      : ['', '', ''];
    const date = new Date(+year, +month - 1, +day);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // ⏰ Format Time
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
    const [hStr, m] = value.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  // 🖼️ Media Viewer
  mediaViewer = { open: false, url: '', type: '' };
  openMediaViewer(url: string, type: string): void {
    this.mediaViewer = { open: true, url, type };
  }
  closeMediaViewer(): void {
    this.mediaViewer.open = false;
  }
}
