'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  ClipboardCheck,
  Bell,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
}

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/slots', icon: Calendar, label: 'Слоты и Запись' },
  { href: '/admin/students', icon: Users, label: 'Ученики' },
  { href: '/admin/journal', icon: ClipboardCheck, label: 'Посещаемость' },
  { href: '/admin/activity', icon: Activity, label: 'Активность' },
  { href: '/admin/notifications', icon: Bell, label: 'Уведомления' },
  { href: '/admin/settings', icon: Settings, label: 'Настройки' }
];

export function Sidebar({ className, onClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn('h-screen bg-card border-r flex flex-col', className)}>
      <div className="p-6 border-b">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3 group" onClick={onClick}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
            J
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Japan School
            </h1>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </Link>
      </div>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <motion.div className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href} onClick={onClick}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start transition-all duration-200',
                        isActive && 'bg-secondary/80 text-secondary-foreground font-medium'
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>

        <div className="px-3 py-2">
          <motion.h2
            className="mb-2 px-4 text-lg font-semibold tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            Система
          </motion.h2>
          <div className="space-y-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                onClick={() => {
                  // Logout logic здесь
                  window.location.href = '/login';
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="px-3 py-2 border-t">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-muted-foreground">Тема</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Подсказка по Ctrl+K */}
        <div className="px-3 py-2 mt-auto border-t">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="space-y-2"
          >
            <div className="px-4 py-2 text-xs text-muted-foreground bg-secondary/30 rounded-md">
              Нажмите{' '}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>{' '}
              для быстрого поиска
            </div>
            <div className="px-4 py-2 text-xs text-muted-foreground bg-secondary/30 rounded-md">
              Нажмите{' '}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                ?
              </kbd>{' '}
              для справки
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
