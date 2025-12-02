'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { BookingChartData } from '@/types';

interface BookingChartProps {
  data: BookingChartData[];
}

export function BookingChart({ data }: BookingChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Статистика бронирований</CardTitle>
        <CardDescription>Занятость слотов за последние 7 дней</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(265 15% 35%)" opacity={0.2} />
            <XAxis
              dataKey="date"
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
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(240, 8%, 12%)',
                border: '1px solid hsl(265 15% 35%)',
                borderRadius: '8px',
                color: 'hsl(260 5% 95%)'
              }}
              cursor={{ fill: 'hsl(265 15% 35% / 0.1)' }}
            />
            <Legend
              wrapperStyle={{
                color: 'hsl(260 5% 95%)',
                paddingTop: '20px'
              }}
            />
            <Bar
              dataKey="booked"
              name="Забронировано"
              fill="hsl(142, 76%, 46%)"
              radius={[6, 6, 0, 0]}
            />
            <Bar dataKey="free" name="Свободно" fill="hsl(265, 85%, 70%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
