"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RiAdminLine,
  RiLoader4Line,
  RiShieldUserLine,
  RiUserLine,
} from "react-icons/ri";

interface UserRoleSelectProps {
  userId: string;
  currentRole: string;
  roleColors: Record<string, string>;
  roleIcons: Record<string, React.ReactNode>;
}

const roleOptions = [
  { value: "USER", label: "User", icon: RiUserLine },
  { value: "MANAGER", label: "Manager", icon: RiShieldUserLine },
  { value: "ADMIN", label: "Admin", icon: RiAdminLine },
];

export function UserRoleSelect({
  userId,
  currentRole,
  roleColors,
  roleIcons,
}: UserRoleSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(currentRole);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === role) return;

    try {
      const response = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }

      setRole(newRole);
      toast.success(`Role updated to ${newRole}`);
      
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
      // Reset to original role on error
      setRole(currentRole);
    }
  };

  return (
    <Select value={role} onValueChange={handleRoleChange} disabled={isPending}>
      <SelectTrigger className="w-[140px] h-8 border-0 bg-transparent p-0 focus:ring-0">
        <SelectValue>
          <Badge className={`gap-1.5 ${roleColors[role]}`}>
            {isPending ? (
              <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
            ) : (
              roleIcons[role]
            )}
            {role}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {roleOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <option.icon className="h-4 w-4" />
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
