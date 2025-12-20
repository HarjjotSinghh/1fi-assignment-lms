/**
 * API Route authentication and authorization utilities
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
    hasPermission,
    hasMinimumRole,
    type Role,
    type Permission
} from "@/lib/rbac";
import type { Session } from "next-auth";

export type AuthResult = {
    authorized: boolean;
    session: Session | null;
    role: Role | null;
    error?: NextResponse;
};

/**
 * Check API request authorization
 * Returns auth result with session info or error response
 */
export async function checkApiAuth(permission?: Permission): Promise<AuthResult> {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
        return {
            authorized: false,
            session: null,
            role: null,
            error: NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in to access this resource" },
                { status: 401 }
            ),
        };
    }

    const role = session.user.role as Role;

    // If no specific permission required, just check authentication
    if (!permission) {
        return {
            authorized: true,
            session,
            role,
        };
    }

    // Check if user has the required permission
    if (!hasPermission(role, permission)) {
        return {
            authorized: false,
            session,
            role,
            error: NextResponse.json(
                { error: "Forbidden", message: "You do not have permission to perform this action" },
                { status: 403 }
            ),
        };
    }

    return {
        authorized: true,
        session,
        role,
    };
}

/**
 * Check if user has minimum role for API access
 */
export async function checkApiRole(minimumRole: Role): Promise<AuthResult> {
    const session = await auth();

    if (!session?.user) {
        return {
            authorized: false,
            session: null,
            role: null,
            error: NextResponse.json(
                { error: "Unauthorized", message: "You must be logged in to access this resource" },
                { status: 401 }
            ),
        };
    }

    const role = session.user.role as Role;

    if (!hasMinimumRole(role, minimumRole)) {
        return {
            authorized: false,
            session,
            role,
            error: NextResponse.json(
                { error: "Forbidden", message: `This action requires ${minimumRole} role or higher` },
                { status: 403 }
            ),
        };
    }

    return {
        authorized: true,
        session,
        role,
    };
}

/**
 * Higher-order function to wrap API handlers with permission check
 */
export function withPermission<T>(
    permission: Permission,
    handler: (session: Session, role: Role) => Promise<NextResponse<T>>
) {
    return async (): Promise<NextResponse> => {
        const authResult = await checkApiAuth(permission);

        if (!authResult.authorized || authResult.error) {
            return authResult.error!;
        }

        return handler(authResult.session!, authResult.role!);
    };
}

/**
 * Higher-order function to wrap API handlers with role check
 */
export function withRole<T>(
    minimumRole: Role,
    handler: (session: Session, role: Role) => Promise<NextResponse<T>>
) {
    return async (): Promise<NextResponse> => {
        const authResult = await checkApiRole(minimumRole);

        if (!authResult.authorized || authResult.error) {
            return authResult.error!;
        }

        return handler(authResult.session!, authResult.role!);
    };
}

