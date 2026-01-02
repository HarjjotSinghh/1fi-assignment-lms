"use client";

import { useEffect, useState } from "react";
import { 
    RiFlowChart, 
    RiAddLine, 
    RiEditLine, 
    RiDeleteBinLine,
    RiLoader4Line,
    RiCheckLine,
    RiCloseLine
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface WorkflowStage {
    name: string;
    approverRole: string;
    slaHours?: number;
}

interface Workflow {
    id: string;
    name: string;
    description: string | null;
    type: string;
    stages: WorkflowStage[];
    isActive: boolean;
    productId: string | null;
    createdAt: string;
}

interface WorkflowForm {
    name: string;
    description: string;
    type: string;
    stages: WorkflowStage[];
    isActive: boolean;
}

const workflowTypes = [
    { value: "LOAN_APPROVAL", label: "Loan Approval" },
    { value: "DISBURSEMENT", label: "Disbursement" },
    { value: "COLLATERAL_RELEASE", label: "Collateral Release" },
    { value: "FORECLOSURE", label: "Foreclosure" },
];

const defaultStage: WorkflowStage = {
    name: "",
    approverRole: "MANAGER",
    slaHours: 24,
};

const defaultForm: WorkflowForm = {
    name: "",
    description: "",
    type: "LOAN_APPROVAL",
    stages: [{ ...defaultStage }],
    isActive: true,
};

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<WorkflowForm>(defaultForm);

    const loadWorkflows = async () => {
        try {
            const response = await fetch("/api/admin/workflows");
            const data = await response.json();
            if (response.ok) {
                setWorkflows(data.workflows);
            } else {
                toast.error(data.error || "Failed to load workflows");
            }
        } catch {
            toast.error("Failed to load workflows");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadWorkflows();
    }, []);

    const handleSubmit = async () => {
        if (!form.name || !form.type || form.stages.length === 0) {
            toast.error("Name, type, and at least one stage are required");
            return;
        }

        // Validate stages
        for (const stage of form.stages) {
            if (!stage.name || !stage.approverRole) {
                toast.error("All stages must have a name and approver role");
                return;
            }
        }

        setIsSaving(true);
        try {
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...form, id: editingId } : form;

            const response = await fetch("/api/admin/workflows", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                toast.success(editingId ? "Workflow updated" : "Workflow created");
                setDialogOpen(false);
                setEditingId(null);
                setForm(defaultForm);
                loadWorkflows();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to save workflow");
            }
        } catch {
            toast.error("Failed to save workflow");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (wf: Workflow) => {
        setEditingId(wf.id);
        setForm({
            name: wf.name,
            description: wf.description || "",
            type: wf.type,
            stages: wf.stages,
            isActive: wf.isActive,
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/workflows?id=${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Workflow deleted");
                loadWorkflows();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete workflow");
            }
        } catch {
            toast.error("Failed to delete workflow");
        }
    };

    const addStage = () => {
        setForm({
            ...form,
            stages: [...form.stages, { ...defaultStage }],
        });
    };

    const removeStage = (index: number) => {
        if (form.stages.length <= 1) return;
        setForm({
            ...form,
            stages: form.stages.filter((_, i) => i !== index),
        });
    };

    const updateStage = (index: number, field: keyof WorkflowStage, value: string | number) => {
        const newStages = [...form.stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setForm({ ...form, stages: newStages });
    };

    const getTypeBadge = (type: string) => {
        const found = workflowTypes.find((t) => t.value === type);
        return found?.label || type;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Workflow Configuration</h1>
                    <p className="text-muted-foreground">
                        Define approval workflows and routing rules
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
                            New Workflow
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? "Edit Workflow" : "Create Workflow"}
                            </DialogTitle>
                            <DialogDescription>
                                Define workflow stages and approval rules
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Workflow Name *</Label>
                                    <Input
                                        id="name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g., Standard Loan Approval"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={form.type}
                                        onValueChange={(value) => setForm({ ...form, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {workflowTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Workflow description..."
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Stages</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addStage}>
                                        <RiAddLine className="h-4 w-4 mr-1" />
                                        Add Stage
                                    </Button>
                                </div>
                                {form.stages.map((stage, index) => (
                                    <div key={index} className="flex gap-3 items-end p-3 border rounded-lg bg-muted/30">
                                        <div className="flex-1 space-y-2">
                                            <Label>Stage {index + 1} Name</Label>
                                            <Input
                                                value={stage.name}
                                                onChange={(e) => updateStage(index, "name", e.target.value)}
                                                placeholder="e.g., Manager Review"
                                            />
                                        </div>
                                        <div className="w-32 space-y-2">
                                            <Label>Approver</Label>
                                            <Select
                                                value={stage.approverRole}
                                                onValueChange={(value) => updateStage(index, "approverRole", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24 space-y-2">
                                            <Label>SLA (hrs)</Label>
                                            <Input
                                                type="number"
                                                value={stage.slaHours || ""}
                                                onChange={(e) => updateStage(index, "slaHours", parseInt(e.target.value) || 24)}
                                                placeholder="24"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeStage(index)}
                                            disabled={form.stages.length <= 1}
                                            className="text-red-600"
                                        >
                                            <RiCloseLine className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
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
                    <CardTitle>Workflow Definitions</CardTitle>
                    <CardDescription>
                        {workflows.length} workflow{workflows.length !== 1 ? "s" : ""} configured
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <RiFlowChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No workflows configured</p>
                            <p className="text-sm">Create your first workflow to define approval processes</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Workflow</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Stages</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workflows.map((wf) => (
                                    <TableRow key={wf.id}>
                                        <TableCell>
                                            <div className="font-medium">{wf.name}</div>
                                            {wf.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {wf.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{getTypeBadge(wf.type)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {wf.stages.map((stage, i) => (
                                                    <span key={i} className="flex items-center">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {stage.name || `Stage ${i + 1}`}
                                                        </Badge>
                                                        {i < wf.stages.length - 1 && (
                                                            <span className="mx-1 text-muted-foreground">→</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={wf.isActive ? "default" : "secondary"}>
                                                {wf.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(wf.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(wf)}
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
                                                            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete &quot;{wf.name}&quot;? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(wf.id)}
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
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
