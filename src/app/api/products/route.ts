import { db } from "@/db";
import { loanProducts } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// GET all products
export async function GET() {
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

// POST create new product
export async function POST(request: NextRequest) {
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
