"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { verifyDocumentAction } from "@/app/actions/documents";
import { toast } from "sonner";
import { RiCheckLine, RiCloseLine, RiLoader4Line } from "react-icons/ri";

type DocumentActionsProps = {
    documentId: string;
    isVerified: boolean;
    applicationId: string;
};

export function DocumentActions({ documentId, isVerified, applicationId }: DocumentActionsProps) {
    const [isPending, startTransition] = useTransition();

    const handleVerify = (verified: boolean) => {
        startTransition(async () => {
            const result = await verifyDocumentAction(documentId, verified, applicationId);
            if (result.success) {
                toast.success(verified ? "Document marked as verified" : "Document verification revoked");
            } else {
                toast.error("Failed to update document status");
            }
        });
    };

    if (isVerified) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="rounded-none h-8 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                onClick={() => handleVerify(false)}
                disabled={isPending}
            >
                {isPending ? <RiLoader4Line className="h-4 w-4 animate-spin" /> : <RiCloseLine className="h-4 w-4 mr-1" />}
                Revoke
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="rounded-none h-8 border-success/50 text-success hover:bg-success/10 hover:text-success"
            onClick={() => handleVerify(true)}
            disabled={isPending}
        >
            {isPending ? <RiLoader4Line className="h-4 w-4 animate-spin" /> : <RiCheckLine className="h-4 w-4 mr-1" />}
            Verify
        </Button>
    );
}
