import { db } from "@/db";
import { documents, loans, customers, loanProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    RiArrowLeftLine,
    RiFileListLine,
    RiDownloadLine,
    RiEyeLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { DocumentUpload } from "@/components/documents/document-upload";

async function getLoanDetails(id: string) {
    try {
        const [loan] = await db
            .select({
                id: loans.id,
                loanNumber: loans.loanNumber,
                principalAmount: loans.principalAmount,
                status: loans.status,
                customerId: loans.customerId,
                customerFirstName: customers.firstName,
                customerLastName: customers.lastName,
                productName: loanProducts.name,
            })
            .from(loans)
            .leftJoin(customers, eq(loans.customerId, customers.id))
            .leftJoin(loanProducts, eq(loans.productId, loanProducts.id))
            .where(eq(loans.id, id));

        return loan;
    } catch {
        return null;
    }
}

async function getLoanDocuments(loanId: string) {
    try {
        return await db
            .select()
            .from(documents)
            .where(eq(documents.loanId, loanId));
    } catch {
        return [];
    }
}

type LoanDocumentsPageProps = {
    params: Promise<{ id: string }>;
};

export default async function LoanDocumentsPage({ params }: LoanDocumentsPageProps) {
    const { id } = await params;
    const loan = await getLoanDetails(id);

    if (!loan) {
        notFound();
    }

    const loanDocuments = await getLoanDocuments(id);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/loans/${id}`}>
                        <Button variant="ghost" size="icon" className="rounded-none">
                            <RiArrowLeftLine className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-none bg-primary/10">
                                <RiFileListLine className="h-5 w-5 text-primary" />
                            </div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight">
                                Loan Documents
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {loan.loanNumber} • {loan.customerFirstName} {loan.customerLastName}
                        </p>
                    </div>
                </div>
            </section>

            {/* Loan Summary Card */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-xs text-muted-foreground">Loan Number</p>
                                <p className="font-mono font-medium">{loan.loanNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Product</p>
                                <p className="font-medium">{loan.productName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Principal</p>
                                <p className="font-mono font-medium">{formatCurrency(loan.principalAmount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Customer</p>
                                <p className="font-medium">{loan.customerFirstName} {loan.customerLastName}</p>
                            </div>
                        </div>
                        <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Document Upload Component */}
            <DocumentUpload
                entityId={loan.id}
                entityType="LOAN"
                customerId={loan.customerId}
                existingDocuments={loanDocuments}
            />

            {/* Document Types Info */}
            <Card className="border-info/20 bg-info/5">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <RiFileListLine className="h-5 w-5 text-info shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-foreground mb-2">Supported Document Types</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-muted-foreground">
                                <span>• Aadhaar Card</span>
                                <span>• PAN Card</span>
                                <span>• Bank Statements</span>
                                <span>• Salary Slips</span>
                                <span>• ITR Documents</span>
                                <span>• Property Documents</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
