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
    onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).default(false),
    onboardingCompletedAt: text("onboarding_completed_at"),
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
    loanId: text("loan_id").references(() => loans.id),
});

// ============================================
// KYC VERIFICATIONS (DigiLocker)
// ============================================

export const kycVerifications = sqliteTable("kyc_verifications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Verification identifiers
    verificationId: text("verification_id").notNull().unique(), // Our unique ID sent to Cashfree
    referenceId: integer("reference_id"), // Cashfree's reference ID

    // Request details
    documentsRequested: text("documents_requested").notNull(), // JSON array: ["AADHAAR", "PAN"]
    documentsConsented: text("documents_consented"), // JSON array of consented docs
    redirectUrl: text("redirect_url"),
    digilockerUrl: text("digilocker_url"),
    userFlow: text("user_flow").default("signup"), // signin or signup

    // Status tracking
    status: text("status").notNull().default("PENDING"), // PENDING, AUTHENTICATED, EXPIRED, CONSENT_DENIED

    // User details returned from DigiLocker
    userName: text("user_name"),
    userDob: text("user_dob"),
    userGender: text("user_gender"),
    userMobile: text("user_mobile"),

    // Document details
    aadhaarNumber: text("aadhaar_number"),
    panNumber: text("pan_number"),

    // Consent validity
    consentExpiresAt: text("consent_expires_at"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    expiresAt: text("expires_at"), // URL expires 10 mins after creation
    completedAt: text("completed_at"),

    // Relations
    customerId: text("customer_id").references(() => customers.id),
});

// ============================================
// AUDIT LOGS (Compliance Trail)
// ============================================

export const auditLogs = sqliteTable("audit_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Action details
    action: text("action").notNull(), // CREATE, UPDATE, DELETE, APPROVE, REJECT, DISBURSE, EXPORT
    entityType: text("entity_type").notNull(), // LOAN, APPLICATION, CUSTOMER, COLLATERAL, PRODUCT
    entityId: text("entity_id"),

    // Description and metadata
    description: text("description").notNull(),
    metadata: text("metadata"), // JSON stringified additional data

    // IP and user agent for security
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    userId: text("user_id").references(() => users.id),
});

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = sqliteTable("notifications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Notification content
    type: text("type").notNull(), // ALERT, INFO, SUCCESS, WARNING, ERROR
    title: text("title").notNull(),
    message: text("message").notNull(),

    // Status
    isRead: integer("is_read", { mode: "boolean" }).default(false),

    // Optional link to navigate to
    link: text("link"),

    // Related entity
    entityType: text("entity_type"), // LOAN, APPLICATION, CUSTOMER, etc.
    entityId: text("entity_id"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    readAt: text("read_at"),

    // Relations
    userId: text("user_id").references(() => users.id),
});

// ============================================
// APPROVALS WORKFLOW
// ============================================

export const approvals = sqliteTable("approvals", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Approval type
    type: text("type").notNull(), // LOAN_APPROVAL, DISBURSEMENT, KYC_OVERRIDE, COLLATERAL_RELEASE

    // Status
    status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED, EXPIRED

    // Related entity
    entityType: text("entity_type").notNull(), // APPLICATION, LOAN, CUSTOMER
    entityId: text("entity_id").notNull(),

    // Request details
    requestedAmount: real("requested_amount"), // For loan approvals
    notes: text("notes"), // Requester's notes

    // Review details
    reviewComment: text("review_comment"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    expiresAt: text("expires_at"), // Optional expiry for time-sensitive approvals
    reviewedAt: text("reviewed_at"),

    // Relations
    requestedById: text("requested_by_id").references(() => users.id),
    reviewedById: text("reviewed_by_id").references(() => users.id),
});

// ============================================
// PARTNERS (B2B)
// ============================================

export const partners = sqliteTable("partners", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    code: text("code").notNull().unique(), // Partner short code
    type: text("type").notNull().default("FINTECH"), // FINTECH, BANK, NBFC, MERCHANT

    // Contact
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),

    // API Access
    apiKeyId: text("api_key_id").references(() => apiKeys.id),
    webhookUrl: text("webhook_url"),

    // Revenue Sharing
    revenueSharePercent: real("revenue_share_percent").default(0),

    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

