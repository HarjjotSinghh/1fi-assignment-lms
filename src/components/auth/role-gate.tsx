"use client";

import { usePermissions } from "@/hooks/use-permissions";
import type { Permission, Role } from "@/lib/rbac";

interface RoleGateProps {
  children: React.ReactNode;
  /**
   * Permission(s) required to render children
   * Can be a single permission or array of permissions
   */
  permission?: Permission | Permission[];
  /**
   * Minimum role required to render children
   * Alternative to permission-based check
   */
  role?: Role;
  /**
   * For array of permissions: "any" = user needs at least one, "all" = user needs all
   * @default "any"
   */
  mode?: "any" | "all";
  /**
   * Content to render if user doesn't have permission
   * @default null (renders nothing)
   */
  fallback?: React.ReactNode;
  /**
   * If true, shows a loading skeleton while checking permissions
   * @default false
   */
  showLoading?: boolean;
}

/**
 * Conditionally render children based on user permissions
 * 
 * @example
 * // Single permission
 * <RoleGate permission="products:create">
 *   <Button>Create Product</Button>
 * </RoleGate>
 * 
 * @example
 * // Multiple permissions (any)
 * <RoleGate permission={["products:edit", "products:delete"]} mode="any">
 *   <Button>Manage Product</Button>
 * </RoleGate>
 * 
 * @example
 * // Role-based
 * <RoleGate role="MANAGER">
 *   <AdminPanel />
 * </RoleGate>
 * 
 * @example
 * // With fallback
 * <RoleGate permission="analytics:view" fallback={<UpgradePrompt />}>
 *   <Analytics />
 * </RoleGate>
 */
export function RoleGate({
  children,
  permission,
  role,
  mode = "any",
  fallback = null,
  showLoading = false,
}: RoleGateProps) {
  const { can, canAny, canAll, hasRole, isLoading } = usePermissions();

  // Show loading state if requested
  if (isLoading && showLoading) {
    return (
      <div className="animate-pulse bg-muted rounded h-8 w-24" />
    );
  }

  // Don't render anything while loading (prevents flash)
  if (isLoading) {
    return null;
  }

  let hasAccess = false;

  // Check role-based access
  if (role) {
    hasAccess = hasRole(role);
  }
  // Check permission-based access
  else if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = mode === "all" ? canAll(permission) : canAny(permission);
    } else {
      hasAccess = can(permission);
    }
  }

  // Render children if user has access, otherwise render fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Server-compatible version for use in Server Components
 * Requires the role to be passed in (from session)
 */
interface ServerRoleGateProps {
  children: React.ReactNode;
  userRole: Role | string | null | undefined;
  permission?: Permission | Permission[];
  role?: Role;
  mode?: "any" | "all";
  fallback?: React.ReactNode;
}

export function ServerRoleGate({
  children,
  userRole,
  permission,
  role,
  mode = "any",
  fallback = null,
}: ServerRoleGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasMinimumRole } = require("@/lib/rbac");

  let hasAccess = false;

  // Check role-based access
  if (role) {
    hasAccess = hasMinimumRole(userRole, role);
  }
  // Check permission-based access
  else if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = mode === "all" 
        ? hasAllPermissions(userRole, permission) 
        : hasAnyPermission(userRole, permission);
    } else {
      hasAccess = hasPermission(userRole, permission);
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
