'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Snowflake, Flower2, Sun, Leaf, Wand2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Season = 'auto' | 'winter' | 'spring' | 'summer' | 'autumn';

const seasons: {
  id: Season;
  label: string;
  labelJp: string;
  icon: React.ReactNode;
  gradient: string;
  description: string;
}[] = [
  {
    id: 'auto',
    label: 'Авто',
    labelJp: '自動',
    icon: <Wand2 className="w-5 h-5" />,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    description: 'Автоматически по дате'
  },
  {
    id: 'winter',
    label: 'Зима',
    labelJp: '冬',
    icon: <Snowflake className="w-5 h-5" />,
    gradient: 'from-blue-400 via-cyan-400 to-sky-300',
    description: '雪 · Снежинки и уют'
  },
  {
    id: 'spring',
    label: 'Весна',
    labelJp: '春',
    icon: <Flower2 className="w-5 h-5" />,
    gradient: 'from-pink-400 via-rose-400 to-pink-300',
    description: '桜 · Сакура и цветение'
  },
  {
    id: 'summer',
    label: 'Лето',
    labelJp: '夏',
    icon: <Sun className="w-5 h-5" />,
    gradient: 'from-amber-400 via-orange-400 to-yellow-300',
    description: '太陽 · Солнце и тепло'
  },
  {
    id: 'autumn',
    label: 'Осень',
    labelJp: '秋',
    icon: <Leaf className="w-5 h-5" />,
    gradient: 'from-orange-500 via-red-500 to-amber-500',
    description: '紅葉 · Момидзи и уют'
  }
];

const intensityLevels = [
  { value: 0, label: 'Выкл', emoji: '🚫', jp: 'オフ' },
  { value: 1, label: 'Лёгкий', emoji: '✨', jp: '軽い' },
  { value: 2, label: 'Средний', emoji: '🌟', jp: '普通' },
  { value: 3, label: 'Сильный', emoji: '💫', jp: '強い' },
  { value: 4, label: 'Максимум', emoji: '🎆', jp: '最大' }
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
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [intensity, setIntensity] = useState(2);
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

  const saveSetting = useCallback(async (key: string, value: string) => {
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
  }, []);

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

  const handleIntensityChange = async (newIntensity: number) => {
    setIntensity(newIntensity);
    await saveSetting('season_intensity', newIntensity.toString());
  };

  const actualSeason = currentSeason === 'auto' ? getCurrentSeasonByDate() : currentSeason;
  const seasonInfo = seasons.find((s) => s.id === actualSeason) || seasons[0];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
              季節のテーマ · Сезонная тема
              {saved && (
                <span className="text-sm text-green-400 font-normal animate-pulse">✓ 保存済み</span>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Настройте сезонное оформление для создания уюта
            </CardDescription>
          </div>
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500',
              `bg-gradient-to-br ${seasonInfo.gradient}`
            )}
          >
            {seasonInfo.icon}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Auto mode toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20">
          <div className="space-y-0.5">
            <Label htmlFor="auto-mode" className="font-medium flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              自動モード · Авторежим
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
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">選択 · Выберите сезон</Label>
          <div className="grid grid-cols-5 gap-2">
            {seasons.map((season) => (
              <Button
                key={season.id}
                variant="outline"
                className={cn(
                  'flex flex-col h-auto py-3 px-2 gap-1.5 transition-all duration-300 border-2',
                  currentSeason === season.id
                    ? `bg-gradient-to-br ${season.gradient} border-transparent text-white shadow-lg scale-105`
                    : 'hover:border-purple-500/50 hover:bg-purple-500/10'
                )}
                onClick={() => handleSeasonChange(season.id)}
                disabled={saving}
              >
                <span className="text-lg">{season.icon}</span>
                <span className="text-xs font-medium">{season.label}</span>
                <span className="text-[10px] opacity-70">{season.labelJp}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Intensity selector - кнопки вместо слайдера */}
        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <Label className="font-medium flex items-center gap-2">
              <span className="text-lg">🎚️</span>
              強度 · Интенсивность эффектов
            </Label>
            <span className="text-sm font-bold text-amber-400">
              {intensityLevels[intensity].emoji} {intensityLevels[intensity].label}
            </span>
          </div>

          {/* Intensity buttons */}
          <div className="grid grid-cols-5 gap-2">
            {intensityLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => handleIntensityChange(level.value)}
                disabled={saving}
                className={cn(
                  'flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 border-2',
                  intensity === level.value
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-transparent text-white shadow-lg scale-105'
                    : 'bg-background/50 border-border hover:border-amber-500/50 hover:bg-amber-500/10'
                )}
              >
                <span className="text-xl">{level.emoji}</span>
                <span className="text-[10px] font-medium mt-1">{level.jp}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="relative overflow-hidden rounded-xl border border-border/50">
          <div
            className={cn(
              'p-4 transition-all duration-500',
              actualSeason === 'winter' && 'bg-sky-500/10',
              actualSeason === 'spring' && 'bg-pink-500/10',
              actualSeason === 'summer' && 'bg-amber-500/10',
              actualSeason === 'autumn' && 'bg-orange-500/10',
              currentSeason === 'auto' && 'bg-purple-500/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-white',
                  `bg-gradient-to-br ${seasonInfo.gradient}`
                )}
              >
                {seasonInfo.icon}
              </div>
              <div>
                <p className="font-medium">
                  {seasons.find((s) => s.id === actualSeason)?.label}
                  {currentSeason === 'auto' && (
                    <span className="text-purple-400 ml-2 text-sm">· 自動</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {seasons.find((s) => s.id === actualSeason)?.description}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl">{intensityLevels[intensity].emoji}</p>
                <p className="text-xs text-muted-foreground">{intensityLevels[intensity].label}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
