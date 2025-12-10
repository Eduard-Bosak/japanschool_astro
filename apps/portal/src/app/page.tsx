'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white overflow-hidden">
      {/* Background effects - matching main landing */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Conic gradient overlay */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(240, 107, 147, 0.35), transparent 60%), radial-gradient(circle at 80% 60%, rgba(255, 193, 7, 0.25), transparent 65%)'
          }}
        />
        {/* Animated glow */}
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'rgba(240, 107, 147, 0.15)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{ background: 'rgba(255, 193, 7, 0.1)', animationDelay: '1s' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="https://japanschool.vercel.app" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#f06b93] to-[#ff9eb5] flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold group-hover:text-[#f06b93] transition-colors">
              Japan School
            </span>
          </Link>

          <Link
            href="https://japanschool.vercel.app"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← На главную
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-[#f06b93] bg-clip-text text-transparent">
              Личный кабинет
            </h1>
            <p className="text-gray-400">Войдите чтобы управлять уроками и расписанием</p>
          </div>

          {/* Login card */}
          <div
            className="rounded-2xl p-8 backdrop-blur-xl border border-white/10"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0))',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#f06b93] focus:ring-2 focus:ring-[#f06b93]/20 transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#f06b93] focus:ring-2 focus:ring-[#f06b93]/20 transition-all"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #ff9eb5 0%, #f06b93 100%)'
                }}
              >
                Войти
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0f1115] text-gray-500">или</span>
                </div>
              </div>

              {/* Register link */}
              <p className="text-center text-gray-400 text-sm">
                Нет аккаунта?{' '}
                <Link
                  href="https://japanschool.vercel.app/#contact"
                  className="text-[#f06b93] hover:text-[#ff9eb5] transition-colors font-medium"
                >
                  Запишитесь на урок
                </Link>
              </p>
            </form>
          </div>

          {/* Features */}
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl">📅</div>
              <p className="text-xs text-gray-500">Расписание</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">📚</div>
              <p className="text-xs text-gray-500">Материалы</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">📊</div>
              <p className="text-xs text-gray-500">Прогресс</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-gray-600">
        © 2024 Japan School
      </footer>
    </div>
  );
}
