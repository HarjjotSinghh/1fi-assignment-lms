"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RiEyeLine, RiEyeOffLine, RiFileCopyLine, RiCheckLine } from "react-icons/ri";
import { toast } from "sonner";

export function WebhookSecret({ secret }: { secret: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-muted-foreground">
        {show ? secret : "whsec_••••••••••••••••••••••••••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setShow(!show)}
      >
        {show ? (
          <RiEyeOffLine className="h-3 w-3" />
        ) : (
          <RiEyeLine className="h-3 w-3" />
        )}
      </Button>
      {show && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? (
            <RiCheckLine className="h-3 w-3 text-success" />
          ) : (
            <RiFileCopyLine className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}
