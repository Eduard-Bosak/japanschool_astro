import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const { error: dbError } = await supabase.from('system_settings').select('key').limit(1);

    const dbStatus = !dbError;
    const responseTime = Date.now() - startTime;

    // Log health check to database for uptime tracking (ignore errors)
    try {
      await supabase.from('health_logs').insert({
        status: dbStatus ? 'healthy' : 'unhealthy',
        response_time_ms: responseTime,
        database_ok: dbStatus,
        checked_at: new Date().toISOString()
      });
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      {
        status: dbStatus ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTimeMs: responseTime,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: dbStatus ? 'ok' : 'error',
          api: 'ok'
        }
      },
      {
        status: dbStatus ? 200 : 503,
        headers: { 'Cache-Control': 'no-store' }
      }
    );
  } catch {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTimeMs: responseTime,
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}

// Calculate uptime percentage
export async function POST() {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get health logs for different periods
    const [logs24h, logs7d] = await Promise.all([
      supabase.from('health_logs').select('status').gte('checked_at', last24h.toISOString()),
      supabase.from('health_logs').select('status').gte('checked_at', last7d.toISOString())
    ]);

    const calculateUptime = (data: { status: string }[] | null) => {
      if (!data || data.length === 0) return 99.9; // No data = assume healthy
      const healthy = data.filter((d) => d.status === 'healthy').length;
      return Math.round((healthy / data.length) * 1000) / 10;
    };

    return NextResponse.json({
      uptime24h: calculateUptime(logs24h.data),
      uptime7d: calculateUptime(logs7d.data),
      totalChecks: logs24h.data?.length || 0,
      lastCheck: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ uptime24h: 99.9, uptime7d: 99.9, error: 'No data yet' });
  }
}
