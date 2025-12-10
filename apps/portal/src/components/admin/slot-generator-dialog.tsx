'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';
import { addDays, format, setHours, setMinutes } from 'date-fns';

interface SlotGeneratorDialogProps {
  onSlotsGenerated: () => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 0, label: 'Вс' }
];

export function SlotGeneratorDialog({ onSlotsGenerated }: SlotGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(18);
  const [duration, setDuration] = useState(60); // minutes
  const [breakDuration, setBreakDuration] = useState(0); // minutes

  const handleDayToggle = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const calculateSlots = () => {
    const slots = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      if (selectedDays.includes(current.getDay())) {
        // Set start time for the day
        let time = setMinutes(setHours(new Date(current), startHour), 0);

        // Set end time for the day
        const dayEnd = setMinutes(setHours(new Date(current), endHour), 0);

        while (time < dayEnd) {
          const slotEnd = new Date(time.getTime() + duration * 60000);
          if (slotEnd <= dayEnd) {
            slots.push({
              start_time: time.toISOString(),
              end_time: slotEnd.toISOString()
            });
          }
          // Move to next slot: duration + break
          time = new Date(time.getTime() + (duration + breakDuration) * 60000);
        }
      }
      current = addDays(current, 1);
    }
    return slots;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const slotsToCreate = calculateSlots();

      if (slotsToCreate.length === 0) {
        toast.error('Нет слотов для создания с выбранными параметрами');
        setLoading(false);
        return;
      }

      // Check for existing slots to avoid duplicates
      // This is a simplified check. Ideally, we should check in DB.
      // For now, we will rely on a simple client-side confirmation or just try to insert.
      // Supabase doesn't have "ON CONFLICT SKIP" easily for bulk insert without a constraint.
      // We'll fetch existing slots in range first.

      const { data: existingSlots } = await supabase
        .from('slots')
        .select('start_time')
        .gte('start_time', new Date(startDate).toISOString())
        .lte('start_time', new Date(endDate).toISOString());

      const existingTimes = new Set(existingSlots?.map((s) => s.start_time));

      const newSlots = slotsToCreate.filter((s) => !existingTimes.has(s.start_time));

      if (newSlots.length === 0) {
        toast.info('Все слоты в этом диапазоне уже существуют');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('slots').insert(newSlots);

      if (error) throw error;

      toast.success(`Создано слотов: ${newSlots.length}`);
      onSlotsGenerated();
      setOpen(false);
    } catch (error) {
      toast.error('Ошибка генерации', {
        description: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  const previewCount = calculateSlots().length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Генератор
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Генератор слотов</DialogTitle>
          <DialogDescription>Массовое создание слотов по расписанию.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Начало периода</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Конец периода</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Дни недели</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day.id}
                  className={`
                    cursor-pointer px-3 py-1 rounded-md text-sm border transition-colors
                    ${
                      selectedDays.includes(day.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent border-input'
                    }
                  `}
                  onClick={() => handleDayToggle(day.id)}
                >
                  {day.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>С (часы)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>До (часы)</Label>
              <Input
                type="number"
                min={0}
                max={23}
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Длительность (мин)</Label>
              <Input
                type="number"
                step={15}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Перерыв (мин)</Label>
              <Input
                type="number"
                step={5}
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md text-sm text-center">
            Будет создано примерно <strong>{previewCount}</strong> слотов
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleGenerate} disabled={loading || previewCount === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сгенерировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
