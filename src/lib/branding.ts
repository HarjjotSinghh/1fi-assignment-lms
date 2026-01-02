/**
 * Branding & White-Labeling Utilities
 */

import { db } from "@/db";
import { brandingSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface BrandingConfig {
    logoUrl: string | null;
    logoDarkUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string | null;
    accentColor: string | null;
    companyName: string;
    supportEmail: string | null;
    supportPhone: string | null;
    websiteUrl: string | null;
    footerText: string | null;
    copyrightText: string | null;
}

const DEFAULT_BRANDING: BrandingConfig = {
    logoUrl: null,
    logoDarkUrl: null,
    faviconUrl: null,
    primaryColor: "#4F46E5",
    secondaryColor: null,
    accentColor: null,
    companyName: "1Fi LMS",
    supportEmail: null,
    supportPhone: null,
    websiteUrl: null,
    footerText: null,
    copyrightText: null,
};

let cachedBranding: BrandingConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get branding configuration
 */
export async function getBranding(): Promise<BrandingConfig> {
    // Check cache
    if (cachedBranding && Date.now() - cacheTimestamp < CACHE_TTL) {
        return cachedBranding;
    }

    try {
        const settings = await db.query.brandingSettings.findFirst();

        if (!settings) {
            cachedBranding = DEFAULT_BRANDING;
            cacheTimestamp = Date.now();
            return DEFAULT_BRANDING;
        }

        cachedBranding = {
            logoUrl: settings.logoUrl,
            logoDarkUrl: settings.logoDarkUrl,
            faviconUrl: settings.faviconUrl,
            primaryColor: settings.primaryColor || DEFAULT_BRANDING.primaryColor,
            secondaryColor: settings.secondaryColor,
            accentColor: settings.accentColor,
            companyName: settings.companyName || DEFAULT_BRANDING.companyName,
            supportEmail: settings.supportEmail,
            supportPhone: settings.supportPhone,
            websiteUrl: settings.websiteUrl,
            footerText: settings.footerText,
            copyrightText: settings.copyrightText,
        };
        cacheTimestamp = Date.now();

        return cachedBranding;
    } catch (error) {
        console.error("Failed to get branding:", error);
        return DEFAULT_BRANDING;
    }
}

/**
 * Update branding configuration
 */
export async function updateBranding(
    config: Partial<BrandingConfig>,
    userId?: string
): Promise<BrandingConfig> {
    try {
        const existing = await db.query.brandingSettings.findFirst();

        if (existing) {
            await db
                .update(brandingSettings)
                .set({
                    ...config,
                    updatedAt: new Date().toISOString(),
                    updatedById: userId,
                })
                .where(eq(brandingSettings.id, existing.id));
        } else {
            await db.insert(brandingSettings).values({
                ...config,
                updatedById: userId,
            });
        }

        // Clear cache
        cachedBranding = null;
        cacheTimestamp = 0;

        return getBranding();
    } catch (error) {
        console.error("Failed to update branding:", error);
        throw error;
    }
}

/**
 * Generate CSS variables from branding config
 */
export function generateBrandingCss(branding: BrandingConfig): string {
    const variables: string[] = [];

    if (branding.primaryColor) {
        variables.push(`--brand-primary: ${branding.primaryColor};`);
    }
    if (branding.secondaryColor) {
        variables.push(`--brand-secondary: ${branding.secondaryColor};`);
    }
    if (branding.accentColor) {
        variables.push(`--brand-accent: ${branding.accentColor};`);
    }

    return `:root { ${variables.join(" ")} }`;
}

/**
 * Clear branding cache (call after updates)
 */
export function clearBrandingCache(): void {
    cachedBranding = null;
    cacheTimestamp = 0;
}
