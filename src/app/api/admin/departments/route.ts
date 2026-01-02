import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { departments, users } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/admin/departments
 * List all departments with hierarchy
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
        const includeUsers = searchParams.get("includeUsers") === "true";

        // Get all departments
        const allDepartments = await db.query.departments.findMany({
            orderBy: (departments, { asc }) => [asc(departments.name)],
        });

        // Get managers for each department
        const departmentsWithManagers = await Promise.all(
            allDepartments.map(async (dept) => {
                let manager = null;
                if (dept.managerId) {
                    manager = await db.query.users.findFirst({
                        where: eq(users.id, dept.managerId),
                        columns: { id: true, name: true, email: true },
                    });
                }

                let userCount = 0;
                if (includeUsers) {
                    const usersInDept = await db.query.users.findMany({
                        where: eq(users.departmentId, dept.id),
                        columns: { id: true },
                    });
                    userCount = usersInDept.length;
                }

                return {
                    ...dept,
                    manager,
                    userCount,
                };
            })
        );

        // Build hierarchy
        const buildHierarchy = (parentId: string | null): typeof departmentsWithManagers => {
            return departmentsWithManagers
                .filter((d) => d.parentId === parentId)
                .map((d) => ({
                    ...d,
                    children: buildHierarchy(d.id),
                }));
        };

        const hierarchy = buildHierarchy(null);

        return NextResponse.json({
            departments: departmentsWithManagers,
            hierarchy,
        });
    } catch (error) {
        console.error("List departments error:", error);
        return NextResponse.json(
            { error: "Failed to list departments" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/departments
 * Create a new department
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
        const { name, code, description, parentId, managerId, isActive } = body;

        if (!name || !code) {
            return NextResponse.json(
                { error: "Name and code are required" },
                { status: 400 }
            );
        }

        // Check for duplicate code
        const existing = await db.query.departments.findFirst({
            where: eq(departments.code, code),
        });

        if (existing) {
            return NextResponse.json(
                { error: "Department code already exists" },
                { status: 400 }
            );
        }

        const [department] = await db
            .insert(departments)
            .values({
                name,
                code: code.toUpperCase(),
                description,
                parentId: parentId || null,
                managerId: managerId || null,
                isActive: isActive ?? true,
            })
            .returning();

        await logAudit({
            action: "CREATE",
            entityType: "DOCUMENT",
            entityId: department.id,
            description: `Department created: ${name} (${code})`,
            metadata: { name, code, parentId },
            userId: session.user.id,
        });

        return NextResponse.json(department);
    } catch (error) {
        console.error("Create department error:", error);
        return NextResponse.json(
            { error: "Failed to create department" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/departments
 * Update a department
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
        const { id, name, code, description, parentId, managerId, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Department ID is required" },
                { status: 400 }
            );
        }

        // Check if department exists
        const existing = await db.query.departments.findFirst({
            where: eq(departments.id, id),
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Department not found" },
                { status: 404 }
            );
        }

        // Prevent circular reference
        if (parentId === id) {
            return NextResponse.json(
                { error: "Department cannot be its own parent" },
                { status: 400 }
            );
        }

        const [updated] = await db
            .update(departments)
            .set({
                name: name ?? existing.name,
                code: code ? code.toUpperCase() : existing.code,
                description: description !== undefined ? description : existing.description,
                parentId: parentId !== undefined ? parentId : existing.parentId,
                managerId: managerId !== undefined ? managerId : existing.managerId,
                isActive: isActive !== undefined ? isActive : existing.isActive,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(departments.id, id))
            .returning();

        await logAudit({
            action: "UPDATE",
            entityType: "DOCUMENT",
            entityId: id,
            description: `Department updated: ${updated.name}`,
            metadata: { changes: body },
            userId: session.user.id,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update department error:", error);
        return NextResponse.json(
            { error: "Failed to update department" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/departments
 * Delete a department
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
                { error: "Department ID is required" },
                { status: 400 }
            );
        }

        // Check if department has users
        const usersInDept = await db.query.users.findMany({
            where: eq(users.departmentId, id),
            columns: { id: true },
        });

        if (usersInDept.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete department with ${usersInDept.length} assigned users` },
                { status: 400 }
            );
        }

        // Check if department has children
        const children = await db.query.departments.findMany({
            where: eq(departments.parentId, id),
            columns: { id: true },
        });

        if (children.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete department with sub-departments" },
                { status: 400 }
            );
        }

        await db.delete(departments).where(eq(departments.id, id));

        await logAudit({
            action: "DELETE",
            entityType: "DOCUMENT",
            entityId: id,
            description: "Department deleted",
            userId: session.user.id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete department error:", error);
        return NextResponse.json(
            { error: "Failed to delete department" },
            { status: 500 }
        );
    }
}
