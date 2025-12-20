import { sqliteTable, AnySQLiteColumn, uniqueIndex, foreignKey, text, integer, real } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const apiKeys = sqliteTable("api_keys", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	name: text().notNull(),
	description: text(),
	isActive: integer("is_active").default(1),
	lastUsedAt: text("last_used_at"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	userId: text("user_id").notNull().references(() => users.id),
},
	(table) => [
		uniqueIndex("api_keys_key_unique").on(table.key),
	]);

export const applicationStatusHistory = sqliteTable("application_status_history", {
	id: text().primaryKey().notNull(),
	status: text().notNull(),
	comment: text(),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	applicationId: text("application_id").notNull().references(() => loanApplications.id),
});

export const collaterals = sqliteTable("collaterals", {
	id: text().primaryKey().notNull(),
	fundName: text("fund_name").notNull(),
	amcName: text("amc_name").notNull(),
	folioNumber: text("folio_number").notNull(),
	schemeCode: text("scheme_code"),
	schemeName: text("scheme_name").notNull(),
	schemeType: text("scheme_type").notNull(),
	units: real().notNull(),
	purchaseNav: real("purchase_nav").notNull(),
	currentNav: real("current_nav").notNull(),
	purchaseValue: real("purchase_value").notNull(),
	currentValue: real("current_value").notNull(),
	pledgeStatus: text("pledge_status").default("PENDING").notNull(),
	pledgedAt: text("pledged_at"),
	releasedAt: text("released_at"),
	lienMarkedAt: text("lien_marked_at"),
	lienReferenceNumber: text("lien_reference_number"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	lastValuationAt: text("last_valuation_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	customerId: text("customer_id").notNull().references(() => customers.id),
	applicationId: text("application_id").references(() => loanApplications.id),
	loanId: text("loan_id").references(() => loans.id),
});

export const customers = sqliteTable("customers", {
	id: text().primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	dateOfBirth: text("date_of_birth").notNull(),
	aadhaarNumber: text("aadhaar_number"),
	aadhaarVerified: integer("aadhaar_verified").default(0),
	aadhaarVerifiedAt: text("aadhaar_verified_at"),
	panNumber: text("pan_number"),
	panVerified: integer("pan_verified").default(0),
	panVerifiedAt: text("pan_verified_at"),
	kycStatus: text("kyc_status").default("PENDING").notNull(),
	kycRejectionReason: text("kyc_rejection_reason"),
	addressLine1: text("address_line_1"),
	addressLine2: text("address_line_2"),
	city: text(),
	state: text(),
	pincode: text(),
	employmentType: text("employment_type"),
	monthlyIncome: real("monthly_income"),
	companyName: text("company_name"),
	bankAccountNumber: text("bank_account_number"),
	bankIfscCode: text("bank_ifsc_code"),
	bankName: text("bank_name"),
	riskScore: integer("risk_score"),
	creditScore: integer("credit_score"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	createdById: text("created_by_id").references(() => users.id),
},
	(table) => [
		uniqueIndex("customers_pan_number_unique").on(table.panNumber),
		uniqueIndex("customers_aadhaar_number_unique").on(table.aadhaarNumber),
		uniqueIndex("customers_email_unique").on(table.email),
	]);

export const documents = sqliteTable("documents", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	url: text().notNull(),
	verified: integer().default(0),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	customerId: text("customer_id").references(() => customers.id),
	applicationId: text("application_id").references(() => loanApplications.id),
});

export const emiSchedule = sqliteTable("emi_schedule", {
	id: text().primaryKey().notNull(),
	installmentNo: integer("installment_no").notNull(),
	dueDate: text("due_date").notNull(),
	emiAmount: real("emi_amount").notNull(),
	principalAmount: real("principal_amount").notNull(),
	interestAmount: real("interest_amount").notNull(),
	status: text().default("PENDING").notNull(),
	paidAmount: real("paid_amount"),
	paidAt: text("paid_at"),
	loanId: text("loan_id").notNull().references(() => loans.id),
});

export const loanApplications = sqliteTable("loan_applications", {
	id: text().primaryKey().notNull(),
	applicationNumber: text("application_number").notNull(),
	requestedAmount: real("requested_amount").notNull(),
	approvedAmount: real("approved_amount"),
	tenure: integer().notNull(),
	status: text().default("DRAFT").notNull(),
	statusReason: text("status_reason"),
	submittedAt: text("submitted_at"),
	reviewedAt: text("reviewed_at"),
	approvedAt: text("approved_at"),
	rejectedAt: text("rejected_at"),
	disbursedAt: text("disbursed_at"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	source: text().default("MANUAL").notNull(),
	externalReference: text("external_reference"),
	customerId: text("customer_id").notNull().references(() => customers.id),
	productId: text("product_id").notNull().references(() => loanProducts.id),
},
	(table) => [
		uniqueIndex("loan_applications_application_number_unique").on(table.applicationNumber),
	]);

export const loanProducts = sqliteTable("loan_products", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	minAmount: real("min_amount").notNull(),
	maxAmount: real("max_amount").notNull(),
	minTenureMonths: integer("min_tenure_months").notNull(),
	maxTenureMonths: integer("max_tenure_months").notNull(),
	interestRatePercent: real("interest_rate_percent").notNull(),
	processingFeePercent: real("processing_fee_percent").default(1),
	maxLtvPercent: real("max_ltv_percent").default(50),
	marginCallThreshold: real("margin_call_threshold").default(60),
	liquidationThreshold: real("liquidation_threshold").default(70),
	minCreditScore: integer("min_credit_score"),
	minMonthlyIncome: real("min_monthly_income"),
	isActive: integer("is_active").default(1),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
});

export const loans = sqliteTable("loans", {
	id: text().primaryKey().notNull(),
	loanNumber: text("loan_number").notNull(),
	principalAmount: real("principal_amount").notNull(),
	interestRate: real("interest_rate").notNull(),
	tenure: integer().notNull(),
	emiAmount: real("emi_amount").notNull(),
	outstandingPrincipal: real("outstanding_principal").notNull(),
	outstandingInterest: real("outstanding_interest").notNull(),
	totalOutstanding: real("total_outstanding").notNull(),
	disbursedAmount: real("disbursed_amount").notNull(),
	disbursedAt: text("disbursed_at").notNull(),
	maturityDate: text("maturity_date").notNull(),
	status: text().default("ACTIVE").notNull(),
	currentLtv: real("current_ltv"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	customerId: text("customer_id").notNull().references(() => customers.id),
	productId: text("product_id").notNull().references(() => loanProducts.id),
	applicationId: text("application_id").notNull().references(() => loanApplications.id),
},
	(table) => [
		uniqueIndex("loans_application_id_unique").on(table.applicationId),
		uniqueIndex("loans_loan_number_unique").on(table.loanNumber),
	]);

export const payments = sqliteTable("payments", {
	id: text().primaryKey().notNull(),
	amount: real().notNull(),
	paymentDate: text("payment_date").notNull(),
	paymentMode: text("payment_mode").notNull(),
	transactionRef: text("transaction_ref"),
	status: text().default("SUCCESS").notNull(),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	loanId: text("loan_id").notNull().references(() => loans.id),
});

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	name: text(),
	role: text().default("USER").notNull(),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	emailVerified: text("email_verified"),
	password: text(),
	image: text(),
	onboardingCompleted: integer("onboarding_completed").default(0),
	onboardingCompletedAt: text("onboarding_completed_at"),
},
	(table) => [
		uniqueIndex("users_email_unique").on(table.email),
	]);

export const accounts = sqliteTable("accounts", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
	id: text().primaryKey().notNull(),
	sessionToken: text("session_token").notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	expires: text().notNull(),
},
	(table) => [
		uniqueIndex("sessions_session_token_unique").on(table.sessionToken),
	]);

