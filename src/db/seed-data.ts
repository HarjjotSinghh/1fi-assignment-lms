
import { db } from "@/db";
import { 
    departments, 
    communicationTemplates, 
    customFieldDefinitions, 
    legalCases, 
    watchlist, 
    users,
    loans,
    customers,
    auditLogs,
    apiKeys,
    payments,
    approvals,
    notifications,
    autoApprovalRules,
    emiSchedule,
    loanProducts,
    loanApplications,
    recoveryAgents,
    collaterals,
    loginHistory
} from "@/db/schema";
import { addDays, subDays, startOfMonth, addMonths, subHours } from "date-fns";


export async function seedData() {
    console.log("Seeding data...");

    // 1. Departments
    const deptId = crypto.randomUUID();
    await db.insert(departments).values([
        {
            id: deptId,
            name: "Lending Operations",
            code: "LEND",
            description: "Core lending team",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            name: "Risk Management",
            code: "RISK",
            description: "Risk assessment team",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            name: "Collections",
            code: "COLL",
            description: "Debt recovery team",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ]).onConflictDoNothing();

    // 2. Communication Templates
    await db.insert(communicationTemplates).values([
        {
            id: crypto.randomUUID(),
            name: "Loan Approval",
            channel: "EMAIL",
            subject: "Your loan has been approved",
            body: "Dear {{customerName}}, congratulations! Your loan {{loanNumber}} has been approved.",
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            name: "Payment Reminder",
            channel: "SMS",
            body: "Reminder: Your EMI of {{amount}} is due on {{dueDate}}. Please pay to avoid charges.",
            isActive: true,
            createdAt: new Date().toISOString()
        }
    ]).onConflictDoNothing();

    // 3. Custom Fields
    await db.insert(customFieldDefinitions).values([
        {
            id: crypto.randomUUID(),
            fieldName: "Referral Source",
            entity: "CUSTOMER",
            fieldType: "TEXT",
            fieldLabel: "Referral Source",
            isRequired: false,
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            fieldName: "Property Type",
            entity: "COLLATERAL",
            fieldType: "SELECT",
            fieldLabel: "Property Type",
            options: JSON.stringify(["Residential", "Commercial", "Industrial"]),
            isRequired: true,
            isActive: true,
            createdAt: new Date().toISOString()
        }
    ]).onConflictDoNothing();

    // 4. Auto Approval Rules
    await db.insert(autoApprovalRules).values([
        {
            id: crypto.randomUUID(),
            name: "High Credit Score Auto-Approval",
            description: "Automatically approve loans for improved credit scores > 800",
            priority: 10,
            conditions: JSON.stringify({ minCreditScore: 800, maxLtv: 60, operator: "AND" }),
            autoApprove: true,
            autoReject: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            name: "High Risk Auto-Reject",
            description: "Reject applications with low credit scores",
            priority: 9,
            conditions: JSON.stringify({ minCreditScore: 600, operator: "LT" }),
            autoApprove: false,
            autoReject: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ]).onConflictDoNothing();

    // 4b. Recovery Agents
    await db.insert(recoveryAgents).values([
        {
            id: crypto.randomUUID(),
            name: "Agent Smith",
            code: "AGT-001",
            phone: "+91 99999 00001",
            agencyName: "Matrix Recovery",
            isActive: true,
            totalAssigned: 5,
            totalRecovered: 2,
            successRate: 40,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            name: "Internal Collection Team",
            code: "AGT-INT-01",
            phone: "+91 99999 00002",
            isActive: true,
            totalAssigned: 10,
            totalRecovered: 8,
            successRate: 80,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ]).onConflictDoNothing();

     // 5. API Keys (Partners)
    const userId = (await db.query.users.findFirst())?.id;
    if (userId) {
         await db.insert(apiKeys).values([
            {
                id: crypto.randomUUID(),
                key: "pk_test_" + crypto.randomUUID().replace(/-/g, ""),
                name: "Fintech Partner A",
                description: "Test API key for Fintech Partner A",
                isActive: true,
                userId: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]).onConflictDoNothing();
    }

    // Fetch dependencies
    let user = await db.query.users.findFirst();
    let loan = await db.query.loans.findFirst();
    let customer = await db.query.customers.findFirst();

    // Ensure we have a loan and customer for deep seeding
    if (!loan && user) {
        console.log("No loan found, creating basic loan structure...");
        
        // Product
        const productId = crypto.randomUUID();
        await db.insert(loanProducts).values({
            id: productId,
            name: "Personal Loan Basic",
            description: "Standard personal loan",
            minAmount: 10000,
            maxAmount: 500000,
            minTenureMonths: 12,
            maxTenureMonths: 60,
            interestRatePercent: 12.5,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Customer
        if (!customer) {
            const customerId = crypto.randomUUID();
            await db.insert(customers).values({
                id: customerId,
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                phone: "9876543210",
                dateOfBirth: "1990-01-01",
                kycStatus: "VERIFIED",
                riskScore: 750,
                creditScore: 750,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            customer = await db.query.customers.findFirst();
        }

        if (customer) {
             // Application
            const appId = crypto.randomUUID();
            await db.insert(loanApplications).values({
                id: appId,
                customerId: customer.id,
                productId: productId,
                requestedAmount: 100000,
                tenure: 12,
                status: "APPROVED",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Loan
            const loanId = crypto.randomUUID();
            await db.insert(loans).values({
                id: loanId,
                loanNumber: "LN-" + Date.now(),
                customerId: customer.id,
                productId: productId,
                applicationId: appId,
                principalAmount: 100000,
                interestRate: 12.5,
                tenure: 12,
                emiAmount: 8908,
                outstandingPrincipal: 95000,
                outstandingInterest: 500,
                totalOutstanding: 95500,
                disbursedAmount: 100000,
                disbursedAt: new Date().toISOString(),
                maturityDate: addMonths(new Date(), 12).toISOString(),
                status: "ACTIVE",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                currentLtv: 79.5
            });

            // Collaterals (Mutual Fund)
            await db.insert(collaterals).values({
                id: crypto.randomUUID(),
                loanId: loanId,
                customerId: customer.id,
                assetType: "MUTUAL_FUND",
                fundName: "HDFC Top 100 Fund",
                amcName: "HDFC Mutual Fund",
                folioNumber: "12345678/90",
                schemeName: "HDFC Top 100 Fund - Growth",
                schemeType: "EQUITY",
                units: 1000,
                purchaseNav: 100,
                currentNav: 120,
                purchaseValue: 100000,
                currentValue: 120000,
                pledgeStatus: "PLEDGED",
                pledgedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastValuationAt: new Date().toISOString()
            });
            
            // Refresh loan fetch
            loan = await db.query.loans.findFirst();

            // Create a delinquent loan for Collections testing
            const badAppId = crypto.randomUUID();
            await db.insert(loanApplications).values({
                id: badAppId,
                customerId: customer.id,
                productId: productId,
                requestedAmount: 50000,
                tenure: 12,
                status: "APPROVED",
                createdAt: subDays(new Date(), 90).toISOString(),
                updatedAt: subDays(new Date(), 90).toISOString()
            });

            await db.insert(loans).values({
                id: crypto.randomUUID(),
                loanNumber: "LN-BAD-" + Date.now(),
                customerId: customer.id,
                productId: productId,
                applicationId: badAppId,
                principalAmount: 50000,
                interestRate: 15,
                tenure: 12,
                emiAmount: 4500,
                outstandingPrincipal: 48000,
                outstandingInterest: 2000,
                totalOutstanding: 50000,
                disbursedAmount: 50000,
                disbursedAt: subDays(new Date(), 90).toISOString(),
                maturityDate: addMonths(new Date(), 9).toISOString(),
                status: "DEFAULT", // Make it delinquent
                createdAt: subDays(new Date(), 90).toISOString(),
                updatedAt: subDays(new Date(), 90).toISOString()
            });
        }
    }

    if (user && loan) {
        // 6. Legal Cases
        await db.insert(legalCases).values([
            {
                id: crypto.randomUUID(),
                caseNumber: "CS/2024/001",
                loanId: loan.id,
                customerId: loan.customerId,
                courtName: "Delhi High Court",
                caseType: "CIVIL_SUIT",
                status: "FILED",
                assignedToId: user.id,
                filingDate: new Date(Date.now() - 86400000 * 30).toISOString(), // Filed 30 days ago
                nextHearingDate: new Date(Date.now() + 86400000 * 14).toISOString(), // 2 weeks
                claimAmount: 500000,
                notes: "Initial filing done. Summons issued.",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]).onConflictDoNothing();
    }

    if (user) {
        // 5. Watchlist for user context (re-using existing block structure)
        // 5. Watchlist
        await db.insert(watchlist).values([
            {
                id: crypto.randomUUID(),
                entityType: "PAN",
                entityValue: "ABCDE1234F",
                listType: "BLACKLIST",
                reason: "Fraudulent activity detected in previous loan",
                addedById: user.id,
                addedAt: new Date().toISOString()
            },
            {
                id: crypto.randomUUID(),
                entityType: "NAME",
                entityValue: "John Doe Suspicious",
                listType: "GREYLIST",
                reason: "Potential match with PEP list",
                addedById: user.id,
                addedAt: new Date().toISOString()
            }
        ]).onConflictDoNothing();

        // 6. Login History (Audit Logs with specific action)
        await db.insert(auditLogs).values([
            {
                id: crypto.randomUUID(),
                userId: user.id,
                action: "LOGIN",
                entityType: "AUTH",
                entityId: user.id,
                description: "User logged in successfully",
                ipAddress: "127.0.0.1",
                userAgent: "Mozilla/5.0...",
                createdAt: new Date().toISOString()
            },
             {
                id: crypto.randomUUID(),
                userId: user.id,
                action: "LOGIN",
                entityType: "AUTH",
                entityId: user.id,
                description: "User logged in successfully",
                ipAddress: "127.0.0.1",
                userAgent: "Mozilla/5.0...",
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ]).onConflictDoNothing();

        // 7. Approvals
        await db.insert(approvals).values([
            {
                id: crypto.randomUUID(),
                type: "LOAN_APPROVAL",
                status: "PENDING",
                entityType: "APPLICATION",
                entityId: loan?.applicationId || crypto.randomUUID(),
                requestedAmount: 150000,
                notes: "Requesting higher amount based on good credit history",
                requestedById: user.id,
                createdAt: new Date().toISOString()
            },
            {
                id: crypto.randomUUID(),
                type: "DISBURSEMENT",
                status: "APPROVED",
                entityType: "LOAN",
                entityId: loan?.id || crypto.randomUUID(),
                requestedAmount: 100000,
                notes: "Standard disbursement",
                requestedById: user.id,
                reviewedById: user.id,
                reviewedAt: new Date().toISOString(),
                createdAt: subDays(new Date(), 2).toISOString()
            }
        ]).onConflictDoNothing();

        // 8. Notifications - Expanded mock data
        await db.insert(notifications).values([
            {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "ALERT",
                title: "High Value Loan Application",
                message: "A new loan application for ₹15,00,000 requires your approval.",
                isRead: false,
                link: "/approvals",
                createdAt: new Date().toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "WARNING",
                title: "Margin Call Alert",
                message: "Loan LN-2024-001 has breached 70% LTV threshold. Immediate action required.",
                isRead: false,
                link: "/collateral/rebalancing",
                createdAt: subHours(new Date(), 2).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "SUCCESS",
                title: "Payment Received",
                message: "Payment of ₹8,908 received for loan LN-2024-002 via UPI.",
                isRead: false,
                link: "/payments/reconciliation",
                createdAt: subHours(new Date(), 4).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "INFO",
                title: "KYC Verification Complete",
                message: "Customer Rahul Sharma's KYC has been successfully verified via DigiLocker.",
                isRead: true,
                readAt: subHours(new Date(), 1).toISOString(),
                link: "/customers",
                createdAt: subHours(new Date(), 6).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "INFO",
                title: "System Maintenance",
                message: "Scheduled maintenance tonight at 11 PM. Expected downtime: 30 minutes.",
                isRead: true,
                readAt: new Date().toISOString(),
                createdAt: subDays(new Date(), 1).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "ALERT",
                title: "Legal Case Update",
                message: "Next hearing for case CS/2024/001 is scheduled for next week.",
                isRead: false,
                link: "/legal",
                createdAt: subDays(new Date(), 1).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "SUCCESS",
                title: "Loan Disbursed",
                message: "Loan LN-2024-003 for ₹2,00,000 has been disbursed successfully.",
                isRead: true,
                readAt: subDays(new Date(), 2).toISOString(),
                link: "/loans",
                createdAt: subDays(new Date(), 2).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                type: "WARNING",
                title: "Overdue EMI",
                message: "Customer John Doe has an overdue EMI of ₹4,500. Consider follow-up.",
                isRead: false,
                link: "/collections",
                createdAt: subDays(new Date(), 3).toISOString()
            }
        ]).onConflictDoNothing();

        // 9. Login History - Mock data
        await db.insert(loginHistory).values([
            {
                id: crypto.randomUUID(),
                userId: user.id,
                success: true,
                ipAddress: "192.168.1.100",
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
                location: "Mumbai, India",
                mfaUsed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                success: true,
                ipAddress: "192.168.1.100",
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
                location: "Mumbai, India",
                mfaUsed: true,
                createdAt: subHours(new Date(), 8).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                success: false,
                ipAddress: "103.42.11.55",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0",
                location: "Delhi, India",
                failureReason: "Invalid password",
                createdAt: subDays(new Date(), 1).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                success: true,
                ipAddress: "192.168.1.100",
                userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2) Safari/604.1",
                location: "Mumbai, India",
                mfaUsed: true,
                createdAt: subDays(new Date(), 1).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                success: true,
                ipAddress: "192.168.1.105",
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/119.0.0.0",
                location: "Pune, India",
                mfaUsed: false,
                createdAt: subDays(new Date(), 2).toISOString()
            },
            {
                id: crypto.randomUUID(),
                userId: user.id,
                success: false,
                ipAddress: "45.33.22.11",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/118.0.0.0",
                location: "Unknown",
                failureReason: "Suspicious login attempt blocked",
                createdAt: subDays(new Date(), 3).toISOString()
            }
        ]).onConflictDoNothing();
    }

    if (loan) {
        // 9. Payments (Reconciliation Data)
        await db.insert(payments).values([
            {
                id: crypto.randomUUID(),
                loanId: loan.id,
                amount: 8908,
                paymentDate: subDays(new Date(), 30).toISOString(),
                paymentMode: "UPI",
                transactionRef: "UPI123456789",
                status: "SUCCESS",
                isReconciled: true,
                reconciledAt: new Date().toISOString(),
                createdAt: subDays(new Date(), 30).toISOString()
            },
            {
                id: crypto.randomUUID(),
                loanId: loan.id,
                amount: 8908,
                paymentDate: new Date().toISOString(),
                paymentMode: "NEFT",
                transactionRef: "NEFT987654321",
                status: "SUCCESS",
                isReconciled: false, // Unreconciled for demo
                createdAt: new Date().toISOString()
            }
        ]).onConflictDoNothing();

        // 10. EMI Schedule (Cash Flow Forecasting)
        // Create 12 months of future EMIs
        const schedule = Array.from({ length: 12 }).map((_, i) => ({
            id: crypto.randomUUID(),
            loanId: loan!.id,
            installmentNo: i + 1,
            dueDate: addMonths(startOfMonth(new Date()), i + 1).toISOString(),
            emiAmount: 8908,
            principalAmount: 8408,
            interestAmount: 500,
            status: "PENDING",
            paidAmount: 0,
            createdAt: new Date().toISOString()
        }));

        await db.insert(emiSchedule).values(schedule).onConflictDoNothing();
    }

    console.log("Seeding completed.");
}
