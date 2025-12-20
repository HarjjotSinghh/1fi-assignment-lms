import { db } from "@/db";
import { customers, loanProducts } from "@/db/schema";
import { CustomerOnboardingForm } from "./customer-form";

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
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">New Loan Application</h1>
        <p className="text-muted-foreground mt-1">
          Create a new loan application. Complete customer onboarding and KYC verification first.
        </p>
      </div>

      <CustomerOnboardingForm products={products} />
    </div>
  );
}
