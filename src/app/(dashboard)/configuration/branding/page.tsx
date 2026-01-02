"use client";

import { useEffect, useState } from "react";
import { 
    RiPaletteLine, 
    RiSaveLine,
    RiLoader4Line,
    RiImageLine,
    RiMailLine,
    RiPhoneLine,
    RiGlobalLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BrandingConfig {
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

const defaultConfig: BrandingConfig = {
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

export default function BrandingPage() {
    const [config, setConfig] = useState<BrandingConfig>(defaultConfig);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadBranding();
    }, []);

    const loadBranding = async () => {
        try {
            const response = await fetch("/api/admin/branding");
            const data = await response.json();
            if (response.ok) {
                setConfig({ ...defaultConfig, ...data });
            }
        } catch {
            toast.error("Failed to load branding settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/admin/branding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                toast.success("Branding settings saved");
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to save branding");
            }
        } catch {
            toast.error("Failed to save branding");
        } finally {
            setIsSaving(false);
        }
    };

    const updateConfig = (key: keyof BrandingConfig, value: string | null) => {
        setConfig((prev) => ({ ...prev, [key]: value || null }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Branding</h1>
                    <p className="text-muted-foreground">
                        Customize the look and feel of your LMS
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <RiSaveLine className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Logo Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RiImageLine className="h-5 w-5" />
                            Logo & Images
                        </CardTitle>
                        <CardDescription>
                            Upload your company logo and favicon
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL (Light Mode)</Label>
                            <Input
                                id="logoUrl"
                                placeholder="https://example.com/logo.png"
                                value={config.logoUrl || ""}
                                onChange={(e) => updateConfig("logoUrl", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logoDarkUrl">Logo URL (Dark Mode)</Label>
                            <Input
                                id="logoDarkUrl"
                                placeholder="https://example.com/logo-dark.png"
                                value={config.logoDarkUrl || ""}
                                onChange={(e) => updateConfig("logoDarkUrl", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="faviconUrl">Favicon URL</Label>
                            <Input
                                id="faviconUrl"
                                placeholder="https://example.com/favicon.ico"
                                value={config.faviconUrl || ""}
                                onChange={(e) => updateConfig("faviconUrl", e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Color Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RiPaletteLine className="h-5 w-5" />
                            Colors
                        </CardTitle>
                        <CardDescription>
                            Customize your brand colors
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="primaryColor">Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="primaryColor"
                                    value={config.primaryColor}
                                    onChange={(e) => updateConfig("primaryColor", e.target.value)}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={config.primaryColor}
                                    onChange={(e) => updateConfig("primaryColor", e.target.value)}
                                    placeholder="#4F46E5"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secondaryColor">Secondary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="secondaryColor"
                                    value={config.secondaryColor || "#6B7280"}
                                    onChange={(e) => updateConfig("secondaryColor", e.target.value)}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={config.secondaryColor || ""}
                                    onChange={(e) => updateConfig("secondaryColor", e.target.value)}
                                    placeholder="#6B7280"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accentColor">Accent Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    id="accentColor"
                                    value={config.accentColor || "#10B981"}
                                    onChange={(e) => updateConfig("accentColor", e.target.value)}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={config.accentColor || ""}
                                    onChange={(e) => updateConfig("accentColor", e.target.value)}
                                    placeholder="#10B981"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Color Preview */}
                        <div className="pt-4">
                            <Label>Preview</Label>
                            <div className="flex gap-2 mt-2">
                                <div
                                    className="h-12 w-12 rounded-lg"
                                    style={{ backgroundColor: config.primaryColor }}
                                    title="Primary"
                                />
                                {config.secondaryColor && (
                                    <div
                                        className="h-12 w-12 rounded-lg"
                                        style={{ backgroundColor: config.secondaryColor }}
                                        title="Secondary"
                                    />
                                )}
                                {config.accentColor && (
                                    <div
                                        className="h-12 w-12 rounded-lg"
                                        style={{ backgroundColor: config.accentColor }}
                                        title="Accent"
                                    />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Company Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RiGlobalLine className="h-5 w-5" />
                            Company Information
                        </CardTitle>
                        <CardDescription>
                            Basic company details displayed throughout the app
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                value={config.companyName}
                                onChange={(e) => updateConfig("companyName", e.target.value)}
                                placeholder="1Fi LMS"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="websiteUrl">Website URL</Label>
                            <Input
                                id="websiteUrl"
                                value={config.websiteUrl || ""}
                                onChange={(e) => updateConfig("websiteUrl", e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Support Contact */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RiMailLine className="h-5 w-5" />
                            Support Contact
                        </CardTitle>
                        <CardDescription>
                            Contact information for customer support
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="supportEmail">Support Email</Label>
                            <Input
                                id="supportEmail"
                                type="email"
                                value={config.supportEmail || ""}
                                onChange={(e) => updateConfig("supportEmail", e.target.value)}
                                placeholder="support@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supportPhone">Support Phone</Label>
                            <Input
                                id="supportPhone"
                                value={config.supportPhone || ""}
                                onChange={(e) => updateConfig("supportPhone", e.target.value)}
                                placeholder="+91 9876543210"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Text */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Footer & Legal</CardTitle>
                        <CardDescription>
                            Customize footer content and copyright text
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="footerText">Footer Text</Label>
                            <Textarea
                                id="footerText"
                                value={config.footerText || ""}
                                onChange={(e) => updateConfig("footerText", e.target.value)}
                                placeholder="Additional footer information..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="copyrightText">Copyright Text</Label>
                            <Input
                                id="copyrightText"
                                value={config.copyrightText || ""}
                                onChange={(e) => updateConfig("copyrightText", e.target.value)}
                                placeholder={`© ${new Date().getFullYear()} Your Company. All rights reserved.`}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
