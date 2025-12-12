'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Student, TariffPlan } from '@/types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [tariffs, setTariffs] = useState<Record<string, TariffPlan>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);

      // Fetch tariff plans first
      const { data: tariffData } = await supabase.from('tariff_plans').select('*');

      if (tariffData) {
        const tariffMap: Record<string, TariffPlan> = {};
        tariffData.forEach((t) => {
          tariffMap[t.id] = { ...t, features: t.features || [] };
        });
        setTariffs(tariffMap);
      }

      // Получаем всех пользователей из profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
        return;
      }

      // Для каждого пользователя считаем количество бронирований
      const studentsWithBookings = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('slots')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', profile.id);

          return {
            ...profile,
            booking_count: count || 0
          };
        })
      );

      setStudents(studentsWithBookings);
      setLoading(false);
    };

    fetchStudents();
  }, []);

  const exportToCSV = () => {
    // Заголовки
    const headers = ['Email', 'Роль', 'Записей', 'Дата регистрации'];

    // Данные
    const rows = students.map((s) => [
      s.email,
      s.role === 'admin' ? 'Админ' : 'Ученик',
      s.booking_count.toString(),
      new Date(s.created_at).toLocaleDateString('ru-RU')
    ]);

    // Формируем CSV
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Скачиваем
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV файл экспортирован!', {
      description: `Список из ${students.length} учеников`
    });
  };

  // Фильтруем студентов по поисковому запросу
  const filteredStudents = students.filter((student) =>
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ученики</h2>
          <p className="text-muted-foreground">Список всех зарегистрированных пользователей</p>
        </div>
        <Button onClick={exportToCSV} disabled={students.length === 0}>
          Экспорт в CSV
        </Button>
      </div>

      {/* Поиск */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Поиск по email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Найдено: {filteredStudents.length} из {students.length}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего учеников</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter((s) => s.booking_count > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Есть хотя бы одна запись</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Администраторов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter((s) => s.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>Просмотр всех зарегистрированных пользователей</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'Нет учеников, соответствующих запросу' : 'Еще нет учеников'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Тариф</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Записей</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {student.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="hover:underline hover:text-primary transition-colors"
                        >
                          {student.email}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.display_name || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {format(new Date(student.created_at), 'd MMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      {student.tariff_id && tariffs[student.tariff_id] ? (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: tariffs[student.tariff_id].color,
                            color: tariffs[student.tariff_id].color
                          }}
                        >
                          {tariffs[student.tariff_id].name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.role === 'admin' ? 'destructive' : 'secondary'}>
                        {student.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
