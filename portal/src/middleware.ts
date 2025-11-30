import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Создаем клиент Supabase для middleware
  const supabase = createMiddlewareClient({ req, res });

  // Получаем сессию
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // 1. Защита Админки (/admin)
  if (path.startsWith('/admin')) {
    // Если не залогинен -> на вход
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Проверяем роль (запрос к базе)
    // В middleware это может быть дорого, но для MVP пойдет.
    // Лучше хранить роль в metadata, но пока сделаем простой запрос.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Если не админ -> в кабинет ученика
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // 2. Защита Кабинета (/dashboard)
  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // 3. Если залогинен и идет на /login -> редирект внутрь
  if (path === '/login' && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login']
};
