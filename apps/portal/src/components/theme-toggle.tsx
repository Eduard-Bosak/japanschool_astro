'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-neutral-400 hover:text-white hover:bg-neutral-800"
      >
        <Sun className="mr-2 h-4 w-4" />
        Тема
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full justify-start text-amber-400 hover:text-amber-300 hover:bg-neutral-800"
    >
      {isDark ? (
        <>
          <Sun className="mr-2 h-4 w-4" />
          Светлая тема
        </>
      ) : (
        <>
          <Moon className="mr-2 h-4 w-4" />
          Тёмная тема
        </>
      )}
    </Button>
  );
}
