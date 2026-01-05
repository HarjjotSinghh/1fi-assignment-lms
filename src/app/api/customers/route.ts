import { NextResponse } from "next/server";
import { db, users } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

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
            aadhaarNumber,
            panNumber,
        } = body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !dateOfBirth) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Determine verification status
        const isAadhaarVerified = !!aadhaarNumber;
        const isPanVerified = !!panNumber;

        // Check if customer with email already exists
        const existingCustomer = await db
            .select()
            .from(customers)
            .where(eq(customers.email, email))
            .limit(1);

        if (existingCustomer.length > 0) {
            const currentCustomer = existingCustomer[0];

            // Check for Aadhaar conflict if changing
            if (aadhaarNumber && String(aadhaarNumber) !== currentCustomer.aadhaarNumber) {
                const conflict = await db
                    .select()
                    .from(customers)
                    .where(eq(customers.aadhaarNumber, String(aadhaarNumber)))
                    .limit(1);
                
                if (conflict.length > 0) {
                    return NextResponse.json(
                        { error: "Aadhaar number already registered with another account" },
                        { status: 400 }
                    );
                }
            }

            // Check for PAN conflict if changing
            if (panNumber && String(panNumber) !== currentCustomer.panNumber) {
                const conflict = await db
                    .select()
                    .from(customers)
                    .where(eq(customers.panNumber, String(panNumber)))
                    .limit(1);
                
                if (conflict.length > 0) {
                    return NextResponse.json(
                        { error: "PAN number already registered with another account" },
                        { status: 400 }
                    );
                }
            }

            // Prepare update payload
            const updatePayload: any = {
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
            };

            // Only update Aadhaar/PAN if provided
            if (aadhaarNumber) {
                updatePayload.aadhaarNumber = String(aadhaarNumber);
                updatePayload.aadhaarVerified = true;
            }
            if (panNumber) {
                updatePayload.panNumber = String(panNumber);
                updatePayload.panVerified = true;
            }

            // Update existing customer
            const updated = await db
                .update(customers)
                .set(updatePayload)
                .where(eq(customers.email, email))
                .returning();

            return NextResponse.json({
                success: true,
                customer: updated[0],
                message: "Customer profile updated",
            });
        }

        // Check for duplicate Aadhaar/PAN before creation
        if (aadhaarNumber) {
            const existingAadhaar = await db
                .select()
                .from(customers)
                .where(eq(customers.aadhaarNumber, String(aadhaarNumber)))
                .limit(1);

            if (existingAadhaar.length > 0) {
                return NextResponse.json(
                    { error: "Aadhaar number already registered with another account" },
                    { status: 400 }
                );
            }
        }

        if (panNumber) {
            const existingPan = await db
                .select()
                .from(customers)
                .where(eq(customers.panNumber, String(panNumber)))
                .limit(1);

            if (existingPan.length > 0) {
                return NextResponse.json(
                    { error: "PAN number already registered with another account" },
                    { status: 400 }
                );
            }
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
                aadhaarNumber: aadhaarNumber ? String(aadhaarNumber) : null,
                panNumber: panNumber ? String(panNumber) : null,
                aadhaarVerified: isAadhaarVerified,
                panVerified: isPanVerified,
            })
            .returning();

        // Update user's onboarding status if logged in
        const session = await auth();
        if (session?.user?.id) {
            await db.update(users)
                .set({
                    onboardingCompleted: true,
                    onboardingCompletedAt: new Date().toISOString(),
                })
                .where(eq(users.id, session.user.id));
        }

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
