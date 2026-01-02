import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

/**
 * POST /api/auth/mfa/disable
 * Disable MFA for the current user
 */
export async function POST() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if MFA is enabled
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (!user.mfaEnabled) {
            return NextResponse.json(
                { error: "MFA is not enabled" },
                { status: 400 }
            );
        }

        // Disable MFA
        await db
            .update(users)
            .set({
                mfaEnabled: false,
                mfaSecret: null,
                mfaBackupCodes: null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, session.user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("MFA disable error:", error);
        return NextResponse.json(
            { error: "Failed to disable MFA" },
            { status: 500 }
        );
    }
}
