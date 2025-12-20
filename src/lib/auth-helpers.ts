/**
 * Server-side authentication and authorization helpers
 * Use these in Server Components and API routes
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
    hasPermission,
    hasAnyPermission,
    hasMinimumRole,
    type Role,
    type Permission
} from "@/lib/rbac";

/**
 * Get the current user's session with role information
 * For use in Server Components
 */
export async function getSession() {
    return await auth();
}

/**
 * Get the current user's role
 * Returns null if not authenticated
 */
export async function getCurrentUserRole(): Promise<Role | null> {
    const session = await auth();
    if (!session?.user?.role) return null;
    return session.user.role as Role;
}

/**
 * Check if the current user has a specific permission
 * For use in Server Components
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
    const role = await getCurrentUserRole();
    return hasPermission(role, permission);
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function checkAnyPermission(permissions: Permission[]): Promise<boolean> {
    const role = await getCurrentUserRole();
    return hasAnyPermission(role, permissions);
}

/**
 * Check if the current user meets the minimum role requirement
 */
export async function checkMinimumRole(minimumRole: Role): Promise<boolean> {
    const role = await getCurrentUserRole();
    return hasMinimumRole(role, minimumRole);
}

/**
 * Require a specific permission - redirects to dashboard if unauthorized
 * For use in Server Components at the top of the component
 */
export async function requirePermission(permission: Permission): Promise<void> {
    const hasAccess = await checkPermission(permission);
    if (!hasAccess) {
        redirect("/dashboard?error=unauthorized");
    }
}

/**
 * Require any of the specified permissions - redirects if unauthorized
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<void> {
    const hasAccess = await checkAnyPermission(permissions);
    if (!hasAccess) {
        redirect("/dashboard?error=unauthorized");
    }
}

/**
 * Require a minimum role level - redirects if unauthorized
 */
export async function requireRole(minimumRole: Role): Promise<void> {
    const hasAccess = await checkMinimumRole(minimumRole);
    if (!hasAccess) {
        redirect("/dashboard?error=unauthorized");
    }
}

/**
 * Get user with role for passing to client components
 */
export async function getUserWithRole() {
    const session = await auth();
    if (!session?.user) return null;

    return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as Role,
        image: session.user.image,
    };
}
