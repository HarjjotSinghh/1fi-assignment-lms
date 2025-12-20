import { relations } from "drizzle-orm/relations";
import { users, apiKeys, loanApplications, applicationStatusHistory, loans, collaterals, customers, documents, emiSchedule, loanProducts, payments, accounts, sessions, approvals, auditLogs, kycVerifications, notifications } from "./schema";

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	apiKeys: many(apiKeys),
	customers: many(customers),
	accounts: many(accounts),
	sessions: many(sessions),
	approvals_reviewedById: many(approvals, {
		relationName: "approvals_reviewedById_users_id"
	}),
	approvals_requestedById: many(approvals, {
		relationName: "approvals_requestedById_users_id"
	}),
	auditLogs: many(auditLogs),
	notifications: many(notifications),
}));

export const applicationStatusHistoryRelations = relations(applicationStatusHistory, ({ one }) => ({
	loanApplication: one(loanApplications, {
		fields: [applicationStatusHistory.applicationId],
		references: [loanApplications.id]
	}),
}));

export const loanApplicationsRelations = relations(loanApplications, ({ one, many }) => ({
	applicationStatusHistories: many(applicationStatusHistory),
	collaterals: many(collaterals),
	documents: many(documents),
	loanProduct: one(loanProducts, {
		fields: [loanApplications.productId],
		references: [loanProducts.id]
	}),
	customer: one(customers, {
		fields: [loanApplications.customerId],
		references: [customers.id]
	}),
	loans: many(loans),
}));

export const collateralsRelations = relations(collaterals, ({ one }) => ({
	loan: one(loans, {
		fields: [collaterals.loanId],
		references: [loans.id]
	}),
	loanApplication: one(loanApplications, {
		fields: [collaterals.applicationId],
		references: [loanApplications.id]
	}),
	customer: one(customers, {
		fields: [collaterals.customerId],
		references: [customers.id]
	}),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
	collaterals: many(collaterals),
	emiSchedules: many(emiSchedule),
	loanApplication: one(loanApplications, {
		fields: [loans.applicationId],
		references: [loanApplications.id]
	}),
	loanProduct: one(loanProducts, {
		fields: [loans.productId],
		references: [loanProducts.id]
	}),
	customer: one(customers, {
		fields: [loans.customerId],
		references: [customers.id]
	}),
	payments: many(payments),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
	collaterals: many(collaterals),
	user: one(users, {
		fields: [customers.createdById],
		references: [users.id]
	}),
	documents: many(documents),
	loanApplications: many(loanApplications),
	loans: many(loans),
	kycVerifications: many(kycVerifications),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
	loanApplication: one(loanApplications, {
		fields: [documents.applicationId],
		references: [loanApplications.id]
	}),
	customer: one(customers, {
		fields: [documents.customerId],
		references: [customers.id]
	}),
}));

export const emiScheduleRelations = relations(emiSchedule, ({ one }) => ({
	loan: one(loans, {
		fields: [emiSchedule.loanId],
		references: [loans.id]
	}),
}));

export const loanProductsRelations = relations(loanProducts, ({ many }) => ({
	loanApplications: many(loanApplications),
	loans: many(loans),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
	loan: one(loans, {
		fields: [payments.loanId],
		references: [loans.id]
	}),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
	user_reviewedById: one(users, {
		fields: [approvals.reviewedById],
		references: [users.id],
		relationName: "approvals_reviewedById_users_id"
	}),
	user_requestedById: one(users, {
		fields: [approvals.requestedById],
		references: [users.id],
		relationName: "approvals_requestedById_users_id"
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const kycVerificationsRelations = relations(kycVerifications, ({ one }) => ({
	customer: one(customers, {
		fields: [kycVerifications.customerId],
		references: [customers.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));