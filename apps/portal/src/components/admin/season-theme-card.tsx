'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Snowflake, Flower2, Sun, Leaf, Wand2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Season = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';

const seasons: {
  id: Season;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}[] = [
  {
    id: 'auto',
    label: 'Авто',
    icon: <Wand2 className="w-5 h-5" />,
    color: 'text-purple-400',
    bgColor: 'from-purple-500/20 to-purple-600/10',
    description: 'По дате'
  },
  {
    id: 'spring',
    label: 'Весна',
    icon: <Flower2 className="w-5 h-5" />,
    color: 'text-pink-400',
    bgColor: 'from-pink-500/20 to-pink-600/10',
    description: 'Сакура'
  },
  {
    id: 'summer',
    label: 'Лето',
    icon: <Sun className="w-5 h-5" />,
    color: 'text-amber-400',
    bgColor: 'from-amber-500/20 to-amber-600/10',
    description: 'Солнце'
  },
  {
    id: 'autumn',
    label: 'Осень',
    icon: <Leaf className="w-5 h-5" />,
    color: 'text-orange-400',
    bgColor: 'from-orange-500/20 to-orange-600/10',
    description: 'Листья'
  },
  {
    id: 'winter',
    label: 'Зима',
    icon: <Snowflake className="w-5 h-5" />,
    color: 'text-sky-400',
    bgColor: 'from-sky-500/20 to-sky-600/10',
    description: 'Снег'
  }
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('key', 'season_theme');

      if (data && data.length > 0) {
        setCurrentSeason((data[0].value as Season) || 'auto');
      }
    };
    loadSettings();
  }, []);

  const saveSetting = useCallback(async (value: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(
          { key: 'season_theme', value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) {
        console.error('Failed to save season theme:', error);
        alert(`Ошибка сохранения: ${error.message}`);
      } else {
        console.log('Season theme saved:', value);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  }, []);

  const handleSeasonChange = async (season: Season) => {
    setCurrentSeason(season);
    await saveSetting(season);
  };

  const actualSeason = currentSeason === 'auto' ? getCurrentSeasonByDate() : currentSeason;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🎨 Тема лендинга
          {saving && (
            <span className="text-xs text-muted-foreground animate-pulse">Сохранение...</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Season buttons grid */}
        <div className="grid grid-cols-5 gap-2">
          {seasons.map((season) => {
            const isSelected = currentSeason === season.id;
            const isActual = actualSeason === season.id && currentSeason === 'auto';

            return (
              <button
                key={season.id}
                onClick={() => handleSeasonChange(season.id)}
                disabled={saving}
                className={cn(
                  'relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 border',
                  isSelected
                    ? `bg-gradient-to-br ${season.bgColor} border-white/20 shadow-lg`
                    : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                )}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                )}

                {/* Icon */}
                <span
                  className={cn(
                    'transition-colors',
                    isSelected || isActual ? season.color : 'text-muted-foreground'
                  )}
                >
                  {season.icon}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium',
                    isSelected ? 'text-white' : 'text-muted-foreground'
                  )}
                >
                  {season.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current status */}
        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Активная тема:</span>
            <span
              className={cn(
                'text-sm font-medium',
                seasons.find((s) => s.id === actualSeason)?.color
              )}
            >
              {seasons.find((s) => s.id === actualSeason)?.label}
              {currentSeason === 'auto' && ' (авто)'}
            </span>
          </div>
          {currentSeason === 'auto' && (
            <p className="text-xs text-muted-foreground mt-1">
              Тема выбирается автоматически по текущему месяцу
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
