import { db } from "@/db";
import { loanProducts } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  Plus,
  Package,
  Percent,
  Calendar,
  IndianRupee,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Loan Products</h1>
          <p className="text-muted-foreground mt-1">
            Configure loan products with interest rates, tenure options, and LTV settings.
          </p>
        </div>
        <ProductFormDialog />
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="border border-dashed bg-muted/30">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-primary/10 flex items-center justify-center">
                <Package className="h-7 w-7 text-primary" />
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
            <Card key={product.id} className="border hover:border-primary/30 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-heading text-lg">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {product.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" /> Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Loan Amount Range */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-success/10">
                    <IndianRupee className="h-3.5 w-3.5 text-success" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Loan Amount</p>
                    <p className="font-medium font-mono">
                      {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}
                    </p>
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-accent/10">
                    <Percent className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Interest Rate</p>
                    <p className="font-medium font-mono">{formatPercent(product.interestRatePercent)} p.a.</p>
                  </div>
                </div>

                {/* Tenure */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-info/10">
                    <Calendar className="h-3.5 w-3.5 text-info" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tenure</p>
                    <p className="font-medium font-mono">
                      {product.minTenureMonths} - {product.maxTenureMonths} months
                    </p>
                  </div>
                </div>

                {/* LTV Settings */}
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
