import { NextResponse } from 'next/server';

export function middleware(request) {
    const path = request.nextUrl.pathname;
    
    // Define public paths that don't require authentication
    const isPublicPath = path === '/attendance' || path === '/' || path === '/signup';
    
    // Get the token from cookies
    const token = request.cookies.get('token')?.value || '';
    
    // If user is not logged in and trying to access protected routes
    if (!token && !isPublicPath) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    
    // If user is logged in and trying to access login/signup/attendance, redirect to dashboard
    if (token && (path === '/' || path === '/signup' || path === '/attendance')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};