import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, users, brandingSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { generatePDFHtml, PDFTemplate } from "@/lib/pdf-generator";
import { logAudit } from "@/lib/audit";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { type } = body as { type: PDFTemplate };

        if (!type) {
            return NextResponse.json({ error: "Document type is required" }, { status: 400 });
        }

        const loan = await db.query.loans.findFirst({
            where: eq(loans.id, params.id),
            with: {
                customer: true,
                product: true,
            },
        });

        if (!loan) {
            return NextResponse.json({ error: "Loan not found" }, { status: 404 });
        }

        // Get branding settings
        const branding = await db.query.brandingSettings.findFirst();

        // Prepare data based on type
        const data: Record<string, unknown> = {
            loanNumber: loan.loanNumber,
            customerName: `${loan.customer.firstName} ${loan.customer.lastName}`,
            loanAmount: loan.principalAmount,
            interestRate: loan.interestRate,
            tenure: loan.tenure,
            principalOutstanding: loan.outstandingPrincipal,
            interestOutstanding: loan.outstandingInterest,
            totalOutstanding: loan.totalOutstanding,
            emi: loan.emiAmount,
        };

        const html = generatePDFHtml({
            template: type,
            data,
            branding: branding ? {
                logoUrl: branding.logoUrl || undefined,
                companyName: branding.companyName || undefined,
                primaryColor: branding.primaryColor || undefined,
            } : undefined,
        });

        // In a real app, we would convert this HTML to PDF here using puppeteer
        // For now, we return the HTML which the frontend can print/render
        
        await logAudit({
            action: "EXPORT",
            entityType: "DOCUMENT",
            entityId: params.id,
            description: `Generated ${type} for loan ${loan.loanNumber}`,
            userId: session.user.id,
        });

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html",
                "Content-Disposition": `attachment; filename="${type}_${loan.loanNumber}.html"`,
            },
        });

    } catch (error) {
        console.error("Generate document error:", error);
        return NextResponse.json(
            { error: "Failed to generate document" },
            { status: 500 }
        );
    }
}
