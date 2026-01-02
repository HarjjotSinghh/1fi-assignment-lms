import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
    verifyTotpCode,
    generateBackupCodes,
    formatBackupCode,
} from "@/lib/mfa";

/**
 * POST /api/auth/mfa/verify
 * Verify TOTP code and enable MFA for the user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { code, secret } = body;

        if (!code || !secret) {
            return NextResponse.json(
                { error: "Code and secret are required" },
                { status: 400 }
            );
        }

        // Verify the TOTP code
        const isValid = verifyTotpCode(code, secret);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Generate backup codes
        const { plainCodes, hashedCodes } = generateBackupCodes(8);

        // Enable MFA for the user
        await db
            .update(users)
            .set({
                mfaEnabled: true,
                mfaSecret: secret,
                mfaBackupCodes: JSON.stringify(hashedCodes),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, session.user.id));

        // Return formatted backup codes for user to save
        const formattedCodes = plainCodes.map(formatBackupCode);

        return NextResponse.json({
            success: true,
            backupCodes: formattedCodes,
        });
    } catch (error) {
        console.error("MFA verify error:", error);
        return NextResponse.json(
            { error: "Failed to verify MFA" },
            { status: 500 }
        );
    }
}
