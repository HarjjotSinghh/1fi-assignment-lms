/**
 * Multi-Factor Authentication (MFA) utilities
 * TOTP-based authentication using otplib
 */

import { authenticator } from "otplib";
import { createHash, randomBytes } from "crypto";
import QRCode from "qrcode";

// Configure TOTP settings
authenticator.options = {
    digits: 6,
    step: 30, // 30-second window
    window: 1, // Allow 1 step before/after for clock drift
};

const APP_NAME = "1Fi LMS";

/**
 * Generate a new MFA secret for a user
 */
export function generateMfaSecret(): string {
    return authenticator.generateSecret();
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTotpUri(email: string, secret: string): string {
    return authenticator.keyuri(email, APP_NAME, secret);
}

/**
 * Generate QR code as data URL
 */
export async function generateQrCodeDataUrl(uri: string): Promise<string> {
    return QRCode.toDataURL(uri, {
        width: 256,
        margin: 2,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
    });
}

/**
 * Verify a TOTP code
 */
export function verifyTotpCode(code: string, secret: string): boolean {
    try {
        return authenticator.verify({ token: code, secret });
    } catch {
        return false;
    }
}

/**
 * Generate backup codes for MFA recovery
 * Returns plain text codes (to show user) and hashed codes (to store)
 */
export function generateBackupCodes(count: number = 8): {
    plainCodes: string[];
    hashedCodes: string[];
} {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = randomBytes(4).toString("hex").toUpperCase();
        plainCodes.push(code);
        hashedCodes.push(hashBackupCode(code));
    }

    return { plainCodes, hashedCodes };
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
    return createHash("sha256").update(code.toUpperCase()).digest("hex");
}

/**
 * Verify a backup code against stored hashed codes
 * Returns the index of the matched code, or -1 if not found
 */
export function verifyBackupCode(
    code: string,
    hashedCodes: string[]
): number {
    const inputHash = hashBackupCode(code);
    return hashedCodes.findIndex((hash) => hash === inputHash);
}

/**
 * Remove a used backup code from the list
 */
export function removeUsedBackupCode(
    hashedCodes: string[],
    usedIndex: number
): string[] {
    return hashedCodes.filter((_, index) => index !== usedIndex);
}

/**
 * Check if MFA is required for a user based on their role
 */
export function isMfaRequiredForRole(role: string): boolean {
    // Require MFA for admin and manager roles
    return role === "ADMIN" || role === "MANAGER";
}

/**
 * Format backup codes for display (with dashes for readability)
 */
export function formatBackupCode(code: string): string {
    return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Parse a backup code input (remove dashes and spaces)
 */
export function parseBackupCodeInput(input: string): string {
    return input.replace(/[-\s]/g, "").toUpperCase();
}
