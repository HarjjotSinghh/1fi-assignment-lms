import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { restoreBackup } from "@/lib/backup";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/admin/backup/restore
 * Restore database from a backup
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
        const { backupId } = body;

        if (!backupId) {
            return NextResponse.json(
                { error: "Backup ID is required" },
                { status: 400 }
            );
        }

        await restoreBackup(backupId);

        await logAudit({
            action: "UPDATE",
            entityType: "DOCUMENT",
            entityId: backupId,
            description: `Database restored from backup: ${backupId}`,
            userId: session.user.id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Restore backup error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to restore backup" },
            { status: 500 }
        );
    }
}