// ============================================
// COMMUNICATION LOGS
// ============================================

export const communicationLogs = sqliteTable("communication_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Type and channel
    channel: text("channel").notNull(), // EMAIL, SMS, WHATSAPP, CALL, PUSH
    direction: text("direction").notNull().default("OUTBOUND"), // INBOUND, OUTBOUND

    // Content
    subject: text("subject"),
    content: text("content").notNull(),
    templateId: text("template_id"),

    // Status
    status: text("status").notNull().default("SENT"), // PENDING, SENT, DELIVERED, FAILED, READ

    // Metadata
    metadata: text("metadata"), // JSON stringified

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    deliveredAt: text("delivered_at"),
    readAt: text("read_at"),

    // Relations
    customerId: text("customer_id").references(() => customers.id),
    loanId: text("loan_id").references(() => loans.id),
    userId: text("user_id").references(() => users.id), // Who sent it
});

// ============================================
// MARGIN CALLS
// ============================================

export const marginCalls = sqliteTable("margin_calls", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    callNumber: text("call_number").notNull().unique().$defaultFn(() => `MC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`),

    // Trigger details
    triggerLtv: real("trigger_ltv").notNull(),
    currentLtv: real("current_ltv").notNull(),
    shortfallAmount: real("shortfall_amount").notNull(),

    // Status
    status: text("status").notNull().default("PENDING"), // PENDING, NOTIFIED, TOPPED_UP, LIQUIDATED, RESOLVED

    // Resolution
    topUpAmount: real("top_up_amount"),
    topUpDate: text("top_up_date"),
    liquidationAmount: real("liquidation_amount"),
    liquidationDate: text("liquidation_date"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    notifiedAt: text("notified_at"),
    dueDate: text("due_date").notNull(),
    resolvedAt: text("resolved_at"),

    // Relations
    loanId: text("loan_id").notNull().references(() => loans.id),
    customerId: text("customer_id").notNull().references(() => customers.id),
    collateralId: text("collateral_id").references(() => collaterals.id),
});

// ============================================
// LEGAL CASES (NPA)
// ============================================

export const legalCases = sqliteTable("legal_cases", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    caseNumber: text("case_number").notNull().unique(),

    // Case details
    caseType: text("case_type").notNull(), // ARBITRATION, CIVIL_SUIT, DRT, SARFAESI
    courtName: text("court_name"),

    // Status
    status: text("status").notNull().default("FILED"), // FILED, HEARING, JUDGEMENT, EXECUTION, CLOSED

    // Dates
    filingDate: text("filing_date").notNull(),
    nextHearingDate: text("next_hearing_date"),
    judgementDate: text("judgement_date"),

    // Amounts
    claimAmount: real("claim_amount").notNull(),
    recoveredAmount: real("recovered_amount").default(0),

    // Notes
    notes: text("notes"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    loanId: text("loan_id").notNull().references(() => loans.id),
    customerId: text("customer_id").notNull().references(() => customers.id),
    assignedToId: text("assigned_to_id").references(() => users.id),
});

// ============================================
// RECOVERY AGENTS
// ============================================

