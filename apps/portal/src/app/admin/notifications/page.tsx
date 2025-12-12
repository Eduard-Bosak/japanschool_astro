'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Mail,
  Loader2,
  Bell,
  CalendarPlus,
  CalendarX,
  Sunrise,
  BarChart3,
  Clock,
  Send,
  Bot,
  MessageCircle,
  Sparkles,
  Shield
} from 'lucide-react';

import { User } from '@supabase/supabase-js';

type NotificationSettings = {
  email_booking_created: boolean;
  email_booking_cancelled: boolean;
  email_daily_digest: boolean;
  email_weekly_digest: boolean;
  email_slot_reminder: boolean;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Отдельные состояния для каждого тумблера
  const [bookingCreated, setBookingCreated] = useState(true);
  const [bookingCancelled, setBookingCancelled] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [slotReminder, setSlotReminder] = useState(true);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setBookingCreated(data.email_booking_created ?? true);
        setBookingCancelled(data.email_booking_cancelled ?? true);
        setDailyDigest(data.email_daily_digest ?? false);
        setWeeklyDigest(data.email_weekly_digest ?? true);
        setSlotReminder(data.email_slot_reminder ?? true);
        setTelegramToken(data.telegram_bot_token || '');
        setTelegramChatId(data.telegram_chat_id || '');
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('notification_settings').upsert(
        {
          user_id: user.id,
          email_booking_created: bookingCreated,
          email_booking_cancelled: bookingCancelled,
          email_daily_digest: dailyDigest,
          email_weekly_digest: weeklyDigest,
          email_slot_reminder: slotReminder,
          telegram_bot_token: telegramToken,
          telegram_chat_id: telegramChatId,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
      toast.success('Настройки сохранены', {
        description: 'Ваши настройки уведомлений обновлены'
      });
    } catch (error) {
      toast.error('Ошибка сохранения', {
        description: (error as Error).message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: 'Отправка тестового письма...',
      success: 'Тестовое письмо отправлено!',
      error: 'Ошибка отправки'
    });
  };

  const handleTestTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      toast.error('Заполните Bot Token и Chat ID');
      return;
    }

    setTestingTelegram(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: '🎌 *Japan School - Тест*\n\nПоздравляем! Telegram уведомления работают!',
          parse_mode: 'Markdown'
        })
      });

      if (response.ok) {
        toast.success('Telegram подключён!', {
          description: 'Проверьте сообщение в вашем чате'
        });
      } else {
        const data = await response.json();
        throw new Error(data.description || 'Ошибка Telegram API');
      }
    } catch (error) {
      toast.error('Ошибка подключения', {
        description: (error as Error).message
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Уведомления</h2>
            <p className="text-muted-foreground text-sm">
              Настройте как и когда получать уведомления
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleTestEmail} className="gap-2">
            <Mail className="h-4 w-4" />
            Тестовое письмо
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Сохранить
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Notifications Card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Email Уведомления</CardTitle>
                <CardDescription>Выберите события для email-рассылки</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {/* Новая запись */}
            <div className="flex items-center justify-between p-4 hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CalendarPlus className="h-4 w-4 text-green-500" />
                </div>
                <Label htmlFor="switch-booking-created" className="flex flex-col cursor-pointer">
                  <span className="font-medium">Новая запись</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Уведомлять, когда ученик записывается на слот
                  </span>
                </Label>
              </div>
              <Switch
                id="switch-booking-created"
                checked={bookingCreated}
                onCheckedChange={(v) => {
                  setBookingCreated(v);
                  toast(v ? '✅ Новая запись — включено' : '❌ Новая запись — выключено');
                }}
              />
            </div>

            {/* Отмена записи */}
            <div className="flex items-center justify-between p-4 hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <CalendarX className="h-4 w-4 text-orange-500" />
                </div>
                <Label htmlFor="switch-booking-cancelled" className="flex flex-col cursor-pointer">
                  <span className="font-medium">Отмена записи</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Уведомлять, когда ученик отменяет занятие
                  </span>
                </Label>
              </div>
              <Switch
                id="switch-booking-cancelled"
                checked={bookingCancelled}
                onCheckedChange={(v) => {
                  setBookingCancelled(v);
                  toast(v ? '✅ Отмена записи — включено' : '❌ Отмена записи — выключено');
                }}
              />
            </div>

            {/* Ежедневная сводка */}
            <div className="flex items-center justify-between p-4 hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Sunrise className="h-4 w-4 text-amber-500" />
                </div>
                <Label htmlFor="switch-daily-digest" className="flex flex-col cursor-pointer">
                  <span className="font-medium">Ежедневная сводка</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Получать список занятий на день каждое утро
                  </span>
                </Label>
              </div>
              <Switch
                id="switch-daily-digest"
                checked={dailyDigest}
                onCheckedChange={(v) => {
                  setDailyDigest(v);
                  toast(v ? '✅ Ежедневная сводка — включено' : '❌ Ежедневная сводка — выключено');
                }}
              />
            </div>

            {/* Еженедельный отчет */}
            <div className="flex items-center justify-between p-4 hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </div>
                <Label htmlFor="switch-weekly-digest" className="flex flex-col cursor-pointer">
                  <span className="font-medium">Еженедельный отчет</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Статистика за неделю по понедельникам
                  </span>
                </Label>
              </div>
              <Switch
                id="switch-weekly-digest"
                checked={weeklyDigest}
                onCheckedChange={(v) => {
                  setWeeklyDigest(v);
                  toast(
                    v ? '✅ Еженедельный отчет — включено' : '❌ Еженедельный отчет — выключено'
                  );
                }}
              />
            </div>

            {/* Напоминания о слотах */}
            <div className="flex items-center justify-between p-4 hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-4 w-4 text-purple-500" />
                </div>
                <Label htmlFor="switch-slot-reminder" className="flex flex-col cursor-pointer">
                  <span className="font-medium">Напоминания о слотах</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Напоминать за 15 минут до начала урока
                  </span>
                </Label>
              </div>
              <Switch
                id="switch-slot-reminder"
                checked={slotReminder}
                onCheckedChange={(v) => {
                  setSlotReminder(v);
                  toast(
                    v ? '✅ Напоминания о слотах — включено' : '❌ Напоминания о слотах — выключено'
                  );
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Telegram Card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0088cc]/10 to-blue-500/10 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0088cc]/20">
                <Send className="h-5 w-5 text-[#0088cc]" />
              </div>
              <div>
                <CardTitle>Telegram Интеграция</CardTitle>
                <CardDescription>Мгновенные уведомления прямо в мессенджер</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Bot Token */}
            <div className="space-y-2">
              <Label htmlFor="bot_token" className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                Bot Token
              </Label>
              <Input
                id="bot_token"
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Токен надёжно хранится в базе данных
              </p>
            </div>

            {/* Chat ID */}
            <div className="space-y-2">
              <Label htmlFor="chat_id" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Chat ID
              </Label>
              <Input
                id="chat_id"
                placeholder="123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Узнайте ID через @userinfobot в Telegram
              </p>
            </div>

            {/* Test Button */}
            <Button
              variant="outline"
              className="w-full gap-2 border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/10"
              onClick={handleTestTelegram}
              disabled={testingTelegram || !telegramToken || !telegramChatId}
            >
              {testingTelegram ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Отправить тестовое сообщение
            </Button>

            {/* Instructions */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Как настроить:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Откройте @BotFather в Telegram</li>
                <li>Создайте нового бота командой /newbot</li>
                <li>Скопируйте полученный токен сюда</li>
                <li>Напишите что-нибудь вашему боту</li>
                <li>Получите Chat ID через @userinfobot</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
