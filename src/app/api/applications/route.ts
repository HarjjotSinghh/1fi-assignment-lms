import { db } from "@/db";
import { loanApplications, customers } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

// GET all applications
export async function GET() {
    try {
        const applications = await db.select().from(loanApplications);
        return NextResponse.json(applications);
    } catch (error) {
        console.error("Error fetching applications:", error);
        return NextResponse.json(
            { error: "Failed to fetch applications" },
            { status: 500 }
        );
    }
}

// POST create new application (with customer)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // First create or find the customer
        const existingCustomer = await db.query.customers.findFirst({
            where: (customers, { eq }) => eq(customers.email, body.email),
        });

        let customerId: string;

        if (existingCustomer) {
            customerId = existingCustomer.id;
        } else {
            const [newCustomer] = await db
                .insert(customers)
                .values({
                    firstName: body.firstName,
                    lastName: body.lastName,
                    email: body.email,
                    phone: body.phone,
                    dateOfBirth: body.dateOfBirth,
                    aadhaarNumber: body.aadhaarNumber,
                    aadhaarVerified: true,
                    aadhaarVerifiedAt: new Date().toISOString(),
                    panNumber: body.panNumber.toUpperCase(),
                    panVerified: true,
                    panVerifiedAt: new Date().toISOString(),
                    kycStatus: "VERIFIED",
                    addressLine1: body.addressLine1,
                    addressLine2: body.addressLine2,
                    city: body.city,
                    state: body.state,
                    pincode: body.pincode,
                    employmentType: body.employmentType,
                    monthlyIncome: body.monthlyIncome,
                    companyName: body.companyName,
                    bankAccountNumber: body.bankAccountNumber,
                    bankIfscCode: body.bankIfscCode,
                    bankName: body.bankName,
                })
                .returning();
            customerId = newCustomer.id;
        }

        // Create the loan application
        const [application] = await db
            .insert(loanApplications)
            .values({
                customerId,
                productId: body.productId,
                requestedAmount: body.requestedAmount,
                tenure: body.tenure,
                status: "SUBMITTED",
                source: "MANUAL",
                submittedAt: new Date().toISOString(),
            })
            .returning();

        return NextResponse.json(application, { status: 201 });
    } catch (error) {
        console.error("Error creating application:", error);
        return NextResponse.json(
            { error: "Failed to create application" },
            { status: 500 }
        );
    }
}
