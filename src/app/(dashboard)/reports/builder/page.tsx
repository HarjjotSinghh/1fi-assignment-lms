"use client";

import { useEffect, useState } from "react";
import {
    RiFileChartLine,
    RiLoader4Line,
    RiDownloadLine,
    RiPlayLine,
    RiAddLine,
    RiDeleteBinLine,
    RiFilterLine,
    RiTableLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";

interface EntitySchema {
    name: string;
    fields: Array<{
        id: string;
        label: string;
        type: string;
        options?: string[];
    }>;
    aggregations: string[];
}

interface Filter {
    field: string;
    value: string;
}

export default function ReportBuilderPage() {
    const [entities, setEntities] = useState<Record<string, EntitySchema>>({});
    const [selectedEntity, setSelectedEntity] = useState<string>("");
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [summary, setSummary] = useState<Record<string, any> | null>(null);

    // Load entity schema
    useEffect(() => {
        const loadSchema = async () => {
            try {
                const res = await fetch("/api/reports/builder");
                if (res.ok) {
                    const data = await res.json();
                    setEntities(data.entities);
                }
            } catch {
                toast.error("Failed to load report schema");
            }
        };
        loadSchema();
    }, []);

    const currentEntity = entities[selectedEntity];

    const handleFieldToggle = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const addFilter = () => {
        if (!currentEntity) return;
        const firstField = currentEntity.fields[0];
        if (firstField) {
            setFilters([...filters, { field: firstField.id, value: "" }]);
        }
    };

    const removeFilter = (index: number) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    const updateFilter = (index: number, key: "field" | "value", value: string) => {
        const updated = [...filters];
        updated[index][key] = value;
        setFilters(updated);
    };

    const executeReport = async () => {
        if (!selectedEntity) {
            toast.error("Please select an entity");
            return;
        }

        setIsLoading(true);
        setResults(null);
        setSummary(null);

        try {
            // Build filter object
            const filterObj: Record<string, string> = {};
            filters.forEach(f => {
                if (f.value) filterObj[f.field] = f.value;
            });

            const res = await fetch("/api/reports/builder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity: selectedEntity,
                    selectedFields: selectedFields.length > 0 ? selectedFields : undefined,
                    filters: filterObj,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setResults(data.data);
                setSummary(data.summary);
                toast.success(`Report generated: ${data.data.length} records`);
            } else {
                toast.error("Failed to generate report");
            }
        } catch {
            toast.error("Error executing report");
        } finally {
            setIsLoading(false);
        }
    };

    const exportCSV = () => {
        if (!results || results.length === 0) return;

        const headers = Object.keys(results[0]);
        const csvContent = [
            headers.join(","),
            ...results.map(row =>
                headers.map(h => JSON.stringify(row[h] ?? "")).join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedEntity}_report_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Report exported to CSV");
    };

    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return "-";
        if (typeof value === "object") return JSON.stringify(value);
        if (typeof value === "number") return value.toLocaleString("en-IN");
        return String(value);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Report Builder</h1>
                    <p className="text-muted-foreground">
                        Create custom reports by selecting entities, fields, and filters
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Entity Selection */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <RiTableLine className="h-4 w-4" />
                                Data Source
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedEntity} onValueChange={(v) => {
                                setSelectedEntity(v);
                                setSelectedFields([]);
                                setFilters([]);
                                setResults(null);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select entity..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(entities).map(([key, entity]) => (
                                        <SelectItem key={key} value={key}>{entity.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Field Selection */}
                    {currentEntity && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Select Fields</CardTitle>
                                <CardDescription>Choose columns to include</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[250px] overflow-y-auto">
                                {currentEntity.fields.map((field) => (
                                    <div key={field.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={field.id}
                                            checked={selectedFields.includes(field.id)}
                                            onCheckedChange={() => handleFieldToggle(field.id)}
                                        />
                                        <Label htmlFor={field.id} className="text-sm cursor-pointer">
                                            {field.label}
                                            <Badge variant="outline" className="ml-2 text-xs">{field.type}</Badge>
                                        </Label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Filters */}
                    {currentEntity && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <RiFilterLine className="h-4 w-4" />
                                        Filters
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" onClick={addFilter}>
                                        <RiAddLine className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {filters.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-2">No filters applied</p>
                                ) : (
                                    filters.map((filter, idx) => {
                                        const fieldDef = currentEntity.fields.find(f => f.id === filter.field);
                                        return (
                                            <div key={idx} className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <Select
                                                        value={filter.field}
                                                        onValueChange={(v) => updateFilter(idx, "field", v)}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {currentEntity.fields.map(f => (
                                                                <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex-1">
                                                    {fieldDef?.options ? (
                                                        <Select
                                                            value={filter.value}
                                                            onValueChange={(v) => updateFilter(idx, "value", v)}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Value" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {fieldDef.options.map(opt => (
                                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            className="h-8"
                                                            value={filter.value}
                                                            onChange={(e) => updateFilter(idx, "value", e.target.value)}
                                                            placeholder="Value"
                                                        />
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeFilter(idx)}>
                                                    <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button
                                    className="w-full"
                                    onClick={executeReport}
                                    disabled={!selectedEntity || isLoading}
                                >
                                    {isLoading ? (
                                        <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RiPlayLine className="mr-2 h-4 w-4" />
                                    )}
                                    Run Report
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <RiFileChartLine className="h-5 w-5" />
                                        Report Results
                                    </CardTitle>
                                    {summary && (
                                        <CardDescription>
                                            {summary.totalRecords} records found
                                        </CardDescription>
                                    )}
                                </div>
                                {results && results.length > 0 && (
                                    <Button variant="outline" onClick={exportCSV}>
                                        <RiDownloadLine className="mr-2 h-4 w-4" />
                                        Export CSV
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-[400px] flex items-center justify-center">
                                    <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : results ? (
                                <div className="space-y-4">
                                    {/* Summary Cards */}
                                    {summary && Object.keys(summary).length > 1 && (
                                        <div className="grid grid-cols-3 gap-3">
                                            {Object.entries(summary).map(([key, value]) => (
                                                <div key={key} className="p-3 bg-muted/50 rounded-lg">
                                                    <p className="text-xs text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                    <p className="text-lg font-bold">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Data Table */}
                                    {results.length > 0 ? (
                                        <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/50">
                                                        {Object.keys(results[0]).slice(0, 8).map((key) => (
                                                            <TableHead key={key} className="whitespace-nowrap">
                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {results.slice(0, 100).map((row, i) => (
                                                        <TableRow key={i}>
                                                            {Object.values(row).slice(0, 8).map((value, j) => (
                                                                <TableCell key={j} className="font-mono text-sm">
                                                                    {formatValue(value)}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No records found matching your criteria
                                        </div>
                                    )}

                                    {results.length > 100 && (
                                        <p className="text-sm text-muted-foreground text-center">
                                            Showing 100 of {results.length} records. Export to see all.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                    <RiFileChartLine className="h-12 w-12 mb-3 opacity-20" />
                                    <p>Select an entity and run a report</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
