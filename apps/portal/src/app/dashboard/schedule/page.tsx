'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Slot } from '@/types';
import { User } from '@supabase/supabase-js';

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [monthSlots, setMonthSlots] = useState<
    { start_time: string; is_booked: boolean; student_id: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);

  const fetchSlots = useCallback(async (selectedDate: Date) => {
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
  }, []);

  const fetchMonthSlots = useCallback(async (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const { data } = await supabase
      .from('slots')
      .select('start_time, is_booked, student_id')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString());

    setMonthSlots(data || []);
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profile) setBalance(profile.balance || 0);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        fetchUserData(data.user.id);
      }
    });
  }, [fetchUserData]);

  useEffect(() => {
    if (date) {
      fetchSlots(date);
    }
  }, [date, fetchSlots]);

  useEffect(() => {
    fetchMonthSlots(currentMonth);
  }, [currentMonth, fetchMonthSlots]);

  const bookSlot = async (slotId: string) => {
    if (!user) return;

    if (balance <= 0) {
      toast.error('Недостаточно уроков', {
        description: 'Пожалуйста, обратитесь к преподавателю для пополнения баланса.'
      });
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Ошибка бронирования', { description: data.error });
        return;
      }

      toast.success('Вы записаны на урок!', {
        description: `${format(new Date(slots.find((s) => s.id === slotId)?.start_time || ''), 'd MMMM в HH:mm', { locale: ru })}`
      });
      setBalance(data.lessonsRemaining);
      fetchSlots(date!);
      fetchMonthSlots(currentMonth);
    } catch (error) {
      toast.error('Ошибка бронирования', { description: (error as Error).message });
    }
  };

  const cancelBooking = async (slotId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Ошибка отмены', { description: data.error });
        return;
      }

      if (data.lessonReturned) {
        toast.success('Урок отменён', { description: 'Урок возвращён на ваш баланс' });
        fetchUserData(user.id);
      } else {
        toast.warning('Урок отменён', {
          description: 'Урок не возвращён (отмена менее чем за 24 часа)'
        });
      }

      fetchSlots(date!);
      fetchMonthSlots(currentMonth);
    } catch (error) {
      toast.error('Ошибка отмены', { description: (error as Error).message });
    }
  };

  // Get days with available/booked slots for calendar highlighting
  const getDayClass = (day: Date) => {
    const daySlots = monthSlots.filter((s) => isSameDay(new Date(s.start_time), day));
    if (daySlots.length === 0) return '';

    const hasMyBooking = daySlots.some((s) => s.student_id === user?.id);
    const hasAvailable = daySlots.some((s) => !s.is_booked);

    if (hasMyBooking) return 'bg-green-500 text-white rounded-full';
    if (hasAvailable) return 'bg-amber-500 text-white rounded-full';
    return 'bg-slate-600 text-white rounded-full';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-2">
        <h1 className="text-lg font-bold text-neutral-900">Расписание</h1>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 flex-1 min-h-0">
        {/* Calendar Card */}
        <Card className="!bg-white !border-neutral-200 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-neutral-900 text-base">Календарь</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                onClick={() => {
                  const prev = new Date(currentMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setCurrentMonth(prev);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center text-neutral-700">
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                onClick={() => {
                  const next = new Date(currentMonth);
                  next.setMonth(next.getMonth() + 1);
                  setCurrentMonth(next);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={ru}
              className="rounded-md w-full [&_.rdp-day]:text-neutral-900 [&_.rdp-day]:font-medium [&_.rdp-day_button]:text-neutral-900 [&_.rdp-day_button:hover]:bg-neutral-200 [&_.rdp-day_button.rdp-day_selected]:bg-neutral-900 [&_.rdp-day_button.rdp-day_selected]:text-white [&_.rdp-head_cell]:text-neutral-600 [&_.rdp-head_cell]:font-semibold [&_.rdp-day_outside]:text-neutral-400 [&_.rdp-nav_button]:text-neutral-700 [&_.rdp-caption]:text-neutral-900"
              modifiers={{
                hasSlots: (day) => {
                  const daySlots = monthSlots.filter((s) => isSameDay(new Date(s.start_time), day));
                  return daySlots.length > 0;
                }
              }}
              modifiersClassNames={{
                hasSlots: 'font-bold'
              }}
            />
            <div className="mt-2 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-900" />
                <span className="text-neutral-500">Есть слоты</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-neutral-500">Вы записаны</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slots Card */}
        <Card className="!bg-white !border-neutral-200 shadow-sm flex flex-col overflow-hidden">
          <CardHeader className="py-3 flex-shrink-0">
            <CardTitle className="text-neutral-900 text-base">
              Слоты на {date ? format(date, 'd MMMM', { locale: ru }) : '...'}
            </CardTitle>
            <CardDescription className="text-neutral-500 text-sm">Выберите время</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-sm">Нет доступных слотов</div>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => {
                  const isMyBooking = slot.student_id === user?.id;
                  const isAvailable = !slot.is_booked;

                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isMyBooking
                          ? 'bg-green-50 border-green-300'
                          : isAvailable
                            ? 'bg-white border-neutral-300 hover:border-neutral-500 hover:shadow-sm'
                            : 'bg-neutral-100 border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`text-lg font-bold font-mono ${isMyBooking ? 'text-green-700' : isAvailable ? 'text-neutral-900' : 'text-neutral-500'}`}
                        >
                          {format(new Date(slot.start_time), 'HH:mm')}
                        </div>
                        {isMyBooking && (
                          <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Записан
                          </span>
                        )}
                        {!isAvailable && !isMyBooking && (
                          <span className="text-xs font-medium text-neutral-500">Занято</span>
                        )}
                      </div>

                      {isMyBooking ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                          onClick={() => cancelBooking(slot.id)}
                        >
                          Отменить
                        </Button>
                      ) : isAvailable ? (
                        <Button
                          size="sm"
                          className="bg-neutral-900 hover:bg-neutral-800 text-white h-7 px-3 text-xs"
                          onClick={() => bookSlot(slot.id)}
                        >
                          Записаться
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled
                          className="bg-neutral-200 text-neutral-400 h-7 px-2 text-xs"
                        >
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
  );
}
