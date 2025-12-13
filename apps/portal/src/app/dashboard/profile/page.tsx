'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2, User, Mail, Save, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoading(false);
      return;
    }

    setUser({ id: authUser.id, email: authUser.email || '' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || '');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Профиль сохранён');
    } catch (error) {
      toast.error('Ошибка сохранения', { description: (error as Error).message });
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast.success('Пароль изменён');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Ошибка смены пароля', { description: (error as Error).message });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Профиль</h1>
        <p className="text-neutral-500">Управление личными данными</p>
      </div>

      {/* Profile Info */}
      <Card className="!bg-white !border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-900 flex items-center gap-2">
            <User className="h-5 w-5 text-neutral-700" />
            Личные данные
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Обновите ваше имя для отображения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-700">
              Email
            </Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-neutral-100 border-neutral-200 text-neutral-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-neutral-700">
              Отображаемое имя
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Введите ваше имя"
              className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900"
            />
          </div>

          <Button
            onClick={saveProfile}
            disabled={saving}
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Сохранить
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="!bg-white !border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-neutral-900 flex items-center gap-2">
            <Key className="h-5 w-5 text-neutral-700" />
            Смена пароля
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Обновите пароль для входа в аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-neutral-700">
              Новый пароль
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-neutral-700">
              Подтвердите пароль
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900"
            />
          </div>

          <Button
            onClick={changePassword}
            disabled={saving || !newPassword || !confirmPassword}
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Key className="mr-2 h-4 w-4" />
            )}
            Изменить пароль
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
