import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  RiAdminLine,
  RiArrowLeftLine,
  RiShieldUserLine,
  RiUserLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { UserRoleSelect } from "./user-role-select";

async function getUsers() {
  try {
    return await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      image: users.image,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

const roleIcons: Record<string, React.ReactNode> = {
  ADMIN: <RiAdminLine className="h-3.5 w-3.5" />,
  MANAGER: <RiShieldUserLine className="h-3.5 w-3.5" />,
  USER: <RiUserLine className="h-3.5 w-3.5" />,
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-destructive/10 text-destructive border-destructive/20",
  MANAGER: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  USER: "bg-primary/10 text-primary border-primary/20",
};

export default async function AdminDashboardPage() {
  const allUsers = await getUsers();

  const stats = {
    total: allUsers.length,
    admins: allUsers.filter((u) => u.role === "ADMIN").length,
    managers: allUsers.filter((u) => u.role === "MANAGER").length,
    users: allUsers.filter((u) => u.role === "USER").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-none">
                  <RiArrowLeftLine className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <Badge className="w-fit rounded-full bg-destructive/10 text-destructive border-destructive/20">
                  Super Admin
                </Badge>
                <h1 className="font-heading text-3xl font-bold tracking-tight mt-1">
                  User Management
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm ml-12">
              Manage user roles and permissions across the system.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: stats.total, icon: RiUserLine },
            { label: "Admins", value: stats.admins, icon: RiAdminLine },
            { label: "Managers", value: stats.managers, icon: RiShieldUserLine },
            { label: "Regular Users", value: stats.users, icon: RiUserLine },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table */}
        <Card className="border bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">All Users</CardTitle>
            <CardDescription>
              Click on a user's role to change their access level.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">User</TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">Role</TableHead>
                  <TableHead className="font-medium">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  allUsers.map((user) => {
                    const initials = user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?";
                    const isSuperAdmin = user.email === "harjjotsinghh@gmail.com";

                    return (
                      <TableRow key={user.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.name || "Unnamed User"}
                                {isSuperAdmin && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Super Admin
                                  </Badge>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          {isSuperAdmin ? (
                            <Badge className={`gap-1.5 ${roleColors[user.role]}`}>
                              {roleIcons[user.role]}
                              {user.role}
                            </Badge>
                          ) : (
                            <UserRoleSelect
                              userId={user.id}
                              currentRole={user.role}
                              roleColors={roleColors}
                              roleIcons={roleIcons}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(user.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
