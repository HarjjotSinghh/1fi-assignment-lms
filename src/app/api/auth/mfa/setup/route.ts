import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
    generateMfaSecret,
    generateTotpUri,
    generateQrCodeDataUrl,
} from "@/lib/mfa";

/**
 * POST /api/auth/mfa/setup
 * Generate a new MFA secret and QR code for the current user
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

        // Check if MFA is already enabled
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (user.mfaEnabled) {
            return NextResponse.json(
                { error: "MFA is already enabled" },
                { status: 400 }
            );
        }

        // Generate a new secret
        const secret = generateMfaSecret();
        const uri = generateTotpUri(user.email, secret);
        const qrCodeUrl = await generateQrCodeDataUrl(uri);

        return NextResponse.json({
            secret,
            qrCodeUrl,
        });
    } catch (error) {
        console.error("MFA setup error:", error);
        return NextResponse.json(
            { error: "Failed to setup MFA" },
            { status: 500 }
        );
    }
}
