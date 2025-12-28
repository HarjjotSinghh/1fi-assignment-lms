"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiAddCircleLine,
  RiDeleteBin6Line,
  RiKeyLine,
  RiFileCopyLine,
  RiCheckLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ApiKeyActionsProps {
  mode: "create" | "revoke";
  userId?: string;
  keyId?: string;
  keyName?: string;
}

export function ApiKeyActions({ mode, userId, keyId, keyName }: ApiKeyActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state for create
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create API key");
      }

      setNewKey(data.key);
      toast.success("API key created successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!keyId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revoke API key");
      }

      toast.success("API key revoked successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke API key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setNewKey(null);
    setName("");
    setDescription("");
    setCopied(false);
  };

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen && newKey) {
          handleClose();
        } else {
          setOpen(isOpen);
        }
      }}>
        <DialogTrigger asChild>
          <Button className="rounded-none gap-2">
            <RiAddCircleLine className="h-4 w-4" />
            Generate New Key
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          {!newKey ? (
            <>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for partner integrations. The key will only be shown once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Key Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production Key for Partner XYZ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any notes about this key..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-none resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClose} className="rounded-none">
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={loading} className="rounded-none">
                  {loading ? "Creating..." : "Create Key"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RiKeyLine className="h-5 w-5 text-success" />
                  API Key Created
                </DialogTitle>
                <DialogDescription>
                  Copy this key now. You won't be able to see it again!
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="p-4 bg-slate-950 rounded-none">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-slate-50 font-mono flex-1 break-all">
                      {newKey}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0 text-slate-50 hover:text-slate-200 hover:bg-slate-800"
                    >
                      {copied ? (
                        <RiCheckLine className="h-4 w-4 text-success" />
                      ) : (
                        <RiFileCopyLine className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Store this key securely. It will be masked in the dashboard after you close this dialog.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={handleClose} className="rounded-none w-full">
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Revoke mode
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-none gap-1 text-destructive hover:text-destructive">
          <RiDeleteBin6Line className="h-3.5 w-3.5" />
          Revoke
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke "{keyName}"? This action cannot be undone and will immediately invalidate the key.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-none">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={loading}
            className="rounded-none"
          >
            {loading ? "Revoking..." : "Revoke Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
