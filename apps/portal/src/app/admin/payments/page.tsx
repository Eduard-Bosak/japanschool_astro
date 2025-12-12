'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Payment } from '@/types';

type MonthlyRevenue = {
  month: string;
  revenue: number;
  count: number;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [stats, setStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    totalYear: 0,
    avgPayment: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);

      // Fetch recent payments with joined data
      const { data: paymentData } = await supabase
        .from('payments')
        .select(
          `
          *,
          profiles!payments_student_id_fkey(email),
          tariff_plans!payments_tariff_id_fkey(name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(20);

      if (paymentData) {
        const formatted = paymentData.map((p) => ({
          ...p,
          student_email: p.profiles?.email,
          tariff_name: p.tariff_plans?.name
        }));
        setPayments(formatted);
      }

      // Calculate stats
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const yearStart = new Date(now.getFullYear(), 0, 1);

      // This month
      const { data: thisMonthData } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', thisMonthStart.toISOString())
        .eq('status', 'completed');

      // Last month
      const { data: lastMonthData } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .eq('status', 'completed');

      // This year
      const { data: yearData } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', yearStart.toISOString())
        .eq('status', 'completed');

      const thisMonthTotal = thisMonthData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const lastMonthTotal = lastMonthData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const yearTotal = yearData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const avgPayment =
        yearData && yearData.length > 0 ? Math.round(yearTotal / yearData.length) : 0;

      setStats({
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        totalYear: yearTotal,
        avgPayment
      });

      // Monthly revenue for chart (last 6 months)
      const monthlyRevenue: MonthlyRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: monthData } = await supabase
          .from('payments')
          .select('amount')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
          .eq('status', 'completed');

        monthlyRevenue.push({
          month: format(monthDate, 'MMM', { locale: ru }),
          revenue: monthData?.reduce((sum, p) => sum + p.amount, 0) || 0,
          count: monthData?.length || 0
        });
      }
      setMonthlyData(monthlyRevenue);

      setLoading(false);
    };

    fetchPayments();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ru-RU') + ' ₽';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      completed: { variant: 'default', label: 'Оплачено' },
      pending: { variant: 'secondary', label: 'Ожидает' },
      refunded: { variant: 'outline', label: 'Возврат' },
      failed: { variant: 'destructive', label: 'Ошибка' }
    };
    const { variant, label } = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const trend =
    stats.lastMonth > 0
      ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Платежи и выручка</h2>
        <p className="text-muted-foreground">Статистика оплат и финансовые показатели</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Этот месяц</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(stats.thisMonth)}
            </div>
            {trend !== 0 && (
              <div
                className={`flex items-center text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trend > 0 ? '+' : ''}
                {trend}% от прошлого месяца
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Прошлый месяц</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.lastMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">За год</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalYear)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgPayment)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика выручки</CardTitle>
          <CardDescription>Доход за последние 6 месяцев</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f06b93" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f06b93" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(265 15% 35%)" opacity={0.2} />
              <XAxis
                dataKey="month"
                stroke="hsl(260 5% 75%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(260 5% 75%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(240, 8%, 12%)',
                  border: '1px solid hsl(265 15% 35%)',
                  borderRadius: '8px',
                  color: 'hsl(260 5% 95%)'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Выручка']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f06b93"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Последние платежи</CardTitle>
          <CardDescription>История транзакций</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет платежей</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Студент</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Способ</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(payment.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="font-medium">{payment.student_email || '—'}</TableCell>
                    <TableCell className="font-bold text-green-500">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.payment_method === 'card'
                          ? '💳 Карта'
                          : payment.payment_method === 'cash'
                            ? '💵 Наличные'
                            : payment.payment_method === 'transfer'
                              ? '🏦 Перевод'
                              : '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
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
