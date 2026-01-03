import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { interestRateBenchmarks, interestRateHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/admin/interest-rates
 * List all interest rate benchmarks
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const benchmarks = await db.query.interestRateBenchmarks.findMany({
            orderBy: [desc(interestRateBenchmarks.updatedAt)],
        });

        return NextResponse.json({ benchmarks });
    } catch (error) {
        console.error("List interest rates error:", error);
        return NextResponse.json(
            { error: "Failed to list interest rates" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/interest-rates
 * Create a new interest rate benchmark
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, currentRate, effectiveFrom, source, isActive } = body;

        if (!name || currentRate === undefined || !effectiveFrom) {
            return NextResponse.json(
                { error: "Name, current rate, and effective date are required" },
                { status: 400 }
            );
        }

        const [benchmark] = await db
            .insert(interestRateBenchmarks)
            .values({
                name,
                description,
                currentRate,
                effectiveFrom,
                source,
                isActive: isActive ?? true,
                updatedById: session.user.id,
            })
            .returning();

        // Record in history
        await db.insert(interestRateHistory).values({
            benchmarkId: benchmark.id,
            rate: currentRate,
            effectiveFrom,
            source,
            createdById: session.user.id,
        });

        await logAudit({
            action: "CREATE",
            entityType: "DOCUMENT",
            entityId: benchmark.id,
            description: `Interest rate benchmark created: ${name} at ${currentRate}%`,
            metadata: { name, currentRate },
            userId: session.user.id,
        });

        return NextResponse.json(benchmark);
    } catch (error) {
        console.error("Create interest rate error:", error);
        return NextResponse.json(
            { error: "Failed to create interest rate" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/interest-rates
 * Update an interest rate benchmark (creates history entry)
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id, name, description, currentRate, effectiveFrom, source, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Benchmark ID is required" },
                { status: 400 }
            );
        }

        const existing = await db.query.interestRateBenchmarks.findFirst({
            where: eq(interestRateBenchmarks.id, id),
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Benchmark not found" },
                { status: 404 }
            );
        }

        // If rate changed, record in history
        if (currentRate !== undefined && currentRate !== existing.currentRate) {
            // Close previous history entry
            await db
                .update(interestRateHistory)
                .set({ effectiveTo: effectiveFrom || new Date().toISOString() })
                .where(eq(interestRateHistory.benchmarkId, id));

            // Create new history entry
            await db.insert(interestRateHistory).values({
                benchmarkId: id,
                rate: currentRate,
                effectiveFrom: effectiveFrom || new Date().toISOString(),
                source,
                createdById: session.user.id,
            });
        }

        const [updated] = await db
            .update(interestRateBenchmarks)
            .set({
                name: name ?? existing.name,
                description: description !== undefined ? description : existing.description,
                currentRate: currentRate ?? existing.currentRate,
                previousRate: currentRate !== existing.currentRate ? existing.currentRate : existing.previousRate,
                effectiveFrom: effectiveFrom ?? existing.effectiveFrom,
                source: source !== undefined ? source : existing.source,
                isActive: isActive !== undefined ? isActive : existing.isActive,
                updatedAt: new Date().toISOString(),
                updatedById: session.user.id,
            })
            .where(eq(interestRateBenchmarks.id, id))
            .returning();

        await logAudit({
            action: "UPDATE",
            entityType: "DOCUMENT",
            entityId: id,
            description: `Interest rate benchmark updated: ${updated.name}`,
            metadata: { changes: body },
            userId: session.user.id,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update interest rate error:", error);
        return NextResponse.json(
            { error: "Failed to update interest rate" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/interest-rates
 * Delete an interest rate benchmark
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Benchmark ID is required" },
                { status: 400 }
            );
        }

        // Delete history first
        await db.delete(interestRateHistory).where(eq(interestRateHistory.benchmarkId, id));
        
        // Delete benchmark
        await db.delete(interestRateBenchmarks).where(eq(interestRateBenchmarks.id, id));

        await logAudit({
            action: "DELETE",
            entityType: "DOCUMENT",
            entityId: id,
            description: "Interest rate benchmark deleted",
            userId: session.user.id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete interest rate error:", error);
        return NextResponse.json(
            { error: "Failed to delete interest rate" },
            { status: 500 }
        );
    }
}
