import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, customers, loanApplications, collaterals, payments, emiSchedule, loanProducts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { eq, and, gte, lte, like, sql, count, sum, avg } from "drizzle-orm";

// Available entities and their fields for report building
export const REPORT_ENTITIES = {
    loans: {
        name: "Loans",
        fields: [
            { id: "id", label: "Loan ID", type: "text" },
            { id: "status", label: "Status", type: "select", options: ["ACTIVE", "CLOSED", "DEFAULTED", "WRITTEN_OFF"] },
            { id: "outstandingPrincipal", label: "Outstanding Principal", type: "number" },
            { id: "outstandingInterest", label: "Outstanding Interest", type: "number" },
            { id: "tenure", label: "Tenure (months)", type: "number" },
            { id: "disbursedAt", label: "Disbursement Date", type: "date" },
            { id: "currentLtv", label: "Current LTV %", type: "number" },
            { id: "createdAt", label: "Created Date", type: "date" },
        ],
        aggregations: ["count", "sum:outstandingPrincipal", "avg:currentLtv"],
    },
    customers: {
        name: "Customers",
        fields: [
            { id: "id", label: "Customer ID", type: "text" },
            { id: "fullName", label: "Full Name", type: "text" },
            { id: "email", label: "Email", type: "text" },
            { id: "phone", label: "Phone", type: "text" },
            { id: "kycStatus", label: "KYC Status", type: "select", options: ["PENDING", "VERIFIED", "REJECTED"] },
            { id: "riskCategory", label: "Risk Category", type: "select", options: ["LOW", "MEDIUM", "HIGH"] },
            { id: "createdAt", label: "Created Date", type: "date" },
        ],
        aggregations: ["count"],
    },
    applications: {
        name: "Loan Applications",
        fields: [
            { id: "id", label: "Application ID", type: "text" },
            { id: "status", label: "Status", type: "select", options: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DISBURSED"] },
            { id: "requestedAmount", label: "Requested Amount", type: "number" },
            { id: "requestedTenure", label: "Requested Tenure", type: "number" },
            { id: "createdAt", label: "Created Date", type: "date" },
        ],
        aggregations: ["count", "sum:requestedAmount", "avg:requestedAmount"],
    },
    payments: {
        name: "Payments",
        fields: [
            { id: "id", label: "Payment ID", type: "text" },
            { id: "amount", label: "Amount", type: "number" },
            { id: "paymentMode", label: "Payment Mode", type: "select", options: ["UPI", "NEFT", "NACH", "CASH", "CHEQUE"] },
            { id: "status", label: "Status", type: "select", options: ["PENDING", "SUCCESS", "FAILED"] },
            { id: "receivedAt", label: "Received Date", type: "date" },
        ],
        aggregations: ["count", "sum:amount"],
    },
    collaterals: {
        name: "Collaterals",
        fields: [
            { id: "id", label: "Collateral ID", type: "text" },
            { id: "assetType", label: "Asset Type", type: "select", options: ["MUTUAL_FUND", "BOND", "INSURANCE", "FD", "SHARES"] },
            { id: "pledgeStatus", label: "Pledge Status", type: "select", options: ["PENDING", "PLEDGED", "RELEASED", "LIQUIDATED"] },
            { id: "currentValue", label: "Current Value", type: "number" },
            { id: "schemeType", label: "Scheme Type", type: "text" },
        ],
        aggregations: ["count", "sum:currentValue"],
    },
};

// GET - Fetch report schema/metadata
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "analytics:view")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({ entities: REPORT_ENTITIES });
    } catch (error) {
        console.error("Report builder GET error:", error);
        return NextResponse.json({ error: "Failed to fetch report schema" }, { status: 500 });
    }
}

