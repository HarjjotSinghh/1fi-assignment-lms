"use client";

import { useState } from "react";
import {
    RiFileChartLine,
    RiLoader4Line,
    RiDownloadLine,
    RiShieldCheckLine,
    RiBankLine,
    RiPieChartLine,
    RiErrorWarningLine,
    RiRefreshLine,
    RiCheckboxCircleLine,
    RiAlertLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReportData {
    headers: string[];
    rows: (string | number)[][];
    summary: Record<string, number | string>;
    generatedAt?: string;
    dataSource?: "LIVE" | "CACHED";
}

const REPORT_TYPES = [
    { id: "NPA", name: "NPA Classification", icon: RiErrorWarningLine, desc: "Non-Performing Assets classification as per IRAC norms", color: "text-red-600" },
    { id: "SECTOR_EXPOSURE", name: "Sectoral Exposure", icon: RiPieChartLine, desc: "Credit exposure limit usage across sectors", color: "text-blue-600" },
    { id: "ALM", name: "Asset Liability Mgmt", icon: RiBankLine, desc: "Structural liquidity statement and gap analysis", color: "text-purple-600" },
    { id: "PRUDENTIAL_NORMS", name: "Prudential Norms", icon: RiShieldCheckLine, desc: "Compliance with capital adequacy and leverage ratios", color: "text-green-600" },
];

export default function RegulatoryReportsPage() {
    const [activeTab, setActiveTab] = useState("NPA");
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<Record<string, ReportData>>({});

    const handleGenerateReport = async (type: string) => {
        setIsLoading(true);
        try {
            // Call the API endpoint
            const res = await fetch(`/api/reports/regulatory?type=${type}`);
            if (!res.ok) {
                // Fallback to client-side generation
                const { generateRegulatoryReport } = await import("@/lib/regulatory-reports");
                const data = await generateRegulatoryReport(type);
                setReportData(prev => ({ ...prev, [type]: data }));
            } else {
                const data = await res.json();
                setReportData(prev => ({ ...prev, [type]: data }));
            }
            toast.success("Report generated from live data");
        } catch (error) {
            console.error(error);
            // Try direct import as fallback
            try {
                const { generateRegulatoryReport } = await import("@/lib/regulatory-reports");
                const data = await generateRegulatoryReport(type);
                setReportData(prev => ({ ...prev, [type]: data }));
                toast.success("Report generated successfully");
            } catch {
                toast.error("Failed to generate report");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportJSON = (type: string) => {
        const data = reportData[type];
        if (!data) return;

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type.toLowerCase()}_report_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Report exported");
    };

    const renderCellValue = (cell: string | number, header: string) => {
        const cellStr = String(cell);
        
        // Status badges
        if (cellStr === "COMPLIANT") {
            return <Badge className="bg-green-600"><RiCheckboxCircleLine className="mr-1 h-3 w-3" />COMPLIANT</Badge>;
        }
        if (cellStr === "NON-COMPLIANT") {
            return <Badge className="bg-red-600"><RiAlertLine className="mr-1 h-3 w-3" />NON-COMPLIANT</Badge>;
        }
        if (cellStr === "HIGH" || cellStr === "ATTENTION NEEDED") {
            return <Badge variant="destructive">{cellStr}</Badge>;
        }
        if (cellStr === "MEDIUM") {
            return <Badge className="bg-amber-500">{cellStr}</Badge>;
        }
        if (cellStr === "LOW" || cellStr === "ADEQUATE") {
            return <Badge className="bg-green-600">{cellStr}</Badge>;
        }

        // Numeric formatting
        if (typeof cell === "number" && header.includes("%")) {
            return `${cell}%`;
        }
        if (typeof cell === "number" && (header.includes("₹") || header.includes("Lakh"))) {
            return `₹${cell.toLocaleString('en-IN')}`;
        }

        return cell;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Regulatory Reports</h1>
                    <p className="text-muted-foreground">
                        Generate compliance reports for RBI/NBFC regulatory filing
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                        Data Source: LIVE
                    </Badge>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                {REPORT_TYPES.map((type) => (
                    <Card 
                        key={type.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${activeTab === type.id ? "ring-2 ring-primary" : ""}`}
                        onClick={() => {
                            setActiveTab(type.id);
                            if (!reportData[type.id]) {
                                handleGenerateReport(type.id);
                            }
                        }}
                    >
                        <CardHeader className="pb-2">
                            <div className={`p-2 w-fit rounded-lg bg-muted ${type.color}`}>
                                <type.icon className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <h3 className="font-semibold text-sm">{type.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {reportData[type.id] ? "Generated" : "Click to generate"}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="w-full justify-start">
                    {REPORT_TYPES.map((type) => (
                        <TabsTrigger key={type.id} value={type.id} className="gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.name.split(" ").slice(0, 2).join(" ")}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {REPORT_TYPES.map((type) => {
                    const data = reportData[type.id];
                    return (
                        <TabsContent key={type.id} value={type.id} className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-muted ${type.color}`}>
                                                <type.icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <CardTitle>{type.name}</CardTitle>
                                                <CardDescription>{type.desc}</CardDescription>
                                            </div>
                                        </div>
                                        {data?.generatedAt && (
                                            <div className="text-right text-xs text-muted-foreground">
                                                <p>Generated: {format(new Date(data.generatedAt), "PP p")}</p>
                                                <Badge variant="outline" className="mt-1">
                                                    {data.dataSource || "LIVE"} Data
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isLoading && activeTab === type.id ? (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                                            <RiLoader4Line className="h-8 w-8 animate-spin mb-4" />
                                            <p>Querying portfolio data...</p>
                                        </div>
                                    ) : data ? (
                                        <div className="space-y-6">
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {Object.entries(data.summary).map(([key, value]) => (
                                                    <div key={key} className="p-4 bg-gradient-to-br from-muted/50 to-muted rounded-lg border">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{key}</p>
                                                        <p className="text-xl font-bold mt-1">{renderCellValue(value, key)}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Data Table */}
                                            <div className="rounded-lg border overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            {data.headers.map((header, i) => (
                                                                <TableHead key={i} className="font-semibold">{header}</TableHead>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {data.rows.map((row, i) => (
                                                            <TableRow key={i} className="hover:bg-muted/30">
                                                                {row.map((cell, j) => (
                                                                    <TableCell key={j}>
                                                                        {renderCellValue(cell, data.headers[j])}
                                                                    </TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                            <RiFileChartLine className="h-12 w-12 mb-3 opacity-20" />
                                            <p className="mb-4">Click below to generate this report</p>
                                            <Button onClick={() => handleGenerateReport(type.id)}>
                                                Generate {type.name}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                                {data && (
                                    <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-muted/30">
                                        <Button variant="outline" onClick={() => handleGenerateReport(type.id)}>
                                            <RiRefreshLine className="mr-2 h-4 w-4" />
                                            Refresh
                                        </Button>
                                        <Button onClick={() => handleExportJSON(type.id)}>
                                            <RiDownloadLine className="mr-2 h-4 w-4" />
                                            Export JSON
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
