'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Snowflake, Flower2, Sun, Leaf, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Season = 'auto' | 'winter' | 'spring' | 'summer' | 'autumn';

const seasons: { id: Season; icon: React.ReactNode; color: string }[] = [
  { id: 'auto', icon: <Wand2 className="w-4 h-4" />, color: 'text-purple-400' },
  { id: 'winter', icon: <Snowflake className="w-4 h-4" />, color: 'text-sky-400' },
  { id: 'spring', icon: <Flower2 className="w-4 h-4" />, color: 'text-pink-400' },
  { id: 'summer', icon: <Sun className="w-4 h-4" />, color: 'text-amber-400' },
  { id: 'autumn', icon: <Leaf className="w-4 h-4" />, color: 'text-orange-400' }
];

function getCurrentSeasonByDate(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
}

export function SeasonThemeCard() {
  const [currentSeason, setCurrentSeason] = useState<Season>('auto');
  const [intensity, setIntensity] = useState(2);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['season_theme', 'season_intensity']);

      if (data) {
        const settings = data.reduce(
          (acc, s) => {
            acc[s.key] = s.value;
            return acc;
          },
          {} as Record<string, string>
        );
        setCurrentSeason((settings['season_theme'] as Season) || 'auto');
        setIntensity(parseInt(settings['season_intensity'] || '2', 10));
      }
    };
    loadSettings();
  }, []);

  const saveSetting = useCallback(async (key: string, value: string) => {
    setSaving(true);
    await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setSaving(false);
  }, []);

  const handleSeasonChange = async (season: Season) => {
    setCurrentSeason(season);
    await saveSetting('season_theme', season);
  };

  const handleIntensityChange = async (enabled: boolean) => {
    const newIntensity = enabled ? 2 : 0;
    setIntensity(newIntensity);
    await saveSetting('season_intensity', newIntensity.toString());
  };

  const actualSeason = currentSeason === 'auto' ? getCurrentSeasonByDate() : currentSeason;
  const seasonInfo = seasons.find((s) => s.id === actualSeason) || seasons[0];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left: Season selector */}
          <div className="flex items-center gap-1">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => handleSeasonChange(season.id)}
                disabled={saving}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  currentSeason === season.id
                    ? `${season.color} bg-white/10`
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {season.icon}
              </button>
            ))}
          </div>

          {/* Right: Toggle effects */}
          <div className="flex items-center gap-3">
            <span className={cn('text-sm transition-colors', seasonInfo.color)}>
              {actualSeason === 'winter' && '❄️'}
              {actualSeason === 'spring' && '🌸'}
              {actualSeason === 'summer' && '☀️'}
              {actualSeason === 'autumn' && '🍂'}
              {currentSeason === 'auto' && ' auto'}
            </span>
            <Switch
              checked={intensity > 0}
              onCheckedChange={handleIntensityChange}
              disabled={saving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
