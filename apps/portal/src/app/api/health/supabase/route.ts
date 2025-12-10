import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        connected: false,
        error: 'Supabase не настроен',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to query a simple table
    const start = Date.now();
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    const latency = Date.now() - start;

    if (error && !error.message.includes('does not exist')) {
      return NextResponse.json({
        connected: false,
        error: error.message,
        latency,
      });
    }

    // Count tables (approximate)
    const tables = ['profiles', 'lessons', 'trial_requests', 'activity_logs'];
    let tableCount = 0;

    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (!tableError) tableCount++;
    }

    return NextResponse.json({
      connected: true,
      tables: tableCount,
      latency,
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
