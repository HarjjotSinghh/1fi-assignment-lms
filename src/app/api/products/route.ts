import { db } from "@/db";
import { loanProducts } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkApiAuth } from "@/lib/api-auth";

// GET all products (authenticated users can view)
export async function GET() {
    const authResult = await checkApiAuth();
    if (!authResult.authorized) {
        return authResult.error;
    }

    try {
        const products = await db.select().from(loanProducts);
        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// POST create new product (requires products:create permission)
export async function POST(request: NextRequest) {
    const authResult = await checkApiAuth("products:create");
    if (!authResult.authorized) {
        return authResult.error;
    }

    try {
        const body = await request.json();

        const product = await db
            .insert(loanProducts)
            .values({
                name: body.name,
                description: body.description,
                minAmount: body.minAmount,
                maxAmount: body.maxAmount,
                minTenureMonths: body.minTenureMonths,
                maxTenureMonths: body.maxTenureMonths,
                interestRatePercent: body.interestRatePercent,
                processingFeePercent: body.processingFeePercent ?? 1,
                maxLtvPercent: body.maxLtvPercent ?? 50,
                marginCallThreshold: body.marginCallThreshold ?? 60,
                liquidationThreshold: body.liquidationThreshold ?? 70,
                minCreditScore: body.minCreditScore,
                minMonthlyIncome: body.minMonthlyIncome,
                isActive: body.isActive ?? true,
            })
            .returning();

        return NextResponse.json(product[0], { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}

