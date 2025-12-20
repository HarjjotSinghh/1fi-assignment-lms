import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Role type for middleware
type Role = "ADMIN" | "MANAGER" | "USER";

// Super admin email - only this user can access /admin routes
const SUPER_ADMIN_EMAIL = "harjjotsinghh@gmail.com";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register"];

// Route-role restrictions: minimum role required for each route prefix
const routeRoleRestrictions: Record<string, Role[]> = {
    "/analytics": ["ADMIN", "MANAGER"],
    // Products can be viewed by all, but creation/edit is handled at component level
};

// Role hierarchy for comparison
const roleHierarchy: Record<Role, number> = {
    USER: 1,
    MANAGER: 2,
    ADMIN: 3,
};

function hasRoleAccess(userRole: string | undefined, allowedRoles: Role[]): boolean {
    if (!userRole) return false;
    return allowedRoles.includes(userRole as Role);
}

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
        const userRole = token?.role as Role | undefined;
        const userEmail = token?.email as string | undefined;

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

        // Super admin route protection
        if (pathname.startsWith("/admin")) {
            if (userEmail !== SUPER_ADMIN_EMAIL) {
                const dashboardUrl = new URL("/dashboard", request.url);
                dashboardUrl.searchParams.set("error", "unauthorized");
                return NextResponse.redirect(dashboardUrl);
            }
        }

        // Check role-based route restrictions
        for (const [route, allowedRoles] of Object.entries(routeRoleRestrictions)) {
            if (pathname.startsWith(route)) {
                if (!hasRoleAccess(userRole, allowedRoles)) {
                    // Redirect unauthorized users to dashboard with error message
                    const dashboardUrl = new URL("/dashboard", request.url);
                    dashboardUrl.searchParams.set("error", "unauthorized");
                    return NextResponse.redirect(dashboardUrl);
                }
                break;
            }
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
