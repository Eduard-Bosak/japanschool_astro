'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  FileText,
  LogOut,
  ClipboardCheck,
  Activity,
  Bell
} from 'lucide-react';

const commandItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Слоты и Запись', href: '/admin/slots', icon: Calendar },
  { label: 'Ученики', href: '/admin/students', icon: Users },
  { label: 'Посещаемость', href: '/admin/journal', icon: ClipboardCheck },
  { label: 'Активность', href: '/admin/activity', icon: Activity },
  { label: 'Уведомления', href: '/admin/notifications', icon: Bell },
  { label: 'Настройки', href: '/admin/settings', icon: Settings }
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Поиск команд..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        <CommandGroup heading="Навигация">
          {commandItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Действия">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                const event = new CustomEvent('exportCSV');
                document.dispatchEvent(event);
              })
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Экспорт CSV</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/login'))}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Выйти</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
