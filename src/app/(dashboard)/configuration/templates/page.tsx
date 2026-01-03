"use client";

import { useEffect, useState } from "react";
import { 
    RiMailLine, 
    RiMessage2Line, 
    RiWhatsappLine, 
    RiAddLine,
    RiDeleteBinLine,
    RiEditLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Template = {
    id: string;
    name: string;
    channel: "EMAIL" | "SMS" | "WHATSAPP";
    subject?: string;
    body: string;
    variables: string;
    isActive: boolean;
};

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        channel: "EMAIL" as "EMAIL" | "SMS" | "WHATSAPP",
        subject: "",
        body: "",
    });

    const loadTemplates = async () => {
        try {
            const res = await fetch("/api/admin/templates");
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch {
            toast.error("Failed to load templates");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleCreate = async () => {
        try {
            // Simple variable extraction regex
            const variables = formData.body.match(/{{(.*?)}}/g)?.map(v => v.replace(/{{|}}/g, '').trim()) || [];
            
            const res = await fetch("/api/admin/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    variables: variables,
                }),
            });

            if (res.ok) {
                toast.success("Template created");
                setIsDialogOpen(false);
                setFormData({ name: "", channel: "EMAIL", subject: "", body: "" });
                loadTemplates();
            } else {
                toast.error("Failed to create template");
            }
        } catch {
            toast.error("Error submitting form");
        }
    };

    const getIcon = (channel: string) => {
        switch (channel) {
            case "EMAIL": return <RiMailLine className="h-4 w-4" />;
            case "SMS": return <RiMessage2Line className="h-4 w-4" />;
            case "WHATSAPP": return <RiWhatsappLine className="h-4 w-4" />;
            default: return <RiMailLine className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Communication Templates</h1>
                    <p className="text-muted-foreground">
                        Manage Email, SMS, and WhatsApp contents for automated notifications
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <RiAddLine className="mr-2 h-4 w-4" />
                            New Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Create Template</DialogTitle>
                            <DialogDescription>
                                Define message content. Use {"{{variableName}}"} for dynamic data.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Template Name</Label>
                                    <Input 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g. Loan Approval Email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Channel</Label>
                                    <Select 
                                        value={formData.channel} 
                                        onValueChange={(v: any) => setFormData({...formData, channel: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EMAIL">Email</SelectItem>
                                            <SelectItem value="SMS">SMS</SelectItem>
                                            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {formData.channel === "EMAIL" && (
                                <div className="space-y-2">
                                    <Label>Subject Line</Label>
                                    <Input 
                                        value={formData.subject} 
                                        onChange={e => setFormData({...formData, subject: e.target.value})}
                                        placeholder="Your loan #{{loanNumber}} update"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Message Body</Label>
                                <Textarea 
                                    className="min-h-[150px] font-mono text-sm"
                                    value={formData.body} 
                                    onChange={e => setFormData({...formData, body: e.target.value})}
                                    placeholder="Dear {{customerName}}, your loan of ₹{{amount}} is approved."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Detected Variables: {formData.body.match(/{{(.*?)}}/g)?.join(", ") || "None"}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Create Template</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <Card key={template.id}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    {getIcon(template.channel)}
                                    {template.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {template.channel}
                                </CardDescription>
                            </div>
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                                {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground line-clamp-3 font-mono bg-muted p-2 rounded">
                                {template.body}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                            <div className="flex gap-1">
                                {JSON.parse(template.variables || "[]").map((v: string) => (
                                    <Badge key={v} variant="outline" className="text-xs h-5 px-1">
                                        {v}
                                    </Badge>
                                ))}
                            </div>
                            <Button variant="ghost" size="sm">
                                <RiEditLine className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
