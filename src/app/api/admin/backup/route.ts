import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import {
    createBackup,
    listBackups,
    deleteBackup,
    restoreBackup,
    formatBackupSize,
} from "@/lib/backup";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/admin/backup
 * List all available backups
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id || !hasPermission(session.user.role, "analytics:export")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const backups = await listBackups();
        const formatted = backups.map((b) => ({
            ...b,
            sizeFormatted: formatBackupSize(b.size),
        }));

        return NextResponse.json({ backups: formatted });
    } catch (error) {
        console.error("List backups error:", error);
        return NextResponse.json(
            { error: "Failed to list backups" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/backup
 * Create a new backup
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

        const body = await request.json().catch(() => ({}));
        const name = body.name as string | undefined;

        const backup = await createBackup(name);

        await logAudit({
            action: "CREATE",
            entityType: "DOCUMENT",
            entityId: backup.id,
            description: `Database backup created: ${backup.filename}`,
            metadata: { filename: backup.filename, size: backup.size },
            userId: session.user.id,
        });

        return NextResponse.json({
            success: true,
            backup: {
                ...backup,
                sizeFormatted: formatBackupSize(backup.size),
            },
        });
    } catch (error) {
        console.error("Create backup error:", error);
        return NextResponse.json(
            { error: "Failed to create backup" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/backup
 * Delete a backup
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
        const backupId = searchParams.get("id");

        if (!backupId) {
            return NextResponse.json(
                { error: "Backup ID is required" },
                { status: 400 }
            );
        }

        await deleteBackup(backupId);

        await logAudit({
            action: "DELETE",
            entityType: "DOCUMENT",
            entityId: backupId,
            description: `Database backup deleted: ${backupId}`,
            userId: session.user.id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete backup error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete backup" },
            { status: 500 }
        );
    }
}
