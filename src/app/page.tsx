import Link from "next/link";
import {
  RiArrowRightLine,
  RiShieldCheckLine,
  RiFlashlightLine,
  RiStackLine,
  RiLineChartLine,
  RiSecurePaymentLine,
  RiCustomerService2Line,
  RiCheckboxCircleLine,
  RiWallet3Line,
  RiGithubLine,
  RiTwitterXLine,
  RiLinkedinLine,
} from "react-icons/ri";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: RiFlashlightLine,
    title: "Lightning Fast",
    description: "Process loan applications in minutes, not days. Streamlined workflows for maximum efficiency.",
  },
  {
    icon: RiShieldCheckLine,
    title: "KYC Verified",
    description: "Built-in Aadhaar and PAN verification. Complete regulatory compliance out of the box.",
  },
  {
    icon: RiStackLine,
    title: "Product Flexibility",
    description: "Configure multiple loan products with custom interest rates, tenure, and LTV settings.",
  },
  {
    icon: RiLineChartLine,
    title: "Real-time Monitoring",
    description: "Track LTV ratios, collateral values, and loan health with live dashboards.",
  },
  {
    icon: RiSecurePaymentLine,
    title: "Collateral Management",
    description: "Seamlessly manage mutual fund pledges with NAV tracking and valuation updates.",
  },
  {
    icon: RiCustomerService2Line,
    title: "API Integration",
    description: "RESTful APIs for fintech partners. Programmatically create and manage applications.",
  },
];

const stats = [
  { value: "₹50Cr+", label: "Loans Processed" },
  { value: "10K+", label: "Happy Customers" },
  { value: "99.9%", label: "Uptime" },
  { value: "<5min", label: "Avg. Processing" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary flex items-center justify-center">
              <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold">1Fi LMS</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-medium border hover:bg-muted transition-colors">
                Sign in
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Dashboard
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium border bg-muted/50">
              <RiCheckboxCircleLine className="w-3.5 h-3.5 text-primary" />
              Trusted by 100+ NBFCs across India
            </div>
            
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Modern Loan Management for{" "}
              <span className="text-primary">LAMF</span>
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              The complete platform for lending against mutual funds. Streamline applications, 
              manage collateral, and grow your loan book with enterprise-grade tools.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link href="/products">
                <button className="w-full sm:w-auto px-8 py-3 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 press-scale">
                  Start Free Trial
                  <RiArrowRightLine className="w-4 h-4" />
                </button>
              </Link>
              <Link href="#features">
                <button className="w-full sm:w-auto px-8 py-3 text-base font-medium border hover:bg-muted transition-colors">
                  Learn More
                </button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 border bg-card">
                <p className="font-heading text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Everything you need to manage LAMF
            </h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built features for lending against mutual funds, designed for modern NBFCs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 border bg-card hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Simple 4-step process
            </h2>
            <p className="mt-4 text-muted-foreground">
              From application to disbursement in record time.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Customer Onboarding", desc: "KYC verification with Aadhaar & PAN" },
              { step: "02", title: "Collateral Pledge", desc: "Link and pledge mutual fund units" },
              { step: "03", title: "Loan Approval", desc: "Automated LTV and eligibility checks" },
              { step: "04", title: "Disbursement", desc: "Instant fund transfer to customer" },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-heading font-bold text-primary/10">
                  {item.step}
                </div>
                <h3 className="font-heading text-lg font-semibold mt-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 right-0 w-full h-px bg-border -mr-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            Ready to transform your lending operations?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
            Join 100+ NBFCs already using 1Fi LMS to streamline their LAMF business.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/products">
              <button className="w-full sm:w-auto px-8 py-3 text-base font-medium bg-background text-foreground hover:bg-background/90 transition-colors flex items-center justify-center gap-2 press-scale">
                Get Started Now
                <RiArrowRightLine className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/api/external/applications">
              <button className="w-full sm:w-auto px-8 py-3 text-base font-medium border border-primary-foreground/30 hover:bg-primary-foreground/10 transition-colors">
                View API Docs
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary flex items-center justify-center">
                  <RiWallet3Line className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-heading text-xl font-bold">1Fi LMS</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                Modern loan management for the digital age.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/products" className="hover:text-foreground transition-colors">Loan Products</Link></li>
                <li><Link href="/api/external/applications" className="hover:text-foreground transition-colors">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex items-center gap-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <RiGithubLine className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <RiTwitterXLine className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <RiLinkedinLine className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} 1Fi LMS. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
