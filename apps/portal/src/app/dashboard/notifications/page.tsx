'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2, Bell, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch notifications
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setNotifications(notifs || []);

    // Fetch notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      setEmailNotifications(settings.email_enabled ?? true);
      setLessonReminders(settings.lesson_reminders ?? true);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const markAllAsRead = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Все уведомления отмечены как прочитанные');
    }
  };

  const saveSettings = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from('notification_settings').upsert({
      user_id: user.id,
      email_enabled: emailNotifications,
      lesson_reminders: lessonReminders
    });

    if (error) {
      toast.error('Ошибка сохранения настроек');
    } else {
      toast.success('Настройки сохранены');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Уведомления</h1>
          <p className="text-neutral-500">
            {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Нет новых уведомлений'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          >
            Отметить все как прочитанные
          </Button>
        )}
      </div>

      {/* Notification Settings */}
      <Card className="!bg-white !border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-neutral-700" />
            Настройки уведомлений
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Управляйте способами получения уведомлений
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-neutral-900">Email уведомления</Label>
              <p className="text-sm text-neutral-500">Получать уведомления на электронную почту</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-neutral-900">Напоминания об уроках</Label>
              <p className="text-sm text-neutral-500">Напоминание за 24 часа до урока</p>
            </div>
            <Switch checked={lessonReminders} onCheckedChange={setLessonReminders} />
          </div>

          <Button onClick={saveSettings} className="bg-neutral-900 hover:bg-neutral-800 text-white">
            Сохранить настройки
          </Button>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="!bg-white !border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-neutral-700" />
            Последние уведомления
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">У вас пока нет уведомлений</div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                    notification.read
                      ? 'bg-neutral-50 border-neutral-200'
                      : 'bg-white border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium ${notification.read ? 'text-neutral-500' : 'text-neutral-900'}`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-neutral-900" />
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">{notification.message}</p>
                    <p className="text-xs text-neutral-400 mt-2">
                      {format(new Date(notification.created_at), 'd MMMM, HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
