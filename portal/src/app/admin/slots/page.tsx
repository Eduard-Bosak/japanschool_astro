'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Dialog } from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, FileDown, CalendarDays, CalendarRange } from 'lucide-react';
import { logActivity } from '@/lib/activity-logger';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SlotGeneratorDialog } from '@/components/admin/slot-generator-dialog';
import type { Slot } from '@/types';

export default function SlotsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [monthSlots, setMonthSlots] = useState<Slot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (date) {
      if (viewMode === 'day') {
        fetchSlots(date);
      } else {
        fetchMonthSlots(date);
      }
    }
  }, [date, viewMode]);

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

  const fetchMonthSlots = async (selectedDate: Date) => {
    setLoading(true);
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .gte('start_time', monthStart.toISOString())
      .lte('start_time', monthEnd.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching month slots:', error);
    } else {
      setMonthSlots(data || []);
    }
    setLoading(false);
  };

  const createSlot = async (hour: number) => {
    if (!date) return;

    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);

    const endDate = new Date(slotDate);
    endDate.setHours(hour + 1, 0, 0, 0);

    const { data, error } = await supabase
      .from('slots')
      .insert({
        start_time: slotDate.toISOString(),
        end_time: endDate.toISOString()
      })
      .select(); // Add .select() to return the inserted data

    if (error) {
      toast.error('Ошибка при создании слота', {
        description: error.message
      });
    } else {
      toast.success('Слот создан!', {
        description: `На ${format(slotDate, 'HH:mm, d MMMM', { locale: ru })}`
      });
      await logActivity('Слот создан', 'slot', data?.[0]?.id, {
        time: format(slotDate, 'HH:mm, d MMMM', { locale: ru })
      });
      fetchSlots(date);
    }
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from('slots').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления', {
        description: error.message
      });
    } else {
      toast.success('Слот удален');
      if (viewMode === 'day') {
        fetchSlots(date!);
      } else {
        fetchMonthSlots(date!);
      }
    }
  };

  const toggleSlotSelection = (slotId: string) => {
    setSelectedSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slotId)) {
        newSet.delete(slotId);
      } else {
        newSet.add(slotId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSlots.size === slots.length) {
      setSelectedSlots(new Set());
    } else {
      setSelectedSlots(new Set(slots.map((s) => s.id)));
    }
  };

  const deleteSelectedSlots = async () => {
    const slotsToDelete = Array.from(selectedSlots);

    const { error } = await supabase.from('slots').delete().in('id', slotsToDelete);

    if (error) {
      toast.error('Ошибка удаления', {
        description: error.message
      });
    } else {
      toast.success(`Удалено слотов: ${slotsToDelete.length}`);
      setSelectedSlots(new Set());
      if (viewMode === 'day') {
        fetchSlots(date!);
      } else {
        fetchMonthSlots(date!);
      }
    }
  };

  const getSlotCountForDay = (day: Date) => {
    return monthSlots.filter((slot) => isSameDay(new Date(slot.start_time), day)).length;
  };

  const getBookedCountForDay = (day: Date) => {
    return monthSlots.filter((slot) => isSameDay(new Date(slot.start_time), day) && slot.is_booked)
      .length;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add font support for Cyrillic (using a standard font that supports it or just transliteration for now as a basic step)
    // Note: For full Cyrillic support in jsPDF, we'd need to add a custom font.
    // For this iteration, we'll use a simple approach or English headers where possible,
    // but since the UI is Russian, we might see encoding issues without a custom font.
    // To avoid complexity of base64 fonts right now, we will try to use standard font and see.
    // Actually, standard jsPDF fonts don't support Cyrillic.
    // We will use a workaround or just English for the PDF to ensure it works,
    // or we can try to add a font if needed.
    // Let's stick to a simple export first.

    doc.setFontSize(18);
    doc.text('Schedule Export', 14, 22);

    // Using 'slots' for the current day's view as 'filteredSlots' was not defined.
    // The 'profiles?.email' part is also not available in the current Slot type,
    // so using 'student_id' instead.
    const tableData = slots.map((slot) => [
      format(new Date(slot.start_time), 'yyyy-MM-dd HH:mm'),
      slot.is_booked ? 'Booked' : 'Free',
      slot.student_id || '-' // Using student_id as profiles.email is not available
    ]);

    (
      doc as unknown as {
        autoTable: (options: { head: string[][]; body: string[][]; startY: number }) => void;
      }
    ).autoTable({
      head: [['Date & Time', 'Status', 'Student']],
      body: tableData,
      startY: 30
    });

    doc.save('schedule.pdf');
    toast.success('Расписание экспортировано');
  };

  const handleSlotsGenerated = () => {
    if (viewMode === 'day') {
      fetchSlots(date || new Date());
    } else {
      fetchMonthSlots(date || new Date());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Управление Слотами</h2>
        <div className="flex items-center gap-2">
          <SlotGeneratorDialog onSlotsGenerated={handleSlotsGenerated} />
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            {/* ... existing dialog trigger ... */}
          </Dialog>
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            onClick={() => setViewMode('day')}
            size="sm"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            День
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
            size="sm"
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            Месяц
          </Button>
        </div>
      </div>

      {viewMode === 'day' ? (
        // День - как было
        <div className="grid gap-6 md:grid-cols-2">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Слоты на {date ? format(date, 'd MMMM yyyy', { locale: ru }) : '...'}
              </CardTitle>
              {slots.length > 0 && (
                <div className="flex gap-2 items-center">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAllSlots"
                      checked={selectedSlots.size === slots.length && slots.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <label
                      htmlFor="selectAllSlots"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Выбрать все
                    </label>
                  </div>
                  {selectedSlots.size > 0 && (
                    <Button size="sm" variant="destructive" onClick={deleteSelectedSlots}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить ({selectedSlots.size})
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-6">
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
                    <Button key={hour} variant="outline" size="sm" onClick={() => createSlot(hour)}>
                      <Plus className="mr-1 h-3 w-3" />
                      {hour}:00
                    </Button>
                  ))}
                </div>

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
                    <div className="text-xs text-muted-foreground text-right mb-2">
                      Время указано в вашем часовом поясе (
                      {Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </div>
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          slot.is_booked
                            ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                            : 'bg-secondary/50 border-border hover:bg-secondary/80'
                        }`}
                      >
                        <Checkbox
                          checked={selectedSlots.has(slot.id)}
                          onCheckedChange={() => toggleSlotSelection(slot.id)}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-mono font-medium text-lg">
                            {format(new Date(slot.start_time), 'HH:mm')}
                          </span>
                          {slot.is_booked ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              Забронировано
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Свободно</Badge>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
                              <AlertDialogDescription>
                                Вы уверены, что хотите удалить слот на{' '}
                                <strong>
                                  {format(new Date(slot.start_time), 'HH:mm, d MMMM', {
                                    locale: ru
                                  })}
                                </strong>
                                ?
                                {slot.is_booked && (
                                  <span className="block mt-2 text-red-600 font-semibold">
                                    ⚠️ Этот слот уже забронирован!
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSlot(slot.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Месяц - новый вид
        <Card>
          <CardHeader>
            <CardTitle>
              Обзор слотов за {date ? format(date, 'LLLL yyyy', { locale: ru }) : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                locale={ru}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-sm text-muted-foreground p-2"
                  >
                    {day}
                  </div>
                ))}

                {date &&
                  eachDayOfInterval({
                    start: startOfMonth(date),
                    end: endOfMonth(date)
                  }).map((day) => {
                    const totalSlots = getSlotCountForDay(day);
                    const bookedSlots = getBookedCountForDay(day);
                    const freeSlots = totalSlots - bookedSlots;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`
                        min-h-[80px] p-2 border rounded-lg
                        ${isSameDay(day, new Date()) ? 'bg-primary/5 border-primary' : 'bg-background'}
                        ${totalSlots > 0 ? 'cursor-pointer hover:bg-accent' : ''}
                      `}
                        onClick={() => {
                          if (totalSlots > 0) {
                            setDate(day);
                            setViewMode('day');
                          }
                        }}
                      >
                        <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                        {totalSlots > 0 && (
                          <div className="space-y-1">
                            {freeSlots > 0 && (
                              <div className="text-xs bg-zinc-800 text-zinc-100 px-2 py-1 rounded border border-zinc-700 font-medium shadow-sm">
                                {freeSlots} св.
                              </div>
                            )}
                            {bookedSlots > 0 && (
                              <div className="text-xs bg-green-900/80 text-green-100 px-2 py-1 rounded border border-green-800 font-medium shadow-sm">
                                {bookedSlots} зан.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
