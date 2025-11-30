'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Slot = {
  id: string;
  start_time: string;
  is_booked: boolean;
  student_id: string | null;
};

export default function StudentDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Получаем текущего юзера
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    });
  }, []);

  useEffect(() => {
    if (date) {
      fetchSlots(date);
    }
  }, [date]);

  const fetchSlots = async (selectedDate: Date) => {
    setLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching slots:', error);
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  const bookSlot = async (slotId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('slots')
      .update({ is_booked: true, student_id: user.id })
      .eq('id', slotId);

    if (error) {
      alert('Ошибка бронирования: ' + error.message);
    } else {
      alert('Вы успешно записались на урок!');
      fetchSlots(date!);
    }
  };

  const cancelBooking = async (slotId: string) => {
    const { error } = await supabase
      .from('slots')
      .update({ is_booked: false, student_id: null })
      .eq('id', slotId);

    if (error) {
      alert('Ошибка отмены: ' + error.message);
    } else {
      fetchSlots(date!);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Личный Кабинет</h1>
            <p className="text-muted-foreground">Запишитесь на урок японского языка</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              supabase.auth.signOut();
              router.push('/');
            }}
          >
            Выйти
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Календарь</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                locale={ru}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Расписание на {date ? format(date, 'd MMMM', { locale: ru }) : '...'}
              </CardTitle>
              <CardDescription>Выберите свободное время для занятия</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет доступных слотов на этот день.
                </div>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => {
                    const isMyBooking = slot.student_id === user?.id;
                    const isAvailable = !slot.is_booked;

                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isMyBooking
                            ? 'bg-green-50 border-green-200 shadow-sm'
                            : isAvailable
                              ? 'bg-white hover:border-primary/50 hover:shadow-md'
                              : 'bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`text-xl font-bold font-mono ${isMyBooking ? 'text-green-700' : ''}`}
                          >
                            {format(new Date(slot.start_time), 'HH:mm')}
                          </div>
                          {isMyBooking && (
                            <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Вы записаны
                            </span>
                          )}
                          {!isAvailable && !isMyBooking && (
                            <span className="text-xs text-muted-foreground">Занято</span>
                          )}
                        </div>

                        {isMyBooking ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => cancelBooking(slot.id)}
                          >
                            Отменить
                          </Button>
                        ) : isAvailable ? (
                          <Button size="sm" onClick={() => bookSlot(slot.id)}>
                            Записаться
                          </Button>
                        ) : (
                          <Button size="sm" disabled variant="secondary">
                            Занято
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
