import { db } from "@/db";
import { loanApplications, customers, apiKeys } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

/**
 * External API for Fintech Partners
 * 
 * This endpoint allows fintech companies to programmatically create loan applications.
 * 
 * Authentication: API Key in X-API-Key header
 * 
 * Request Body:
 * {
 *   "customer": {
 *     "firstName": string,
 *     "lastName": string,
 *     "email": string,
 *     "phone": string,
 *     "dateOfBirth": string (ISO date),
 *     "aadhaarNumber": string (12 digits),
 *     "panNumber": string (ABCDE1234F format)
 *   },
 *   "loan": {
 *     "productId": string (UUID),
 *     "requestedAmount": number,
 *     "tenure": number (months)
 *   },
 *   "externalReference": string (optional - your internal reference)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "applicationId": string,
 *   "applicationNumber": string,
 *   "status": "SUBMITTED",
 *   "message": "Application created successfully"
 * }
 */

export async function POST(request: NextRequest) {
    try {
        // Validate API Key
        const apiKey = request.headers.get("X-API-Key");

        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing API Key",
                    message: "Please provide X-API-Key header"
                },
                { status: 401 }
            );
        }

        // Verify API Key
        const validKey = await db.query.apiKeys.findFirst({
            where: (keys, { eq, and }) => and(eq(keys.key, apiKey), eq(keys.isActive, true)),
        });

        if (!validKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid API Key",
                    message: "The provided API key is invalid or inactive"
                },
                { status: 401 }
            );
        }

        // Update last used
        await db
            .update(apiKeys)
            .set({ lastUsedAt: new Date().toISOString() })
            .where(eq(apiKeys.id, validKey.id));

        // Parse request body
        const body = await request.json();
        const { customer, loan, externalReference } = body;

        // Validate required fields
        if (!customer || !loan) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid Request Body",
                    message: "Both 'customer' and 'loan' objects are required"
                },
                { status: 400 }
            );
        }

        // Validate customer fields
        const requiredCustomerFields = ["firstName", "lastName", "email", "phone", "dateOfBirth", "aadhaarNumber", "panNumber"];
        for (const field of requiredCustomerFields) {
            if (!customer[field]) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Missing Customer Field",
                        message: `customer.${field} is required`
                    },
                    { status: 400 }
                );
            }
        }

        // Validate loan fields
        const requiredLoanFields = ["productId", "requestedAmount", "tenure"];
        for (const field of requiredLoanFields) {
            if (!loan[field]) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Missing Loan Field",
                        message: `loan.${field} is required`
                    },
                    { status: 400 }
                );
            }
        }

        // Check if customer exists
        let customerId: string;
        const existingCustomer = await db.query.customers.findFirst({
            where: (c, { eq }) => eq(c.email, customer.email),
        });

        if (existingCustomer) {
            customerId = existingCustomer.id;
        } else {
            // Create new customer
            const [newCustomer] = await db
                .insert(customers)
                .values({
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone,
                    dateOfBirth: customer.dateOfBirth,
                    aadhaarNumber: customer.aadhaarNumber,
                    aadhaarVerified: false,
                    panNumber: customer.panNumber.toUpperCase(),
                    panVerified: false,
                    kycStatus: "PENDING",
                })
                .returning();
            customerId = newCustomer.id;
        }

        // Create loan application
        const [application] = await db
            .insert(loanApplications)
            .values({
                customerId,
                productId: loan.productId,
                requestedAmount: loan.requestedAmount,
                tenure: loan.tenure,
                status: "SUBMITTED",
                source: "API",
                externalReference: externalReference || null,
                submittedAt: new Date().toISOString(),
            })
            .returning();

        return NextResponse.json(
            {
                success: true,
                applicationId: application.id,
                applicationNumber: application.applicationNumber,
                status: application.status,
                message: "Loan application created successfully",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("External API Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal Server Error",
                message: "An unexpected error occurred"
            },
            { status: 500 }
        );
    }
}

// GET - API Documentation
export async function GET() {
    return NextResponse.json({
        name: "1Fi LMS External API",
        version: "1.0.0",
        description: "API for fintech partners to create loan applications programmatically",
        authentication: {
            type: "API Key",
            header: "X-API-Key",
            description: "Contact 1Fi to obtain an API key for integration",
        },
        endpoints: {
            createApplication: {
                method: "POST",
                path: "/api/external/applications",
                contentType: "application/json",
                requestBody: {
                    customer: {
                        firstName: "string (required)",
                        lastName: "string (required)",
                        email: "string (required)",
                        phone: "string (required, 10 digits)",
                        dateOfBirth: "string (required, ISO date)",
                        aadhaarNumber: "string (required, 12 digits)",
                        panNumber: "string (required, format: ABCDE1234F)",
                    },
                    loan: {
                        productId: "string (required, UUID of loan product)",
                        requestedAmount: "number (required, in INR)",
                        tenure: "number (required, in months)",
                    },
                    externalReference: "string (optional, your internal reference ID)",
                },
                responses: {
                    "201": {
                        success: true,
                        applicationId: "string",
                        applicationNumber: "string",
                        status: "SUBMITTED",
                        message: "string",
                    },
                    "400": {
                        success: false,
                        error: "string",
                        message: "string",
                    },
                    "401": {
                        success: false,
                        error: "string",
                        message: "string",
                    },
                },
            },
        },
        rateLimit: "100 requests per minute per API key",
        contact: "api-support@1fi.io",
    });
}
