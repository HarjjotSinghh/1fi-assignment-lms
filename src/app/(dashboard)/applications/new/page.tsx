import { db } from "@/db";
import { loanProducts } from "@/db/schema";
import { LoanApplicationForm } from "./loan-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiFileListLine, RiLineChartLine, RiShieldCheckLine } from "react-icons/ri";

async function getProducts() {
  try {
    return await db.select().from(loanProducts);
  } catch {
    return [];
  }
}

export default async function NewApplicationPage() {
  const products = await getProducts();

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-6 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative space-y-2">
          <Badge className="w-fit rounded-full bg-primary/10 text-primary border-primary/20">
            Application workflow
          </Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight">New Loan Application</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Complete KYC, collateral, and loan selection in a guided multi-step flow.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr] stagger-children">
        <LoanApplicationForm products={products} />
        <div className="space-y-4 stagger-children">
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RiShieldCheckLine className="h-4 w-4 text-primary" />
                KYC checklist
              </CardTitle>
              <CardDescription>Verify identity before submission.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <RiFileListLine className="h-4 w-4 text-primary" />
                Aadhaar and PAN details verified.
              </div>
              <div className="flex items-start gap-2">
                <RiLineChartLine className="h-4 w-4 text-primary" />
                Income and employment details captured.
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Approval tips</CardTitle>
              <CardDescription>Reduce turnaround time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Confirm collateral eligibility and NAV valuation.</p>
              <p>Align requested amount with product limits.</p>
              <p>Keep bank details ready for disbursal.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
