'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Crown,
  Sparkles,
  BookOpen,
  Gift,
  Plus,
  Pencil,
  Trash2,
  Calculator,
  Percent
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TariffPlan } from '@/types';

const tariffIcons: Record<string, React.ReactNode> = {
  trial: <Gift className="w-6 h-6" />,
  basic: <BookOpen className="w-6 h-6" />,
  standard: <Sparkles className="w-6 h-6" />,
  premium: <Crown className="w-6 h-6" />
};

const defaultColors = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ef4444', // red
  '#84cc16' // lime
];

type TariffFormData = {
  name: string;
  slug: string;
  description: string;
  lessons_per_month: number;
  price_per_lesson: number;
  price_monthly: number;
  discount_percent: number;
  features: string;
  color: string;
  is_active: boolean;
  sort_order: number;
};

const defaultFormData: TariffFormData = {
  name: '',
  slug: '',
  description: '',
  lessons_per_month: 4,
  price_per_lesson: 1000,
  price_monthly: 4000,
  discount_percent: 0,
  features: '',
  color: '#6366f1',
  is_active: true,
  sort_order: 0
};

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<TariffPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentsPerTariff, setStudentsPerTariff] = useState<Record<string, number>>({});

  // Modal states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<TariffPlan | null>(null);
  const [tariffToDelete, setTariffToDelete] = useState<TariffPlan | null>(null);

  // Form state
  const [formData, setFormData] = useState<TariffFormData>(defaultFormData);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch tariffs
    const { data: tariffData } = await supabase
      .from('tariff_plans')
      .select('*')
      .order('sort_order');

    if (tariffData) {
      const parsed = tariffData.map((t) => ({
        ...t,
        features: typeof t.features === 'string' ? JSON.parse(t.features) : t.features || []
      }));
      setTariffs(parsed);
    }

    // Count students per tariff
    const { data: profiles } = await supabase
      .from('profiles')
      .select('tariff_id')
      .eq('role', 'student');

    if (profiles) {
      const counts: Record<string, number> = {};
      profiles.forEach((p) => {
        if (p.tariff_id) {
          counts[p.tariff_id] = (counts[p.tariff_id] || 0) + 1;
        }
      });
      setStudentsPerTariff(counts);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculator: update total when lessons or price per lesson changes
  const updateFromLessonsOrPrice = (lessons: number, pricePerLesson: number, discount: number) => {
    const subtotal = lessons * pricePerLesson;
    const discountAmount = subtotal * (discount / 100);
    const total = Math.round(subtotal - discountAmount);
    setFormData((prev) => ({
      ...prev,
      lessons_per_month: lessons,
      price_per_lesson: pricePerLesson,
      discount_percent: discount,
      price_monthly: total
    }));
  };

  // Calculator: update price per lesson when total changes
  const updateFromTotal = (total: number, lessons: number, discount: number) => {
    if (lessons <= 0) return;
    // Reverse calculate: total = lessons * pricePerLesson * (1 - discount/100)
    // pricePerLesson = total / (lessons * (1 - discount/100))
    const multiplier = 1 - discount / 100;
    const pricePerLesson = multiplier > 0 ? Math.round(total / (lessons * multiplier)) : 0;
    setFormData((prev) => ({
      ...prev,
      price_monthly: total,
      price_per_lesson: pricePerLesson
    }));
  };

  const openCreateModal = () => {
    setEditingTariff(null);
    setFormData({
      ...defaultFormData,
      sort_order: tariffs.length
    });
    setSheetOpen(true);
  };

  const openEditModal = (tariff: TariffPlan) => {
    setEditingTariff(tariff);
    setFormData({
      name: tariff.name,
      slug: tariff.slug,
      description: tariff.description || '',
      lessons_per_month: tariff.lessons_per_month,
      price_per_lesson:
        tariff.lessons_per_month > 0
          ? Math.round(tariff.price_monthly / tariff.lessons_per_month)
          : 0,
      price_monthly: tariff.price_monthly,
      discount_percent: 0,
      features: Array.isArray(tariff.features) ? tariff.features.join('\n') : '',
      color: tariff.color || '#6366f1',
      is_active: tariff.is_active,
      sort_order: tariff.sort_order
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Введите название тарифа');
      return;
    }

    setSaving(true);

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
    const featuresArray = formData.features
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const tariffData = {
      name: formData.name,
      slug,
      description: formData.description,
      lessons_per_month: formData.lessons_per_month,
      price_monthly: formData.price_monthly,
      features: featuresArray,
      color: formData.color,
      is_active: formData.is_active,
      sort_order: formData.sort_order
    };

    try {
      if (editingTariff) {
        // Update
        const { error } = await supabase
          .from('tariff_plans')
          .update(tariffData)
          .eq('id', editingTariff.id);

        if (error) throw error;
        toast.success('✅ Тариф обновлён');
      } else {
        // Create
        const { error } = await supabase.from('tariff_plans').insert(tariffData);

        if (error) throw error;
        toast.success('✅ Тариф создан');
      }

      setSheetOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Ошибка сохранения', {
        description: (error as Error).message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tariffToDelete) return;

    try {
      const { error } = await supabase.from('tariff_plans').delete().eq('id', tariffToDelete.id);

      if (error) throw error;
      toast.success('🗑️ Тариф удалён');
      setDeleteDialogOpen(false);
      setTariffToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Ошибка удаления', {
        description: (error as Error).message
      });
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Бесплатно';
    return `${price.toLocaleString('ru-RU')} ₽`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Тарифные планы</h2>
          <p className="text-muted-foreground">Управление пакетами уроков</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="gap-2 bg-gradient-to-r from-primary to-pink-500"
        >
          <Plus className="h-4 w-4" />
          Создать тариф
        </Button>
      </div>

      {/* Tariff Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tariffs.map((tariff) => (
          <Card key={tariff.id} className="relative overflow-hidden group">
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: tariff.color }}
            />

            {/* Edit/Delete buttons - Very visible */}
            <div className="absolute top-3 right-3 flex gap-2 z-50">
              <button
                type="button"
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg border border-purple-400"
                onClick={() => openEditModal(tariff)}
                title="Редактировать"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-lg border border-red-400"
                onClick={() => {
                  setTariffToDelete(tariff);
                  setDeleteDialogOpen(true);
                }}
                title="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span style={{ color: tariff.color }}>
                  {tariffIcons[tariff.slug] || <Sparkles className="w-6 h-6" />}
                </span>
                <CardTitle className="text-lg">{tariff.name}</CardTitle>
                {!tariff.is_active && <Badge variant="secondary">Неактивен</Badge>}
              </div>
              <CardDescription>{tariff.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: tariff.color }}>
                    {formatPrice(tariff.price_monthly)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{tariff.lessons_per_month} уроков</span>
                  {tariff.lessons_per_month > 0 && (
                    <span className="text-xs">
                      (~{Math.round(tariff.price_monthly / tariff.lessons_per_month)} ₽/урок)
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Студентов:</span>
                    <Badge
                      variant="outline"
                      style={{ borderColor: tariff.color, color: tariff.color }}
                    >
                      {studentsPerTariff[tariff.id] || 0}
                    </Badge>
                  </div>
                </div>

                <ul className="space-y-1 text-xs text-muted-foreground">
                  {tariff.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span style={{ color: tariff.color }}>✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue estimate */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Ожидаемый доход</CardTitle>
          <CardDescription>На основе текущих подписок</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {(() => {
              let monthlyTotal = 0;
              tariffs.forEach((t) => {
                const count = studentsPerTariff[t.id] || 0;
                monthlyTotal += count * t.price_monthly;
              });
              return (
                <>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-muted-foreground">В месяц</p>
                    <p className="text-2xl font-bold text-green-400">
                      {monthlyTotal.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-muted-foreground">В квартал</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {(monthlyTotal * 3).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-muted-foreground">В год</p>
                    <p className="text-2xl font-bold text-primary">
                      {(monthlyTotal * 12).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingTariff ? 'Редактировать тариф' : 'Создать тариф'}</SheetTitle>
            <SheetDescription>
              {editingTariff ? 'Измените параметры тарифа' : 'Настройте новый пакет уроков'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Название тарифа</Label>
              <Input
                id="name"
                placeholder="Базовый, Премиум..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                placeholder="Для начинающих..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Calculator Section */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <span className="font-medium">Калькулятор цены</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Lessons */}
                <div className="space-y-2">
                  <Label htmlFor="lessons">Кол-во уроков</Label>
                  <Input
                    id="lessons"
                    type="number"
                    min="1"
                    value={formData.lessons_per_month}
                    onChange={(e) => {
                      const lessons = parseInt(e.target.value) || 1;
                      updateFromLessonsOrPrice(
                        lessons,
                        formData.price_per_lesson,
                        formData.discount_percent
                      );
                    }}
                  />
                </div>

                {/* Price per lesson */}
                <div className="space-y-2">
                  <Label htmlFor="price_per_lesson">Цена за урок (₽)</Label>
                  <Input
                    id="price_per_lesson"
                    type="number"
                    min="0"
                    value={formData.price_per_lesson}
                    onChange={(e) => {
                      const price = parseInt(e.target.value) || 0;
                      updateFromLessonsOrPrice(
                        formData.lessons_per_month,
                        price,
                        formData.discount_percent
                      );
                    }}
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <Label htmlFor="discount" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Скидка (%)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => {
                    const discount = parseInt(e.target.value) || 0;
                    updateFromLessonsOrPrice(
                      formData.lessons_per_month,
                      formData.price_per_lesson,
                      discount
                    );
                  }}
                />
              </div>

              {/* Total Price */}
              <div className="space-y-2">
                <Label htmlFor="total">Итого (₽)</Label>
                <Input
                  id="total"
                  type="number"
                  min="0"
                  className="text-xl font-bold"
                  value={formData.price_monthly}
                  onChange={(e) => {
                    const total = parseInt(e.target.value) || 0;
                    updateFromTotal(total, formData.lessons_per_month, formData.discount_percent);
                  }}
                />
                {formData.discount_percent > 0 && (
                  <p className="text-xs text-green-500">
                    Скидка {formData.discount_percent}% применена!
                  </p>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label htmlFor="features">Преимущества (по строке)</Label>
              <Textarea
                id="features"
                rows={4}
                placeholder="Доступ к материалам&#10;Домашние задания&#10;Поддержка в чате"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Цвет</Label>
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      formData.color === color ? 'scale-110 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Активен</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full gap-2 bg-gradient-to-r from-primary to-pink-500"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingTariff ? 'Сохранить изменения' : 'Создать тариф'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тариф?</AlertDialogTitle>
            <AlertDialogDescription>
              Тариф "{tariffToDelete?.name}" будет удалён. Студенты с этим тарифом останутся без
              подписки.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
