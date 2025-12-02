'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Loader2,
  CheckCircle2,
  LogOut,
  Calendar as CalendarIcon,
  History,
  BookOpen,
  BarChart3,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BalanceCard } from '@/components/student/balance-card';
import { LessonHistory } from '@/components/student/lesson-history';
import { MaterialsList } from '@/components/student/materials-list';
import { StatsCard } from '@/components/student/stats-card';
import { generateICS, downloadICS } from '@/lib/ical';
import { toast } from 'sonner';
import type { Slot, Material } from '@/types';

import { User } from '@supabase/supabase-js';

export default function StudentDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [history, setHistory] = useState<Slot[]>([]);
  const router = useRouter();

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

  const fetchUserData = useCallback(async (userId: string) => {
    // Fetch Profile (Balance)
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profile) setBalance(profile.balance || 0);

    // Fetch Materials
    const { data: materialsData } = await supabase
      .from('materials')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (materialsData) setMaterials(materialsData);

    // Fetch History (All bookings)
    const { data: historyData } = await supabase
      .from('slots')
      .select('*')
      .eq('student_id', userId)
      .order('start_time', { ascending: false });

    if (historyData) setHistory(historyData);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
        fetchUserData(data.user.id);
      }
    });
  }, [router, fetchUserData]);

  useEffect(() => {
    if (date) {
      fetchSlots(date);
    }
  }, [date, fetchSlots]);

  const bookSlot = async (slotId: string) => {
    if (!user) return;

    if (balance <= 0) {
      toast.error('Недостаточно средств', {
        description: 'Пожалуйста, пополните баланс для записи.'
      });
      return;
    }

    const { error } = await supabase
      .from('slots')
      .update({ is_booked: true, student_id: user.id })
      .eq('id', slotId);

    if (error) {
      toast.error('Ошибка бронирования', { description: error.message });
    } else {
      toast.success('Вы записаны на урок!');
      // Decrement local balance for immediate feedback (optimistic update)
      setBalance((prev) => prev - 1);
      // Update DB balance
      await supabase
        .from('profiles')
        .update({ balance: balance - 1 })
        .eq('id', user.id);

      fetchSlots(date!);
      fetchUserData(user.id);
    }
  };

  const cancelBooking = async (slotId: string) => {
    if (!user) return;

    try {
      // 1. Fetch cancellation policy setting
      const { data: settingData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'cancellation_hours')
        .single();

      const cancellationHours = parseInt(settingData?.value || '24');

      // 2. Get slot details
      const { data: slot } = await supabase
        .from('slots')
        .select('start_time')
        .eq('id', slotId)
        .single();

      if (!slot) {
        toast.error('Слот не найден');
        return;
      }

      // 3. Check if cancellation is allowed
      const slotTime = new Date(slot.start_time);
      const now = new Date();
      const hoursUntilLesson = (slotTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilLesson < cancellationHours) {
        toast.error('Отмена невозможна', {
          description: `Урок можно отменить только за ${cancellationHours}+ часов до начала.`
        });
        return;
      }

      // 4. Cancel the booking
      const { error } = await supabase
        .from('slots')
        .update({
          is_booked: false,
          student_id: null,
          status: 'scheduled'
        })
        .eq('id', slotId);

      if (error) throw error;

      // 5. Refund balance
      setBalance((prev) => prev + 1);
      await supabase
        .from('profiles')
        .update({ balance: balance + 1 })
        .eq('id', user.id);

      toast.success('Урок отменен, баланс возвращен');
      fetchSlots(date!);
      fetchUserData(user.id);
    } catch (error) {
      toast.error('Ошибка отмены', { description: (error as Error).message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Личный Кабинет</h1>
            <p className="text-muted-foreground">Добро пожаловать, {user?.email}</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="hidden md:block">
              <BalanceCard balance={balance} />
            </div>
            <Button
              variant="outline"
              className="ml-auto md:ml-0"
              onClick={() => {
                supabase.auth.signOut();
                router.push('/');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Mobile Balance */}
        <div className="md:hidden">
          <BalanceCard balance={balance} />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="schedule">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Расписание
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              История
            </TabsTrigger>
            <TabsTrigger value="materials">
              <BookOpen className="mr-2 h-4 w-4" />
              Материалы
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="mr-2 h-4 w-4" />
              Статистика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-12">
              <Card className="md:col-span-5 lg:col-span-4 h-fit">
                <CardHeader>
                  <CardTitle>Календарь</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-0 pb-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                    locale={ru}
                  />
                </CardContent>
              </Card>

              <Card className="md:col-span-7 lg:col-span-8">
                <CardHeader>
                  <CardTitle>
                    Слоты на {date ? format(date, 'd MMMM', { locale: ru }) : '...'}
                  </CardTitle>
                  <CardDescription>Выберите время для занятия</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Нет доступных слотов на этот день.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>История занятий</CardTitle>
                <CardDescription>Ваши прошедшие и будущие уроки</CardDescription>
              </CardHeader>
              <CardContent>
                <LessonHistory bookings={history} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Учебные материалы</CardTitle>
                <CardDescription>Файлы и ссылки, назначенные преподавателем</CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialsList materials={materials} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <StatsCard
              totalCompleted={history.filter((h) => h.status === 'completed').length}
              totalMissed={history.filter((h) => h.status === 'missed').length}
              upcoming={
                history.filter((h) => new Date(h.start_time) > new Date() && h.is_booked).length
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>Экспорт в календарь</CardTitle>
                <CardDescription>
                  Загрузите ваше расписание для импорта в Google Calendar, iCal или другие календари
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    const upcomingBookings = history.filter(
                      (h) => new Date(h.start_time) > new Date() && h.is_booked
                    );
                    if (upcomingBookings.length === 0) {
                      toast.error('Нет предстоящих уроков для экспорта');
                      return;
                    }
                    const icsContent = generateICS(upcomingBookings);
                    downloadICS(icsContent, 'japan-school-lessons.ics');
                    toast.success('Файл календаря загружен!');
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать .ics файл
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
