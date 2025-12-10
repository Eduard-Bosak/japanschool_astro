'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type JournalEntry = {
  id: string;
  start_time: string;
  student_id: string;
  status: string;
  profiles: {
    email: string;
    display_name: string | null;
  };
};

export default function JournalPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    // Fetch past bookings that are 'scheduled' (pending review)
    const { data, error } = await supabase
      .from('slots')
      .select(
        `
        id,
        start_time,
        student_id,
        status,
        profiles!slots_student_id_fkey (email, display_name)
      `
      )
      .eq('is_booked', true)
      .lt('start_time', new Date().toISOString()) // Past lessons
      .eq('status', 'scheduled') // Only pending ones
      .order('start_time', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки журнала', { description: error.message });
    } else {
      // Map the response to match JournalEntry type
      const formattedData = (data || []).map((item) => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) as JournalEntry[];
      setEntries(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const updateStatus = async (id: string, newStatus: string, studentId: string) => {
    try {
      // 1. Update slot status
      const { error: slotError } = await supabase
        .from('slots')
        .update({ status: newStatus })
        .eq('id', id);

      if (slotError) throw slotError;

      // 2. If canceled, refund balance
      if (newStatus === 'canceled_teacher' || newStatus === 'canceled_student') {
        // Fetch current balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', studentId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ balance: (profile.balance || 0) + 1 })
            .eq('id', studentId);
          toast.success('Урок отменен, баланс возвращен');
        }
      } else if (newStatus === 'completed') {
        toast.success('Урок отмечен как проведенный');
      } else if (newStatus === 'missed') {
        toast.success('Отмечен прогул (баланс не возвращен)');
      }

      // Refresh list
      fetchEntries();
    } catch (error) {
      toast.error('Ошибка обновления статуса', { description: (error as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Журнал посещаемости</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Неотмеченные уроки</CardTitle>
          <CardDescription>Прошедшие занятия, требующие подтверждения статуса.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500/20" />
              <p>Все прошедшие уроки проверены! 🎉</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата и Время</TableHead>
                  <TableHead>Ученик</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {format(new Date(entry.start_time), 'd MMMM, HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.profiles?.display_name || 'Без имени'}</p>
                        <p className="text-xs text-muted-foreground">{entry.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(entry.id, 'completed', entry.student_id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Был
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(entry.id, 'missed', entry.student_id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Прогул
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatus(entry.id, 'canceled_teacher', entry.student_id)
                          }
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Отмена (Возврат)
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
