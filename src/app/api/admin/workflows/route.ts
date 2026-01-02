import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workflowDefinitions, workflowInstances, workflowHistory, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export interface WorkflowStage {
    name: string;
    approverRole: string; // ADMIN, MANAGER, or specific user ID
    minAmount?: number;
    maxAmount?: number;
    slaHours?: number;
    autoApprove?: boolean;
    conditions?: string; // JSON conditions
}

/**
 * GET /api/admin/workflows
 * List workflow definitions
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || !hasPermission(session.user.role, "dashboard:view")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        let workflows;
        if (type) {
            workflows = await db.query.workflowDefinitions.findMany({
                where: eq(workflowDefinitions.type, type),
                orderBy: [desc(workflowDefinitions.createdAt)],
            });
        } else {
            workflows = await db.query.workflowDefinitions.findMany({
                orderBy: [desc(workflowDefinitions.createdAt)],
            });
        }

        // Parse stages JSON for each workflow
        const parsed = workflows.map((wf) => ({
            ...wf,
            stages: JSON.parse(wf.stages) as WorkflowStage[],
        }));

        return NextResponse.json({ workflows: parsed });
    } catch (error) {
        console.error("List workflows error:", error);
        return NextResponse.json(
            { error: "Failed to list workflows" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/workflows
 * Create a workflow definition
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
        const { name, description, type, stages, productId, isActive } = body;

        if (!name || !type || !stages || !Array.isArray(stages) || stages.length === 0) {
            return NextResponse.json(
                { error: "Name, type, and at least one stage are required" },
                { status: 400 }
            );
        }

        const [workflow] = await db
            .insert(workflowDefinitions)
            .values({
                name,
                description,
                type,
                stages: JSON.stringify(stages),
                productId: productId || null,
                isActive: isActive ?? true,
                createdById: session.user.id,
            })
            .returning();

        await logAudit({
            action: "CREATE",
            entityType: "DOCUMENT",
            entityId: workflow.id,
            description: `Workflow created: ${name} (${type})`,
            metadata: { name, type, stagesCount: stages.length },
            userId: session.user.id,
        });

        return NextResponse.json({
            ...workflow,
            stages: JSON.parse(workflow.stages),
        });
    } catch (error) {
        console.error("Create workflow error:", error);
        return NextResponse.json(
            { error: "Failed to create workflow" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/workflows
 * Update a workflow definition
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
        const { id, name, description, type, stages, productId, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Workflow ID is required" },
                { status: 400 }
            );
        }

        const existing = await db.query.workflowDefinitions.findFirst({
            where: eq(workflowDefinitions.id, id),
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        const [updated] = await db
            .update(workflowDefinitions)
            .set({
                name: name ?? existing.name,
                description: description !== undefined ? description : existing.description,
                type: type ?? existing.type,
                stages: stages ? JSON.stringify(stages) : existing.stages,
                productId: productId !== undefined ? productId : existing.productId,
                isActive: isActive !== undefined ? isActive : existing.isActive,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(workflowDefinitions.id, id))
            .returning();

        await logAudit({
            action: "UPDATE",
            entityType: "DOCUMENT",
            entityId: id,
            description: `Workflow updated: ${updated.name}`,
            metadata: { changes: body },
            userId: session.user.id,
        });

        return NextResponse.json({
            ...updated,
            stages: JSON.parse(updated.stages),
        });
    } catch (error) {
        console.error("Update workflow error:", error);
        return NextResponse.json(
            { error: "Failed to update workflow" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/workflows
 * Delete a workflow definition
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
                { error: "Workflow ID is required" },
                { status: 400 }
            );
        }

        // Check for active instances
        const activeInstances = await db.query.workflowInstances.findMany({
            where: and(
                eq(workflowInstances.definitionId, id),
                eq(workflowInstances.status, "IN_PROGRESS")
            ),
            columns: { id: true },
        });

        if (activeInstances.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete workflow with ${activeInstances.length} active instances` },
                { status: 400 }
            );
        }

        await db.delete(workflowDefinitions).where(eq(workflowDefinitions.id, id));

        await logAudit({
            action: "DELETE",
            entityType: "DOCUMENT",
            entityId: id,
            description: "Workflow deleted",
            userId: session.user.id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete workflow error:", error);
        return NextResponse.json(
            { error: "Failed to delete workflow" },
            { status: 500 }
        );
    }
}
