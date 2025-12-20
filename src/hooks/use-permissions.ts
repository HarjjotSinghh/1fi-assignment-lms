"use client";

import { useSession } from "next-auth/react";
import {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumRole,
    type Role,
    type Permission
} from "@/lib/rbac";

/**
 * Client-side hook for permission checking
 * Must be used within SessionProvider context
 */
export function usePermissions() {
    const { data: session, status } = useSession();
    const role = session?.user?.role as Role | undefined;
    const isLoading = status === "loading";
    const isAuthenticated = status === "authenticated";

    return {
        /**
         * Check if user has a specific permission
         */
        can: (permission: Permission): boolean => {
            if (isLoading || !role) return false;
            return hasPermission(role, permission);
        },

        /**
         * Check if user has any of the specified permissions
         */
        canAny: (permissions: Permission[]): boolean => {
            if (isLoading || !role) return false;
            return hasAnyPermission(role, permissions);
        },

        /**
         * Check if user has all of the specified permissions
         */
        canAll: (permissions: Permission[]): boolean => {
            if (isLoading || !role) return false;
            return hasAllPermissions(role, permissions);
        },

        /**
         * Check if user meets or exceeds a minimum role level
         */
        hasRole: (minimumRole: Role): boolean => {
            if (isLoading || !role) return false;
            return hasMinimumRole(role, minimumRole);
        },

        /**
         * Current user role
         */
        role,

        /**
         * Convenience role checks
         */
        isAdmin: role === "ADMIN",
        isManager: role === "MANAGER" || role === "ADMIN",
        isUser: !!role,

        /**
         * Loading state
         */
        isLoading,
        isAuthenticated,

        /**
         * User info
         */
        user: session?.user,
    };
}

/**
 * Hook to check a single permission with loading state
 */
export function usePermission(permission: Permission) {
    const { can, isLoading, isAuthenticated } = usePermissions();

    return {
        hasPermission: can(permission),
        isLoading,
        isAuthenticated,
    };
}

/**
 * Hook to check minimum role requirement
 */
export function useRole(minimumRole: Role) {
    const { hasRole, isLoading, isAuthenticated, role } = usePermissions();

    return {
        hasAccess: hasRole(minimumRole),
        currentRole: role,
        isLoading,
        isAuthenticated,
    };
}
