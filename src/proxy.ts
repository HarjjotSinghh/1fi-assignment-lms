
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Role type for middleware
type Role = "ADMIN" | "MANAGER" | "USER";

// Super admin email - only this user can access /admin routes
const SUPER_ADMIN_EMAIL = "harjjotsinghh@gmail.com";

// Route-role restrictions: minimum role required for each route prefix
const routeRoleRestrictions: Record<string, Role[]> = {
    "/analytics": ["ADMIN", "MANAGER"],
};

function hasRoleAccess(userRole: string | undefined, allowedRoles: Role[]): boolean {
    if (!userRole) return false;
    return allowedRoles.includes(userRole as Role);
}

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;
    const pathname = nextUrl.pathname;
    const user = req.auth?.user;

    // Static assets and API routes are handled by matcher, but being explicit doesn't hurt
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.includes(".")
    ) {
        return;
    }

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
    const isOnboardingPage = pathname.startsWith("/onboarding");
    const isPublicPage = pathname === "/" || isAuthPage;

    // 1. Not logged in
    if (!isLoggedIn) {
        if (!isPublicPage) {
            // Redirect to login if trying to access protected page
            let callbackUrl = nextUrl.pathname;
            if (nextUrl.search) {
                callbackUrl += nextUrl.search;
            }
            return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl));
        }
        return;
    }

    // 2. Logged in logic

    // If accessing auth pages while logged in, redirect to dashboard
    if (isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // 3. Onboarding Check
    // We use "any" cast because we extended the type but TypeScript in this context might not pick it up instantly 
    const onboardingCompleted = (user as any)?.onboardingCompleted;

    // If not completed and not on onboarding page, force redirect
    if (!onboardingCompleted && !isOnboardingPage && pathname !== "/logout") {
        return NextResponse.redirect(new URL("/onboarding", nextUrl));
    }

    // Optional: Redirect away from onboarding if completed
    if (onboardingCompleted && isOnboardingPage) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // 4. Permission Checks (Admin & Roles)

    // Super admin route protection
    if (pathname.startsWith("/admin")) {
        if (user?.email !== SUPER_ADMIN_EMAIL) {
            const dashboardUrl = new URL("/dashboard", nextUrl);
            dashboardUrl.searchParams.set("error", "unauthorized");
            return NextResponse.redirect(dashboardUrl);
        }
    }

    // Check role-based route restrictions
    for (const [route, allowedRoles] of Object.entries(routeRoleRestrictions)) {
        if (pathname.startsWith(route)) {
            if (!hasRoleAccess(user?.role, allowedRoles)) {
                const dashboardUrl = new URL("/dashboard", nextUrl);
                dashboardUrl.searchParams.set("error", "unauthorized");
                return NextResponse.redirect(dashboardUrl);
            }
            break;
        }
    }

    // Allow access
    return;
});

export const config = {
    // Matcher ignoring static files and api
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
