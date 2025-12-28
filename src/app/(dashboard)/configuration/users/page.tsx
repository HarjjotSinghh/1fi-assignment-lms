"use client";

import { useEffect, useState } from "react";
import { 
  RiShieldUserLine,
  RiAdminLine,
  RiUserLine,
  RiUserStarLine
} from "react-icons/ri";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getSystemUsers, updateUserRole } from "@/app/actions/users";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res = await getSystemUsers();
    if (res.success) setUsers(res.data || []);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
        toast.success("User role updated");
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
        toast.error("Failed to update role");
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">System Access Control</h1>
        <p className="text-muted-foreground">Manage employee access, RBAC assignments, and permissions.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>All registered users with system access.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">Loading users...</TableCell>
                        </TableRow>
                    ) : users.length === 0 ? (
                        <TableRow>
                             <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                        </TableRow>
                    ) : (
                        users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.image || ""} />
                                            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div>{user.name}</div>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <div className="w-[140px]">
                                        <Select 
                                            defaultValue={user.role} 
                                            onValueChange={(val) => handleRoleChange(user.id, val)}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USER">
                                                    <div className="flex items-center gap-2">
                                                        <RiUserLine className="w-3 h-3" /> User
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="MANAGER">
                                                     <div className="flex items-center gap-2">
                                                        <RiUserStarLine className="w-3 h-3" /> Manager
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="ADMIN">
                                                     <div className="flex items-center gap-2">
                                                        <RiAdminLine className="w-3 h-3" /> Admin
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {user.emailVerified ? (
                                        <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50">Verified</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-amber-600 bg-amber-50">Pending</Badge>
                                    )}
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
