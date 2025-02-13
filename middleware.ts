import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // This call updates the session cookie if needed.
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ['/settings/:path*'] // Only run this middleware on /settings routes
};