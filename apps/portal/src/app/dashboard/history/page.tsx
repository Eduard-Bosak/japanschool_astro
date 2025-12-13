'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, Calendar, CheckCircle2, XCircle, Clock, Download, Filter } from 'lucide-react';
import type { Slot } from '@/types';
import { generateICS, downloadICS } from '@/lib/ical';
import { toast } from 'sonner';

type FilterType = 'all' | 'upcoming' | 'completed' | 'missed';

export default function HistoryPage() {
  const [history, setHistory] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('slots')
      .select('*')
      .eq('student_id', user.id)
      .order('start_time', { ascending: false });

    setHistory(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = history.filter((slot) => {
    const now = new Date();
    const slotTime = new Date(slot.start_time);

    switch (filter) {
      case 'upcoming':
        return slotTime > now;
      case 'completed':
        return slot.status === 'completed';
      case 'missed':
        return slot.status === 'missed';
      default:
        return true;
    }
  });

  const getStatusBadge = (slot: Slot) => {
    const now = new Date();
    const slotTime = new Date(slot.start_time);

    if (slotTime > now) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Предстоит
        </Badge>
      );
    }

    if (slot.status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Завершён
        </Badge>
      );
    }

    if (slot.status === 'missed') {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Пропущен
        </Badge>
      );
    }

    return (
      <Badge className="bg-neutral-100 text-neutral-600 border-neutral-200">
        <Clock className="w-3 h-3 mr-1" />
        Ожидание
      </Badge>
    );
  };

  const exportToCalendar = () => {
    const upcoming = history.filter((h) => new Date(h.start_time) > new Date());
    if (upcoming.length === 0) {
      toast.error('Нет предстоящих уроков для экспорта');
      return;
    }
    const icsContent = generateICS(upcoming);
    downloadICS(icsContent, 'japan-school-lessons.ics');
    toast.success('Календарь загружен!');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">История занятий</h1>
          <p className="text-neutral-500">Ваши прошедшие и предстоящие уроки</p>
        </div>
        <Button
          onClick={exportToCalendar}
          className="bg-neutral-900 hover:bg-neutral-800 text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Экспорт в календарь
        </Button>
      </div>

      {/* Filters */}
      <Card className="!bg-white !border-neutral-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Все' },
              { value: 'upcoming', label: 'Предстоящие' },
              { value: 'completed', label: 'Завершённые' },
              { value: 'missed', label: 'Пропущенные' }
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(item.value as FilterType)}
                className={
                  filter === item.value
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card className="!bg-white !border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-neutral-700" />
            Занятия ({filteredHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              {filter === 'all'
                ? 'У вас пока нет записей на занятия'
                : 'Нет занятий с выбранным фильтром'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-neutral-900">
                        {format(new Date(slot.start_time), 'd')}
                      </div>
                      <div className="text-xs text-neutral-500 uppercase">
                        {format(new Date(slot.start_time), 'MMM', { locale: ru })}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">
                        {format(new Date(slot.start_time), 'EEEE', { locale: ru })}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {format(new Date(slot.start_time), 'HH:mm')} -{' '}
                        {format(
                          new Date(new Date(slot.start_time).getTime() + 60 * 60 * 1000),
                          'HH:mm'
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(slot)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
