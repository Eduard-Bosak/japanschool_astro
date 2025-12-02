'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Snowflake, Flower2, Sun, Leaf, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Season = 'auto' | 'winter' | 'spring' | 'summer' | 'autumn';

const seasons: {
  id: Season;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}[] = [
  {
    id: 'auto',
    label: 'Авто',
    icon: <Wand2 className="w-5 h-5" />,
    color: 'from-violet-500 to-purple-500',
    description: 'Автоматически по дате'
  },
  {
    id: 'winter',
    label: 'Зима',
    icon: <Snowflake className="w-5 h-5" />,
    color: 'from-blue-400 to-cyan-300',
    description: 'Снежинки и уют'
  },
  {
    id: 'spring',
    label: 'Весна',
    icon: <Flower2 className="w-5 h-5" />,
    color: 'from-pink-400 to-rose-300',
    description: 'Сакура и цветение'
  },
  {
    id: 'summer',
    label: 'Лето',
    icon: <Sun className="w-5 h-5" />,
    color: 'from-amber-400 to-yellow-300',
    description: 'Солнце и тепло'
  },
  {
    id: 'autumn',
    label: 'Осень',
    icon: <Leaf className="w-5 h-5" />,
    color: 'from-orange-500 to-amber-400',
    description: 'Листопад и уют'
  }
];

const intensityLabels = ['Выкл', 'Лёгкий', 'Средний', 'Сильный', 'Максимум'];

function getCurrentSeasonByDate(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
}

export function SeasonThemeCard() {
  const [currentSeason, setCurrentSeason] = useState<Season>('auto');
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [intensity, setIntensity] = useState(2); // 0-4: off, light, medium, strong, max
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['season_theme', 'season_auto_enabled', 'season_intensity']);

      if (data) {
        const settings = data.reduce(
          (acc, s) => {
            acc[s.key] = s.value;
            return acc;
          },
          {} as Record<string, string>
        );

        setCurrentSeason((settings['season_theme'] as Season) || 'auto');
        setAutoEnabled(settings['season_auto_enabled'] !== 'false');
        setIntensity(parseInt(settings['season_intensity'] || '2', 10));
      }
    };

    loadSettings();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);

    const { error } = await supabase.from('system_settings').upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'key'
      }
    );

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  };

  const handleSeasonChange = async (season: Season) => {
    setCurrentSeason(season);
    await saveSetting('season_theme', season);
  };

  const handleAutoToggle = async (enabled: boolean) => {
    setAutoEnabled(enabled);
    await saveSetting('season_auto_enabled', enabled.toString());
    if (enabled) {
      setCurrentSeason('auto');
      await saveSetting('season_theme', 'auto');
    }
  };

  const handleIntensityChange = async (value: number[]) => {
    const newIntensity = value[0];
    setIntensity(newIntensity);
    await saveSetting('season_intensity', newIntensity.toString());
  };

  const actualSeason = currentSeason === 'auto' ? getCurrentSeasonByDate() : currentSeason;
  const seasonInfo = seasons.find((s) => s.id === actualSeason) || seasons[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🎨 Сезонная тема
              {saved && <span className="text-sm text-green-500 font-normal">Сохранено!</span>}
            </CardTitle>
            <CardDescription>Настройте сезонное оформление лендинга</CardDescription>
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white',
              seasonInfo.color
            )}
          >
            {seasonInfo.icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto mode toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="auto-mode" className="font-medium">
              Авторежим
            </Label>
            <p className="text-sm text-muted-foreground">Автоматически менять тему по календарю</p>
          </div>
          <Switch
            id="auto-mode"
            checked={autoEnabled && currentSeason === 'auto'}
            onCheckedChange={handleAutoToggle}
          />
        </div>

        {/* Season selector */}
        <div className="grid grid-cols-5 gap-2">
          {seasons.map((season) => (
            <Button
              key={season.id}
              variant={currentSeason === season.id ? 'default' : 'outline'}
              className={cn(
                'flex flex-col h-auto py-3 gap-1 transition-all',
                currentSeason === season.id && `bg-gradient-to-br ${season.color} border-0`
              )}
              onClick={() => handleSeasonChange(season.id)}
              disabled={saving}
            >
              {season.icon}
              <span className="text-xs">{season.label}</span>
            </Button>
          ))}
        </div>

        {/* Intensity slider */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Интенсивность эффектов</Label>
            <span className="text-sm font-medium text-primary">{intensityLabels[intensity]}</span>
          </div>
          <Slider
            value={[intensity]}
            onValueChange={handleIntensityChange}
            max={4}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>🚫</span>
            <span>✨</span>
            <span>🌟</span>
            <span>💫</span>
            <span>🎆</span>
          </div>
        </div>

        {/* Current status */}
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm">
            <span className="text-muted-foreground">Сейчас на сайте: </span>
            <span className="font-medium">
              {seasons.find((s) => s.id === actualSeason)?.label}
              {currentSeason === 'auto' && ' (авто)'}
            </span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-medium">{intensityLabels[intensity]}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {seasons.find((s) => s.id === actualSeason)?.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
