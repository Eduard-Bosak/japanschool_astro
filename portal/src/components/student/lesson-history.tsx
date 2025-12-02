'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Slot } from '@/types';

interface LessonHistoryProps {
  bookings: Slot[];
}

export function LessonHistory({ bookings }: LessonHistoryProps) {
  if (bookings.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">История посещений пуста</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Дата и Время</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead className="text-right">Дата записи</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => {
          const isPast = new Date(booking.start_time) < new Date();
          return (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                {format(new Date(booking.start_time), 'd MMMM yyyy, HH:mm', {
                  locale: ru
                })}
              </TableCell>
              <TableCell>
                {isPast ? (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Завершен
                  </Badge>
                ) : (
                  <Badge className="bg-green-600 hover:bg-green-700">Предстоит</Badge>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {format(new Date(booking.created_at), 'd.MM.yyyy')}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
