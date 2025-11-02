import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { filter, Subject, Subscription, take, takeUntil } from 'rxjs';
import { ShareFunctionsService } from './../../services/share-functions.service';
import { UserService } from './../../services/user.service';
import { SocketService } from 'src/app/services/socket.service';
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

  constructor(
    private elem: ElementRef,
    private shareFunctions: ShareFunctionsService,
    private socketService: SocketService,
    private UserService: UserService
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
      (chat: any) => chat.participants[0]._id === data.message.sendBy
    );
    if (data.message.sendBy === this.theOpenedChatId?._id) {
      const readMessage = { ...data.message, isRead: true };
      this.theChat.push(readMessage);

      const chatIndex = this.myChats.findIndex(
        (c: any) => c._id === data.chatId
      );

      if (chatIndex !== -1) {
        // ✅ حدث الرسالة بالكامل كآخر رسالة
        this.myChats[chatIndex].lastMessage = readMessage;

        // ✅ خليه يطلع في أول الشات (زي في else)
        const chat = this.myChats.splice(chatIndex, 1)[0];
        this.myChats.unshift(chat);

        // ✅ تأكد إن عداد الرسائل الغير مقروءة صفر
        this.myChats[0].unreadCount = 0;
      }

      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.play();

      // ✅ إشعار السيرفر بالقراءة
      this.socketService.emit('markAsRead', {
        chatId: data.chatId,
        readerId: this.userData._id,
        friendId: this.theOpenedChatId._id,
      });
    } else {
      if (chatIndex !== -1) {
        const chat = this.myChats[chatIndex];
        chat.lastMessage = data.message;
        this.myChats.splice(chatIndex, 1);
        this.myChats.unshift(chat);
      }

      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.play();
      this.sortChats(this.myChats);

      let index = this.myChats.findIndex(
        (chat: any) => chat._id === data.chatId
      );
      this.myChats[index].unreadCount++;
    }
  }

  /** 🟢 تحميل الأصدقاء المتصلين */
  loadOnlineFriends() {
    if (!this.userData?._id) return;
    this.UserService
      .getOnlineFriends({ userId: this.userData._id })
      .subscribe((res: any) => {
        this.onlineFriends = res.onlineFriends;
      });
  }

  sortChats(chats: any) {
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
    this.UserService
      .getMyChats({ userId: this.userData._id })
      .subscribe((res: any) => {
        this.myChats = res.chats;
      });
  }

  openChat(i: number, data: any[]) {
    this.theChat = [];

    const myId = this.userData._id;
    const friendData = this.filteredFriends.length
      ? data[i]
      : data[i].participants[0];
    this.theOpenedChatId = friendData;

    this.UserService.getChat({ myId, friendId: friendData._id }).subscribe({
      next: (res: any) => {
        const chatData = res?.chat?.chat;
        if (chatData) {
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

          this.chat = '';
          this.searchStyle = 'd-none';
          this.friend = 'friend';
          this.chatItem = '';
          this.nameChat = friendData.userName;
          this.imgChat = friendData.profileImage;
        }
      },
      error: (err) => console.error('Error loading chat:', err),
    });
  }

  markMessagesAsRead() {
    console.log('fg');

    this.UserService
      .markMessagesAsRead({
        chatId: this.theOpenedChatId?._id,
        userId: this.userData._id,
      })
      .subscribe({
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

  sendMessage(): void {
    const content = this.message.trim();
    if (!content) return;

    const now = new Date();
    const messageData = {
      sendBy: this.userData._id,
      sendTo: this.theOpenedChatId._id,
      content,
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('en-US', { hour12: false }),
    };

    this.theChat.push({
      sendBy: { _id: this.userData._id },
      sendTo: { _id: this.theOpenedChatId._id },
      content,
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('en-US', { hour12: false }),
      isRead: false,
    });
    this.message = '';
    const chatIndex = this.myChats.findIndex(
      (chat: any) => chat.participants[0]._id === this.theOpenedChatId._id
    );
    if (chatIndex !== -1) {
      const chat = this.myChats[chatIndex];
      chat.lastMessage = messageData;
      this.myChats.splice(chatIndex, 1);
      this.myChats.unshift(chat);
    }

    this.UserService.initChat(messageData).subscribe({
      next: (res: any) => {
        if (res?.message && res?.chatId) {
          const chatIndex = this.myChats.findIndex(
            (chat: any) => chat._id === res.chatId
          );
          if (chatIndex !== -1) {
            this.myChats[chatIndex].lastMessage = res.message;
          }
        }
      },
      error: (err) => console.error('Error saving message:', err),
    });
    setTimeout(() => this.scrollToBottom(true), 0);
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
}
