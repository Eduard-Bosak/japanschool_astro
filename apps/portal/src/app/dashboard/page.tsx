'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { format, isToday, isTomorrow } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import type { Slot, Material } from '@/types';
import { User } from '@supabase/supabase-js';

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [upcomingLessons, setUpcomingLessons] = useState<Slot[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoading(false);
      return;
    }

    setUser(authUser);

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, lessons_remaining')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name);
      setBalance(profile.lessons_remaining || 0);
    }

    // Fetch upcoming lessons (next 5)
    const { data: upcoming } = await supabase
      .from('slots')
      .select('*')
      .eq('student_id', authUser.id)
      .eq('is_booked', true)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5);

    setUpcomingLessons(upcoming || []);

    // Fetch recent materials (last 3)
    const { data: materials } = await supabase
      .from('materials')
      .select('*')
      .eq('student_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(3);

    setRecentMaterials(materials || []);

    // Fetch stats
    const { data: allBookings } = await supabase
      .from('slots')
      .select('status')
      .eq('student_id', authUser.id);

    if (allBookings) {
      setStats({
        completed: allBookings.filter((b) => b.status === 'completed').length,
        total: allBookings.length
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Сегодня';
    if (isTomorrow(date)) return 'Завтра';
    return format(date, 'd MMMM', { locale: ru });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Привет, {displayName || user?.email?.split('@')[0] || 'Ученик'}! 👋
        </h1>
        <p className="text-neutral-500">
          {upcomingLessons.length > 0
            ? `У вас ${upcomingLessons.length} предстоящих ${upcomingLessons.length === 1 ? 'урок' : upcomingLessons.length < 5 ? 'урока' : 'уроков'}`
            : 'Запишитесь на первый урок!'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/schedule">
          <Card className="!bg-white !border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded-lg text-neutral-900 group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-neutral-900">Записаться</p>
                <p className="text-xs text-neutral-500">на урок</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/history">
          <Card className="!bg-white !border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded-lg text-neutral-900 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-neutral-900">История</p>
                <p className="text-xs text-neutral-500">занятий</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/materials">
          <Card className="!bg-white !border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded-lg text-neutral-900 group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-neutral-900">Материалы</p>
                <p className="text-xs text-neutral-500">{recentMaterials.length} файлов</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="!bg-white !border-neutral-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm text-neutral-900">Пройдено</p>
              <p className="text-xs text-neutral-500">{stats.completed} уроков</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Lessons */}
        <Card className="!bg-white !border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-neutral-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-neutral-700" />
                Ближайшие уроки
              </CardTitle>
              <CardDescription className="text-neutral-500">
                {upcomingLessons.length > 0 ? 'Ваши записи' : 'Нет запланированных уроков'}
              </CardDescription>
            </div>
            <Link href="/dashboard/schedule">
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
              >
                Все <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingLessons.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                <p className="text-neutral-500 mb-4">Запишитесь на первый урок!</p>
                <Link href="/dashboard/schedule">
                  <Button className="bg-neutral-900 hover:bg-neutral-800 text-white">
                    Выбрать время
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingLessons.slice(0, 3).map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <div className="text-lg font-bold text-neutral-900">
                          {format(new Date(lesson.start_time), 'd')}
                        </div>
                        <div className="text-xs text-neutral-500 uppercase">
                          {format(new Date(lesson.start_time), 'MMM', { locale: ru })}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">
                          {getDateLabel(lesson.start_time)}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {format(new Date(lesson.start_time), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Записан
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Materials */}
        <Card className="!bg-white !border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-neutral-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-neutral-700" />
                Новые материалы
              </CardTitle>
              <CardDescription className="text-neutral-500">От преподавателя</CardDescription>
            </div>
            <Link href="/dashboard/materials">
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
              >
                Все <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentMaterials.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                <p className="text-neutral-500">Пока нет материалов</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMaterials.map((material) => (
                  <a
                    key={material.id}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-400 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-neutral-200 text-neutral-700">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-1">
                          {material.title}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {format(new Date(material.created_at), 'd MMM', { locale: ru })}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
