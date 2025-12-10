'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Проверяем роль пользователя
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Перенаправляем в зависимости от роли
      router.refresh();

      if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError((err as Error).message || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      alert('Регистрация успешна! Проверьте почту для подтверждения или просто войдите.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(240, 107, 147, 0.35), transparent 60%), radial-gradient(circle at 80% 60%, rgba(255, 193, 7, 0.25), transparent 65%)'
          }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'rgba(240, 107, 147, 0.15)' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#f06b93] to-[#ff9eb5] flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold group-hover:text-[#f06b93] transition-colors">
              Japan School
            </span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-white to-[#f06b93] bg-clip-text text-transparent">
              Вход в систему
            </h1>
            <p className="text-gray-400">Введите email и пароль для входа</p>
          </div>

          {/* Login card */}
          <div
            className="rounded-2xl p-8 backdrop-blur-xl border border-white/10"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0))',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
          >
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error alert */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#f06b93] focus:ring-2 focus:ring-[#f06b93]/20 transition-all"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #ff9eb5 0%, #f06b93 100%)'
                }}
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>

              {/* Register button */}
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="w-full py-3 rounded-xl font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Регистрация (для теста)
              </button>

              {/* Back link */}
              <p className="text-center text-gray-500 text-sm pt-2">
                <Link href="/" className="hover:text-[#f06b93] transition-colors">
                  ← Вернуться на главную
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
