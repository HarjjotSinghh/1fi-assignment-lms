"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SimulationControls() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const runSimulation = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Processing End-of-Day Batch...");

    try {
      // 1. Update NAVs
      const navRes = await fetch("/api/jobs/update-nav", { method: "POST" });
      if (!navRes.ok) throw new Error("Failed to update NAVs");
      const navData = await navRes.json();
      
      toast.loading(`NAV Updated: ${navData.message}`, { id: toastId });

      // 2. Check Margin Calls
      const marginRes = await fetch("/api/jobs/check-margin-calls", { method: "POST" });
      if (!marginRes.ok) throw new Error("Failed to check margin calls");
      const marginData = await marginRes.json();

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Batch Processing Complete</span>
          <span className="text-xs opacity-90">
            Checked {marginData.data.loansChecked} loans.
            Generated {marginData.data.marginCallsGenerated} margin calls.
          </span>
        </div>,
        { id: toastId, duration: 5000 }
      );

      // Refresh UI to show new data
      router.refresh();
      
    } catch (error) {
      console.error(error);
      toast.error("Simulation failed. Check console.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runSimulation} 
              disabled={isLoading}
              className="rounded-none border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary pointer-events-auto"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              ) : (
                <PlayIcon className="h-4 w-4 mr-2" />
              )}
              Run Daily Batch
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <p className="font-semibold">Simulate End-of-Day Processing</p>
          <ul className="text-xs list-disc pl-4 mt-1 space-y-1 text-muted-foreground">
            <li>Updates mutual fund NAVs (random ±2%)</li>
            <li>Recalculates LTV for all active loans</li>
            <li>Generates margin calls if thresholds breached</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