export const recoveryAgents = sqliteTable("recovery_agents", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Agent details
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    agencyName: text("agency_name"),

    // Contact
    phone: text("phone").notNull(),
    email: text("email"),

    // Performance
    totalAssigned: integer("total_assigned").default(0),
    totalRecovered: real("total_recovered").default(0),
    successRate: real("success_rate").default(0),

    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const recoveryAssignments = sqliteTable("recovery_assignments", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Status
    status: text("status").notNull().default("ASSIGNED"), // ASSIGNED, IN_PROGRESS, RECOVERED, FAILED, REASSIGNED

    // Amounts
    assignedAmount: real("assigned_amount").notNull(),
    recoveredAmount: real("recovered_amount").default(0),

    // Notes
    notes: text("notes"),

    // Timestamps
    assignedAt: text("assigned_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    lastContactAt: text("last_contact_at"),
    closedAt: text("closed_at"),

    // Relations
    agentId: text("agent_id").notNull().references(() => recoveryAgents.id),
    loanId: text("loan_id").notNull().references(() => loans.id),
    legalCaseId: text("legal_case_id").references(() => legalCases.id),
});

// ============================================
// AUTO-APPROVAL RULES
// ============================================

export const autoApprovalRules = sqliteTable("auto_approval_rules", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Rule details
    name: text("name").notNull(),
    description: text("description"),
    priority: integer("priority").default(0),

    // Conditions (JSON)
    conditions: text("conditions").notNull(), // JSON: { minCreditScore, maxLtv, minIncome, etc. }

    // Actions
    autoApprove: integer("auto_approve", { mode: "boolean" }).default(false),
    autoReject: integer("auto_reject", { mode: "boolean" }).default(false),
    assignToRole: text("assign_to_role"), // UNDERWRITER, MANAGER, etc.

    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    productId: text("product_id").references(() => loanProducts.id), // null = all products
    createdById: text("created_by_id").references(() => users.id),
});

// ============================================
// SYSTEM SETTINGS
// ============================================

export const systemSettings = sqliteTable("system_settings", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Setting key-value
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    type: text("type").notNull().default("STRING"), // STRING, NUMBER, BOOLEAN, JSON

    // Metadata
    description: text("description"),
    category: text("category").notNull().default("GENERAL"), // GENERAL, INTEGRATION, RISK, NOTIFICATION

    // Timestamps
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedById: text("updated_by_id").references(() => users.id),
});

// ============================================
// REPORT TEMPLATES
// ============================================

export const reportTemplates = sqliteTable("report_templates", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Template details
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull(), // REGULATORY, OPERATIONAL, ANALYTICS, CUSTOM
    format: text("format").notNull().default("PDF"), // PDF, EXCEL, CSV

    // Template configuration (JSON)
    config: text("config").notNull(), // JSON: columns, filters, grouping, etc.

    // Schedule
    isScheduled: integer("is_scheduled", { mode: "boolean" }).default(false),
    scheduleFrequency: text("schedule_frequency"), // DAILY, WEEKLY, MONTHLY

    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    lastRunAt: text("last_run_at"),

    // Relations
    createdById: text("created_by_id").references(() => users.id),
});

// ============================================
// PARTNER APPLICATIONS (Bulk uploads)
// ============================================

export const partnerApplications = sqliteTable("partner_applications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Batch details
    batchId: text("batch_id").notNull(),
    fileName: text("file_name"),

    // Status
    status: text("status").notNull().default("PENDING"), // PENDING, PROCESSING, COMPLETED, FAILED

    // Counts
    totalRecords: integer("total_records").default(0),
    successCount: integer("success_count").default(0),
    failedCount: integer("failed_count").default(0),

    // Errors (JSON)
    errors: text("errors"),

    // Timestamps
    uploadedAt: text("uploaded_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    processedAt: text("processed_at"),

    // Relations
    partnerId: text("partner_id").notNull().references(() => partners.id),
    uploadedById: text("uploaded_by_id").references(() => users.id),
});

// ============================================
// PROVISIONING STAGES (IND AS)
// ============================================

export const provisioningStages = sqliteTable("provisioning_stages", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Stage as per IND AS 109
    stage: integer("stage").notNull(), // 1, 2, or 3

    // Provision amounts
    exposureAmount: real("exposure_amount").notNull(),
    provisionPercent: real("provision_percent").notNull(),
    provisionAmount: real("provision_amount").notNull(),

    // Days past due
    dpd: integer("dpd").notNull(), // Days Past Due

    // Snapshot date
    snapshotDate: text("snapshot_date").notNull(),

    // Relations
    loanId: text("loan_id").notNull().references(() => loans.id),
});

// ============================================
// CREDIT LINES (User Collateral Tree - Root)
// ============================================

