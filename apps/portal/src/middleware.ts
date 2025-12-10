import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 1. Защита Админки (/admin)
  if (path.startsWith('/admin')) {
    // Если не залогинен -> на вход
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Проверяем роль
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Если не админ -> в кабинет ученика
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. Защита Кабинета (/dashboard)
  if (path.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Если залогинен и идет на /login -> редирект внутрь
  if (path === '/login' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login']
};
