// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// export function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // If the user hits an uppercase URL, redirect to lowercase
//   if (pathname !== pathname.toLowerCase()) {
//     // Prevent infinite loops: only redirect if it's a real page request
//     // and not a request for a static file
//     const url = request.nextUrl.clone();
//     url.pathname = pathname.toLowerCase();
//     return NextResponse.redirect(url, 301);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all paths except:
//      * 1. /api (internal API)
//      * 2. /_next (Next.js internals)
//      * 3. /fonts, /images, etc.
//      */
//     '/((?!api|_next|favicon.ico).*)',
//   ],
// };

import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Ignore Next.js internals & static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const lowerPath = pathname.toLowerCase();

  if (pathname !== lowerPath) {
    const url = request.nextUrl.clone();
    url.pathname = lowerPath;
    url.search = search;

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
