import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
    verifyTotpCode,
    verifyBackupCode,
    removeUsedBackupCode,
    parseBackupCodeInput,
} from "@/lib/mfa";

/**
 * POST /api/auth/mfa/challenge
 * Verify MFA code during login
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, isBackupCode, email } = body;

        if (!code || !email) {
            return NextResponse.json(
                { error: "Code and email are required" },
                { status: 400 }
            );
        }

        // Get user by email
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (!user.mfaEnabled || !user.mfaSecret) {
            return NextResponse.json(
                { error: "MFA is not enabled for this user" },
                { status: 400 }
            );
        }

        if (isBackupCode) {
            // Verify backup code
            const parsedCode = parseBackupCodeInput(code);
            const hashedCodes: string[] = user.mfaBackupCodes
                ? JSON.parse(user.mfaBackupCodes)
                : [];

            const codeIndex = verifyBackupCode(parsedCode, hashedCodes);

            if (codeIndex === -1) {
                return NextResponse.json(
                    { error: "Invalid backup code" },
                    { status: 400 }
                );
            }

            // Remove the used backup code
            const updatedCodes = removeUsedBackupCode(hashedCodes, codeIndex);
            await db
                .update(users)
                .set({
                    mfaBackupCodes: JSON.stringify(updatedCodes),
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(users.id, user.id));

            return NextResponse.json({
                success: true,
                remainingBackupCodes: updatedCodes.length,
            });
        } else {
            // Verify TOTP code
            const isValid = verifyTotpCode(code, user.mfaSecret);

            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid verification code" },
                    { status: 400 }
                );
            }

            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error("MFA challenge error:", error);
        return NextResponse.json(
            { error: "Failed to verify MFA" },
            { status: 500 }
        );
    }
}
