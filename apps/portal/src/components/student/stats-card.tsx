'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock } from 'lucide-react';

type StatsCardProps = {
  totalCompleted: number;
  totalMissed: number;
  upcoming: number;
};

export function StatsCard({ totalCompleted, totalMissed, upcoming }: StatsCardProps) {
  const totalLessons = totalCompleted + totalMissed;
  const attendanceRate = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Attendance Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Посещаемость</CardTitle>
          {attendanceRate >= 80 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{attendanceRate}%</div>
          <p className="text-xs text-muted-foreground">
            {totalCompleted} из {totalLessons} уроков
          </p>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Проведено</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCompleted}</div>
          <p className="text-xs text-muted-foreground">Уроков завершено</p>
        </CardContent>
      </Card>

      {/* Missed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Пропущено</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMissed}</div>
          <p className="text-xs text-muted-foreground">Прогулов</p>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Предстоит</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcoming}</div>
          <p className="text-xs text-muted-foreground">Будущих уроков</p>
        </CardContent>
      </Card>
    </div>
  );
}
