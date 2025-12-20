"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiAdminLine,
  RiDashboardLine,
  RiLineChartLine,
  RiStackLine,
  RiFileListLine,
  RiMoneyDollarCircleLine,
  RiShieldLine,
  RiUserLine,
  RiSettings3Line,
  RiAddCircleLine,
  RiArrowRightSLine,
  RiWallet3Line,
  RiNotification3Line,
  RiHistoryLine,
  RiCheckboxCircleLine,
  RiBookOpenLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasMinimumRole, type Role } from "@/lib/rbac";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole?: Role; // Minimum role required to see this item
};

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: RiDashboardLine,
    // Dashboard is visible to all authenticated users
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: RiLineChartLine,
    minRole: "MANAGER", // Only MANAGER and ADMIN can see analytics
  },
  {
    title: "Loan Products",
    href: "/products",
    icon: RiStackLine,
    // Products are viewable by all, but creation is restricted at component level
  },
  {
    title: "Applications",
    href: "/applications",
    icon: RiFileListLine,
    // Applications visible to all (users can create their own)
  },
  {
    title: "Active Loans",
    href: "/loans",
    icon: RiMoneyDollarCircleLine,
    // Loans visible to all (users see their own)
  },
  {
    title: "Collateral",
    href: "/collateral",
    icon: RiShieldLine,
    // Collateral visible to all (users see their own)
  },
  {
    title: "Customers",
    href: "/customers",
    icon: RiUserLine,
    minRole: "MANAGER", // Customer list is for managers and admins
  },
];

const operationsNavItems: NavItem[] = [
  {
    title: "Notifications",
    href: "/notifications",
    icon: RiNotification3Line,
  },
  {
    title: "Activity Log",
    href: "/activity",
    icon: RiHistoryLine,
    minRole: "MANAGER",
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: RiCheckboxCircleLine,
    minRole: "MANAGER",
  },
  {
    title: "Playbook",
    href: "/playbook",
    icon: RiBookOpenLine,
  },
];

const SUPER_ADMIN_EMAIL = "harjjotsinghh@gmail.com";

interface AppSidebarProps {
  userRole?: string;
  userEmail?: string | null;
}

export function AppSidebar({ userRole, userEmail }: AppSidebarProps) {
  const pathname = usePathname();
  
  // Filter nav items based on user role
  const visibleNavItems = mainNavItems.filter((item) => {
    if (!item.minRole) return true; // No role restriction
    return hasMinimumRole(userRole, item.minRole);
  });

  const visibleOperationsItems = operationsNavItems.filter((item) => {
    if (!item.minRole) return true;
    return hasMinimumRole(userRole, item.minRole);
  });

  // Check if user can create applications
  const canCreateApplication = hasMinimumRole(userRole, "USER");

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center">
            <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-tight text-sidebar-foreground">
              1Fi LMS
            </span>
            <span className="text-xs text-sidebar-foreground/60 font-mono">
              Lending System
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Quick Action - Only show if user has permission to create applications */}
        {canCreateApplication && (
          <div className="px-2 py-3">
            <Link href="/applications/new">
              <Button
                className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground press-scale"
                size="lg"
              >
                <RiAddCircleLine className="w-4 h-4" />
                <span>New Application</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 transition-all duration-200",
                        isActive &&
                          "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={cn(
                            "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
                            isActive && "text-sidebar-primary"
                          )}
                        />
                        <span className="font-medium">{item.title}</span>
                        {isActive && (
                          <RiArrowRightSLine className="w-4 h-4 ml-auto opacity-60" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleOperationsItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 transition-all duration-200",
                        isActive &&
                          "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={cn(
                            "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
                            isActive && "text-sidebar-primary"
                          )}
                        />
                        <span className="font-medium">{item.title}</span>
                        {isActive && (
                          <RiArrowRightSLine className="w-4 h-4 ml-auto opacity-60" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-sm text-sidebar-foreground/70">Theme</span>
          <ThemeToggle />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="px-3 py-2.5">
              <Link
                href="/settings"
                className="flex items-center gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              >
                <RiSettings3Line className="w-4 h-4" />
                <span className="font-medium">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {userEmail === SUPER_ADMIN_EMAIL && (
          <SidebarMenu className="mt-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="px-3 py-2.5">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-3 text-destructive hover:text-destructive"
                >
                  <RiAdminLine className="w-4 h-4" />
                  <span className="font-medium">Super Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <div className="mt-3 px-3">
          <p className="text-xs text-sidebar-foreground/40 font-mono">
            v1.0.0 • 1Fi NBFC
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
