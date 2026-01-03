/**
 * Role-Based Access Control (RBAC) definitions and utilities
 * 
 * Role Hierarchy: ADMIN > MANAGER > USER
 */

// Role definitions
export type Role = "ADMIN" | "MANAGER" | "USER";

// Permission actions organized by resource
export type Permission =
    // Application permissions
    | "applications:view"
    | "applications:create"
    | "applications:approve"
    | "applications:reject"
    | "applications:delete"
    // Loan permissions
    | "loans:view"
    | "loans:manage"
    | "loans:export"
    // Customer permissions
    | "customers:view"
    | "customers:create"
    | "customers:edit"
    | "customers:delete"
    | "customers:kyc_override"
    // Product permissions
    | "products:view"
    | "products:create"
    | "products:edit"
    | "products:delete"
    // Collateral permissions
    | "collateral:view"
    | "collateral:release"
    | "collateral:liquidate"
    // Analytics permissions
    | "analytics:view"
    | "analytics:export"
    // Dashboard permissions
    | "dashboard:view"
    | "dashboard:full_stats"
    // Onboarding permissions
    | "onboarding:access"
    // System permissions (Phase 4)
    | "system:manage"
    | "compliance:manage";

// Base permissions for USER role
const userPermissions: Permission[] = [
    "applications:view",
    "applications:create",
    "loans:view",
    "customers:view",
    "products:view",
    "collateral:view",
    "dashboard:view",
    "onboarding:access",
];

// Additional permissions for MANAGER role
const managerPermissions: Permission[] = [
    ...userPermissions,
    "applications:approve",
    "applications:reject",
    "loans:manage",
    "loans:export",
    "customers:create",
    "customers:edit",
    "products:create",
    "products:edit",
    "collateral:release",
    "analytics:view",
    "analytics:export",
    "dashboard:full_stats",
];

// ADMIN has all permissions
const allPermissions: Permission[] = [
    ...managerPermissions,
    "applications:delete",
    "customers:delete",
    "customers:kyc_override",
    "products:delete",
    "collateral:liquidate",
    "system:manage",
    "compliance:manage",
];

// Role-permission mapping
const rolePermissions: Record<Role, Permission[]> = {
    ADMIN: allPermissions,
    MANAGER: managerPermissions,
    USER: userPermissions,
};

// Role hierarchy for comparison
const roleHierarchy: Record<Role, number> = {
    USER: 1,
    MANAGER: 2,
    ADMIN: 3,
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | string | undefined | null, permission: Permission): boolean {
    if (!role) return false;
    const validRole = (role as string).toUpperCase() as Role;
    const permissions = rolePermissions[validRole];
    if (!permissions) return false;
    return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role | string | undefined | null, permissions: Permission[]): boolean {
    if (!role) return false;
    return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role | string | undefined | null, permissions: Permission[]): boolean {
    if (!role) return false;
    return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a role meets or exceeds the minimum required role level
 */
export function hasMinimumRole(userRole: Role | string | undefined | null, minimumRole: Role): boolean {
    if (!userRole) return false;
    const normalizedRole = (userRole as string).toUpperCase() as Role;
    const userLevel = roleHierarchy[normalizedRole];
    const requiredLevel = roleHierarchy[minimumRole];
    if (!userLevel || !requiredLevel) return false;
    return userLevel >= requiredLevel;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role | string): Permission[] {
    const normalizedRole = (role as string).toUpperCase() as Role;
    return rolePermissions[normalizedRole] || [];
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string | undefined | null): role is Role {
    if (!role) return false;
    const normalizedRole = role.toUpperCase();
    return normalizedRole === "ADMIN" || normalizedRole === "MANAGER" || normalizedRole === "USER";
}

/**
 * Get the display name for a role
 */
export function getRoleDisplayName(role: Role | string): string {
    const normalizedRole = (role as string).toUpperCase() as Role;
    const displayNames: Record<Role, string> = {
        ADMIN: "Administrator",
        MANAGER: "Manager",
        USER: "User",
    };
    return displayNames[normalizedRole] || role;
}

/**
 * Route-role restrictions for middleware
 */
export const routeRoleRestrictions: Record<string, Role> = {
    "/analytics": "MANAGER",
    "/products": "MANAGER", // Note: viewing products is allowed, but this restricts full access
};

/**
 * Actions that require specific roles (for API validation)
 */
export const actionRoleRequirements: Record<string, Permission> = {
    "create-product": "products:create",
    "edit-product": "products:edit",
    "delete-product": "products:delete",
    "approve-application": "applications:approve",
    "reject-application": "applications:reject",
    "release-collateral": "collateral:release",
    "liquidate-collateral": "collateral:liquidate",
    "export-loans": "loans:export",
    "export-analytics": "analytics:export",
};
