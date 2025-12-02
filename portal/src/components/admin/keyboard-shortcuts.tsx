'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  {
    category: 'Навигация',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Открыть Command Palette' },
      { keys: ['Esc'], description: 'Закрыть модалки и диалоги' }
    ]
  },
  {
    category: 'Общее',
    items: [
      { keys: ['?'], description: 'Показать эту справку' },
      { keys: ['Ctrl', '/'], description: 'Показать горячие клавиши' }
    ]
  }
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ctrl+/ или ?
      if (
        (e.key === '/' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '?' && !e.metaKey && !e.ctrlKey)
      ) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Горячие клавиши
          </DialogTitle>
          <DialogDescription>
            Используйте эти сочетания клавиш для быстрой работы в админке
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <kbd
                          key={keyIdx}
                          className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
