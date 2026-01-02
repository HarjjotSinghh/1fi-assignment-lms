/**
 * Database Backup & Restore Utilities
 * SQLite-specific backup operations
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync } from "fs";
import { join, basename } from "path";

const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || "10", 10);
const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "./sqlite.db";

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
}

export interface BackupInfo {
    id: string;
    filename: string;
    path: string;
    size: number;
    createdAt: Date;
}

/**
 * Create a database backup
 */
export async function createBackup(name?: string): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = name
        ? `${name.replace(/[^a-zA-Z0-9-_]/g, "_")}_${timestamp}`
        : `backup_${timestamp}`;
    const filename = `${backupName}.db`;
    const backupPath = join(BACKUP_DIR, filename);

    // Copy the database file
    copyFileSync(DB_PATH, backupPath);

    // Get file stats
    const stats = statSync(backupPath);

    // Clean up old backups if we exceed the limit
    await cleanupOldBackups();

    return {
        id: backupName,
        filename,
        path: backupPath,
        size: stats.size,
        createdAt: new Date(),
    };
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
    if (!existsSync(BACKUP_DIR)) {
        return [];
    }

    const files = readdirSync(BACKUP_DIR)
        .filter((file) => file.endsWith(".db"))
        .map((filename) => {
            const filePath = join(BACKUP_DIR, filename);
            const stats = statSync(filePath);
            return {
                id: filename.replace(".db", ""),
                filename,
                path: filePath,
                size: stats.size,
                createdAt: stats.mtime,
            };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return files;
}

/**
 * Restore from a backup
 */
export async function restoreBackup(backupId: string): Promise<boolean> {
    const backupPath = join(BACKUP_DIR, `${backupId}.db`);

    if (!existsSync(backupPath)) {
        throw new Error(`Backup not found: ${backupId}`);
    }

    // Create a backup of current database before restore
    await createBackup("pre_restore");

    // Copy backup to database path
    copyFileSync(backupPath, DB_PATH);

    return true;
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string): Promise<boolean> {
    const backupPath = join(BACKUP_DIR, `${backupId}.db`);

    if (!existsSync(backupPath)) {
        throw new Error(`Backup not found: ${backupId}`);
    }

    unlinkSync(backupPath);
    return true;
}

/**
 * Clean up old backups to maintain max limit
 */
async function cleanupOldBackups(): Promise<void> {
    const backups = await listBackups();

    if (backups.length > MAX_BACKUPS) {
        const toDelete = backups.slice(MAX_BACKUPS);
        for (const backup of toDelete) {
            try {
                unlinkSync(backup.path);
            } catch (error) {
                console.error(`Failed to delete old backup: ${backup.filename}`, error);
            }
        }
    }
}

/**
 * Get backup file size formatted
 */
export function formatBackupSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate database file integrity
 */
export async function validateDatabase(path: string): Promise<boolean> {
    // Basic check - file exists and has content
    if (!existsSync(path)) {
        return false;
    }

    const stats = statSync(path);
    if (stats.size < 100) {
        return false;
    }

    // SQLite files start with specific header
    // This is a basic check; in production you'd use sqlite3 PRAGMA integrity_check
    return true;
}
