import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { filter, Subject, Subscription, take, takeUntil } from 'rxjs';

import { ShareFunctionsService } from './../../services/share-functions.service';
import { UserService } from './../../services/user.service';
import { SocketService } from 'src/app/services/socket.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // 🧩 Subscriptions & Cleanup
  private destroy$ = new Subject<void>();
  clickEventSubscription: Subscription | null = null;

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

  // ✉️ Message Data
  message = '';
  searchTerm: any = '';

  // 📎 File handling
  selectedFile: File | null = null;
  filePreview: SafeUrl | null = null;
  fileType: 'image' | 'video' | 'pdf' | null = null;
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
    private shareFunctions: ShareFunctionsService,
    private socketService: SocketService,
    private userService: UserService,
    private sanitizer: DomSanitizer
  ) {
    // 👇 يستمع للحدث القادم من مكون آخر (فتح الإعدادات)
    this.clickEventSubscription = this.shareFunctions
      .getClickEvent()
      .subscribe(() => {
        this.toggleSettings();
        console.log('f');
        
      });
  }

  // 🟢 Initialization
  ngOnInit(): void {
    // 📡 Listen for setting toggles
    //   this.clickEventSubscription = this.shareFunctions.getClickEvent().subscribe(() => {
    //   this.toggleSettings();
    // });
this.activeList = this.myChats; // الافتراضي هو عرض المحادثات
    // 👤 Listen for user data
    this.userService.user$
      .pipe(takeUntil(this.destroy$), filter(Boolean), take(1))
      .subscribe((data: any) => {
        this.userData = data;
        this.loadOnlineFriends();
        this.sortChats(data.chats);
this.searchFriends()
        // ⚡️ Connect to socket
        this.socketService.connect(this.userData._id);
        this.socketService.emit('join', this.userData._id);

        setTimeout(() => this.initializeSocketListeners(), 500);
      });
  }

  // 🧹 Cleanup
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.clickEventSubscription) this.clickEventSubscription.unsubscribe();
  }

  // 🧠 Socket Listeners
  initializeSocketListeners(): void {
    this.socketService.listen('receiveMessage').subscribe((data: any) => {
      this.userService.getUserData();
      this.handleIncomingMessage(data);
      setTimeout(() => this.scrollToBottom(true), 0);
    });

    this.socketService.listen('messagesRead').subscribe(() => {
      this.theChat.forEach((msg) => (msg.isRead = true));
    });
  }
  private idOf(value: any): string | undefined {
    return typeof value === 'string' ? value : value?._id;
  }
  // 💬 Handle Incoming Message
  handleIncomingMessage(data: any): void {
    const chatId = data.chatId ?? data.message?.chatId;
    const chatIndex = this.myChats.findIndex((chat) => chat._id === chatId);

    const senderId = this.idOf(data.message.sendBy);

    if (chatIndex === -1) {
      const newChat = {
        _id: chatId,
        participants: [data.message.sendBy, data.message.sendTo],
        lastMessage: data.message,
        unreadCount: senderId !== this.userData._id ? 1 : 0,
      };
      this.myChats.unshift(newChat);

      if (senderId === this.theOpenedChatId?._id) {
        this.theChat.push({ ...data.message, isRead: true });
        newChat.unreadCount = 0;
        if (chatId) this.markAsRead(chatId);
      }
    } else {
      const chat = this.myChats[chatIndex];
      chat.lastMessage = data.message;

      if (senderId === this.theOpenedChatId?._id) {
        this.theChat.push({ ...data.message, isRead: true });
        chat.unreadCount = 0;
        if (chatId) this.markAsRead(chatId);
      } else {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }

      this.myChats.splice(chatIndex, 1);
      this.myChats.unshift(chat);
    }

    // 🔔 Play sound safely
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.play().catch(() => {});
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
  sortChats(chats: any[]): void {
    this.myChats = chats
      .map((chat) => ({
        ...chat,
        participants: chat.participants.filter(
          (p: any) => p._id !== this.userData._id
        ),
      }))
      .sort((a, b) => {
        if (!a.lastMessage || !b.lastMessage) return 0;
        const dateA = new Date(`${a.lastMessage.date} ${a.lastMessage.time}`);
        const dateB = new Date(`${b.lastMessage.date} ${b.lastMessage.time}`);
        return dateB.getTime() - dateA.getTime();
      });

    if (this.theOpenedChatId) {
      const i = this.myChats.findIndex(
        (c) => c.participants[0]._id === this.theOpenedChatId._id
      );
      if (i !== -1) this.myChats[i].unreadCount = 0;
    }
    console.log(this.myChats);

  }

  // 📂 Open Chat
  openChat(i: number, data: any[]): void {
    this.theChat = [];

    const myId = this.userData._id;
    const friendData = this.filteredFriends.length
      ? data[i]
      : data[i].participants[0];

    this.userService.getChat({ myId, friendId: friendData._id }).subscribe({
      next: (res: any) => {
        const chatData = res?.chat?.chat;
        this.theOpenedChatId = friendData;

        if (chatData) {
          this.theChat = chatData.messages.map(
            (msg: any, index: number, arr: any[]) => ({
              ...msg,
              showDivider: this.shouldShowDateDividerOnce(index, arr),
            })
          );

          setTimeout(() => this.scrollToBottom(true), 0);
          this.markAsRead(chatData._id);
          this.markMessagesAsRead();
        }

        // Update UI
        this.chat = '';
        this.searchStyle = 'd-none';
        this.friend = 'friend';
        this.chatItem = '';
        this.nameChat = friendData.userName;
        this.imgChat = friendData.profileImage;
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
            (c) => c.participants[0]._id === this.theOpenedChatId._id
          );
          if (chatIndex !== -1) this.myChats[chatIndex].unreadCount = 0;
        }
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
  }

  // 🔄 Toggle Search/Chat
  toggleSettings(): void {
    const isSearchOpen = this.chat === 'd-none' && this.searchStyle === '';
    console.log('gg');
 if (window.innerWidth <= 768) {
    this.chat = 'd-none';
  }else{
    
    this.chat = isSearchOpen ? '' : 'd-none';
  }
    this.searchStyle = isSearchOpen ? 'd-none' : '';
    this.friend = isSearchOpen ? '' : 'friend';
  }

  // ✉️ Send message or file
  sendMessage(): void {
    const content = this.message.trim();
    if (!content && !this.selectedFile) return;

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

    this.userService.initChat(formData).subscribe((res: any) => {
      this.cancelPreview();
      this.message = '';

      const newMsg = res.message;
      if (typeof newMsg.sendBy === 'string')
        newMsg.sendBy = { _id: newMsg.sendBy };
      if (typeof newMsg.sendTo === 'string')
        newMsg.sendTo = { _id: newMsg.sendTo };

      this.theChat.push(newMsg);
      setTimeout(() => this.scrollToBottom(true), 0);
    });
  }

  // 📎 Handle file selection (image / video / pdf)
  async onFileSelected(event: any): Promise<void> {
    this.cancelPreview();
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;
    this.fileName = file.name;
    const type = file.type;

    if (type.startsWith('image/')) {
      this.fileType = 'image';
      const reader = new FileReader();
      reader.onload = () =>
        (this.filePreview = this.sanitizer.bypassSecurityTrustUrl(
          reader.result as string
        ));
      reader.readAsDataURL(file);
    } else if (type.startsWith('video/')) {
      this.handleVideoFile(file);
    } else if (type === 'application/pdf') {
      this.fileType = 'pdf';
      const reader = new FileReader();
      reader.onload = () =>
        (this.filePreview = this.sanitizer.bypassSecurityTrustUrl(
          reader.result as string
        ));
      reader.readAsDataURL(file);
    } else {
      alert('❌ Only images, videos, or PDFs are allowed!');
    }
  }

  // 🎥 Handle video logic
  handleVideoFile(file: File): void {
    const blobUrl = URL.createObjectURL(file);
    this.videoBlobUrl = blobUrl;
    const video = document.createElement('video');
    video.src = blobUrl;

    video.onloadedmetadata = () => {
      this.videoDuration = video.duration;

      if (video.duration > 600) {
        alert('❌ لا يمكن اختيار فيديو أطول من 10 دقائق.');
        URL.revokeObjectURL(blobUrl);
        return;
      }

      this.fileType = 'video';
      const safeBlob = this.sanitizer.bypassSecurityTrustUrl(blobUrl);

      if (video.duration > 30) {
        this.videoUrl = safeBlob;
        this.videoPreview = null;
        this.trimStart = 0;
        this.trimEnd = video.duration;
      } else {
        this.videoUrl = safeBlob;
        this.videoPreview = safeBlob;
        this.filePreview = safeBlob;
      }
    };
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

  // 🧹 Cancel preview
  cancelPreview(): void {
    const revoke = (url: any) => {
      if (typeof url === 'string' && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
    };
    revoke(this.videoBlobUrl);
    this.videoBlobUrl = null;

    this.videoUrl = this.videoPreview = this.filePreview = null;
    this.fileType = this.selectedFile = this.fileName = null;
    this.videoDuration = 0;
  }

  // 🔍 Search
searchFriends() {
  const term = this.searchTerm.toLowerCase().trim();
  this.filteredFriends = term
    ? this.userData.friends.filter((f: any) =>
        f.userName.toLowerCase().includes(term)
      )
    : [];

  // نحدّد القائمة النشطة بناءً على وجود بحث
  this.activeList = term.length > 0 ? this.filteredFriends : this.myChats;
}

isChat(item: any): boolean {
  return !!item.lastMessage;
}

// جلب الصورة حسب نوع العنصر
getProfileImage(item: any): string {
  if (this.isChat(item)) {
    return item.participants[0]?.profileImage || 'default.png';
  } else {
    return item.profileImage || 'default.png';
  }
}

// جلب اسم المستخدم
getUserName(item: any): string {
  return this.isChat(item)
    ? item.participants[0]?.userName
    : item.userName;
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
