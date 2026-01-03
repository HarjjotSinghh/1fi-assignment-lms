"use client";

import { useEffect, useState } from "react";
import { 
    RiBuilding2Line, 
    RiAddLine, 
    RiEditLine, 
    RiDeleteBinLine,
    RiLoader4Line,
    RiUserLine,
    RiArrowRightSLine
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

interface Department {
    id: string;
    name: string;
    code: string;
    description: string | null;
    parentId: string | null;
    managerId: string | null;
    isActive: boolean;
    manager: { id: string; name: string; email: string } | null;
    userCount: number;
}

interface DepartmentForm {
    name: string;
    code: string;
    description: string;
    parentId: string;
    isActive: boolean;
}

const defaultForm: DepartmentForm = {
    name: "",
    code: "",
    description: "",
    parentId: "",
    isActive: true,
};

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<DepartmentForm>(defaultForm);

    const loadDepartments = async () => {
        try {
            const response = await fetch("/api/admin/departments?includeUsers=true");
            const data = await response.json();
            if (response.ok) {
                setDepartments(data.departments);
            } else {
                toast.error(data.error || "Failed to load departments");
            }
        } catch {
            toast.error("Failed to load departments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const handleSubmit = async () => {
        if (!form.name || !form.code) {
            toast.error("Name and code are required");
            return;
        }

        setIsSaving(true);
        try {
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...form, id: editingId } : form;

            const response = await fetch("/api/admin/departments", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...body,
                    parentId: form.parentId || null,
                }),
            });

            if (response.ok) {
                toast.success(editingId ? "Department updated" : "Department created");
                setDialogOpen(false);
                setEditingId(null);
                setForm(defaultForm);
                loadDepartments();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to save department");
            }
        } catch {
            toast.error("Failed to save department");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (dept: Department) => {
        setEditingId(dept.id);
        setForm({
            name: dept.name,
            code: dept.code,
            description: dept.description || "",
            parentId: dept.parentId || "",
            isActive: dept.isActive,
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/departments?id=${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Department deleted");
                loadDepartments();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete department");
            }
        } catch {
            toast.error("Failed to delete department");
        }
    };

    const getParentName = (parentId: string | null) => {
        if (!parentId) return null;
        const parent = departments.find((d) => d.id === parentId);
        return parent?.name || null;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
                    <p className="text-muted-foreground">
                        Manage organizational departments and hierarchy
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
                            Add Department
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? "Edit Department" : "Add Department"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingId 
                                    ? "Update department details" 
                                    : "Create a new department in your organization"}
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
                                        placeholder="e.g., Collections"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code *</Label>
                                    <Input
                                        id="code"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., COLL"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Department description..."
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentId">Parent Department</Label>
                                <Select
                                    value={form.parentId || "root"}
                                    onValueChange={(value) => setForm({ ...form, parentId: value === "root" ? "" : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="root">None (Top Level)</SelectItem>
                                        {departments
                                            .filter((d) => d.id !== editingId)
                                            .map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name} ({dept.code})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
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
                    <CardTitle>All Departments</CardTitle>
                    <CardDescription>
                        {departments.length} department{departments.length !== 1 ? "s" : ""} configured
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : departments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <RiBuilding2Line className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No departments configured</p>
                            <p className="text-sm">Create your first department to get started</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Manager</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments.map((dept) => (
                                    <TableRow key={dept.id}>
                                        <TableCell>
                                            <div className="font-medium">{dept.name}</div>
                                            {dept.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {dept.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{dept.code}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {getParentName(dept.parentId) ? (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <RiArrowRightSLine className="h-3 w-3" />
                                                    {getParentName(dept.parentId)}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dept.manager ? (
                                                <div className="text-sm">
                                                    {dept.manager.name}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <RiUserLine className="h-4 w-4 text-muted-foreground" />
                                                {dept.userCount}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={dept.isActive ? "default" : "secondary"}>
                                                {dept.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(dept)}
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
                                                            <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete &quot;{dept.name}&quot;? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(dept.id)}
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
