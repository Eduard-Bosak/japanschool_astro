'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Setting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('system_settings').select('*').order('key');

    if (error) {
      toast.error('Ошибка загрузки настроек', { description: error.message });
    } else {
      setSettings(data || []);
      const initialValues: Record<string, string> = {};
      data?.forEach((setting) => {
        initialValues[setting.key] = setting.value;
      });
      setValues(initialValues);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all settings
      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .update({
            value: values[setting.key],
            updated_at: new Date().toISOString()
          })
          .eq('id', setting.id);

        if (error) throw error;
      }
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error('Ошибка сохранения', { description: (error as Error).message });
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Настройки системы</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Параметры
          </CardTitle>
          <CardDescription>Настройте правила отмены уроков и уведомлений</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cancellation Hours */}
          <div className="grid gap-2">
            <Label htmlFor="cancellation_hours">
              За сколько часов можно отменить урок с возвратом баланса
            </Label>
            <Input
              id="cancellation_hours"
              type="number"
              value={values.cancellation_hours || '24'}
              onChange={(e) => setValues({ ...values, cancellation_hours: e.target.value })}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Студент сможет отменить урок с возвратом баланса, если до начала урока осталось больше
              указанных часов.
            </p>
          </div>

          {/* Notification Hours */}
          <div className="grid gap-2">
            <Label htmlFor="notification_hours">
              За сколько часов до урока отправлять напоминание
            </Label>
            <Input
              id="notification_hours"
              type="number"
              value={values.notification_hours || '24'}
              onChange={(e) => setValues({ ...values, notification_hours: e.target.value })}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Email-уведомление будет отправлено студенту за указанное количество часов до начала
              урока.
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить настройки
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