export const creditLines = sqliteTable("credit_lines", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    lineNumber: text("line_number").notNull().unique().$defaultFn(() => `CL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`),

    // Limits
    sanctionedLimit: real("sanctioned_limit").notNull(),
    utilizedAmount: real("utilized_amount").default(0),
    availableLimit: real("available_limit").notNull(),

    // Status
    status: text("status").notNull().default("ACTIVE"), // ACTIVE, FROZEN, CLOSED, DEFAULTED

    // Risk
    riskCategory: text("risk_category").default("STANDARD"), // STANDARD, WATCH, SUBSTANDARD, DOUBTFUL, LOSS

    // Validity
    sanctionDate: text("sanction_date").notNull(),
    expiryDate: text("expiry_date"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations - One credit line per customer
    customerId: text("customer_id").notNull().unique().references(() => customers.id),
});

// ============================================
// CREDIT ACCOUNTS (Credit cards, Overdrafts)
// ============================================

export const creditAccounts = sqliteTable("credit_accounts", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountNumber: text("account_number").notNull().unique(),

    // Type
    accountType: text("account_type").notNull(), // CREDIT_CARD, OVERDRAFT, LINE_OF_CREDIT, REVOLVING

    // Card details (if credit card)
    cardLastFour: text("card_last_four"),
    cardNetwork: text("card_network"), // VISA, MASTERCARD, RUPAY, AMEX
    cardVariant: text("card_variant"), // GOLD, PLATINUM, SIGNATURE, etc.

    // Limits
    creditLimit: real("credit_limit").notNull(),
    currentBalance: real("current_balance").default(0),
    availableCredit: real("available_credit").notNull(),
    minimumDue: real("minimum_due").default(0),

    // Billing
    billingCycleDay: integer("billing_cycle_day").default(1),
    dueDate: text("due_date"),
    statementDate: text("statement_date"),

    // Status
    status: text("status").notNull().default("ACTIVE"), // ACTIVE, BLOCKED, CLOSED, DELINQUENT

    // Interest
    interestRate: real("interest_rate").default(0),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    creditLineId: text("credit_line_id").notNull().references(() => creditLines.id),
});

// ============================================
// CREDIT TRANSACTIONS (Leaf nodes)
// ============================================

export const creditTransactions = sqliteTable("credit_transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    transactionId: text("transaction_id").notNull().unique().$defaultFn(() => `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`),

    // Transaction details
    type: text("type").notNull(), // PURCHASE, CASH_ADVANCE, REFUND, PAYMENT, FEE, INTEREST, REVERSAL
    description: text("description").notNull(),
    merchantName: text("merchant_name"),
    merchantCategory: text("merchant_category"), // MCC code description

    // Amount
    amount: real("amount").notNull(),
    currency: text("currency").default("INR"),

    // Status
    status: text("status").notNull().default("COMPLETED"), // PENDING, COMPLETED, REVERSED, DISPUTED

    // Location
    location: text("location"),
    isInternational: integer("is_international", { mode: "boolean" }).default(false),

    // Timestamps
    transactionDate: text("transaction_date").notNull(),
    postingDate: text("posting_date"),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations
    creditAccountId: text("credit_account_id").notNull().references(() => creditAccounts.id),
});

// ============================================
// WATCHLIST
// ============================================

export const watchlist = sqliteTable("watchlist", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Entity
    entityType: text("entity_type").notNull(), // CUSTOMER, PAN, AADHAAR, PHONE, EMAIL
    entityValue: text("entity_value").notNull(),

    // Reason
    listType: text("list_type").notNull(), // BLACKLIST, WATCHLIST, GREYLIST
    reason: text("reason").notNull(),
    source: text("source"), // INTERNAL, RBI, CIBIL, etc.

    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true),

    // Timestamps
    addedAt: text("added_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    expiresAt: text("expires_at"),
    removedAt: text("removed_at"),

    // Relations
    addedById: text("added_by_id").references(() => users.id),
    customerId: text("customer_id").references(() => customers.id),
});

// ============================================
// WEBHOOKS (Partner Notifications)
// ============================================

