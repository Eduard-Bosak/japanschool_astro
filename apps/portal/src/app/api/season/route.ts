import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getCurrentSeasonByDate(): string {
  const month = new Date().getMonth() + 1; // 1-12

  if (month >= 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
}

export async function GET() {
  try {
    // Get season settings from database
    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['season_theme', 'season_auto_enabled', 'season_intensity']);

    const settingsMap =
      settings?.reduce(
        (acc, s) => {
          acc[s.key] = s.value;
          return acc;
        },
        {} as Record<string, string>
      ) || {};

    const autoEnabled = settingsMap['season_auto_enabled'] !== 'false';
    const themeSetting = settingsMap['season_theme'] || 'auto';
    const intensity = parseInt(settingsMap['season_intensity'] || '2', 10);

    let season: string;

    if (themeSetting === 'auto' || autoEnabled) {
      season = getCurrentSeasonByDate();
    } else {
      season = themeSetting;
    }

    return NextResponse.json(
      {
        season,
        mode: themeSetting === 'auto' ? 'auto' : 'manual',
        autoEnabled,
        intensity: Math.max(0, Math.min(4, intensity)) // Clamp 0-4
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    );
  } catch {
    // Fallback to auto-detection if DB fails
    return NextResponse.json(
      {
        season: getCurrentSeasonByDate(),
        mode: 'auto',
        autoEnabled: true,
        intensity: 2 // Default medium intensity
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
