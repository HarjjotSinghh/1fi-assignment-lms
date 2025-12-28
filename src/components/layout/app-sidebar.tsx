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
  RiBankLine,
  RiHammerLine,
  RiEyeLine,
  RiNodeTree,
  RiBuilding2Line,
  RiFlowChart,
  RiCalculatorLine,
  RiAlertLine,
  RiKeyLine,
  RiGlobalLine,
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
    title: "Command Center",
    href: "/dashboard",
    icon: RiDashboardLine,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: RiLineChartLine,
    minRole: "MANAGER",
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: RiNotification3Line,
  },
];

const lendingNavItems: NavItem[] = [
  {
    title: "Applications",
    href: "/applications",
    icon: RiFileListLine,
  },
  {
    title: "Loan Accounts",
    href: "/loans",
    icon: RiMoneyDollarCircleLine,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: RiUserLine,
  },
  {
    title: "Collateral Book",
    href: "/collateral",
    icon: RiShieldLine,
  },
  {
    title: "User Collateral Tree",
    href: "/collateral/tree",
    icon: RiNodeTree,
    minRole: "MANAGER",
  },
  {
    title: "Collections",
    href: "/collections",
    icon: RiBankLine,
    minRole: "MANAGER",
  },
];

const riskNavItems: NavItem[] = [
  {
    title: "Risk Dashboard",
    href: "/risk-dashboard",
    icon: RiAlertLine,
    minRole: "MANAGER",
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: RiCheckboxCircleLine,
    minRole: "MANAGER",
  },
  {
    title: "Legal Cases",
    href: "/legal",
    icon: RiHammerLine,
    minRole: "MANAGER",
  },
  {
    title: "Watchlist",
    href: "/watchlist",
    icon: RiEyeLine,
    minRole: "ADMIN",
  },
  {
    title: "Audit Log",
    href: "/activity",
    icon: RiHistoryLine,
    minRole: "ADMIN",
  },
];

const configNavItems: NavItem[] = [
  {
    title: "API Keys",
    href: "/configuration/api-keys",
    icon: RiKeyLine,
    minRole: "ADMIN",
  },
  {
    title: "Webhook Events",
    href: "/configuration/webhooks/events",
    icon: RiGlobalLine,
    minRole: "ADMIN",
  },
  {
    title: "Partners",
    href: "/configuration/partners",
    icon: RiBuilding2Line,
    minRole: "ADMIN",
  },
  {
    title: "Loan Products",
    href: "/products",
    icon: RiStackLine,
    minRole: "ADMIN",
  },
  {
    title: "Decision Rules",
    href: "/configuration/rules",
    icon: RiFlowChart,
    minRole: "ADMIN",
  },
  {
    title: "API Docs",
    href: "/docs",
    icon: RiBookOpenLine,
  },
  {
    title: "System Users",
    href: "/configuration/users",
    icon: RiAdminLine,
    minRole: "ADMIN",
  },
];

const toolsNavItems: NavItem[] = [
  {
    title: "EMI Calculator",
    href: "/tools/emi-calculator",
    icon: RiCalculatorLine,
  },
  {
    title: "Foreclosure Calculator",
    href: "/tools/foreclosure-calculator",
    icon: RiAlertLine,
  },
];

interface AppSidebarProps {
  userRole?: string;
  userEmail?: string | null;
}

export function AppSidebar({ userRole, userEmail }: AppSidebarProps) {
  const pathname = usePathname();

  // Helper to filter nav items
  const filterItems = (items: NavItem[]) =>
    items.filter((item) => !item.minRole || hasMinimumRole(userRole, item.minRole));
  console.log('items:', filterItems, mainNavItems, riskNavItems, lendingNavItems, configNavItems, toolsNavItems)
  console.log('filtered items:', filterItems)
  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-sm">
            <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-tight text-sidebar-foreground">
              Fiquity Technology
            </span>
            <span className="text-xs text-sidebar-foreground/60 font-mono group-hover:text-primary transition-colors">
              Admin Console
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        <div className="px-2 py-2">
          <Link href="/applications/new">
            <Button
              className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground press-scale shadow-sm rounded-sm"
              size="default"
            >
              <RiAddCircleLine className="w-4 h-4" />
              <span>Create Application</span>
            </Button>
          </Link>
        </div>

        <NavGroup label="Overview" items={filterItems(mainNavItems)} pathname={pathname} />
        <NavGroup label="Lending Operations" items={filterItems(lendingNavItems)} pathname={pathname} />
        <NavGroup label="Tools" items={filterItems(toolsNavItems)} pathname={pathname} />
        <NavGroup label="Risk & Compliance" items={filterItems(riskNavItems)} pathname={pathname} />
        <NavGroup label="Configuration" items={filterItems(configNavItems)} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border p-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">Theme</span>
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
                <span className="font-medium">Global Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-3 px-3 flex items-center justify-between text-xs text-sidebar-foreground/40 font-mono">
          <span>v2.4.0</span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="System Online"></span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  if (items.length === 0) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest px-2 mb-1">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-sm",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isActive ? "text-primary scale-105" : "text-sidebar-foreground/60 group-hover:scale-110"
                      )}
                    />
                    <span className="flex-1">{item.title}</span>
                    {isActive && (
                      <RiArrowRightSLine className="w-4 h-4 ml-auto text-primary" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
