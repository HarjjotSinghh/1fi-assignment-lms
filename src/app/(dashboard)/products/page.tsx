import { db } from "@/db";
import { loanProducts } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  RiCalendarLine,
  RiEyeLine,
  RiFileChartLine,
  RiMoneyDollarCircleLine,
  RiMore2Line,
  RiPercentLine,
  RiSearchLine,
  RiStackLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ProductFormDialog } from "./product-form-dialog";

async function getProducts() {
  try {
    return await db.select().from(loanProducts).orderBy(desc(loanProducts.createdAt));
  } catch (error) {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.isActive).length;
  const avgInterestRate = totalProducts
    ? products.reduce((sum, product) => sum + product.interestRatePercent, 0) / totalProducts
    : 0;
  const avgLtv = totalProducts
    ? products.reduce((sum, product) => sum + (product.maxLtvPercent ?? 0), 0) / totalProducts
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge className="w-fit rounded-full bg-primary/10 text-primary border-primary/20">
                Product Studio
              </Badge>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Loan Products</h1>
              <p className="text-muted-foreground max-w-2xl text-sm">
                Configure interest bands, tenure rules, and collateral coverage for every lending product.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="rounded-xl gap-2">
                <RiFileChartLine className="h-4 w-4" />
                Export
              </Button>
              <ProductFormDialog />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total products", value: totalProducts },
              { label: "Active products", value: activeProducts },
              { label: "Avg interest rate", value: formatPercent(avgInterestRate) },
              { label: "Avg max LTV", value: formatPercent(avgLtv) },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card/80">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Card className="border bg-card/80">
        <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9 rounded-xl" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonGroup className="rounded-xl border border-input bg-background/80 p-1">
              <Button variant="ghost" size="sm" className="rounded-lg bg-primary text-primary-foreground">
                All
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
                Active
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
                Inactive
              </Button>
            </ButtonGroup>
            <Select defaultValue="recent">
              <SelectTrigger className="h-9 w-[160px] rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="rate">Highest rate</SelectItem>
                <SelectItem value="ltv">Highest LTV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <RiStackLine className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">No Products Yet</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                  Create your first loan product to start accepting applications. Define interest rates, tenure, and LTV parameters.
                </p>
              </div>
              <ProductFormDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {products.map((product) => (
            <Card key={product.id} className="border bg-card/90">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="font-heading text-lg">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RiMore2Line className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <RiEyeLine className="h-4 w-4 mr-2" /> View details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <RiMoneyDollarCircleLine className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Loan amount</p>
                    <p className="font-medium font-mono">
                      {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-xl bg-accent/10">
                    <RiPercentLine className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Interest rate</p>
                    <p className="font-medium font-mono">{formatPercent(product.interestRatePercent)} p.a.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-xl bg-info/10">
                    <RiCalendarLine className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tenure range</p>
                    <p className="font-medium font-mono">
                      {product.minTenureMonths} - {product.maxTenureMonths} months
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Max LTV</span>
                  <span className="font-mono font-medium">{formatPercent(product.maxLtvPercent ?? 50)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
