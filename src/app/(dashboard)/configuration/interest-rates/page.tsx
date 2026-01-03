"use client";

import { useEffect, useState } from "react";
import { 
    RiLineChartLine, 
    RiAddLine, 
    RiEditLine, 
    RiDeleteBinLine,
    RiLoader4Line,
    RiPercentLine,
    RiArrowUpLine,
    RiArrowDownLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface Benchmark {
    id: string;
    name: string;
    description: string | null;
    currentRate: number;
    previousRate: number | null;
    effectiveFrom: string;
    source: string | null;
    isActive: boolean;
    updatedAt: string;
}

interface BenchmarkForm {
    name: string;
    description: string;
    currentRate: number;
    effectiveFrom: string;
    source: string;
    isActive: boolean;
}

const defaultForm: BenchmarkForm = {
    name: "",
    description: "",
    currentRate: 0,
    effectiveFrom: new Date().toISOString().split("T")[0],
    source: "",
    isActive: true,
};

export default function InterestRatesPage() {
    const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<BenchmarkForm>(defaultForm);

    const loadBenchmarks = async () => {
        try {
            const response = await fetch("/api/admin/interest-rates");
            const data = await response.json();
            if (response.ok) {
                setBenchmarks(data.benchmarks);
            } else {
                toast.error(data.error || "Failed to load interest rates");
            }
        } catch {
            toast.error("Failed to load interest rates");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBenchmarks();
    }, []);

    const handleSubmit = async () => {
        if (!form.name || form.currentRate === undefined) {
            toast.error("Name and current rate are required");
            return;
        }

        setIsSaving(true);
        try {
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...form, id: editingId } : form;

            const response = await fetch("/api/admin/interest-rates", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                toast.success(editingId ? "Benchmark updated" : "Benchmark created");
                setDialogOpen(false);
                setEditingId(null);
                setForm(defaultForm);
                loadBenchmarks();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to save benchmark");
            }
        } catch {
            toast.error("Failed to save benchmark");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (benchmark: Benchmark) => {
        setEditingId(benchmark.id);
        setForm({
            name: benchmark.name,
            description: benchmark.description || "",
            currentRate: benchmark.currentRate,
            effectiveFrom: benchmark.effectiveFrom.split("T")[0],
            source: benchmark.source || "",
            isActive: benchmark.isActive,
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/interest-rates?id=${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Benchmark deleted");
                loadBenchmarks();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete benchmark");
            }
        } catch {
            toast.error("Failed to delete benchmark");
        }
    };

    const getRateChange = (current: number, previous: number | null) => {
        if (previous === null) return null;
        return current - previous;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Interest Rates</h1>
                    <p className="text-muted-foreground">
                        Manage benchmark rates for floating interest rate products
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setForm(defaultForm);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <RiAddLine className="h-4 w-4 mr-2" />
                            Add Benchmark
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? "Edit Benchmark" : "Add Benchmark"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingId 
                                    ? "Update benchmark rate (changes are tracked in history)" 
                                    : "Add a new interest rate benchmark"}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g., RBI Repo Rate"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currentRate">Current Rate (%) *</Label>
                                    <Input
                                        id="currentRate"
                                        type="number"
                                        step="0.01"
                                        value={form.currentRate}
                                        onChange={(e) => setForm({ ...form, currentRate: parseFloat(e.target.value) || 0 })}
                                        placeholder="6.50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Benchmark description..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="effectiveFrom">Effective From *</Label>
                                    <Input
                                        id="effectiveFrom"
                                        type="date"
                                        value={form.effectiveFrom}
                                        onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="source">Source</Label>
                                    <Input
                                        id="source"
                                        value={form.source}
                                        onChange={(e) => setForm({ ...form, source: e.target.value })}
                                        placeholder="e.g., RBI, Internal"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isActive">Active</Label>
                                <Switch
                                    id="isActive"
                                    checked={form.isActive}
                                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSaving}>
                                {isSaving && <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />}
                                {editingId ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rate Benchmarks</CardTitle>
                    <CardDescription>
                        {benchmarks.length} benchmark{benchmarks.length !== 1 ? "s" : ""} configured
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : benchmarks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <RiLineChartLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No interest rate benchmarks configured</p>
                            <p className="text-sm">Add benchmarks to enable floating rate products</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Benchmark</TableHead>
                                    <TableHead>Current Rate</TableHead>
                                    <TableHead>Change</TableHead>
                                    <TableHead>Effective Date</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {benchmarks.map((benchmark) => {
                                    const change = getRateChange(benchmark.currentRate, benchmark.previousRate);
                                    return (
                                        <TableRow key={benchmark.id}>
                                            <TableCell>
                                                <div className="font-medium">{benchmark.name}</div>
                                                {benchmark.description && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {benchmark.description}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 font-mono text-lg font-bold">
                                                    <RiPercentLine className="h-4 w-4 text-muted-foreground" />
                                                    {benchmark.currentRate.toFixed(2)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {change !== null ? (
                                                    <div className={`flex items-center gap-1 ${change > 0 ? "text-red-500" : change < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                                                        {change > 0 ? (
                                                            <RiArrowUpLine className="h-4 w-4" />
                                                        ) : change < 0 ? (
                                                            <RiArrowDownLine className="h-4 w-4" />
                                                        ) : null}
                                                        {change > 0 ? "+" : ""}{change.toFixed(2)}%
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{format(new Date(benchmark.effectiveFrom), "PP")}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(benchmark.effectiveFrom), { addSuffix: true })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {benchmark.source || <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={benchmark.isActive ? "default" : "secondary"}>
                                                    {benchmark.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(benchmark)}
                                                    >
                                                        <RiEditLine className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-red-600">
                                                                <RiDeleteBinLine className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Benchmark</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete &quot;{benchmark.name}&quot;? This will also delete rate history.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(benchmark.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
