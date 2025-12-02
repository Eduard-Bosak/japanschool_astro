'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Loader2, Activity, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type ActivityLog = {
  id: string;
  user_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (searchQuery) {
      return logs.filter(
        (log) =>
          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return logs;
  }, [searchQuery, logs]);

  const getActionBadge = (action: string) => {
    if (action.includes('create') || action.includes('создан')) {
      return <Badge className="bg-green-600">Создание</Badge>;
    }
    if (action.includes('delete') || action.includes('удален')) {
      return <Badge variant="destructive">Удаление</Badge>;
    }
    if (action.includes('update') || action.includes('обновлен')) {
      return <Badge className="bg-blue-600">Обновление</Badge>;
    }
    return <Badge variant="secondary">Действие</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Журнал активности
          </h2>
          <p className="text-muted-foreground">История действий администраторов</p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по действиям, пользователю, типу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">за последнее время</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>История действий</CardTitle>
          <CardDescription>
            Последние {filteredLogs.length} записей
            {searchQuery && ` (найдено по запросу "${searchQuery}")`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'Ничего не найдено' : 'Нет записей в журнале'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Время</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Действие</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Детали</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-accent/50">
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), 'dd MMM HH:mm:ss', { locale: ru })}
                      </TableCell>
                      <TableCell className="font-medium">{log.user_email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionBadge(log.action)}
                          <span className="text-sm">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.entity_type ? (
                          <Badge variant="outline">{log.entity_type}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.details && Object.keys(log.details).length > 0
                          ? JSON.stringify(log.details)
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
