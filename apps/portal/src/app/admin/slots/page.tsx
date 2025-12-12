'use client';

import { useState, useEffect, useRef } from 'react';
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
import {
  Loader2,
  Plus,
  Trash2,
  FileDown,
  CalendarDays,
  CalendarRange,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'free' | 'booked' | 'completed' | 'missed'
  >('all');

  // Track previous date to prevent duplicate fetches
  const prevDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (date) {
      const dateKey = `${date.toDateString()}-${viewMode}`;
      // Skip if same date/mode was already fetched
      if (prevDateRef.current === dateKey) return;
      prevDateRef.current = dateKey;

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
      .select(
        `
        *,
        student:profiles!student_id (
          email,
          display_name
        )
      `
      )
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
      .select(
        `
        *,
        student:profiles!student_id (
          email,
          display_name
        )
      `
      )
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
    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Ошибка удаления', {
          description: data.error
        });
        return;
      }

      toast.success('Слот удален', {
        description: data.message
      });

      if (viewMode === 'day') {
        fetchSlots(date!);
      } else {
        fetchMonthSlots(date!);
      }
    } catch (error) {
      console.error('Delete slot error:', error);
      toast.error('Ошибка удаления слота');
    }
  };

  const updateSlotStatus = async (id: string, status: 'completed' | 'missed') => {
    try {
      const response = await fetch(`/api/slots/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Ошибка', { description: data.error });
        return;
      }

      toast.success(status === 'completed' ? 'Занятие проведено ✓' : 'Занятие пропущено ✗');

      if (viewMode === 'day') {
        fetchSlots(date!);
      } else {
        fetchMonthSlots(date!);
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Ошибка обновления статуса');
    }
  };

  const bulkUpdateStatus = async (status: 'completed' | 'missed') => {
    if (selectedSlots.size === 0) return;

    const slotsToUpdate = Array.from(selectedSlots);

    try {
      // Update all selected slots in parallel
      await Promise.all(
        slotsToUpdate.map((id) =>
          fetch(`/api/slots/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          })
        )
      );

      toast.success(
        status === 'completed'
          ? `${slotsToUpdate.length} занятий отмечено проведёнными ✓`
          : `${slotsToUpdate.length} занятий отмечено пропущенными`
      );

      setSelectedSlots(new Set());

      if (viewMode === 'day') {
        fetchSlots(date!);
      } else {
        fetchMonthSlots(date!);
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Ошибка массового обновления');
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

    try {
      // Delete all selected slots in parallel using API
      const results = await Promise.all(
        slotsToDelete.map((id) =>
          fetch(`/api/slots/${id}`, {
            method: 'DELETE'
          }).then((res) => res.json())
        )
      );

      const failed = results.filter((r) => !r.success);

      if (failed.length > 0) {
        toast.error(`Ошибка удаления ${failed.length} слотов`);
      } else {
        toast.success(`Удалено слотов: ${slotsToDelete.length}`);
      }

      setSelectedSlots(new Set());

      if (viewMode === 'day') {
        fetchSlots(date!);
      } else {
        fetchMonthSlots(date!);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Ошибка массового удаления');
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
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Выберите дату
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ru}
                className="rounded-xl border shadow-sm bg-card p-4"
                classNames={{
                  months: 'flex flex-col',
                  month: 'space-y-4',
                  caption: 'flex justify-center pt-1 relative items-center mb-4',
                  caption_label: 'text-base font-semibold',
                  nav: 'space-x-1 flex items-center',
                  nav_button:
                    'h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-muted rounded-md transition-all',
                  table: 'w-full border-collapse',
                  head_row: 'flex',
                  head_cell: 'text-muted-foreground w-10 font-normal text-xs',
                  row: 'flex w-full mt-1',
                  cell: 'relative p-0 text-center',
                  day: 'h-10 w-10 p-0 font-normal text-sm rounded-md text-foreground hover:bg-primary/15 hover:text-primary transition-colors',
                  day_selected: 'bg-muted text-foreground font-medium',
                  day_today:
                    'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30',
                  day_outside: 'text-muted-foreground/40',
                  day_disabled: 'text-muted-foreground/30'
                }}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
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
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => bulkUpdateStatus('completed')}
                        className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Проведено ({selectedSlots.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => bulkUpdateStatus('missed')}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Пропущено ({selectedSlots.size})
                      </Button>
                      <Button size="sm" variant="destructive" onClick={deleteSelectedSlots}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить ({selectedSlots.size})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Time slot creation buttons */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-dashed border-primary/20">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Быстрое создание слота
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
                      <Button
                        key={hour}
                        variant="outline"
                        size="sm"
                        onClick={() => createSlot(hour)}
                        className="group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-150"
                      >
                        <Plus className="mr-1 h-3 w-3 transition-transform duration-150" />
                        {hour}:00
                      </Button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8 min-h-[200px] items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8 min-h-[200px] flex items-center justify-center">
                    Нет слотов на этот день. Создайте новый!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status filter pills - minimal design */}
                    <div className="flex gap-2 flex-wrap">
                      {(
                        [
                          { key: 'all', label: 'Все', count: slots.length },
                          {
                            key: 'free',
                            label: 'Свободно',
                            count: slots.filter((s) => !s.is_booked).length
                          },
                          {
                            key: 'booked',
                            label: 'Забронировано',
                            count: slots.filter((s) => s.is_booked && !s.status).length
                          },
                          {
                            key: 'completed',
                            label: 'Проведено',
                            count: slots.filter((s) => s.status === 'completed').length
                          },
                          {
                            key: 'missed',
                            label: 'Пропущено',
                            count: slots.filter((s) => s.status === 'missed').length
                          }
                        ] as const
                      ).map(({ key, label, count }) => (
                        <button
                          key={key}
                          onClick={() => setStatusFilter(key)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                            statusFilter === key
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {label}
                          <span className="ml-1.5 opacity-70">({count})</span>
                        </button>
                      ))}
                    </div>

                    <div className="text-xs text-muted-foreground text-right">
                      Время указано в вашем часовом поясе (
                      {Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </div>
                    {slots
                      .filter((slot) => {
                        if (statusFilter === 'all') return true;
                        if (statusFilter === 'free') return !slot.is_booked;
                        if (statusFilter === 'booked') return slot.is_booked && !slot.status;
                        if (statusFilter === 'completed') return slot.status === 'completed';
                        if (statusFilter === 'missed') return slot.status === 'missed';
                        return true;
                      })
                      .map((slot) => (
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
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="font-mono font-medium text-lg">
                              {format(new Date(slot.start_time), 'HH:mm')}
                            </span>
                            {slot.is_booked ? (
                              <>
                                <Badge
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700 shrink-0"
                                >
                                  Забронировано
                                </Badge>
                                {/* Student info - minimal avatar + email */}
                                {slot.student && (
                                  <div
                                    className="flex items-center gap-2 min-w-0"
                                    title={slot.student.email}
                                  >
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                                      {(slot.student.display_name ||
                                        slot.student.email)[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                                      {slot.student.display_name ||
                                        slot.student.email.split('@')[0]}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <Badge variant="secondary">Свободно</Badge>
                            )}
                            {/* Show slot status if set */}
                            {slot.status === 'completed' && (
                              <Badge className="bg-blue-600 shrink-0">Проведено ✓</Badge>
                            )}
                            {slot.status === 'missed' && (
                              <Badge className="bg-orange-600 shrink-0">Пропущено</Badge>
                            )}
                          </div>
                          {/* Status buttons for booked slots */}
                          {slot.is_booked && !slot.status && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => updateSlotStatus(slot.id, 'completed')}
                                title="Отметить как проведённое"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => updateSlotStatus(slot.id, 'missed')}
                                title="Отметить как пропущенное"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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
