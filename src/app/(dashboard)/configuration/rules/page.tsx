"use client";

import { useEffect, useState } from "react";
import { 
  RiAddLine, 
  RiFlowChart, 
  RiDeleteBinLine,
  RiCheckDoubleLine,
  RiCloseCircleLine,
  RiToggleLine
} from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  getRules, 
  createRule, 
  deleteRule, 
  toggleRuleActive,
  getProducts 
} from "@/app/actions/rules";

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    const res = await getRules();
    if (res.success) setRules(res.data || []);
    setLoading(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleRuleActive(id, currentStatus);
    if (res.success) {
        toast.success("Rule status updated");
        loadRules();
    } else {
        toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure you want to delete this rule?")) return;
      
      const res = await deleteRule(id);
      if(res.success) {
          toast.success("Rule deleted");
          loadRules();
      } else {
          toast.error("Failed to delete rule");
      }
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Decision Engine</h1>
          <p className="text-muted-foreground">Configure automated underwriting rules and approval workflows.</p>
        </div>
        <AddRuleDialog onAdd={() => loadRules()} />
      </div>

      <div className="grid gap-4">
        {loading ? (
            <div className="text-center py-10">Loading rules...</div>
        ) : rules.length === 0 ? (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <RiFlowChart className="w-12 h-12 mb-4 opacity-20" />
                    <p>No decision rules configured.</p>
                    <p className="text-sm">Create a rule to automate loan approvals.</p>
                </CardContent>
            </Card>
        ) : (
            rules.map(rule => (
                <Card key={rule.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3 flex flex-row items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{rule.name}</CardTitle>
                                <Badge variant={rule.isActive ? "default" : "secondary"}>
                                    {rule.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {rule.product && (
                                    <Badge variant="outline" className="font-normal text-muted-foreground">
                                        {rule.product.name}
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="mt-1">{rule.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch 
                                checked={rule.isActive} 
                                onCheckedChange={() => handleToggle(rule.id, rule.isActive)}
                            />
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(rule.id)}>
                                <RiDeleteBinLine className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Conditions</h4>
                            <div className="bg-muted/50 p-3 rounded-md font-mono text-xs">
                                {rule.conditions}
                            </div>
                        </div>
                        <div>
                             <h4 className="text-sm font-medium mb-2 text-muted-foreground">Actions</h4>
                             <div className="flex gap-2">
                                {rule.autoApprove && (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1">
                                        <RiCheckDoubleLine className="w-3 h-3" /> Auto-Approve
                                    </Badge>
                                )}
                                {rule.autoReject && (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 gap-1">
                                        <RiCloseCircleLine className="w-3 h-3" /> Auto-Reject
                                    </Badge>
                                )}
                                {!rule.autoApprove && !rule.autoReject && (
                                    <Badge variant="outline">Manual Review</Badge>
                                )}
                             </div>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}

function AddRuleDialog({ onAdd }: { onAdd: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    
    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState(1);
    const [action, setAction] = useState("MANUAL"); // AUTO_APPROVE, AUTO_REJECT, MANUAL
    const [productId, setProductId] = useState("ALL");
    
    // Conditions builder simple state
    const [minCreditScore, setMinCreditScore] = useState(700);
    const [maxLtv, setMaxLtv] = useState(60);

    useEffect(() => {
        if(open) loadProducts();
    }, [open]);

    const loadProducts = async () => {
        const res = await getProducts();
        if(res.success) setProducts(res.data || []);
    }

    const handleSubmit = async () => {
        if(!name) {
            toast.error("Rule name is required");
            return;
        }

        const conditions = JSON.stringify({
            minCreditScore,
            maxLtv,
            operator: "AND"
        }, null, 2);

        setLoading(true);
        const res = await createRule({
            name,
            description,
            priority,
            conditions,
            autoApprove: action === "AUTO_APPROVE",
            autoReject: action === "AUTO_REJECT",
            productId: productId === "ALL" ? undefined : productId
        });
        setLoading(false);

        if(res.success) {
            toast.success("Rule created successfully");
            setOpen(false);
            onAdd();
            // Reset form
            setName("");
            setDescription("");
        } else {
            toast.error("Failed to create rule");
        }
    }

    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <RiAddLine className="w-4 h-4" />
                    Create Rule
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Decision Rule</DialogTitle>
                    <DialogDescription>
                        Define conditions for automated loan processing.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Rule Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. High Credit Score Approval" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Auto-approve if score > 750" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label>Applies to Product</Label>
                            <Select value={productId} onValueChange={setProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Products" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Products</SelectItem>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Priority (Higher = run first)</Label>
                            <Input type="number" value={priority} onChange={e => setPriority(parseInt(e.target.value))} />
                        </div>
                    </div>

                    <div className="border rounded-md p-4 bg-muted/20 space-y-4">
                        <h4 className="text-sm font-semibold">Conditions Builder</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Min Credit Score</Label>
                                <Input type="number" value={minCreditScore} onChange={e => setMinCreditScore(parseInt(e.target.value))} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Max LTV (%)</Label>
                                <Input type="number" value={maxLtv} onChange={e => setMaxLtv(parseInt(e.target.value))} />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Simple builder. For complex logic, edit JSON manually later (not implemented).</p>
                    </div>

                     <div className="grid gap-2">
                        <Label>Action</Label>
                        <Select value={action} onValueChange={setAction}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="MANUAL">Flag for Manual Review</SelectItem>
                                <SelectItem value="AUTO_APPROVE">Auto-Approve Application</SelectItem>
                                <SelectItem value="AUTO_REJECT">Auto-Reject Application</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Creating...' : 'Create Rule'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
