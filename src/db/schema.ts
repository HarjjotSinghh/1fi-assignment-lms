import { sql } from "drizzle-orm";
import {
    integer,
    sqliteTable,
    text,
    real,
} from "drizzle-orm/sqlite-core";

// ============================================
// AUTHENTICATION TABLES (NextAuth.js)
// ============================================

export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    emailVerified: text("email_verified"),
    name: text("name"),
    password: text("password"), // Hashed password for credentials auth
    image: text("image"),
    role: text("role").notNull().default("USER"), // ADMIN, USER, MANAGER
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const accounts = sqliteTable("accounts", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionToken: text("session_token").notNull().unique(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expires: text("expires").notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: text("expires").notNull(),
});

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

export const customers = sqliteTable("customers", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Basic Info
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull(),
    dateOfBirth: text("date_of_birth").notNull(),

    // KYC Information - Aadhaar
    aadhaarNumber: text("aadhaar_number").unique(),
    aadhaarVerified: integer("aadhaar_verified", { mode: "boolean" }).default(false),
    aadhaarVerifiedAt: text("aadhaar_verified_at"),

    // KYC Information - PAN
    panNumber: text("pan_number").unique(),
    panVerified: integer("pan_verified", { mode: "boolean" }).default(false),
    panVerifiedAt: text("pan_verified_at"),

    // KYC Status
    kycStatus: text("kyc_status").notNull().default("PENDING"), // PENDING, IN_PROGRESS, VERIFIED, REJECTED
    kycRejectionReason: text("kyc_rejection_reason"),

    // Address
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),

    // Employment
    employmentType: text("employment_type"), // SALARIED, SELF_EMPLOYED, BUSINESS
    monthlyIncome: real("monthly_income"),
    companyName: text("company_name"),

    // Bank Details
    bankAccountNumber: text("bank_account_number"),
    bankIfscCode: text("bank_ifsc_code"),
    bankName: text("bank_name"),

    // Risk Profile
    riskScore: integer("risk_score"),
    creditScore: integer("credit_score"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    createdById: text("created_by_id").references(() => users.id),
});

// ============================================
// API KEY MANAGEMENT (For External Fintechs)
// ============================================

export const apiKeys = sqliteTable("api_keys", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    lastUsedAt: text("last_used_at"),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    userId: text("user_id").notNull().references(() => users.id),
});

// ============================================
// LOAN PRODUCTS
// ============================================

export const loanProducts = sqliteTable("loan_products", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description").notNull(),

    // Loan Terms
    minAmount: real("min_amount").notNull(),
    maxAmount: real("max_amount").notNull(),
    minTenureMonths: integer("min_tenure_months").notNull(),
    maxTenureMonths: integer("max_tenure_months").notNull(),
    interestRatePercent: real("interest_rate_percent").notNull(),
    processingFeePercent: real("processing_fee_percent").default(1.0),

    // LTV (Loan-to-Value) Settings for LAMF
    maxLtvPercent: real("max_ltv_percent").default(50.0), // Max loan as % of collateral value
    marginCallThreshold: real("margin_call_threshold").default(60.0), // Alert when LTV exceeds this
    liquidationThreshold: real("liquidation_threshold").default(70.0), // Auto-liquidate at this LTV

    // Eligibility
    minCreditScore: integer("min_credit_score"),
    minMonthlyIncome: real("min_monthly_income"),

    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// ============================================
// LOAN APPLICATIONS
// ============================================

export const loanApplications = sqliteTable("loan_applications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    applicationNumber: text("application_number").notNull().unique().$defaultFn(() => `APP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`),

    // Loan Details
    requestedAmount: real("requested_amount").notNull(),
    approvedAmount: real("approved_amount"),
    tenure: integer("tenure").notNull(), // in months

    // Status Tracking
    status: text("status").notNull().default("DRAFT"), // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, DISBURSED, CANCELLED
    statusReason: text("status_reason"),

    // Processing
    submittedAt: text("submitted_at"),
    reviewedAt: text("reviewed_at"),
    approvedAt: text("approved_at"),
    rejectedAt: text("rejected_at"),
    disbursedAt: text("disbursed_at"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Source Tracking
    source: text("source").notNull().default("MANUAL"), // MANUAL, API, PARTNER
    externalReference: text("external_reference"), // Reference from partner/fintech

    // Relations
    customerId: text("customer_id").notNull().references(() => customers.id),
    productId: text("product_id").notNull().references(() => loanProducts.id),
});

export const applicationStatusHistory = sqliteTable("application_status_history", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    status: text("status").notNull(),
    comment: text("comment"),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    applicationId: text("application_id").notNull().references(() => loanApplications.id),
});

