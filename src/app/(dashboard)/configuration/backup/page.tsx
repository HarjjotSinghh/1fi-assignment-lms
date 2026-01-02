"use client";

import { useEffect, useState } from "react";
import { 
    RiDatabase2Line, 
    RiDownloadLine, 
    RiDeleteBinLine, 
    RiRefreshLine,
    RiUploadLine,
    RiLoader4Line,
    RiAlertLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Backup {
    id: string;
    filename: string;
    size: number;
    sizeFormatted: string;
    createdAt: string;
}

export default function BackupPage() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backupName, setBackupName] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const loadBackups = async () => {
        try {
            const response = await fetch("/api/admin/backup");
            const data = await response.json();
            if (response.ok) {
                setBackups(data.backups);
            } else {
                toast.error(data.error || "Failed to load backups");
            }
        } catch {
            toast.error("Failed to load backups");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBackups();
    }, []);

    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            const response = await fetch("/api/admin/backup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: backupName || undefined }),
            });
            const data = await response.json();

            if (response.ok) {
                toast.success("Backup created successfully");
                setBackupName("");
                setCreateDialogOpen(false);
                loadBackups();
            } else {
                toast.error(data.error || "Failed to create backup");
            }
        } catch {
            toast.error("Failed to create backup");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteBackup = async (backupId: string) => {
        try {
            const response = await fetch(`/api/admin/backup?id=${backupId}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (response.ok) {
                toast.success("Backup deleted");
                loadBackups();
            } else {
                toast.error(data.error || "Failed to delete backup");
            }
        } catch {
            toast.error("Failed to delete backup");
        }
    };

    const handleRestoreBackup = async (backupId: string) => {
        setIsRestoring(true);
        try {
            const response = await fetch("/api/admin/backup/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ backupId }),
            });
            const data = await response.json();

            if (response.ok) {
                toast.success("Database restored successfully. Please restart the application.");
                loadBackups();
            } else {
                toast.error(data.error || "Failed to restore backup");
            }
        } catch {
            toast.error("Failed to restore backup");
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Database Backup</h1>
                    <p className="text-muted-foreground">
                        Manage database backups and restore points
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadBackups} disabled={isLoading}>
                        <RiRefreshLine className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <RiDatabase2Line className="h-4 w-4 mr-2" />
                                Create Backup
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Database Backup</DialogTitle>
                                <DialogDescription>
                                    Create a new backup of the current database state.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="backup-name">Backup Name (optional)</Label>
                                    <Input
                                        id="backup-name"
                                        placeholder="e.g., before_migration"
                                        value={backupName}
                                        onChange={(e) => setBackupName(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty for auto-generated name with timestamp
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleCreateBackup}
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <RiDatabase2Line className="h-4 w-4 mr-2" />
                                    )}
                                    Create Backup
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Available Backups</CardTitle>
                    <CardDescription>
                        {backups.length} backup{backups.length !== 1 ? "s" : ""} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RiLoader4Line className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <RiDatabase2Line className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No backups available</p>
                            <p className="text-sm">Create your first backup to get started</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Filename</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backups.map((backup) => (
                                    <TableRow key={backup.id}>
                                        <TableCell className="font-mono text-sm">
                                            {backup.filename}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{backup.sizeFormatted}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm" disabled={isRestoring}>
                                                            <RiUploadLine className="h-4 w-4 mr-1" />
                                                            Restore
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                <RiAlertLine className="h-5 w-5 inline mr-2 text-yellow-500" />
                                                                Restore Database
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will replace the current database with the backup from{" "}
                                                                <strong>{backup.filename}</strong>. A backup of the current
                                                                state will be created automatically. This action cannot be
                                                                undone easily.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleRestoreBackup(backup.id)}
                                                                className="bg-yellow-600 hover:bg-yellow-700"
                                                            >
                                                                Restore Database
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="text-red-600">
                                                            <RiDeleteBinLine className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete {backup.filename}? This
                                                                action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteBackup(backup.id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
