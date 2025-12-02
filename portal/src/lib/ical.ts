import type { Slot } from '@/types';

export function generateICS(bookings: Pick<Slot, 'id' | 'start_time'>[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Japan School//Student Cabinet//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  bookings.forEach((booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${booking.id}@japanschool.com`);
    lines.push(`DTSTAMP:${formatDate(new Date())}`);
    lines.push(`DTSTART:${formatDate(start)}`);
    lines.push(`DTEND:${formatDate(end)}`);
    lines.push('SUMMARY:Урок японского языка');
    lines.push('DESCRIPTION:Запланированный урок в Japan School');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

export function downloadICS(content: string, filename: string = 'lessons.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
