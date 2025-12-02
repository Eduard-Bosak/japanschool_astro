'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Globe,
  Server,
  Clock,
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'checking';
  message: string;
  latency?: number;
  lastChecked?: Date;
}

interface SystemInfo {
  nodeVersion: string;
  nextVersion: string;
  environment: string;
  uptime: string;
}

export default function HealthCheckPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Supabase Connection', status: 'checking', message: 'Проверка...' },
    { name: 'Landing Site', status: 'checking', message: 'Проверка...' },
    { name: 'API Endpoints', status: 'checking', message: 'Проверка...' },
    { name: 'Authentication', status: 'checking', message: 'Проверка...' },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);

  const checkSupabase = useCallback(async (): Promise<HealthCheck> => {
    const start = Date.now();
    try {
      const res = await fetch('/api/health/supabase');
      const data = await res.json();
      const latency = Date.now() - start;

      if (data.connected) {
        return {
          name: 'Supabase Connection',
          status: 'ok',
          message: `Подключено (${data.tables} таблиц)`,
          latency,
          lastChecked: new Date(),
        };
      } else {
        return {
          name: 'Supabase Connection',
          status: 'error',
          message: data.error || 'Не удалось подключиться',
          latency,
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      return {
        name: 'Supabase Connection',
        status: 'error',
        message: `Ошибка: ${error instanceof Error ? error.message : 'Unknown'}`,
        latency: Date.now() - start,
        lastChecked: new Date(),
      };
    }
  }, []);

  const checkLandingSite = useCallback(async (): Promise<HealthCheck> => {
    const start = Date.now();
    try {
      // Check if landing site is accessible
      const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:4321';
      const res = await fetch(`${landingUrl}`, { mode: 'no-cors' });
      const latency = Date.now() - start;

      return {
        name: 'Landing Site',
        status: 'ok',
        message: `Доступен`,
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'Landing Site',
        status: 'warning',
        message: 'Возможно недоступен (CORS)',
        latency: Date.now() - start,
        lastChecked: new Date(),
      };
    }
  }, []);

  const checkAPIEndpoints = useCallback(async (): Promise<HealthCheck> => {
    const start = Date.now();
    try {
      const endpoints = ['/api/health'];
      const results = await Promise.all(
        endpoints.map((ep) => fetch(ep).then((r) => r.ok))
      );

      const allOk = results.every((r) => r);
      const latency = Date.now() - start;

      return {
        name: 'API Endpoints',
        status: allOk ? 'ok' : 'warning',
        message: allOk ? `${endpoints.length} эндпоинтов работает` : 'Некоторые эндпоинты недоступны',
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'API Endpoints',
        status: 'error',
        message: `Ошибка проверки`,
        latency: Date.now() - start,
        lastChecked: new Date(),
      };
    }
  }, []);

  const checkAuth = useCallback(async (): Promise<HealthCheck> => {
    const start = Date.now();
    try {
      const res = await fetch('/api/health/auth');
      const data = await res.json();
      const latency = Date.now() - start;

      return {
        name: 'Authentication',
        status: data.configured ? 'ok' : 'warning',
        message: data.configured ? 'Настроено' : 'Требуется настройка',
        latency,
        lastChecked: new Date(),
      };
    } catch {
      return {
        name: 'Authentication',
        status: 'warning',
        message: 'Не удалось проверить',
        latency: Date.now() - start,
        lastChecked: new Date(),
      };
    }
  }, []);

  const runAllChecks = useCallback(async () => {
    setIsRefreshing(true);

    const results = await Promise.all([
      checkSupabase(),
      checkLandingSite(),
      checkAPIEndpoints(),
      checkAuth(),
    ]);

    setChecks(results);
    setLastFullCheck(new Date());
    setIsRefreshing(false);

    // Get system info
    try {
      const res = await fetch('/api/health/system');
      const data = await res.json();
      setSystemInfo(data);
    } catch {
      // Ignore
    }
  }, [checkSupabase, checkLandingSite, checkAPIEndpoints, checkAuth]);

  useEffect(() => {
    runAllChecks();
    // Auto-refresh every 30 seconds
    const interval = setInterval(runAllChecks, 30000);
    return () => clearInterval(interval);
  }, [runAllChecks]);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-500">OK</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return <Badge className="bg-gray-400">Checking</Badge>;
    }
  };

  const overallStatus = checks.every((c) => c.status === 'ok')
    ? 'healthy'
    : checks.some((c) => c.status === 'error')
      ? 'unhealthy'
      : 'degraded';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏥 Health Check</h1>
          <p className="text-muted-foreground mt-1">
            Статус системы и диагностика
          </p>
        </div>
        <Button
          onClick={runAllChecks}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={`border-2 ${
        overallStatus === 'healthy' 
          ? 'border-green-500 bg-green-50 dark:bg-green-950' 
          : overallStatus === 'unhealthy'
            ? 'border-red-500 bg-red-50 dark:bg-red-950'
            : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      }`}>
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            {overallStatus === 'healthy' ? (
              <CheckCircle className="h-10 w-10 text-green-500" />
            ) : overallStatus === 'unhealthy' ? (
              <XCircle className="h-10 w-10 text-red-500" />
            ) : (
              <AlertCircle className="h-10 w-10 text-yellow-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {overallStatus === 'healthy' 
                  ? 'Всё работает!' 
                  : overallStatus === 'unhealthy'
                    ? 'Есть проблемы'
                    : 'Частичная работа'}
              </h2>
              <p className="text-muted-foreground">
                {lastFullCheck 
                  ? `Последняя проверка: ${lastFullCheck.toLocaleTimeString()}`
                  : 'Проверка...'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Проверок</p>
            <p className="text-2xl font-bold">
              {checks.filter(c => c.status === 'ok').length}/{checks.length}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Checks */}
      <div className="grid gap-4 md:grid-cols-2">
        {checks.map((check, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {check.name === 'Supabase Connection' && <Database className="h-4 w-4" />}
                {check.name === 'Landing Site' && <Globe className="h-4 w-4" />}
                {check.name === 'API Endpoints' && <Server className="h-4 w-4" />}
                {check.name === 'Authentication' && <Clock className="h-4 w-4" />}
                {check.name}
              </CardTitle>
              {getStatusBadge(check.status)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  <span className="text-sm">{check.message}</span>
                </div>
                {check.latency !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {check.latency}ms
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Info */}
      {systemInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Системная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-4 text-sm">
              <div>
                <span className="text-muted-foreground">Node.js:</span>{' '}
                <span className="font-mono">{systemInfo.nodeVersion}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Next.js:</span>{' '}
                <span className="font-mono">{systemInfo.nextVersion}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Окружение:</span>{' '}
                <Badge variant="outline">{systemInfo.environment}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Uptime:</span>{' '}
                <span>{systemInfo.uptime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