export const webhooks = sqliteTable("webhooks", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Webhook details
    name: text("name").notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(), // For HMAC signature verification

    // Event subscriptions (JSON array of event types)
    events: text("events").notNull(), // JSON: ["loan.approved", "loan.disbursed", "margin_call.triggered"]

    // Status
    isActive: integer("is_active", { mode: "boolean" }).default(true),

    // Rate limiting
    maxRetries: integer("max_retries").default(3),
    retryDelayMs: integer("retry_delay_ms").default(5000),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    lastTriggeredAt: text("last_triggered_at"),

    // Relations
    partnerId: text("partner_id").references(() => partners.id),
    createdById: text("created_by_id").references(() => users.id),
});

export const webhookDeliveries = sqliteTable("webhook_deliveries", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    deliveryId: text("delivery_id").notNull().unique().$defaultFn(() => `WH-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`),

    // Event details
    eventType: text("event_type").notNull(), // e.g., "loan.approved", "margin_call.triggered"
    payload: text("payload").notNull(), // JSON stringified event payload

    // Delivery status
    status: text("status").notNull().default("PENDING"), // PENDING, SUCCESS, FAILED, RETRYING
    attempts: integer("attempts").default(0),
    maxAttempts: integer("max_attempts").default(3),

    // Response details
    responseCode: integer("response_code"),
    responseBody: text("response_body"),
    errorMessage: text("error_message"),

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    lastAttemptAt: text("last_attempt_at"),
    completedAt: text("completed_at"),
    nextRetryAt: text("next_retry_at"),

    // Relations
    webhookId: text("webhook_id").notNull().references(() => webhooks.id),
});

// ============================================
// NAV HISTORY (Collateral Value Tracking)
// ============================================

export const navHistory = sqliteTable("nav_history", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Fund identification
    schemeCode: text("scheme_code").notNull(),
    schemeName: text("scheme_name").notNull(),
    amcName: text("amc_name"),

    // NAV data
    nav: real("nav").notNull(),
    previousNav: real("previous_nav"),
    changePercent: real("change_percent"),

    // Valuation date
    valuationDate: text("valuation_date").notNull(),

    // Source of data
    source: text("source").default("MANUAL"), // MANUAL, AMFI, RTA, API

    // Timestamps
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),

    // Relations  
    collateralId: text("collateral_id").references(() => collaterals.id),
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
export type KycVerification = typeof kycVerifications.$inferSelect;
export type NewKycVerification = typeof kycVerifications.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;

// New admin tables
export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type NewCommunicationLog = typeof communicationLogs.$inferInsert;
export type MarginCall = typeof marginCalls.$inferSelect;
export type NewMarginCall = typeof marginCalls.$inferInsert;
export type LegalCase = typeof legalCases.$inferSelect;
export type NewLegalCase = typeof legalCases.$inferInsert;
export type RecoveryAgent = typeof recoveryAgents.$inferSelect;
export type NewRecoveryAgent = typeof recoveryAgents.$inferInsert;
export type RecoveryAssignment = typeof recoveryAssignments.$inferSelect;
export type NewRecoveryAssignment = typeof recoveryAssignments.$inferInsert;
export type AutoApprovalRule = typeof autoApprovalRules.$inferSelect;
export type NewAutoApprovalRule = typeof autoApprovalRules.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type NewReportTemplate = typeof reportTemplates.$inferInsert;
export type PartnerApplication = typeof partnerApplications.$inferSelect;
export type NewPartnerApplication = typeof partnerApplications.$inferInsert;
export type ProvisioningStage = typeof provisioningStages.$inferSelect;
export type NewProvisioningStage = typeof provisioningStages.$inferInsert;
export type CreditLine = typeof creditLines.$inferSelect;
export type NewCreditLine = typeof creditLines.$inferInsert;
export type CreditAccount = typeof creditAccounts.$inferSelect;
export type NewCreditAccount = typeof creditAccounts.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type Watchlist = typeof watchlist.$inferSelect;
export type NewWatchlist = typeof watchlist.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
export type NavHistory = typeof navHistory.$inferSelect;
export type NewNavHistory = typeof navHistory.$inferInsert;
