"use client";

import { useEffect, useState } from "react";
import { 
  RiUserStarLine, 
  RiMoneyDollarCircleLine, 
  RiAlarmWarningLine,
  RiAddLine,
  RiSearchLine,
  RiUserAddLine
} from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  getRecoveryAgents, 
  getDelinquentLoans, 
  getRecoveryStats, 
  createRecoveryAgent,
  assignAgentToLoan
} from "@/app/actions/collections";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ totalAgents: 0, totalAssignedAmount: 0, totalRecoveredAmount: 0 });
  
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const res = await getRecoveryStats();
    if (res.success && res.data) {
      setStats(res.data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Collections Command</h1>
        <p className="text-muted-foreground">Manage recovery agents, assign delinquent loans, and track recovery performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard 
          title="Total Recovery Agents" 
          value={stats.totalAgents.toString()} 
          icon={RiUserStarLine}
          description="Active field agents"
        />
        <StatsCard 
          title="Total Assigned Value" 
          value={formatCurrency(stats.totalAssignedAmount)} 
          icon={RiMoneyDollarCircleLine} 
          description="Principal currently assigned"
        />
        <StatsCard 
          title="Total Recovered" 
          value={formatCurrency(stats.totalRecoveredAmount)} 
          icon={RiAlarmWarningLine} 
          description="Successfully recovered amount"
          className="border-l-4 border-l-green-500"
        />
      </div>

      <Tabs defaultValue="loans" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="loans" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Delinquent Loans
          </TabsTrigger>
          <TabsTrigger 
            value="agents" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Recovery Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-6 space-y-4">
          <DelinquentLoansList agentsCount={stats.totalAgents} onAssign={() => loadStats()} />
        </TabsContent>

        <TabsContent value="agents" className="mt-6 space-y-4">
          <RecoveryAgentsList onUpdate={() => loadStats()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, description, className }: any) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DelinquentLoansList({ agentsCount, onAssign }: { agentsCount: number, onAssign: () => void }) {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [loansRes, agentsRes] = await Promise.all([
      getDelinquentLoans(),
      getRecoveryAgents()
    ]);
    
    if (loansRes.success) setLoans(loansRes.data || []);
    if (agentsRes.success) setAgents(agentsRes.data || []);
    setLoading(false);
  };

  const handleAssign = async (loanId: string, agentId: string, amount: number) => {
    const res = await assignAgentToLoan({
      loanId,
      agentId,
      assignedAmount: amount,
      notes: "Manual assignment from dashboard"
    });

    if (res.success) {
      toast.success("Agent assigned successfully");
      onAssign();
    } else {
      toast.error("Failed to assign agent");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delinquent Portfolio</CardTitle>
        <CardDescription>Loans currently in default or NPA status requiring attention.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>DPD</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading loans...</TableCell>
                </TableRow>
              ) : loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No delinquent loans found.</TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-mono">{loan.loanNumber}</TableCell>
                    <TableCell>{loan.customer?.firstName} {loan.customer?.lastName}</TableCell>
                    <TableCell>{formatCurrency(loan.totalOutstanding)}</TableCell>
                    <TableCell>
                      <Badge variant={loan.status === 'NPA' ? 'destructive' : 'secondary'}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>--</TableCell> {/* DPD logic needs payment history */}
                    <TableCell className="text-right">
                       <AssignAgentDialog 
                         loan={loan} 
                         agents={agents} 
                         onAssign={(agentId) => handleAssign(loan.id, agentId, loan.totalOutstanding)} 
                       />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignAgentDialog({ loan, agents, onAssign }: { loan: any, agents: any[], onAssign: (agentId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");

  const handleSubmit = () => {
    if (!selectedAgent) return;
    onAssign(selectedAgent);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Assign Agent</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Recovery Agent</DialogTitle>
          <DialogDescription>
            Assign a field agent to recover outstanding amount of {formatCurrency(loan.totalOutstanding)}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label>Select Agent</Label>
          <div className="grid gap-2 mt-2">
            {agents.map(agent => (
              <div 
                key={agent.id} 
                className={`p-3 border rounded-md cursor-pointer flex justify-between items-center ${selectedAgent === agent.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">{agent.phone}</div>
                </div>
                {agent.agencyName && <Badge variant="outline">{agent.agencyName}</Badge>}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedAgent}>Confirm Assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecoveryAgentsList({ onUpdate }: { onUpdate: () => void }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const res = await getRecoveryAgents();
    if (res.success) setAgents(res.data || []);
    setLoading(false);
  };

  const handleCreate = async (data: any) => {
    const res = await createRecoveryAgent(data);
    if (res.success) {
      toast.success("Agent added successfully");
      loadAgents();
      onUpdate();
    } else {
      toast.error("Failed to add agent");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Field Agents</CardTitle>
          <CardDescription>Manage internal and external recovery personnel.</CardDescription>
        </div>
        <AddAgentDialog onAdd={handleCreate} />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Performance</TableHead>
                <TableHead className="text-right">Assigned Cases</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading agents...</TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No agents found.</TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell className="font-mono text-xs">{agent.code}</TableCell>
                    <TableCell>{agent.agencyName || 'Internal'}</TableCell>
                    <TableCell>{agent.phone}</TableCell>
                    <TableCell className="text-right">{agent.successRate}%</TableCell>
                    <TableCell className="text-right">{agent.totalAssigned}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AddAgentDialog({ onAdd }: { onAdd: (data: any) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    agencyName: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.phone) {
      toast.error("Please fill required fields");
      return;
    }
    onAdd(formData);
    setOpen(false);
    setFormData({ name: '', code: '', phone: '', email: '', agencyName: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <RiUserAddLine className="w-4 h-4" />
          Add Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Recovery Agent</DialogTitle>
          <DialogDescription>Register a new field agent or agency representative.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name*</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Agent Code*</Label>
              <Input 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})} 
                placeholder="AGT-001"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone Number*</Label>
            <Input 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="space-y-2">
            <Label>Email (Optional)</Label>
            <Input 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="john@agency.com"
            />
          </div>
           <div className="space-y-2">
            <Label>Agency Name (Optional)</Label>
            <Input 
              value={formData.agencyName} 
              onChange={e => setFormData({...formData, agencyName: e.target.value})} 
              placeholder="Leave blank if internal employee"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
