import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // req.cookies is used to update the request for the rest of the Next.js process
          req.cookies.set(name, value);
          
          supabaseResponse = NextResponse.next({ request: req });
          
          // supabaseResponse.cookies is used to send the Set-Cookie header to the browser
          supabaseResponse.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          req.cookies.set(name, '');
          
          supabaseResponse = NextResponse.next({ request: req });
          
          supabaseResponse.cookies.set(name, '', options);
        },
      },
    }
  );

  console.log('[Middleware] URL:', req.nextUrl.pathname);
  console.log('[Middleware] Found Cookies:', req.cookies.getAll().map(c => c.name).join(', '));

  // Use getSession() instead of getUser() — getSession() reads the JWT from
  // the cookie locally without making a network request to Supabase.
  // getUser() makes a live API call that can timeout, incorrectly kicking
  // authenticated users to /login on every network hiccup.
  const { data: { session }, error } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  console.log('[Middleware] User ID:', user?.id || 'null', '| Error:', error?.message || 'none');

  const isAppPage = 
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname === '/log' || req.nextUrl.pathname.startsWith('/log/') ||
    req.nextUrl.pathname.startsWith('/rules') ||
    req.nextUrl.pathname.startsWith('/settings');

  const isAuthPage = 
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/signup') ||
    req.nextUrl.pathname.startsWith('/onboarding');

  // If there's a network error, don't redirect — let the page handle it
  if (error && error.message !== 'Auth session missing!' && isAppPage) {
    console.warn('[Middleware] Network error checking auth, allowing request through:', error.message);
    return supabaseResponse;
  }

  // If user is not logged in, but tries to access an app page, redirect to login
  if (!user && isAppPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // Copy over any cookies heavily mutated by Supabase server client
    supabaseResponse.cookies.getAll().forEach((cookie: { name: string; value: string }) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return redirectResponse;
  }

  // If user is logged in, and tries to access an auth page, redirect to dashboard
  if (user && isAuthPage && !req.nextUrl.pathname.startsWith('/onboarding')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // Copy over any cookies heavily mutated by Supabase server client
    supabaseResponse.cookies.getAll().forEach((cookie: { name: string; value: string }) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|manifest.json|viewer).*)',
  ],
};