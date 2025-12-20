import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            employmentType,
            monthlyIncome,
            companyName,
            kycStatus = "PENDING",
        } = body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !dateOfBirth) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if customer with email already exists
        const existingCustomer = await db
            .select()
            .from(customers)
            .where(eq(customers.email, email))
            .limit(1);

        if (existingCustomer.length > 0) {
            // Update existing customer
            const updated = await db
                .update(customers)
                .set({
                    firstName,
                    lastName,
                    phone,
                    dateOfBirth,
                    addressLine1: addressLine1 || null,
                    addressLine2: addressLine2 || null,
                    city: city || null,
                    state: state || null,
                    pincode: pincode || null,
                    employmentType: employmentType || null,
                    monthlyIncome: monthlyIncome || null,
                    companyName: companyName || null,
                    kycStatus,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(customers.email, email))
                .returning();

            return NextResponse.json({
                success: true,
                customer: updated[0],
                message: "Customer profile updated",
            });
        }

        // Create new customer
        const newCustomer = await db
            .insert(customers)
            .values({
                firstName,
                lastName,
                email,
                phone,
                dateOfBirth,
                addressLine1: addressLine1 || null,
                addressLine2: addressLine2 || null,
                city: city || null,
                state: state || null,
                pincode: pincode || null,
                employmentType: employmentType || null,
                monthlyIncome: monthlyIncome || null,
                companyName: companyName || null,
                kycStatus,
            })
            .returning();

        return NextResponse.json({
            success: true,
            customer: newCustomer[0],
            message: "Customer profile created",
        });

    } catch (error) {
        console.error("Error creating/updating customer:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process request" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (email) {
            const customer = await db
                .select()
                .from(customers)
                .where(eq(customers.email, email))
                .limit(1);

            if (customer.length === 0) {
                return NextResponse.json(
                    { error: "Customer not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                customer: customer[0],
            });
        }

        // Return all customers
        const allCustomers = await db.select().from(customers);

        return NextResponse.json({
            success: true,
            customers: allCustomers,
        });

    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch customers" },
            { status: 500 }
        );
    }
}
