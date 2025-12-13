'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, Sparkles, BookOpen, Gift, Check, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TariffPlan } from '@/types';
import { cn } from '@/lib/utils';

const tariffIcons: Record<string, React.ReactNode> = {
  trial: <Gift className="w-8 h-8" />,
  basic: <BookOpen className="w-8 h-8" />,
  standard: <Sparkles className="w-8 h-8" />,
  premium: <Crown className="w-8 h-8" />
};

export default function StudentTariffsPage() {
  const [tariffs, setTariffs] = useState<TariffPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTariffId, setCurrentTariffId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);

      // Get user's current tariff
      const { data: profile } = await supabase
        .from('profiles')
        .select('tariff_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentTariffId(profile.tariff_id);
      }
    }

    // Fetch active tariffs
    const { data: tariffData } = await supabase
      .from('tariff_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (tariffData) {
      const parsed = tariffData.map((t) => ({
        ...t,
        features: typeof t.features === 'string' ? JSON.parse(t.features) : t.features || []
      }));
      setTariffs(parsed);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectTariff = async (tariffId: string) => {
    if (!userId) return;

    // For now, just show a message to contact admin
    // In the future, this could redirect to payment
    toast.info('Для смены тарифа свяжитесь с преподавателем', {
      description: 'Вы можете связаться через Telegram или email'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Тарифы</h1>
        <p className="text-neutral-500 mt-1">Выберите подходящий тариф для обучения</p>
      </div>

      {tariffs.length === 0 ? (
        <Card className="!bg-white !border-neutral-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500">Тарифы пока не настроены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tariffs.map((tariff) => {
            const isCurrent = currentTariffId === tariff.id;
            const IconComponent = tariffIcons[tariff.slug] || <BookOpen className="w-8 h-8" />;

            return (
              <Card
                key={tariff.id}
                className={cn(
                  '!bg-white shadow-sm transition-all hover:shadow-md relative overflow-hidden',
                  isCurrent ? '!border-2 !border-green-500' : '!border-neutral-200'
                )}
              >
                {/* Color accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: tariff.color }}
                />

                {isCurrent && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 text-white">Текущий</Badge>
                  </div>
                )}

                <CardHeader className="pt-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${tariff.color}20`, color: tariff.color }}
                  >
                    {IconComponent}
                  </div>
                  <CardTitle className="text-xl text-neutral-900">{tariff.name}</CardTitle>
                  {tariff.description && (
                    <CardDescription className="text-neutral-500">
                      {tariff.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-neutral-900">
                        {tariff.price_monthly?.toLocaleString('ru-RU')}
                      </span>
                      <span className="text-neutral-500">₽/мес</span>
                    </div>
                    <div className="text-sm text-neutral-500">
                      {tariff.lessons_per_month} уроков • {tariff.price_per_lesson?.toLocaleString('ru-RU')} ₽/урок
                    </div>
                    {tariff.discount_percent > 0 && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 mt-1">
                        Скидка {tariff.discount_percent}%
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  {tariff.features && tariff.features.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      {tariff.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            style={{ color: tariff.color }}
                          />
                          <span className="text-neutral-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action button */}
                  <div className="pt-4">
                    {isCurrent ? (
                      <Button disabled className="w-full bg-green-500 text-white">
                        <Check className="w-4 h-4 mr-2" />
                        Ваш тариф
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        style={{
                          backgroundColor: tariff.color,
                          color: 'white'
                        }}
                        onClick={() => handleSelectTariff(tariff.id)}
                      >
                        Выбрать тариф
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <Card className="!bg-neutral-50 !border-neutral-200 mt-6">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Как сменить тариф?</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Для смены тарифа или покупки дополнительных уроков свяжитесь с преподавателем.
                После оплаты ваш баланс будет обновлён.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
