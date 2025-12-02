'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

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
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_booking_created: true,
    email_booking_cancelled: true,
    email_daily_digest: false,
    email_weekly_digest: true,
    email_slot_reminder: true,
    telegram_bot_token: '',
    telegram_chat_id: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user); // Set user state
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings({
          email_booking_created: data.email_booking_created ?? true,
          email_booking_cancelled: data.email_booking_cancelled ?? true,
          email_daily_digest: data.email_daily_digest ?? false,
          email_weekly_digest: data.email_weekly_digest ?? true,
          email_slot_reminder: data.email_slot_reminder ?? true,
          telegram_bot_token: data.telegram_bot_token || '',
          telegram_chat_id: data.telegram_chat_id || ''
        });
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
          email_booking_created: settings.email_booking_created,
          email_booking_cancelled: settings.email_booking_cancelled,
          email_daily_digest: settings.email_daily_digest,
          email_weekly_digest: settings.email_weekly_digest,
          email_slot_reminder: settings.email_slot_reminder,
          telegram_bot_token: settings.telegram_bot_token,
          telegram_chat_id: settings.telegram_chat_id,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
      toast.success('Настройки сохранены');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Уведомления</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Тестовое письмо
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Уведомления</CardTitle>
            <CardDescription>
              Выберите, какие уведомления вы хотите получать на email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="booking_created" className="flex flex-col space-y-1">
                <span>Новая запись</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Уведомлять, когда ученик записывается на слот
                </span>
              </Label>
              <Switch
                id="booking_created"
                checked={settings.email_booking_created}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_booking_created: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="booking_cancelled" className="flex flex-col space-y-1">
                <span>Отмена записи</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Уведомлять, когда ученик отменяет занятие
                </span>
              </Label>
              <Switch
                id="booking_cancelled"
                checked={settings.email_booking_cancelled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_booking_cancelled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="daily_digest" className="flex flex-col space-y-1">
                <span>Ежедневная сводка</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Получать список занятий на день каждое утро
                </span>
              </Label>
              <Switch
                id="daily_digest"
                checked={settings.email_daily_digest}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_daily_digest: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="weekly_digest" className="flex flex-col space-y-1">
                <span>Еженедельный отчет</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Статистика за неделю по понедельникам
                </span>
              </Label>
              <Switch
                id="weekly_digest"
                checked={settings.email_weekly_digest}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_weekly_digest: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="slot_reminder" className="flex flex-col space-y-1">
                <span>Напоминания о слотах</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Напоминать за 15 минут до начала урока
                </span>
              </Label>
              <Switch
                id="slot_reminder"
                checked={settings.email_slot_reminder}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_slot_reminder: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telegram Интеграция</CardTitle>
            <CardDescription>Настройте бота для получения уведомлений в Telegram.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bot_token">Bot Token</Label>
              <Input
                id="bot_token"
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={settings.telegram_bot_token || ''}
                onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Токен, полученный от @BotFather</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="chat_id">Chat ID</Label>
              <Input
                id="chat_id"
                placeholder="123456789"
                value={settings.telegram_chat_id || ''}
                onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                ID вашего чата с ботом (можно узнать через @userinfobot)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
