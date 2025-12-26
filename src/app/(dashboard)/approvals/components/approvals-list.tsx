"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getPendingApprovalsAction, processApprovalAction } from "@/app/actions/approvals";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type Approval = {
    id: string;
    type: string;
    entityType: string;
    description?: string;
    requestedAmount: number | null;
    notes: string | null;
    createdAt: string;
    requestedBy: string | null;
};

export function ApprovalsList({ userId }: { userId: string }) {
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
    const [reviewComment, setReviewComment] = useState("");
    const [action, setAction] = useState<"APPROVED" | "REJECTED" | null>(null);

    useEffect(() => {
        loadApprovals();
    }, []);

    async function loadApprovals() {
        setLoading(true);
        const res = await getPendingApprovalsAction();
        if (res.success && res.data) {
            setApprovals(res.data);
        }
        setLoading(false);
    }

    async function handleProcess() {
        if (!selectedApproval || !action) return;

        const res = await processApprovalAction(selectedApproval.id, action, reviewComment, userId);
        if (res.success) {
            toast.success(`Request ${action.toLowerCase()}`);
            setApprovals(prev => prev.filter(a => a.id !== selectedApproval.id));
            setSelectedApproval(null);
            setReviewComment("");
            setAction(null);
        } else {
            toast.error("Failed to process request");
        }
    }

    if (loading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-4">
            {approvals.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No pending approvals found.
                    </CardContent>
                </Card>
            ) : (
                approvals.map((item) => (
                    <Card key={item.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                                        <span className="text-sm text-muted-foreground"> • {new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <CardTitle className="text-lg">
                                        Request by {item.requestedBy || "Unknown"}
                                    </CardTitle>
                                </div>
                                {item.requestedAmount && (
                                    <div className="text-xl font-bold">
                                        ₹ {item.requestedAmount.toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <CardDescription className="pt-2">
                                {item.notes || "No notes provided."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => { setSelectedApproval(item); setAction("REJECTED"); }}>
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Request?</DialogTitle>
                                        <DialogDescription>
                                            Please provide a reason for rejection. This will be sent to the requester.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label>Reason</Label>
                                        <Textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="e.g., Incomplete documentation..."
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleProcess} variant="destructive">Confirm Rejection</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setSelectedApproval(item); setAction("APPROVED"); }}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Approve Request</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to approve this request?
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label>Comments (Optional)</Label>
                                        <Textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Any approval notes..."
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleProcess}>Confirm Approval</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
