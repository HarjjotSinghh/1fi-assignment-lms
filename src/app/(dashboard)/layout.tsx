import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { SessionProvider } from "@/components/auth/session-provider";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/layout/notification-center";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <AppSidebar userRole={session?.user?.role} userEmail={session?.user?.email} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1" />
            <ThemeToggle />
            {session?.user && <NotificationCenter userId={session.user.id} />}
            {session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <Link href="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-6">{children}</div>
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </SessionProvider>
  );
}

