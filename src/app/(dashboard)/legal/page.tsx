import { db } from "@/db";
import { legalCases, loans, customers, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiHammerLine, RiSearchLine, RiFilter3Line } from "react-icons/ri";
import { AddCaseDialog } from "@/components/legal/add-case-dialog";

export default async function LegalCasesPage() {
    const cases = await db
        .select({
            id: legalCases.id,
            caseNumber: legalCases.caseNumber,
            courtName: legalCases.courtName,
            lawyerName: users.name,
            status: legalCases.status,
            nextHearingDate: legalCases.nextHearingDate,
            loanNumber: loans.loanNumber,
            customerName: customers.firstName, // joining manually or assuming first name for now
        })
        .from(legalCases)
        .leftJoin(loans, eq(legalCases.loanId, loans.id))
        .leftJoin(customers, eq(loans.customerId, customers.id))
        .leftJoin(users, eq(legalCases.assignedToId, users.id))
        .orderBy(desc(legalCases.createdAt));

    const allLoans = await db.query.loans.findMany({
        columns: {
            id: true,
            loanNumber: true
        }
    });

    return (
        <div className="space-y-6 animate-fade-in text-foreground">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
                        <RiHammerLine className="h-6 w-6 text-primary" />
                        Legal Case Management
                    </h1>
                    <p className="text-muted-foreground">
                        Track ongoing litigation, NPA recovery suits, and arbitration proceedings.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <RiFilter3Line className="h-4 w-4" />
                        Filter Status
                    </Button>
                    <AddCaseDialog loans={allLoans} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Active Cases</CardTitle>
                            <CardDescription>
                                {cases.length} cases currently pending within the legal system.
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <RiSearchLine className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search case number..." className="pl-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Case Details</TableHead>
                                <TableHead>Borrower</TableHead>
                                <TableHead>Court / Forum</TableHead>
                                <TableHead>Legal Representative</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Next Hearing</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No active legal cases found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cases.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <div className="font-medium">{c.caseNumber}</div>
                                            <div className="text-xs text-muted-foreground">Loan: {c.loanNumber}</div>
                                        </TableCell>
                                        <TableCell>{c.customerName || "Unknown"}</TableCell>
                                        <TableCell>{c.courtName}</TableCell>
                                        <TableCell>{c.lawyerName}</TableCell>
                                        <TableCell>
                                            <Badge variant={c.status === "CLOSED" ? "secondary" : "destructive"}>
                                                {c.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{c.nextHearingDate ? new Date(c.nextHearingDate).toLocaleDateString() : "N/A"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">View</Button>
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
