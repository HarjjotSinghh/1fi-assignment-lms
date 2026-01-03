import Link from "next/link";
import { RiShieldCheckLine, RiWallet3Line, RiLockPasswordLine, RiArrowRightLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLandingPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 animate-fade-in">
      {/* Left Column: Branding & Context */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-primary text-white dark:bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-purple-900 opacity-90 transition-all"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-none bg-white text-zinc-900 flex items-center justify-center">
              <RiWallet3Line className="w-6 h-6" />
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight">Fiquity Technology</span>
          </Link>

          <div className="space-y-6 max-w-lg mt-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-xs font-medium text-white/80">
              <RiShieldCheckLine className="w-3.5 h-3.5" />
              <span>System Administrator Access Only</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight">
              Command Center for Modern Lending.
            </h1>
            <p className="text-white/80 text-lg">
              Manage your loan book, monitor real-time collateral risks, and orchestrate compliance workflows from a single, unified interface.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60 flex justify-between items-end">
          <div className="space-y-1">
            <p>© {new Date().getFullYear()} Fiquity Technology Ltd.</p>
            <p>Authorized personnel only. All activities are monitored.</p>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600">v2.4.0-admin</span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex items-center justify-center p-6 bg-background">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Admin Sign In</CardTitle>
            <CardDescription>
              Enter your enterprise credentials to access the command center.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" type="email" placeholder="name@enterprise.com" required className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" required className="bg-muted/30" />
              </div>
              <Link href="/dashboard" className="w-full block">
                <Button className="w-full text-base py-5" type="button">
                  Sign In to Console
                </Button>
              </Link>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2" type="button">
              <RiLockPasswordLine className="w-4 h-4" />
              Single Sign-On (SSO)
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              By clicking details, you agree to our <Link href="#" className="underline hover:text-foreground">Policy</Link> and <Link href="#" className="underline hover:text-foreground">Service Terms</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
