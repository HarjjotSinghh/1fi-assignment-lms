"use client";

import { useEffect, useState } from "react";
import {
    RiAddLine,
    RiDeleteBinLine,
    RiToggleLine,
    RiUserLine,
    RiMoneyDollarCircleLine,
    RiShieldLine,
    RiFileListLine,
    RiLoader4Line,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type CustomField = {
    id: string;
    entity: string;
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    options?: string;
    placeholder?: string;
    helpText?: string;
    isRequired: boolean;
    isActive: boolean;
    displayOrder: number;
};

const ENTITIES = [
    { id: "CUSTOMER", name: "Customer", icon: RiUserLine },
    { id: "LOAN", name: "Loan", icon: RiMoneyDollarCircleLine },
    { id: "COLLATERAL", name: "Collateral", icon: RiShieldLine },
    { id: "APPLICATION", name: "Application", icon: RiFileListLine },
];

const FIELD_TYPES = [
    { id: "TEXT", name: "Text" },
    { id: "NUMBER", name: "Number" },
    { id: "DATE", name: "Date" },
    { id: "SELECT", name: "Dropdown" },
    { id: "BOOLEAN", name: "Yes/No" },
    { id: "EMAIL", name: "Email" },
    { id: "PHONE", name: "Phone" },
];

export default function CustomFieldsPage() {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeEntity, setActiveEntity] = useState("CUSTOMER");

    const [formData, setFormData] = useState({
        entity: "CUSTOMER",
        fieldLabel: "",
        fieldType: "TEXT",
        placeholder: "",
        helpText: "",
        isRequired: false,
        options: "",
    });

    const loadFields = async () => {
        try {
            const res = await fetch("/api/admin/custom-fields");
            if (res.ok) {
                const data = await res.json();
                setFields(data);
            }
        } catch {
            toast.error("Failed to load custom fields");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFields();
    }, []);

    const handleCreate = async () => {
        try {
            const payload = {
                ...formData,
                fieldName: formData.fieldLabel.toLowerCase().replace(/\s+/g, '_'),
                options: formData.fieldType === "SELECT" && formData.options
                    ? formData.options.split(',').map(o => o.trim())
                    : undefined,
            };

            const res = await fetch("/api/admin/custom-fields", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Custom field created");
                setIsDialogOpen(false);
                setFormData({
                    entity: activeEntity,
                    fieldLabel: "",
                    fieldType: "TEXT",
                    placeholder: "",
                    helpText: "",
                    isRequired: false,
                    options: "",
                });
                loadFields();
            } else {
                toast.error("Failed to create field");
            }
        } catch {
            toast.error("Error creating field");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Deactivate this custom field?")) return;

        try {
            const res = await fetch(`/api/admin/custom-fields?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Field deactivated");
                loadFields();
            } else {
                toast.error("Failed to deactivate field");
            }
        } catch {
            toast.error("Error deactivating field");
        }
    };

    const filteredFields = fields.filter(f => f.entity === activeEntity && f.isActive);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Custom Fields</h1>
                    <p className="text-muted-foreground">
                        Define additional fields for entities without code changes
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setFormData(prev => ({ ...prev, entity: activeEntity }))}>
                            <RiAddLine className="mr-2 h-4 w-4" />
                            Add Field
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create Custom Field</DialogTitle>
                            <DialogDescription>
                                Define a new field that will appear in forms for the selected entity.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Entity</Label>
                                    <Select
                                        value={formData.entity}
                                        onValueChange={(v) => setFormData({ ...formData, entity: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ENTITIES.map(e => (
                                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Field Type</Label>
                                    <Select
                                        value={formData.fieldType}
                                        onValueChange={(v) => setFormData({ ...formData, fieldType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FIELD_TYPES.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Field Label</Label>
                                <Input
                                    value={formData.fieldLabel}
                                    onChange={e => setFormData({ ...formData, fieldLabel: e.target.value })}
                                    placeholder="e.g. Mother's Maiden Name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Placeholder</Label>
                                <Input
                                    value={formData.placeholder}
                                    onChange={e => setFormData({ ...formData, placeholder: e.target.value })}
                                    placeholder="e.g. Enter value..."
                                />
                            </div>

                            {formData.fieldType === "SELECT" && (
                                <div className="space-y-2">
                                    <Label>Options (comma-separated)</Label>
                                    <Input
                                        value={formData.options}
                                        onChange={e => setFormData({ ...formData, options: e.target.value })}
                                        placeholder="Option 1, Option 2, Option 3"
                                    />
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.isRequired}
                                    onCheckedChange={(v) => setFormData({ ...formData, isRequired: v })}
                                />
                                <Label>Required Field</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!formData.fieldLabel}>Create Field</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs value={activeEntity} onValueChange={setActiveEntity}>
                <TabsList>
                    {ENTITIES.map(e => (
                        <TabsTrigger key={e.id} value={e.id} className="gap-2">
                            <e.icon className="h-4 w-4" />
                            {e.name}
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                {fields.filter(f => f.entity === e.id && f.isActive).length}
                            </Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {ENTITIES.map(entity => (
                    <TabsContent key={entity.id} value={entity.id}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Custom {entity.name} Fields</CardTitle>
                                <CardDescription>
                                    These fields will appear when creating or editing {entity.name.toLowerCase()}s.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center py-8">
                                        <RiLoader4Line className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredFields.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No custom fields defined for {entity.name}s yet.
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Field Label</TableHead>
                                                <TableHead>Field Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Required</TableHead>
                                                <TableHead className="w-[80px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredFields.map((field) => (
                                                <TableRow key={field.id}>
                                                    <TableCell className="font-medium">{field.fieldLabel}</TableCell>
                                                    <TableCell className="font-mono text-sm text-muted-foreground">
                                                        {field.fieldName}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{field.fieldType}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {field.isRequired ? (
                                                            <Badge className="bg-amber-500">Required</Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">Optional</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(field.id)}
                                                        >
                                                            <RiDeleteBinLine className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