export const verificationTokens = sqliteTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: text().notNull(),
},
	(table) => [
		uniqueIndex("verification_tokens_token_unique").on(table.token),
	]);

export const approvals = sqliteTable("approvals", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	status: text().default("PENDING").notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	requestedAmount: real("requested_amount"),
	notes: text(),
	reviewComment: text("review_comment"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	expiresAt: text("expires_at"),
	reviewedAt: text("reviewed_at"),
	requestedById: text("requested_by_id").references(() => users.id),
	reviewedById: text("reviewed_by_id").references(() => users.id),
});

export const auditLogs = sqliteTable("audit_logs", {
	id: text().primaryKey().notNull(),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id"),
	description: text().notNull(),
	metadata: text(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	userId: text("user_id").references(() => users.id),
});

export const kycVerifications = sqliteTable("kyc_verifications", {
	id: text().primaryKey().notNull(),
	verificationId: text("verification_id").notNull(),
	referenceId: integer("reference_id"),
	documentsRequested: text("documents_requested").notNull(),
	documentsConsented: text("documents_consented"),
	redirectUrl: text("redirect_url"),
	digilockerUrl: text("digilocker_url"),
	userFlow: text("user_flow").default("signup"),
	status: text().default("PENDING").notNull(),
	userName: text("user_name"),
	userDob: text("user_dob"),
	userGender: text("user_gender"),
	userMobile: text("user_mobile"),
	consentExpiresAt: text("consent_expires_at"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	expiresAt: text("expires_at"),
	completedAt: text("completed_at"),
	customerId: text("customer_id").references(() => customers.id),
	aadhaarNumber: text("aadhaar_number"),
	panNumber: text("pan_number"),
},
	(table) => [
		uniqueIndex("kyc_verifications_verification_id_unique").on(table.verificationId),
	]);

export const notifications = sqliteTable("notifications", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	isRead: integer("is_read").default(0),
	link: text(),
	entityType: text("entity_type"),
	entityId: text("entity_id"),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	readAt: text("read_at"),
	userId: text("user_id").references(() => users.id),
});

