"use client";

import { useEffect, useState } from "react";
import { 
  RiAddLine, 
  RiBuilding2Line, 
  RiCodeSSlashLine, 
  RiExternalLinkLine,
  RiFileCopyLine,
  RiKey2Line
} from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  getPartners, 
  createPartner, 
  updatePartner, 
  generatePartnerApiKey 
} from "@/app/actions/partners";

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    const res = await getPartners();
    if (res.success) setPartners(res.data || []);
    setLoading(false);
  };

  const handleUpdate = async (id: string, data: any) => {
    const res = await updatePartner(id, data);
    if (res.success) {
        toast.success("Partner updated");
        loadPartners();
    } else {
        toast.error("Update failed");
    }
  }

  const handleGenerateKey = async (partnerId: string) => {
    const res = await generatePartnerApiKey(partnerId);
    if (res.success && res.data?.key) {
        toast.success("API Key generated");
        // We could show the key in a dialog, but for now we just reload as it's saved
        // Ideally we show it ONCE.
        // For this simple implementation, we'll reload and show the key is present.
        loadPartners();
        navigator.clipboard.writeText(res.data.key);
        toast("API Key copied to clipboard");
    } else {
        toast.error("Failed to generate key");
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Partner Network</h1>
          <p className="text-muted-foreground">Manage fintech partners, B2B integrations, and API access.</p>
        </div>
        <AddPartnerDialog onAdd={() => loadPartners()} />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Registered Partners</CardTitle>
            <CardDescription>List of all external entities with system access.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Partner Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>API Access</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                         <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">Loading partners...</TableCell>
                        </TableRow>
                    ) : partners.length === 0 ? (
                        <TableRow>
                             <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No partners found.</TableCell>
                        </TableRow>
                    ) : (
                        partners.map(partner => (
                            <TableRow key={partner.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <RiBuilding2Line className="w-4 h-4 opacity-50" />
                                        {partner.name}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{partner.code}</TableCell>
                                <TableCell>{partner.type}</TableCell>
                                <TableCell>
                                    {partner.apiKeyId ? (
                                        <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-200">
                                            <RiKey2Line className="w-3 h-3" />
                                            Active Key
                                        </Badge>
                                    ) : (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-xs h-7"
                                            onClick={() => handleGenerateKey(partner.id)}
                                        >
                                            Generate Key
                                        </Button>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs">
                                        <div>{partner.contactName}</div>
                                        <div className="text-muted-foreground">{partner.contactEmail}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                     <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                                        {partner.isActive ? 'Active' : 'Inactive'}
                                     </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleUpdate(partner.id, { isActive: !partner.isActive })}
                                    >
                                        {partner.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AddPartnerDialog({ onAdd }: { onAdd: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'FINTECH',
        contactName: '',
        contactEmail: '',
        webhookUrl: ''
    });

    const handleSubmit = async () => {
        if(!formData.name || !formData.code) {
            toast.error("Name and Code are required");
            return;
        }

        setLoading(true);
        const res = await createPartner(formData);
        setLoading(false);

        if(res.success) {
            toast.success("Partner created successfully");
            setOpen(false);
            onAdd();
            setFormData({
                name: '',
                code: '',
                type: 'FINTECH',
                contactName: '',
                contactEmail: '',
                webhookUrl: ''
            });
        } else {
            toast.error(res.error || "Failed to create partner");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <RiAddLine className="w-4 h-4" />
                    New Partner
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Partner</DialogTitle>
                    <DialogDescription>
                        Onboard a new B2B partner or fintech integration.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Partner Name</Label>
                        <Input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Acme Fintech Solutions"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Short Code</Label>
                            <Input 
                                value={formData.code}
                                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                placeholder="ACME"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select 
                                value={formData.type} 
                                onValueChange={(val) => setFormData({...formData, type: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FINTECH">Fintech</SelectItem>
                                    <SelectItem value="BANK">Bank</SelectItem>
                                    <SelectItem value="NBFC">NBFC</SelectItem>
                                    <SelectItem value="MERCHANT">Merchant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Contact Name</Label>
                        <Input 
                            value={formData.contactName}
                            onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                            placeholder="John Smith"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label>Contact Email</Label>
                        <Input 
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                            placeholder="api-support@acme.com"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label>Webhook URL (Optional)</Label>
                        <Input 
                            value={formData.webhookUrl}
                            onChange={(e) => setFormData({...formData, webhookUrl: e.target.value})}
                            placeholder="https://api.acme.com/webhooks/fiquity"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Creating...' : 'Create Partner'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
