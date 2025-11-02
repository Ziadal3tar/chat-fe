import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'messageTime',
  standalone: true
})
export class MessageTimePipe implements PipeTransform {

  transform(dateString: string, timeString?: string): string {
    if (!dateString) return '';

    let messageDate: Date;


    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      messageDate = new Date(+year, +month - 1, +day);
    } else {
      messageDate = new Date(dateString);
    }


    if (timeString) {
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      messageDate.setHours(hours, minutes, seconds);
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear();

    const isYesterday =
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear();

    if (isToday) {

      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {

      return messageDate.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }
}
