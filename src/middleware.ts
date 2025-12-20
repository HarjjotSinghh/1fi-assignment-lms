import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;


    // Allow API routes to pass through (they handle their own auth)
    if (pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    // Allow static files
    if (
        pathname.startsWith("/_next/") ||
        pathname.includes(".") // files with extensions
    ) {
        return NextResponse.next();
    }

    // Check if the current path is public
    const isPublicRoute = publicRoutes.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    // If it's a public route, just continue
    if (isPublicRoute) {
        return NextResponse.next();
    }

    try {
        // Get the token using the secret
        const token = await getToken({
            req: request,
            secret: process.env.AUTH_SECRET,
        });

        const isLoggedIn = !!token;
        // If accessing a protected route without auth, redirect to login
        if (!isLoggedIn) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // If logged in and trying to access login/register, redirect to dashboard
        if (pathname === "/login" || pathname === "/register") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    } catch (error) {
        console.error("Middleware error:", error);
        // On error, allow the request to continue to avoid blocking the app
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
