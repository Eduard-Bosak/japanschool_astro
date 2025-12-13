'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  Calendar,
  History,
  BookOpen,
  User,
  Bell,
  LogOut,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
}

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
  { href: '/dashboard/schedule', icon: Calendar, label: 'Расписание' },
  { href: '/dashboard/history', icon: History, label: 'История' },
  { href: '/dashboard/materials', icon: BookOpen, label: 'Материалы' },
  { href: '/dashboard/profile', icon: User, label: 'Профиль' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Уведомления' }
];

export function StudentSidebar({ className, onClick }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; display_name?: string } | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser }
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, balance')
          .eq('id', authUser.id)
          .single();

        setUser({
          email: authUser.email,
          display_name: profile?.display_name
        });
        setBalance(profile?.balance || 0);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div
      className={cn('h-screen bg-neutral-900 border-r border-neutral-800 flex flex-col', className)}
    >
      {/* Logo */}
      <div className="p-6 border-b border-neutral-800">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClick}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
            日
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Japan School</h1>
            <p className="text-xs text-neutral-400">Личный кабинет</p>
          </div>
        </Link>
      </div>

      {/* Balance Card */}
      <div className="px-4 py-4">
        <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-300 font-medium">Баланс</span>
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white">{balance}</div>
          <p className="text-xs text-amber-500 mt-1">
            {balance > 0 ? 'уроков доступно' : 'Пополните баланс'}
          </p>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 px-3 py-2">
        <motion.div className="space-y-1">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} onClick={onClick}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="student-sidebar-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-amber-500"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div
                    className={cn(
                      'flex items-center w-full px-4 py-2.5 rounded-lg text-sm transition-colors duration-150',
                      isActive
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800 space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-semibold text-sm">
            {user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.display_name || 'Ученик'}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </div>
    </div>
  );
}
