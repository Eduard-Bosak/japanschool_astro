'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import type { PopularTimeData } from '@/types';

interface PopularTimeChartProps {
  data: PopularTimeData[];
}

export function PopularTimeChart({ data }: PopularTimeChartProps) {
  const { theme } = useTheme();

  // Find max value for scaling color intensity
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Популярное время</CardTitle>
        <CardDescription>Распределение записей по часам дня</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="hour"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Время
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].payload.hour}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Записей
                            </span>
                            <span className="font-bold">{payload[0].value}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      theme === 'dark'
                        ? `hsl(263, 70%, ${60 + (entry.count / maxCount) * 20}%)`
                        : `hsl(263, 70%, ${60 - (entry.count / maxCount) * 20}%)`
                    }
                    fillOpacity={0.6 + (entry.count / maxCount) * 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
