import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Get hostname (e.g. 'spikad.ai', 'app.spikad.ai', 'drivingschool.spikad.ai')
    let hostname = req.headers
        .get('host')!
        .replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

    // special case for Vercel preview URLs
    if (
        hostname.includes('---') &&
        hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
    ) {
        hostname = `${hostname.split('---')[0]}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN
            }`;
    }

    const searchParams = req.nextUrl.searchParams.toString();
    // Get the pathname of the request (e.g. /, /about, /blog/first-post)
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''
        }`;

    // 0. Admin Domain (e.g. admin.spikad.ai) -> Redirect to /admin
    if (hostname === `admin.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
        return NextResponse.rewrite(
            new URL(`/admin${path === '/' ? '' : path}`, req.url),
        );
    }

    // 1. App Domain (e.g. app.spikad.ai) -> Redirect to /app
    if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
        return NextResponse.rewrite(
            new URL(`/app${path === '/' ? '' : path}`, req.url),
        );
    }

    // 2. Main Domain (e.g. spikad.ai) -> Redirect to /home (Marketing Site)
    if (
        hostname === 'localhost:3000' ||
        hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ) {
        // Allow access to /app (Dashboard) and /admin (Super Admin) on the root domain
        if (url.pathname.startsWith('/app') || url.pathname.startsWith('/admin')) {
            return NextResponse.rewrite(
                new URL(`${path === '/' ? '' : path}`, req.url),
            );
        }

        return NextResponse.rewrite(
            new URL(`/home${path === '/' ? '' : path}`, req.url),
        );
    }

    // 3. Custom Domain / Subdomain (e.g. drivingschool.spikad.ai) -> Redirect to /_site/[domain]
    // This allows us to serve the dynamic [domain] page
    return NextResponse.rewrite(new URL(`/_site/${hostname}${path}`, req.url));
}
