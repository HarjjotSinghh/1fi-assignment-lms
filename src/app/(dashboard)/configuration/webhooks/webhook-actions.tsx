"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiAddCircleLine,
  RiDeleteBin6Line,
  RiGlobalLine,
  RiCheckLine,
  RiFileCopyLine,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { WEBHOOK_EVENTS, WebhookEventType } from "@/lib/webhook";

interface WebhookActionsProps {
  mode: "create" | "delete";
  webhookId?: string;
  webhookName?: string;
}

const AVAILABLE_EVENTS = Object.entries(WEBHOOK_EVENTS).map(([key, label]) => ({
  id: key as WebhookEventType,
  label,
}));

export function WebhookActions({ mode, webhookId, webhookName }: WebhookActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          events: selectedEvents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create webhook");
      }

      toast.success("Webhook created successfully");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create webhook");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!webhookId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete webhook");
      }

      toast.success("Webhook deleted successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete webhook");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setUrl("");
    setSelectedEvents([]);
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="rounded-none gap-2">
            <RiAddCircleLine className="h-4 w-4" />
            Add Webhook
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Configure a new webhook endpoint to receive real-time events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Production Listener"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL *</Label>
              <Input
                id="url"
                placeholder="https://api.yourdomain.com/webhooks/lamf"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Events *</Label>
              <div className="border rounded-sm p-3 max-h-60 overflow-y-auto space-y-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={event.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {event.id}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {event.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-none">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading} className="rounded-none">
              {loading ? "Creating..." : "Create Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-none gap-1 text-destructive hover:text-destructive">
          <RiDeleteBin6Line className="h-3.5 w-3.5" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Webhook</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{webhookName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-none">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-none"
          >
            {loading ? "Deleting..." : "Delete Webhook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
