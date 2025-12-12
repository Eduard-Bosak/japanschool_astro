'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingChart } from '@/components/admin/booking-chart';
import { PopularTimeChart } from '@/components/admin/popular-time-chart';
import { SeasonThemeCard } from '@/components/admin/season-theme-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, CheckCircle, Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DashboardStats, RecentBooking, BookingChartData, PopularTimeData } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeSlots: 0,
    totalBookings: 0,
    completedLessons: 0,
    missedLessons: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [upcomingSlots, setUpcomingSlots] = useState<
    { id: string; start_time: string; profiles?: { email: string }[] | { email: string } | null }[]
  >([]);
  const [chartData, setChartData] = useState<BookingChartData[]>([]);
  const [popularTimeData, setPopularTimeData] = useState<PopularTimeData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    // 1. Total Students
    const { count: studentsCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // 2. Active Slots (Future slots)
    const { count: activeSlotsCount } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', new Date().toISOString());

    // 3. Total Bookings (All time)
    const { count: bookingsCount } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('is_booked', true);

    // 4. Completed Lessons
    const { count: completedCount } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // 5. Missed Lessons
    const { count: missedCount } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'missed');

    setStats({
      totalStudents: studentsCount || 0,
      activeSlots: activeSlotsCount || 0,
      totalBookings: bookingsCount || 0,
      completedLessons: completedCount || 0,
      missedLessons: missedCount || 0
    });
  }, []);

  const fetchRecentBookings = useCallback(async () => {
    const { data: recentSlots } = await supabase
      .from('slots')
      .select(
        `
        id,
        start_time,
        created_at,
        profiles!slots_student_id_fkey (email)
      `
      )
      .eq('is_booked', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentSlots) {
      const formattedBookings = recentSlots.map((slot) => {
        const profiles = slot.profiles as { email: string }[] | { email: string } | null;
        const email = Array.isArray(profiles) ? profiles[0]?.email : profiles?.email;
        return {
          id: slot.id,
          start_time: slot.start_time,
          student_email: email || 'Неизвестно',
          created_at: slot.created_at
        };
      });
      setRecentBookings(formattedBookings);
    }
  }, []);

  const fetchUpcomingSlots = useCallback(async () => {
    const { data: upcoming } = await supabase
      .from('slots')
      .select(
        `
        id,
        start_time,
        profiles!slots_student_id_fkey (email)
      `
      )
      .eq('is_booked', true)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5);

    setUpcomingSlots(upcoming || []);
  }, []);

  const fetchChartData = useCallback(async () => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const { data: slots } = await supabase
      .from('slots')
      .select('start_time, is_booked')
      .gte('start_time', last7Days[0])
      .lte('start_time', new Date(today.setDate(today.getDate() + 1)).toISOString());

    if (slots) {
      const data = last7Days.map((date) => {
        const daySlots = slots.filter((s) => s.start_time.startsWith(date));
        const booked = daySlots.filter((s) => s.is_booked).length;
        const free = daySlots.filter((s) => !s.is_booked).length;
        return {
          date: format(new Date(date), 'dd MMM', { locale: ru }),
          total: booked + free,
          booked,
          free
        };
      });
      setChartData(data);
    }
  }, []);

  const fetchPopularTimeData = useCallback(async () => {
    const { data: slots } = await supabase
      .from('slots')
      .select('start_time')
      .eq('is_booked', true)
      .limit(500);

    if (slots) {
      const hourCounts: Record<string, number> = {};

      for (let i = 10; i <= 20; i++) {
        hourCounts[`${i}:00`] = 0;
      }

      slots.forEach((slot) => {
        const date = new Date(slot.start_time);
        const hour = date.getHours();
        const key = `${hour}:00`;
        if (hourCounts[key] !== undefined) {
          hourCounts[key]++;
        }
      });

      const chartData = Object.entries(hourCounts).map(([hour, count]) => ({
        hour,
        count
      }));

      setPopularTimeData(chartData);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchRecentBookings(),
        fetchUpcomingSlots(),
        fetchChartData(),
        fetchPopularTimeData()
      ]);
      setLoading(false);
    };
    loadData();
  }, [
    fetchDashboardData,
    fetchRecentBookings,
    fetchUpcomingSlots,
    fetchChartData,
    fetchPopularTimeData
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatsCard
          title="Всего учеников"
          value={stats.totalStudents}
          icon={Users}
          description="Активных пользователей"
        />
        <StatsCard
          title="Активные слоты"
          value={stats.activeSlots}
          icon={Calendar}
          description="Доступно для записи"
        />
        <StatsCard
          title="Всего записей"
          value={stats.totalBookings}
          icon={CheckCircle}
          description="За все время"
        />
        <StatsCard
          title="Проведено"
          value={stats.completedLessons}
          icon={CheckCircle}
          description="Уроков проведено"
        />
        <StatsCard
          title="Пропущено"
          value={stats.missedLessons}
          icon={Activity}
          description="Уроков пропущено"
        />
      </div>

      {/* Season Theme Card */}
      <SeasonThemeCard />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <BookingChart data={chartData} />
        </div>
        <div className="col-span-3">
          <PopularTimeChart data={popularTimeData} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Недавние Записи</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет записей на уроки.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ученик</TableHead>
                    <TableHead>Время урока</TableHead>
                    <TableHead>Записался</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.student_email}</TableCell>
                      <TableCell>
                        {format(new Date(booking.start_time), 'd MMMM, HH:mm', { locale: ru })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(booking.created_at), 'd MMM, HH:mm', { locale: ru })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ближайшие Уроки</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет запланированных уроков.</p>
            ) : (
              <div className="space-y-3">
                {upcomingSlots.map((slot) => {
                  const profiles = slot.profiles;
                  const email = Array.isArray(profiles) ? profiles[0]?.email : profiles?.email;
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{email || 'Неизвестно'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(slot.start_time), 'EEEE, d MMMM', { locale: ru })}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {format(new Date(slot.start_time), 'HH:mm')}
                      </Badge>
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

function StatsCard({
  title,
  value,
  icon: Icon,
  description
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