// POST - Execute custom report query
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasPermission(session.user.role, "analytics:view")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { entity, selectedFields, filters, groupBy, aggregation } = body;

        // Build and execute query based on entity
        let results: any[] = [];
        let summary: Record<string, any> = {};

        switch (entity) {
            case "loans": {
                const whereConditions = [];
                
                if (filters?.status) {
                    whereConditions.push(eq(loans.status, filters.status));
                }
                if (filters?.dateFrom) {
                    whereConditions.push(gte(loans.createdAt, filters.dateFrom));
                }
                if (filters?.dateTo) {
                    whereConditions.push(lte(loans.createdAt, filters.dateTo));
                }

                const query = db.query.loans.findMany({
                    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
                    with: { product: true, customer: true },
                    limit: 1000,
                });

                results = await query;

                // Calculate aggregations
                const allLoans = await db.select({
                    count: count(),
                    totalPrincipal: sum(loans.outstandingPrincipal),
                    avgLtv: avg(loans.currentLtv),
                }).from(loans).where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

                summary = {
                    totalRecords: allLoans[0]?.count || 0,
                    totalOutstanding: allLoans[0]?.totalPrincipal || 0,
                    averageLTV: allLoans[0]?.avgLtv || 0,
                };
                break;
            }

            case "customers": {
                const whereConditions = [];
                
                if (filters?.kycStatus) {
                    whereConditions.push(eq(customers.kycStatus, filters.kycStatus));
                }
                if (filters?.dateFrom) {
                    whereConditions.push(gte(customers.createdAt, filters.dateFrom));
                }

                results = await db.query.customers.findMany({
                    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
                    limit: 1000,
                });

                summary = { totalRecords: results.length };
                break;
            }

            case "applications": {
                const whereConditions = [];
                
                if (filters?.status) {
                    whereConditions.push(eq(loanApplications.status, filters.status));
                }
                if (filters?.dateFrom) {
                    whereConditions.push(gte(loanApplications.createdAt, filters.dateFrom));
                }

                results = await db.query.loanApplications.findMany({
                    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
                    with: { customer: true, product: true },
                    limit: 1000,
                });

                const agg = await db.select({
                    count: count(),
                    totalRequested: sum(loanApplications.requestedAmount),
                }).from(loanApplications).where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

                summary = {
                    totalRecords: agg[0]?.count || 0,
                    totalRequestedAmount: agg[0]?.totalRequested || 0,
                };
                break;
            }

            case "payments": {
                const whereConditions = [];
                
                if (filters?.status) {
                    whereConditions.push(eq(payments.status, filters.status));
                }
                if (filters?.paymentMode) {
                    whereConditions.push(eq(payments.paymentMode, filters.paymentMode));
                }

                results = await db.query.payments.findMany({
                    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
                    with: { loan: true },
                    limit: 1000,
                });

                const agg = await db.select({
                    count: count(),
                    totalAmount: sum(payments.amount),
                }).from(payments).where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

                summary = {
                    totalRecords: agg[0]?.count || 0,
                    totalAmount: agg[0]?.totalAmount || 0,
                };
                break;
            }

            case "collaterals": {
                const whereConditions = [];
                
                if (filters?.assetType) {
                    whereConditions.push(eq(collaterals.assetType, filters.assetType));
                }
                if (filters?.pledgeStatus) {
                    whereConditions.push(eq(collaterals.pledgeStatus, filters.pledgeStatus));
                }

                results = await db.query.collaterals.findMany({
                    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
                    with: { customer: true },
                    limit: 1000,
                });

                const agg = await db.select({
                    count: count(),
                    totalValue: sum(collaterals.currentValue),
                }).from(collaterals).where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

                summary = {
                    totalRecords: agg[0]?.count || 0,
                    totalValue: agg[0]?.totalValue || 0,
                };
                break;
            }

            default:
                return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
        }

        // Filter fields if specific ones are selected
        if (selectedFields && selectedFields.length > 0) {
            results = results.map(row => {
                const filtered: any = {};
                selectedFields.forEach((field: string) => {
                    if (row[field] !== undefined) {
                        filtered[field] = row[field];
                    }
                });
                return filtered;
            });
        }

        return NextResponse.json({
            data: results,
            summary,
            generatedAt: new Date().toISOString(),
            query: { entity, filters, selectedFields },
        });
    } catch (error) {
        console.error("Report builder POST error:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
