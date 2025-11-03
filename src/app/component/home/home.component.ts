import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { filter, Subject, Subscription, take, takeUntil } from 'rxjs';
import { ShareFunctionsService } from './../../services/share-functions.service';
import { UserService } from './../../services/user.service';
import { SocketService } from 'src/app/services/socket.service';

import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  clickEventSubscription: Subscription;
  theChat: any[] = [];
  myChats: any[] = [];
  filteredFriends: any[] = [];
  onlineFriends: any[] = [];
  searchTerm: any = '';
  message = '';
  userData: any;
  friendData: any;
  theOpenedChatId: any;
  cont: any;
  setting: any;
  private destroy$ = new Subject<void>();

  filePreview: any | null = null;
  fileType: 'image' | 'video' | 'pdf' | null = null;
  fileName: string | null = null;
  selectedFile: File | null = null;

  videoUrl: any | null = null;
  videoPreview: any | null = null;
  videoDuration: number = 0;
  trimStart: number = 0;
  trimEnd: number = 0;

  morning = 'url(./assets/img/white-abstract-background_23-2148817571.jpg)';
  night = 'url(./assets/img/6222603.jpg)';
  friendStyle = '';
  openIcon = '';
  chatItem = 'd-none';
  chat = 'chat';
  friend = '';
  settingStyle = 'd-none';
  searchStyle = 'd-none';
  arabic = '';
  english = '';
  imgChat: any;
  nameChat: any;

  audio = new Audio();
  safeVideoPreview: SafeUrl | null = null;

  constructor(
    private elem: ElementRef,
    private shareFunctions: ShareFunctionsService,
    private socketService: SocketService,
    private UserService: UserService,
    private sanitizer: DomSanitizer
  ) {
    this.clickEventSubscription = this.shareFunctions
      .getClickEvent()
      .subscribe(() => {
        this.toggleSettings();
      });
  }
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  ngOnInit(): void {
    this.audio.src = '../../../assets/audio/ttn.mp3';

    this.UserService.user$
      .pipe(
        takeUntil(this.destroy$),
        filter((data) => !!data),
        take(1)
      )
      .subscribe((data: any) => {
        this.userData = data;
        this.loadOnlineFriends();
        this.sortChats(data.chats);

        // 🟢 اتصل بالسيرفر
        this.socketService.connect(this.userData._id);
this.socketService.emit('join', this.userData._id);
        // ✅ بعد الاتصال، فعّل الاستماع للأحداث
        setTimeout(() => {
          this.initializeSocketListeners();
        }, 500); // تأخير بسيط لتأكيد الاتصال
      });
  }
  initializeSocketListeners() {
    this.socketService.listen('receiveMessage').subscribe((data: any) => {
      this.UserService.getUserData();
      this.handleIncomingMessage(data);
      setTimeout(() => this.scrollToBottom(true), 0);
    });

    this.socketService.listen('messagesRead').subscribe((chatId: any) => {
      this.theChat.forEach((msg: any) => (msg.isRead = true));
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /** 📬 التعامل مع الرسائل المستقبلة لحظيًا */

  handleIncomingMessage(data: any) {
  const chatIndex = this.myChats.findIndex(
    (chat: any) => chat._id === data.message.chatId
  );
console.log(data);
console.log(this.myChats);

  if (chatIndex === -1) {
    // الشات غير موجود → أضفه
    const newChat = {
      _id: data.message.chatId,
      participants: [data.message.sendBy, data.message.sendTo],
      lastMessage: data.message,
      unreadCount: data.message.sendBy !== this.userData._id ? 1 : 0
    };
    this.myChats.unshift(newChat);

    // لو الشات مفتوح حالياً
    if (data.message.sendBy === this.theOpenedChatId?._id) {
      this.theChat.push({ ...data.message, isRead: true });
      newChat.unreadCount = 0;

      // إشعار السيرفر بالقراءة
      this.socketService.emit('markAsRead', {
        chatId: data.chatId,
        readerId: this.userData._id,
        friendId: this.theOpenedChatId._id,
      });
    }
  } else {
    const chat = this.myChats[chatIndex];
    chat.lastMessage = data.message;

    if (data.message.sendBy === this.theOpenedChatId?._id) {
      // الشات مفتوح → اعتبر الرسالة مقروءة
      this.theChat.push({ ...data.message, isRead: true });
      chat.unreadCount = 0;

      // إشعار السيرفر بالقراءة
      this.socketService.emit('markAsRead', {
        chatId: data.chatId,
        readerId: this.userData._id,
        friendId: this.theOpenedChatId._id,
      });
    } else {
      // رسالة من طرف آخر → زيادة عداد الرسائل الغير مقروءة
      chat.unreadCount = (chat.unreadCount || 0) + 1;
    }

    // نقل الشات إلى أول القائمة
    this.myChats.splice(chatIndex, 1);
    this.myChats.unshift(chat);
  }

  // تشغيل صوت الرسائل
  this.audio.pause();
  this.audio.currentTime = 0;
  this.audio.play();
}


  /** 🟢 تحميل الأصدقاء المتصلين */
  loadOnlineFriends() {
    if (!this.userData?._id) return;
    this.UserService.getOnlineFriends({ userId: this.userData._id }).subscribe(
      (res: any) => {
        this.onlineFriends = res.onlineFriends;
      }
    );
  }

  sortChats(chats: any) {
    console.log(chats);
    this.myChats = chats

      .map((chat: any) => ({
        ...chat,
        participants: chat.participants.filter(
          (p: any) => p._id !== this.userData._id
        ),
      }))
      .sort((a: any, b: any) => {
        if (!a.lastMessage || !b.lastMessage) return 0;

        const dateA = new Date(`${a.lastMessage.date} ${a.lastMessage.time}`);
        const dateB = new Date(`${b.lastMessage.date} ${b.lastMessage.time}`);

        return dateB.getTime() - dateA.getTime();
      });
    if (this.theOpenedChatId) {
      let index = this.myChats.findIndex(
        (chat: any) => chat.participants[0]._id === this.theOpenedChatId._id
      );
      this.myChats[index].unreadCount = 0;
    }
  }

  getMyChats() {
    if (!this.userData?._id) return;
    this.UserService.getMyChats({ userId: this.userData._id }).subscribe(
      (res: any) => {
        this.myChats = res.chats;
      }
    );
  }

  openChat(i: number, data: any[]) {
    this.theChat = [];

    const myId = this.userData._id;
    const friendData = this.filteredFriends.length
      ? data[i] // من البحث
      : data[i].participants[0]; // من الشاتات القديمة


    this.UserService.getChat({ myId, friendId: friendData._id }).subscribe({
      next: (res: any) => {
        const chatData = res?.chat?.chat;
    this.theOpenedChatId = friendData;

        if (chatData) {
          // ✅ لو في محادثة سابقة
          this.theChat = chatData.messages.map(
            (msg: any, index: number, arr: any[]) => ({
              ...msg,
              showDivider: this.shouldShowDateDividerOnce(index, arr),
            })
          );

          setTimeout(() => this.scrollToBottom(true), 0);

          this.socketService.emit('markAsRead', {
            chatId: chatData._id,
            readerId: this.userData._id,
            friendId: friendData._id,
          });
          this.markMessagesAsRead();
        } else {
          // ✅ لو مافيش محادثة سابقة (من البحث مثلاً)
          this.theChat = [];
        }

        // ✅ في جميع الحالات، افتح واجهة المحادثة
        this.chat = '';
        this.searchStyle = 'd-none';
        this.friend = 'friend';
        this.chatItem = '';
        this.nameChat = friendData.userName;
        this.imgChat = friendData.profileImage;
      },
      error: (err) => console.error('Error loading chat:', err),
    });
  }

  markMessagesAsRead() {
    console.log('fg');

    this.UserService.markMessagesAsRead({
      chatId: this.theOpenedChatId?._id,
      userId: this.userData._id,
    }).subscribe({
      next: (res: any) => {
        console.log(res);

        if (res.success) {
          const chatIndex = this.myChats.findIndex(
            (c: any) => c.participants[0]._id === this.theOpenedChatId._id
          );

          if (chatIndex !== -1) {
            this.myChats[chatIndex].unreadCount = 0;
          }
        }
      },
      error: (err) => console.error('Error marking messages as read:', err),
    });
  }

  scrollToBottom(force: boolean = false): void {
    try {
      const container = this.chatContainer.nativeElement;
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        150;

      if (force || atBottom) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {}
  }

  closeChat() {
    this.friend = '';
    this.chat = 'chat';
    this.chatItem = 'd-none';
    this.theOpenedChatId = undefined;
  }

  Setting() {
    const isOpen = this.friend === 'friend';
    this.friend = isOpen ? '' : 'friend';
    this.settingStyle = isOpen ? 'd-none' : '';
  }

  toggleSettings() {
    const isSearchOpen = this.chat === 'd-none' && this.searchStyle === '';
    this.chat = isSearchOpen ? '' : 'd-none';
    this.searchStyle = isSearchOpen ? 'd-none' : '';
    this.friend = isSearchOpen ? '' : 'friend';
  }

  sendMessage() {
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

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.UserService.initChat(formData).subscribe({
      next: (res: any) => {
        console.log('✅ Message sent:', res);
        this.filePreview = null;
        this.selectedFile = null;
        this.cancelPreview()
        this.message = '';
        const newMsg = res.message;
      setTimeout(() => this.scrollToBottom(true), 0);

        // لو sendBy جاي ID نصي نحوله لكائن زي الباقي
        if (typeof newMsg.sendBy === 'string') {
          newMsg.sendBy = { _id: newMsg.sendBy };
        }

        if (typeof newMsg.sendTo === 'string') {
          newMsg.sendTo = { _id: newMsg.sendTo };
        }

        this.theChat.push(newMsg);
      },
      error: (err: any) => console.error('❌ Error sending message:', err),
    });
  }

  // متغير لتخزين رابط blob الأصلي للفيديو أثناء المعالجة
  videoBlobUrl: string | null = null;

  async onFileSelected(event: any) {
    this.cancelPreview()
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;
    this.fileName = file.name;
    const fileType = file.type;

    // 📸 الصور
    if (fileType.startsWith('image/')) {
      this.fileType = 'image';
      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview = this.sanitizer.bypassSecurityTrustUrl(
          reader.result as string
        );
      };
      reader.readAsDataURL(file);
    }

    // 🎥 الفيديوهات
    else if (fileType.startsWith('video/')) {
      const blobUrl = URL.createObjectURL(file);
      this.videoBlobUrl = blobUrl; // خزّن الرابط الأصلي
      const video = document.createElement('video');
      video.src = blobUrl;

      video.onloadedmetadata = () => {
        this.videoDuration = video.duration;

        if (video.duration > 600) {
          alert('❌ لا يمكن اختيار فيديو أطول من 10 دقائق.');
          URL.revokeObjectURL(blobUrl);
          this.videoBlobUrl = null;
          return;
        }

        this.fileType = 'video';

        if (video.duration > 30) {
          // فيديو طويل → قص
          this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(blobUrl);
          this.videoPreview = null;
          this.filePreview = null;
          this.trimStart = 0;
          this.trimEnd = video.duration;
        } else {
          // فيديو قصير → عرض مباشرة
          const safeBlob = this.sanitizer.bypassSecurityTrustUrl(blobUrl);
          this.videoUrl = safeBlob;
          this.videoPreview = safeBlob;
          this.filePreview = safeBlob;
        }
      };
    }

    // 📄 PDF
    else if (fileType === 'application/pdf') {
      this.fileType = 'pdf';
      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview = this.sanitizer.bypassSecurityTrustUrl(
          reader.result as string
        );
      };
      reader.readAsDataURL(file);
    }

    // ⚠️ غير مسموح
    else {
      alert('❌ Only images, short videos, or PDFs are allowed!');
      return;
    }
  }

  async confirmTrim() {
    if (!this.videoBlobUrl) {
      console.error('❌ رابط الفيديو الأصلي غير موجود!');
      return;
    }

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
    this.videoBlobUrl = blobUrl; // رابط الفيديو المقتص الجديد
    const safeBlob = this.sanitizer.bypassSecurityTrustUrl(blobUrl);

    // 🎬 خزن المعاينة للعرض
    this.videoPreview = safeBlob;
    this.filePreview = safeBlob;

    // 📦 خزن الملف النهائي لإرساله لاحقًا
    this.selectedFile = new File([trimmedBlob], 'trimmedVideo.webm', {
      type: 'video/webm',
    });

    // 🧹 نظف القديم
    this.videoUrl = null;
    this.videoDuration = 0;

    console.log(
      `✅ تم قص الفيديو من ${this.trimStart} إلى ${this.trimStart + duration}`
    );
  }

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

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        resolve(blob);
      };

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      };

      recorder.start();
      video.muted = true;
      video.play();

      const drawFrame = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (video.currentTime < start + duration && !video.ended) {
          requestAnimationFrame(drawFrame);
        }
      };

      drawFrame();

      setTimeout(() => {
        recorder.stop();
        video.pause();
video.muted = false;
      }, duration * 1000);
    });
  }

  cancelPreview() {
    try {
      if (this.videoBlobUrl) URL.revokeObjectURL(this.videoBlobUrl);
      this.videoBlobUrl = null;

      if (this.videoUrl && (this.videoUrl as string).startsWith('blob:'))
        URL.revokeObjectURL(this.videoUrl as string);
      if (
        this.videoPreview &&
        (this.videoPreview as string).startsWith('blob:')
      )
        URL.revokeObjectURL(this.videoPreview as string);
      if (this.filePreview && (this.filePreview as string).startsWith('blob:'))
        URL.revokeObjectURL(this.filePreview as string);
    } catch {}

    this.videoUrl = null;
    this.videoPreview = null;
    this.filePreview = null;
    this.fileType = null;
    this.selectedFile = null;
    this.fileName = null;
    this.videoDuration = 0;
  }

  /** 🔍 بحث عن الأصدقاء */
  searchFriends() {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredFriends = term
      ? this.userData.friends.filter((f: any) =>
          f.userName.toLowerCase().includes(term)
        )
      : [];
  }

  /** 📅 فاصل التاريخ */
  shouldShowDateDividerOnce(index: number, messages: any[]): boolean {
    if (index === 0) return true;
    const current = messages[index];
    const previous = messages[index - 1];
    if (!current?.date || !previous?.date) return false;

    const parseDate = (d: string) => {
      if (d.includes('/')) {
        const [day, month, year] = d.split('/');
        return new Date(+year, +month - 1, +day);
      }
      return new Date(d);
    };

    return (
      parseDate(current.date).toDateString() !==
      parseDate(previous.date).toDateString()
    );
  }

  /** 🗓️ تنسيق فاصل التاريخ */
  formatDateDivider(dateValue: any): string {
    if (!dateValue) return '';

    let date: Date;
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
      const [day, month, year] = dateValue.split('/');
      date = new Date(+year, +month - 1, +day);
    } else {
      date = new Date(dateValue);
    }

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

  /** ⏰ تنسيق الوقت */
  formatTime(value: any): string {
    if (!value) return '';

    if (value instanceof Date || !isNaN(Date.parse(value))) {
      const date = new Date(value);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }

    const [h, m] = value.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  }

  mediaViewer = { open: false, url: '', type: '' };

  openMediaViewer(url: string, type: string) {
    this.mediaViewer = { open: true, url, type };
  }

  closeMediaViewer() {
    this.mediaViewer.open = false;
  }
}
