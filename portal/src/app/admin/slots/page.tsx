'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type Slot = {
  id: string;
  start_time: string;
  is_booked: boolean;
  student_id: string | null;
};

export default function SlotsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка слотов при выборе даты
  useEffect(() => {
    if (date) {
      fetchSlots(date);
    }
  }, [date]);

  const fetchSlots = async (selectedDate: Date) => {
    setLoading(true);
    // Начало и конец дня
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

  const createSlot = async (hour: number) => {
    if (!date) return;

    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);

    // Конец слота (+1 час)
    const endDate = new Date(slotDate);
    endDate.setHours(hour + 1, 0, 0, 0);

    const { error } = await supabase.from('slots').insert({
      start_time: slotDate.toISOString(),
      end_time: endDate.toISOString()
    });

    if (error) {
      alert('Ошибка при создании слота: ' + error.message);
    } else {
      fetchSlots(date); // Обновить список
    }
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from('slots').delete().eq('id', id);
    if (error) {
      alert('Ошибка удаления: ' + error.message);
    } else {
      fetchSlots(date!);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Управление Слотами</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Календарь */}
        <Card>
          <CardHeader>
            <CardTitle>Выберите дату</CardTitle>
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

        {/* Список слотов */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Слоты на {date ? format(date, 'd MMMM yyyy', { locale: ru }) : '...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Быстрое создание */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
                  <Button key={hour} variant="outline" size="sm" onClick={() => createSlot(hour)}>
                    <Plus className="mr-1 h-3 w-3" />
                    {hour}:00
                  </Button>
                ))}
              </div>

              {/* Список существующих */}
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Нет слотов на этот день. Создайте новый!
                </p>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        slot.is_booked ? 'bg-green-50 border-green-200' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium text-lg">
                          {format(new Date(slot.start_time), 'HH:mm')}
                        </span>
                        {slot.is_booked ? (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            Забронировано
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                            Свободно
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteSlot(slot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
