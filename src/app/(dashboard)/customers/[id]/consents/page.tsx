"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
    RiShieldCheckLine, 
    RiLoader4Line, 
    RiHistoryLine, 
    RiToggleLine 
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

type Consent = {
    id: string;
    consentType: string;
    granted: boolean;
    grantedAt: string;
    version: string;
    ipAddress: string;
};

const CONSENT_TYPES = [
    { id: "DATA_PROCESSING", label: "Data Processing Agreement", desc: "Allow processing of personal and financial data for loan servicing." },
    { id: "CIBIL_CHECK", label: "Bureau Check Authorization", desc: "Authorize periodic credit report fetching from CIBIL/Experian." },
    { id: "MARKETING", label: "Marketing Communications", desc: "Receive offers for top-up loans and new products via Email/SMS." },
    { id: "THIRD_PARTY_SHARING", label: "Third-Party Sharing (Digital Lending App)", desc: "Share data with co-lending partners as per DLA guidelines." },
];

export default function CustomerConsentsPage() {
    const params = useParams();
    const id = params.id as string;
    
    const [consents, setConsents] = useState<Consent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadConsents = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/customers/${id}/consents`);
            if (res.ok) {
                const data = await res.json();
                setConsents(data);
            }
        } catch (error) {
            toast.error("Failed to load consent history");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadConsents();
    }, [id]);

    const handleToggleConsent = async (typeId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/customers/${id}/consents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    consentType: typeId,
                    granted: !currentStatus,
                    version: "1.2" // In real app, fetch latest version policy
                }),
            });

            if (res.ok) {
                toast.success(`Consent ${!currentStatus ? "Granted" : "Revoked"}`);
                loadConsents();
            } else {
                toast.error("Failed to update consent");
            }
        } catch {
            toast.error("Error updating consent");
        }
    };

    // Helper to get latest status for a type
    const getCurrentStatus = (typeId: string) => {
        // Find most recent entry for this type
        const latest = consents.find(c => c.consentType === typeId);
        return latest ? latest.granted : false; // Default false
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Consent Management</h1>
                    <p className="text-muted-foreground">
                        Manage customer data privacy and authorizations (DPDPA 2023 Compliant)
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <RiShieldCheckLine className="h-5 w-5 text-primary" />
                             Active Consents
                        </CardTitle>
                        <CardDescription>
                            Toggle consents for specific data usage purposes. Changes are audit-logged.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <RiLoader4Line className="animate-spin h-6 w-6" />
                            </div>
                        ) : (
                            CONSENT_TYPES.map((type) => {
                                const isGranted = getCurrentStatus(type.id);
                                return (
                                    <div key={type.id} className="flex items-center justify-between space-x-4 border p-4 rounded-lg">
                                        <div className="space-y-1">
                                            <Label htmlFor={type.id} className="text-base font-medium">
                                                {type.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {type.desc}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${isGranted ? "text-green-600" : "text-gray-500"}`}>
                                                {isGranted ? "Granted" : "Denied"}
                                            </span>
                                            <Switch
                                                id={type.id}
                                                checked={isGranted}
                                                onCheckedChange={() => handleToggleConsent(type.id, isGranted)}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <RiHistoryLine className="h-5 w-5" />
                             Consent History
                        </CardTitle>
                        <CardDescription>
                            Audit trail of consent grants and revocations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {consents.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No history available</p>
                            ) : (
                                consents.map((log) => (
                                    <div key={log.id} className="flex justify-between items-start text-sm border-b pb-3 last:border-0">
                                        <div>
                                            <p className="font-medium">{CONSENT_TYPES.find(t => t.id === log.consentType)?.label || log.consentType}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={log.granted ? "bg-green-50 text-green-700 hover:bg-green-50" : "bg-red-50 text-red-700 hover:bg-red-50"}>
                                                    {log.granted ? "GRANTED" : "REVOKED"}
                                                </Badge>
                                                <span className="text-muted-foreground text-xs">v{log.version}</span>
                                            </div>
                                        </div>
                                        <div className="text-right text-muted-foreground text-xs">
                                            <p>{format(new Date(log.grantedAt), "PP p")}</p>
                                            <p className="font-mono mt-1">IP: {log.ipAddress || "Unknown"}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
