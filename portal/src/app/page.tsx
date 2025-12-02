import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1d1d1f] via-[#2c2c2e] to-[#1d1d1f] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#1d1d1f]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Japan School</span>
          </div>
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Войти
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300">
              Личный Кабинет
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Управление уроками, расписанием и успеваемостью
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Admin Card */}
            <Link href="/login" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2c2c2e] to-[#1d1d1f] border border-white/10 p-8 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>

                  <h2 className="text-2xl font-bold mb-2 text-white">Администратор</h2>
                  <p className="text-gray-400 mb-6">
                    Управление расписанием, учениками и оплатами. Полный контроль над системой.
                  </p>

                  <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 group-hover:text-blue-300">
                    Войти как Админ
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Student Card */}
            <Link href="/login" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2c2c2e] to-[#1d1d1f] border border-white/10 p-8 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>

                  <h2 className="text-2xl font-bold mb-2 text-white">Ученик</h2>
                  <p className="text-gray-400 mb-6">
                    Запись на уроки, история занятий и учебные материалы. Личный кабинет студента.
                  </p>

                  <div className="inline-flex items-center gap-2 text-sm font-medium text-green-400 group-hover:text-green-300">
                    Войти как Ученик
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Features */}
          <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-white">Умное расписание</h3>
              <p className="text-sm text-gray-400">Автоматическое управление слотами и записями</p>
            </div>

            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-white">Аналитика</h3>
              <p className="text-sm text-gray-400">Детальная статистика по посещаемости</p>
            </div>

            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <svg
                  className="h-6 w-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-white">Управление балансом</h3>
              <p className="text-sm text-gray-400">Прозрачная система оплат и возвратов</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>© 2024 Japan School. Портал для управления уроками японского языка.</p>
        </div>
      </footer>
    </div>
  );
}
