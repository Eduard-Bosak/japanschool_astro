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
import { motion } from 'framer-motion';

const tariffIcons: Record<string, React.ReactNode> = {
  trial: <Gift className="w-5 h-5" />,
  basic: <BookOpen className="w-5 h-5" />,
  standard: <Sparkles className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <h1 className="text-xl font-bold text-neutral-900">Тарифы</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Выберите подходящий тариф</p>
      </motion.div>

      {tariffs.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="!bg-white !border-neutral-200 shadow-sm">
            <CardContent className="py-8 text-center">
              <CreditCard className="h-10 w-10 mx-auto text-neutral-300 mb-3" />
              <p className="text-neutral-500 text-sm">Тарифы пока не настроены</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {tariffs.map((tariff, index) => {
            const isCurrent = currentTariffId === tariff.id;
            const IconComponent = tariffIcons[tariff.slug] || <BookOpen className="w-5 h-5" />;

            return (
              <motion.div
                key={tariff.id}
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    '!bg-white shadow-sm transition-shadow hover:shadow-lg relative overflow-hidden cursor-pointer h-full flex flex-col',
                    isCurrent ? '!border-2 !border-green-500' : '!border-neutral-200'
                  )}
                >
                  {/* Color accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: tariff.color }}
                  />

                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="absolute top-2 right-2"
                    >
                      <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">
                        Текущий
                      </Badge>
                    </motion.div>
                  )}

                  <CardHeader className="pt-4 pb-2 px-3">
                    <div className="flex items-center gap-2 mb-1">
                      <motion.div
                        whileHover={{ rotate: 10 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${tariff.color}20`, color: tariff.color }}
                      >
                        {IconComponent}
                      </motion.div>
                      <CardTitle className="text-base text-neutral-900">{tariff.name}</CardTitle>
                    </div>
                    <CardDescription className="text-neutral-500 text-xs line-clamp-1 min-h-[16px]">
                      {tariff.description || '\u00A0'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 px-3 pb-3">
                    {/* Price */}
                    <div className="mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-neutral-900">
                          {tariff.price_monthly?.toLocaleString('ru-RU')}
                        </span>
                        <span className="text-neutral-500 text-xs">₽/мес</span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {tariff.lessons_per_month} ур. •{' '}
                        {tariff.price_per_lesson?.toLocaleString('ru-RU')} ₽/ур
                      </div>
                      {tariff.discount_percent > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700 text-xs mt-1 px-1.5 py-0"
                        >
                          -{tariff.discount_percent}%
                        </Badge>
                      )}
                    </div>

                    {/* Features - fixed height */}
                    <div className="flex-1 min-h-[80px] space-y-1 pt-1 border-t border-neutral-100">
                      {tariff.features && tariff.features.length > 0 ? (
                        <>
                          {tariff.features.slice(0, 3).map((feature: string, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * idx + 0.3 }}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <Check
                                className="w-3 h-3 flex-shrink-0"
                                style={{ color: tariff.color }}
                              />
                              <span className="text-neutral-600 truncate">{feature}</span>
                            </motion.div>
                          ))}
                          {tariff.features.length > 3 && (
                            <span className="text-xs text-neutral-400">
                              +{tariff.features.length - 3} ещё
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-neutral-400">Базовые возможности</div>
                      )}
                    </div>

                    {/* Action button - always at bottom */}
                    <div className="pt-2 mt-auto">
                      {isCurrent ? (
                        <Button
                          disabled
                          size="sm"
                          className="w-full h-7 text-xs bg-green-500 text-white"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Ваш тариф
                        </Button>
                      ) : (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs"
                            style={{
                              backgroundColor: tariff.color,
                              color: 'white'
                            }}
                            onClick={() => handleSelectTariff(tariff.id)}
                          >
                            Выбрать
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="!bg-neutral-50 !border-neutral-200 mt-4">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-neutral-600" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900 text-sm">Как сменить тариф?</h3>
                <p className="text-xs text-neutral-500">
                  Свяжитесь с преподавателем для смены тарифа или покупки уроков
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
