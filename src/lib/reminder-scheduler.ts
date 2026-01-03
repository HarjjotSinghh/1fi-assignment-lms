import { db } from "@/db";
import { reminderRules, emiSchedule, loans, communicationTemplates } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Reminder Scheduler Logic
 * Identify EMIs due soon and trigger notifications based on rules
 */
export async function processReminders() {
    try {
        // 1. Fetch active rules
        const rules = await db.query.reminderRules.findMany({
            where: eq(reminderRules.isActive, true),
        });

        const results = [];

        for (const rule of rules) {
            // Calculate target date based on rule.triggerDays
            // e.g. If triggerDays = -3 (3 days before due), target = Today + 3 days
            // If triggerDays = 1 (1 day after due), target = Today - 1 day
            
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + rule.triggerDays);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            // 2. Find EMIs matching this date criteria
            // Logic: Find pending EMIs where dueDate == targetDateStr (simplified)
            // Note: For negative triggerDays (before due), we look for Date = DueDate + triggerDays? No.
            // If we want to remind 3 days BEFORE due date, we look for EMIs due 3 days FROM NOW.
            
            // Correct Logic:
            // We want to find EMIs where: DueDate = Today + (-1 * triggerDays) 
            // e.g. Rule -3 days (before). We want DueDate = Today + 3 days.
            // e.g. Rule +1 days (after). We want DueDate = Today - 1 days.
            
            const daysOffset = -1 * rule.triggerDays;
            const searchDate = new Date();
            searchDate.setDate(searchDate.getDate() + daysOffset);
            const searchDateStr = searchDate.toISOString().split('T')[0];

            const pendingEmis = await db.query.emiSchedule.findMany({
                where: and(
                    eq(emiSchedule.status, "PENDING"),
                    eq(emiSchedule.dueDate, searchDateStr)
                ),
                with: {
                    loan: {
                        with: {
                            customer: true
                        }
                    }
                },
                limit: 50 // Batch limit
            });

            results.push({
                ruleId: rule.id,
                ruleName: rule.name,
                targetDate: searchDateStr,
                matchedEmis: pendingEmis.length
            });

            // 3. Trigger Notification (Mock)
            // In real app, we would queue jobs here
        }

        return results;

    } catch (error) {
        console.error("Reminder processing failed:", error);
        throw error;
    }
}
