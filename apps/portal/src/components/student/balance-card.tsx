'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <Card className="bg-linear-to-br from-yellow-50 to-orange-50 border-yellow-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-yellow-800">Баланс уроков</CardTitle>
        <Wallet className="h-4 w-4 text-yellow-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-yellow-900">{balance}</div>
        <p className="text-xs text-yellow-700 mt-1">
          {balance > 0 ? 'Доступно для записи' : 'Пополните баланс'}
        </p>
      </CardContent>
    </Card>
  );
}