// ============================================
// ACTIVE LOANS
// ============================================

export const loans = sqliteTable("loans", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    loanNumber: text("loan_number").notNull().unique().$defaultFn(() => `LOAN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`),

    // Principal & Interest
    principalAmount: real("principal_amount").notNull(),
    interestRate: real("interest_rate").notNull(),
    tenure: integer("tenure").notNull(), // in months
    emiAmount: real("emi_amount").notNull(),

    // Outstanding
    outstandingPrincipal: real("outstanding_principal").notNull(),
    outstandingInterest: real("outstanding_interest").notNull(),
    totalOutstanding: real("total_outstanding").notNull(),

    // Disbursement
    disbursedAmount: real("disbursed_amount").notNull(),
    disbursedAt: text("disbursed_at").notNull(),

    // Maturity
    maturityDate: text("maturity_date").notNull(),

    // Status
    status: text("status").notNull().default("ACTIVE"), // ACTIVE, CLOSED, DEFAULT, NPA, WRITTEN_OFF

    // Current LTV
    currentLtv: real("current_ltv").default(0),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    customerId: text("customer_id").notNull().references(() => customers.id),
    productId: text("product_id").notNull().references(() => loanProducts.id),
    applicationId: text("application_id").notNull().unique().references(() => loanApplications.id),
});

export const emiSchedule = sqliteTable("emi_schedule", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    installmentNo: integer("installment_no").notNull(),
    dueDate: text("due_date").notNull(),
    emiAmount: real("emi_amount").notNull(),
    principalAmount: real("principal_amount").notNull(),
    interestAmount: real("interest_amount").notNull(),

    // Payment Status
    status: text("status").notNull().default("PENDING"), // PENDING, PAID, OVERDUE, PARTIALLY_PAID
    paidAmount: real("paid_amount").default(0),
    paidAt: text("paid_at"),

    // Relations
    loanId: text("loan_id").notNull().references(() => loans.id),
});

export const payments = sqliteTable("payments", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    amount: real("amount").notNull(),
    paymentDate: text("payment_date").notNull(),
    paymentMode: text("payment_mode").notNull(), // UPI, NEFT, NACH, CASH
    transactionRef: text("transaction_ref"),

    // Status
    status: text("status").notNull().default("SUCCESS"), // SUCCESS, FAILED, PENDING

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    loanId: text("loan_id").notNull().references(() => loans.id),
});

// ============================================
// COLLATERAL MANAGEMENT (Mutual Funds)
// ============================================

export const collaterals = sqliteTable("collaterals", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Mutual Fund Details
    fundName: text("fund_name").notNull(),
    amcName: text("amc_name").notNull(), // Asset Management Company
    folioNumber: text("folio_number").notNull(),
    schemeCode: text("scheme_code"),
    schemeName: text("scheme_name").notNull(),
    schemeType: text("scheme_type").notNull(), // EQUITY, DEBT, HYBRID, LIQUID

    // Units & Valuation
    units: real("units").notNull(),
    purchaseNav: real("purchase_nav").notNull(),
    currentNav: real("current_nav").notNull(),
    purchaseValue: real("purchase_value").notNull(), // units * purchaseNav
    currentValue: real("current_value").notNull(), // units * currentNav

    // Pledge Status
    pledgeStatus: text("pledge_status").notNull().default("PENDING"), // PENDING, PLEDGED, RELEASED, LIQUIDATED
    pledgedAt: text("pledged_at"),
    releasedAt: text("released_at"),

    // Lien Details
    lienMarkedAt: text("lien_marked_at"),
    lienReferenceNumber: text("lien_reference_number"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    lastValuationAt: text("last_valuation_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    customerId: text("customer_id").notNull().references(() => customers.id),
    applicationId: text("application_id").references(() => loanApplications.id),
    loanId: text("loan_id").references(() => loans.id),
});

// ============================================
// DOCUMENTS
// ============================================

export const documents = sqliteTable("documents", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    type: text("type").notNull(), // AADHAAR, PAN, BANK_STATEMENT, SALARY_SLIP, ITR, OTHER
    url: text("url").notNull(),
    verified: integer("verified", { mode: "boolean" }).default(false),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    customerId: text("customer_id").references(() => customers.id),
    applicationId: text("application_id").references(() => loanApplications.id),
});

// Type exports for insert/select operations
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type LoanProduct = typeof loanProducts.$inferSelect;
export type NewLoanProduct = typeof loanProducts.$inferInsert;
export type LoanApplication = typeof loanApplications.$inferSelect;
export type NewLoanApplication = typeof loanApplications.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type Collateral = typeof collaterals.$inferSelect;
export type NewCollateral = typeof collaterals.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
