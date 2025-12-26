import "dotenv/config";
import { db } from "./index";
import {
    users,
    customers,
    loanProducts,
    loanApplications,
    loans,
    collaterals,
    payments,
    documents,
    auditLogs,
    notifications,
    approvals,
    emiSchedule,
    partners,
    communicationLogs,
    marginCalls,
    legalCases,
    recoveryAgents,
    recoveryAssignments,
    autoApprovalRules,
    systemSettings,
    reportTemplates,
    creditLines,
    creditAccounts,
    creditTransactions,
    watchlist,
} from "./schema";
import bcrypt from "bcryptjs";

// ============================================
// MOCK DATA GENERATORS
// ============================================

const indianFirstNames = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharva", "Ananya", "Diya", "Priya", "Neha", "Sneha", "Pooja", "Divya", "Kavya",
    "Riya", "Shruti", "Meera", "Nisha", "Tanvi", "Sakshi", "Kritika", "Ridhi", "Simran", "Anjali",
    "Rahul", "Rohit", "Amit", "Raj", "Vikram", "Sanjay", "Deepak", "Suresh", "Mahesh", "Rakesh",
    "Pradeep", "Vijay", "Karan", "Nikhil", "Gaurav", "Manish", "Ashish", "Pankaj", "Naveen", "Varun"
];

const indianLastNames = [
    "Sharma", "Patel", "Singh", "Kumar", "Gupta", "Reddy", "Rao", "Chopra", "Mehta", "Joshi",
    "Shah", "Verma", "Agarwal", "Iyer", "Nair", "Pillai", "Menon", "Bhat", "Kaur", "Gill",
    "Malhotra", "Kapoor", "Khanna", "Bansal", "Arora", "Bhatt", "Desai", "Pandey", "Mishra", "Dubey"
];

const indianCities = [
    { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
    { city: "Delhi", state: "Delhi", pincode: "110001" },
    { city: "Bangalore", state: "Karnataka", pincode: "560001" },
    { city: "Hyderabad", state: "Telangana", pincode: "500001" },
    { city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
    { city: "Kolkata", state: "West Bengal", pincode: "700001" },
    { city: "Pune", state: "Maharashtra", pincode: "411001" },
    { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
    { city: "Jaipur", state: "Rajasthan", pincode: "302001" },
    { city: "Lucknow", state: "Uttar Pradesh", pincode: "226001" },
];

const bankNames = [
    "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
    "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank", "IndusInd Bank"
];

const amcNames = [
    "SBI Mutual Fund", "HDFC Mutual Fund", "ICICI Prudential", "Aditya Birla Sun Life",
    "Nippon India", "Kotak Mahindra", "Axis Mutual Fund", "UTI Mutual Fund", "DSP Mutual Fund", "Tata Mutual Fund"
];

const schemeTypes = ["EQUITY", "DEBT", "HYBRID", "LIQUID"];
const merchantCategories = ["Retail", "Restaurant", "Travel", "Entertainment", "Groceries", "Electronics", "Fashion", "Healthcare", "Utilities", "Fuel"];
const merchantNames = ["Amazon", "Flipkart", "Swiggy", "Zomato", "BigBasket", "DMart", "Reliance Fresh", "Apollo Pharmacy", "BookMyShow", "MakeMyTrip"];

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generatePAN(): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return `${letters[randomInt(0, 25)]}${letters[randomInt(0, 25)]}${letters[randomInt(0, 25)]}P${letters[randomInt(0, 25)]}${randomInt(1000, 9999)}${letters[randomInt(0, 25)]}`;
}

function generateAadhaar(): string {
    return `${randomInt(1000, 9999)} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`;
}

function generatePhone(): string {
    const prefixes = ["98", "99", "97", "96", "95", "94", "93", "91", "90", "87", "88", "89"];
    return `${randomElement(prefixes)}${randomInt(10000000, 99999999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "company.in"];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@${randomElement(domains)}`;
}

function generateDate(startYear: number, endYear: number): string {
    const year = randomInt(startYear, endYear);
    const month = String(randomInt(1, 12)).padStart(2, "0");
    const day = String(randomInt(1, 28)).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function generateDateISO(daysAgo: number = 0, daysRange: number = 30): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo - randomInt(0, daysRange));
    return date.toISOString();
}

function generateAccountNumber(): string {
    return `${randomInt(10000000, 99999999)}${randomInt(1000, 9999)}`;
}

function generateIFSC(): string {
    const bankCodes = ["SBIN", "HDFC", "ICIC", "UTIB", "KKBK", "PUNB", "BARB", "CNRB", "UBIN", "INDB"];
    return `${randomElement(bankCodes)}0${randomInt(100000, 999999)}`;
}

function generateFolioNumber(): string {
    return `${randomInt(10000000, 99999999)}/${randomInt(10, 99)}`;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

export async function seedAdminData() {
    console.log("🌱 Starting admin data seeding...\n");

    try {
        // -----------------------------------------
        // 1. CREATE ADMIN USERS
        // -----------------------------------------
        console.log("👤 Creating admin users...");
        const hashedPassword = await bcrypt.hash("admin123", 10);

        const adminUsers = [
            { name: "Super Admin", email: "admin@1fi.in", role: "ADMIN" },
            { name: "Risk Manager", email: "risk@1fi.in", role: "MANAGER" },
            { name: "Operations Lead", email: "ops@1fi.in", role: "MANAGER" },
            { name: "Underwriter One", email: "underwriter1@1fi.in", role: "USER" },
            { name: "Underwriter Two", email: "underwriter2@1fi.in", role: "USER" },
            { name: "Collection Agent", email: "collections@1fi.in", role: "USER" },
        ];

        const createdUsers = [];
        for (const user of adminUsers) {
            const [created] = await db.insert(users).values({
                name: user.name,
                email: user.email,
                password: hashedPassword,
                role: user.role,
                onboardingCompleted: true,
            }).returning();
            createdUsers.push(created);
        }
        console.log(`   ✓ Created ${createdUsers.length} admin users`);

        // -----------------------------------------
        // 2. CREATE LOAN PRODUCTS
        // -----------------------------------------
        console.log("📋 Creating loan products...");
        const productData = [
            { name: "LAMF Gold", desc: "Premium loan against mutual funds", minAmt: 100000, maxAmt: 5000000, rate: 10.5, ltv: 60 },
            { name: "LAMF Silver", desc: "Standard loan against mutual funds", minAmt: 50000, maxAmt: 2000000, rate: 11.5, ltv: 55 },
            { name: "LAMF Platinum", desc: "High-value secured lending", minAmt: 500000, maxAmt: 10000000, rate: 9.5, ltv: 65 },
            { name: "Quick Cash LAMF", desc: "Fast disbursement for urgent needs", minAmt: 25000, maxAmt: 500000, rate: 12.5, ltv: 50 },
            { name: "Business LAMF", desc: "For business working capital", minAmt: 200000, maxAmt: 5000000, rate: 11.0, ltv: 55 },
        ];

        const createdProducts = [];
        for (const prod of productData) {
            const [created] = await db.insert(loanProducts).values({
                name: prod.name,
                description: prod.desc,
                minAmount: prod.minAmt,
                maxAmount: prod.maxAmt,
                minTenureMonths: 3,
                maxTenureMonths: 36,
                interestRatePercent: prod.rate,
                processingFeePercent: 1.0,
                maxLtvPercent: prod.ltv,
                marginCallThreshold: prod.ltv + 10,
                liquidationThreshold: prod.ltv + 15,
                minCreditScore: 650,
                isActive: true,
            }).returning();
            createdProducts.push(created);
        }
        console.log(`   ✓ Created ${createdProducts.length} loan products`);

        // -----------------------------------------
        // 3. CREATE CUSTOMERS (500+)
        // -----------------------------------------
        console.log("👥 Creating customers...");
        const createdCustomers = [];
        const customerCount = 500;

        for (let i = 0; i < customerCount; i++) {
            const firstName = randomElement(indianFirstNames);
            const lastName = randomElement(indianLastNames);
            const location = randomElement(indianCities);
            const kycStatuses = ["VERIFIED", "VERIFIED", "VERIFIED", "PENDING", "IN_PROGRESS"];

            const [customer] = await db.insert(customers).values({
                firstName,
                lastName,
                email: generateEmail(firstName, lastName),
                phone: generatePhone(),
                dateOfBirth: generateDate(1970, 2000),
                aadhaarNumber: generateAadhaar(),
                aadhaarVerified: Math.random() > 0.2,
                panNumber: generatePAN(),
                panVerified: Math.random() > 0.15,
                kycStatus: randomElement(kycStatuses),
                addressLine1: `${randomInt(1, 500)}, ${randomElement(["MG Road", "Park Street", "Linking Road", "Brigade Road", "FC Road"])}`,
                city: location.city,
                state: location.state,
                pincode: location.pincode,
                employmentType: randomElement(["SALARIED", "SELF_EMPLOYED", "BUSINESS"]),
                monthlyIncome: randomInt(30000, 500000),
                companyName: randomElement(["TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra", "Own Business", "Freelancer"]),
                bankAccountNumber: generateAccountNumber(),
                bankIfscCode: generateIFSC(),
                bankName: randomElement(bankNames),
                riskScore: randomInt(1, 10),
                creditScore: randomInt(550, 900),
                createdById: randomElement(createdUsers).id,
            }).returning();
            createdCustomers.push(customer);
        }
        console.log(`   ✓ Created ${createdCustomers.length} customers`);

        // -----------------------------------------
        // 4. CREATE LOAN APPLICATIONS (1000+)
        // -----------------------------------------
        console.log("📝 Creating loan applications...");
        const applicationStatuses = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DISBURSED"];
        const createdApplications = [];
        const applicationCount = 1000;

        for (let i = 0; i < applicationCount; i++) {
            const customer = randomElement(createdCustomers);
            const product = randomElement(createdProducts);
            const status = randomElement(applicationStatuses);
            const requestedAmount = randomInt(product.minAmount, product.maxAmount);

            const [app] = await db.insert(loanApplications).values({
                customerId: customer.id,
                productId: product.id,
                requestedAmount,
                approvedAmount: status === "APPROVED" || status === "DISBURSED" ? requestedAmount : null,
                tenure: randomElement([6, 12, 18, 24, 36]),
                status,
                source: randomElement(["MANUAL", "API", "PARTNER"]),
                submittedAt: status !== "DRAFT" ? generateDateISO(randomInt(1, 180)) : null,
                approvedAt: status === "APPROVED" || status === "DISBURSED" ? generateDateISO(randomInt(1, 90)) : null,
                disbursedAt: status === "DISBURSED" ? generateDateISO(randomInt(1, 60)) : null,
            }).returning();
            createdApplications.push(app);
        }
        console.log(`   ✓ Created ${createdApplications.length} loan applications`);

        // -----------------------------------------
        // 5. CREATE ACTIVE LOANS (300)
        // -----------------------------------------
        console.log("💰 Creating active loans...");
        const disbursedApplications = createdApplications.filter(a => a.status === "DISBURSED").slice(0, 300);
        const createdLoans = [];
        const loanStatuses = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "CLOSED", "NPA"];

        for (const app of disbursedApplications) {
            const principal = app.approvedAmount || app.requestedAmount;
            const interestRate = randomFloat(9, 14);
            const tenure = app.tenure;
            const emiAmount = (principal * (1 + (interestRate / 100) * (tenure / 12))) / tenure;

            const [loan] = await db.insert(loans).values({
                customerId: app.customerId,
                productId: app.productId,
                applicationId: app.id,
                principalAmount: principal,
                interestRate,
                tenure,
                emiAmount,
                outstandingPrincipal: principal * randomFloat(0.3, 0.95),
                outstandingInterest: principal * randomFloat(0.01, 0.05),
                totalOutstanding: principal * randomFloat(0.35, 1.0),
                disbursedAmount: principal,
                disbursedAt: app.disbursedAt || generateDateISO(randomInt(30, 180)),
                maturityDate: generateDate(2025, 2028),
                status: randomElement(loanStatuses),
                currentLtv: randomFloat(35, 70),
            }).returning();
            createdLoans.push(loan);
        }
        console.log(`   ✓ Created ${createdLoans.length} active loans`);

        // -----------------------------------------
        // 6. CREATE COLLATERALS
        // -----------------------------------------
        console.log("🔐 Creating collaterals...");
        for (const loan of createdLoans) {
            const numCollaterals = randomInt(1, 3);
            for (let i = 0; i < numCollaterals; i++) {
                const units = randomFloat(100, 10000);
                const purchaseNav = randomFloat(10, 500);
                const currentNav = purchaseNav * randomFloat(0.85, 1.25);

                await db.insert(collaterals).values({
                    customerId: loan.customerId,
                    loanId: loan.id,
                    fundName: `${randomElement(amcNames)} ${randomElement(["Bluechip", "Flexi Cap", "Large Cap", "Multi Cap", "Index"])} Fund`,
                    amcName: randomElement(amcNames),
                    folioNumber: generateFolioNumber(),
                    schemeCode: `${randomInt(100000, 999999)}`,
                    schemeName: `${randomElement(["Growth", "Direct Growth", "IDCW", "Direct IDCW"])} Plan`,
                    schemeType: randomElement(schemeTypes),
                    units,
                    purchaseNav,
                    currentNav,
                    purchaseValue: units * purchaseNav,
                    currentValue: units * currentNav,
                    pledgeStatus: randomElement(["PLEDGED", "PLEDGED", "PLEDGED", "PENDING"]),
                    pledgedAt: generateDateISO(randomInt(30, 180)),
                });
            }
        }
        console.log(`   ✓ Created collaterals for ${createdLoans.length} loans`);

        // -----------------------------------------
        // 7. CREATE PARTNERS
        // -----------------------------------------
        console.log("🤝 Creating partners...");
        const partnerData = [
            { name: "PayTM Money", code: "PAYTM", type: "FINTECH" },
            { name: "Groww", code: "GROWW", type: "FINTECH" },
            { name: "Zerodha", code: "ZEROD", type: "BROKER" },
            { name: "Angel One", code: "ANGEL", type: "BROKER" },
            { name: "Bajaj Finance", code: "BAJFN", type: "NBFC" },
            { name: "Tata Capital", code: "TATA", type: "NBFC" },
        ];

        const createdPartners = [];
        for (const p of partnerData) {
            const [partner] = await db.insert(partners).values({
                name: p.name,
                code: p.code,
                type: p.type,
                contactName: `${randomElement(indianFirstNames)} ${randomElement(indianLastNames)}`,
                contactEmail: `partnerships@${p.code.toLowerCase()}.com`,
                contactPhone: generatePhone(),
                revenueSharePercent: randomFloat(0.5, 2.5),
                isActive: true,
            }).returning();
            createdPartners.push(partner);
        }
        console.log(`   ✓ Created ${createdPartners.length} partners`);

        // -----------------------------------------
        // 8. CREATE CREDIT LINES (for User Collateral Tree)
        // -----------------------------------------
        console.log("💳 Creating credit lines and accounts...");
        const customersWithCreditLines = createdCustomers.slice(0, 200);

        for (const customer of customersWithCreditLines) {
            const sanctionedLimit = randomInt(100000, 2000000);
            const utilized = sanctionedLimit * randomFloat(0.1, 0.8);

            const [creditLine] = await db.insert(creditLines).values({
                customerId: customer.id,
                sanctionedLimit,
                utilizedAmount: utilized,
                availableLimit: sanctionedLimit - utilized,
                status: randomElement(["ACTIVE", "ACTIVE", "ACTIVE", "FROZEN"]),
                riskCategory: randomElement(["STANDARD", "STANDARD", "WATCH", "SUBSTANDARD"]),
                sanctionDate: generateDate(2022, 2024),
                expiryDate: generateDate(2025, 2027),
            }).returning();

            // Create 1-3 credit accounts per credit line
            const numAccounts = randomInt(1, 3);
            for (let i = 0; i < numAccounts; i++) {
                const creditLimit = randomInt(50000, 500000);
                const balance = creditLimit * randomFloat(0.1, 0.9);

                const [account] = await db.insert(creditAccounts).values({
                    creditLineId: creditLine.id,
                    accountNumber: `${randomInt(4000, 4999)}${randomInt(1000, 9999)}${randomInt(1000, 9999)}${randomInt(1000, 9999)}`,
                    accountType: randomElement(["CREDIT_CARD", "CREDIT_CARD", "OVERDRAFT", "LINE_OF_CREDIT"]),
                    cardLastFour: `${randomInt(1000, 9999)}`,
                    cardNetwork: randomElement(["VISA", "MASTERCARD", "RUPAY", "AMEX"]),
                    cardVariant: randomElement(["GOLD", "PLATINUM", "SIGNATURE", "REWARDS"]),
                    creditLimit,
                    currentBalance: balance,
                    availableCredit: creditLimit - balance,
                    minimumDue: balance * 0.05,
                    billingCycleDay: randomInt(1, 28),
                    dueDate: generateDate(2024, 2025),
                    status: randomElement(["ACTIVE", "ACTIVE", "ACTIVE", "BLOCKED", "DELINQUENT"]),
                    interestRate: randomFloat(24, 42),
                }).returning();

                // Create 5-20 transactions per account
                const numTransactions = randomInt(5, 20);
                for (let j = 0; j < numTransactions; j++) {
                    await db.insert(creditTransactions).values({
                        creditAccountId: account.id,
                        type: randomElement(["PURCHASE", "PURCHASE", "PURCHASE", "CASH_ADVANCE", "PAYMENT", "REFUND", "FEE"]),
                        description: `${randomElement(merchantCategories)} - ${randomElement(merchantNames)}`,
                        merchantName: randomElement(merchantNames),
                        merchantCategory: randomElement(merchantCategories),
                        amount: randomFloat(100, 50000),
                        status: randomElement(["COMPLETED", "COMPLETED", "COMPLETED", "PENDING", "REVERSED"]),
                        location: randomElement(indianCities).city,
                        isInternational: Math.random() < 0.1,
                        transactionDate: generateDateISO(randomInt(1, 90)),
                        postingDate: generateDateISO(randomInt(1, 88)),
                    });
                }
            }
        }
        console.log(`   ✓ Created credit lines for ${customersWithCreditLines.length} customers`);

        // -----------------------------------------
        // 9. CREATE MARGIN CALLS
        // -----------------------------------------
        console.log("⚠️ Creating margin calls...");
        const npaLoans = createdLoans.filter(l => l.currentLtv && l.currentLtv > 55).slice(0, 50);
        for (const loan of npaLoans) {
            await db.insert(marginCalls).values({
                loanId: loan.id,
                customerId: loan.customerId,
                triggerLtv: 55,
                currentLtv: loan.currentLtv || 60,
                shortfallAmount: randomFloat(10000, 200000),
                status: randomElement(["PENDING", "NOTIFIED", "TOPPED_UP", "RESOLVED"]),
                dueDate: generateDate(2024, 2025),
                notifiedAt: generateDateISO(randomInt(1, 30)),
            });
        }
        console.log(`   ✓ Created margin calls for ${npaLoans.length} loans`);

        // -----------------------------------------
        // 10. CREATE RECOVERY AGENTS
        // -----------------------------------------
        console.log("🔄 Creating recovery agents...");
        const agentNames = ["Sharma Recovery Services", "National Collection Agency", "Metro Recovery Partners", "SecureDebt Solutions"];
        const createdAgents = [];
        for (const name of agentNames) {
            const [agent] = await db.insert(recoveryAgents).values({
                name,
                code: name.split(" ").map(w => w[0]).join("").toUpperCase(),
                agencyName: name,
                phone: generatePhone(),
                email: `contact@${name.toLowerCase().replace(/\s+/g, "")}.com`,
                totalAssigned: randomInt(10, 100),
                totalRecovered: randomFloat(500000, 5000000),
                successRate: randomFloat(40, 85),
                isActive: true,
            }).returning();
            createdAgents.push(agent);
        }
        console.log(`   ✓ Created ${createdAgents.length} recovery agents`);

        // -----------------------------------------
        // 11. CREATE AUTO-APPROVAL RULES
        // -----------------------------------------
        console.log("⚙️ Creating auto-approval rules...");
        const ruleData = [
            { name: "Premium Auto-Approve", conditions: { minCreditScore: 800, maxLtv: 50, minIncome: 100000 }, approve: true },
            { name: "Standard Auto-Approve", conditions: { minCreditScore: 750, maxLtv: 45, minIncome: 75000 }, approve: true },
            { name: "Low Score Auto-Reject", conditions: { maxCreditScore: 550 }, reject: true },
            { name: "High LTV Manual Review", conditions: { minLtv: 60 }, assignTo: "MANAGER" },
        ];

        for (const rule of ruleData) {
            await db.insert(autoApprovalRules).values({
                name: rule.name,
                description: `Automated rule: ${rule.name}`,
                priority: randomInt(1, 10),
                conditions: JSON.stringify(rule.conditions),
                autoApprove: rule.approve || false,
                autoReject: rule.reject || false,
                assignToRole: rule.assignTo,
                isActive: true,
                createdById: createdUsers[0].id,
            });
        }
        console.log(`   ✓ Created ${ruleData.length} auto-approval rules`);

        // -----------------------------------------
        // 12. CREATE SYSTEM SETTINGS
        // -----------------------------------------
        console.log("🔧 Creating system settings...");
        const settingsData = [
            { key: "MAX_LTV_EQUITY", value: "60", type: "NUMBER", category: "RISK" },
            { key: "MAX_LTV_DEBT", value: "70", type: "NUMBER", category: "RISK" },
            { key: "MARGIN_CALL_THRESHOLD", value: "55", type: "NUMBER", category: "RISK" },
            { key: "AUTO_LIQUIDATION_LTV", value: "70", type: "NUMBER", category: "RISK" },
            { key: "SMS_GATEWAY_ENABLED", value: "true", type: "BOOLEAN", category: "INTEGRATION" },
            { key: "EMAIL_NOTIFICATIONS", value: "true", type: "BOOLEAN", category: "NOTIFICATION" },
            { key: "WHATSAPP_ENABLED", value: "true", type: "BOOLEAN", category: "INTEGRATION" },
            { key: "CIBIL_API_ENABLED", value: "false", type: "BOOLEAN", category: "INTEGRATION" },
        ];

        for (const setting of settingsData) {
            await db.insert(systemSettings).values({
                key: setting.key,
                value: setting.value,
                type: setting.type,
                category: setting.category,
                description: `System setting: ${setting.key}`,
            });
        }
        console.log(`   ✓ Created ${settingsData.length} system settings`);

        // -----------------------------------------
        // 13. CREATE AUDIT LOGS
        // -----------------------------------------
        console.log("📜 Creating audit logs...");
        const actions = ["CREATE", "UPDATE", "APPROVE", "REJECT", "DISBURSE", "EXPORT"];
        const entityTypes = ["LOAN", "APPLICATION", "CUSTOMER", "COLLATERAL"];

        for (let i = 0; i < 500; i++) {
            await db.insert(auditLogs).values({
                action: randomElement(actions),
                entityType: randomElement(entityTypes),
                entityId: crypto.randomUUID().slice(0, 8),
                description: `${randomElement(actions)} operation on ${randomElement(entityTypes).toLowerCase()}`,
                userId: randomElement(createdUsers).id,
                ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
                createdAt: generateDateISO(randomInt(1, 180)),
            });
        }
        console.log(`   ✓ Created 500 audit log entries`);

        // -----------------------------------------
        // 14. CREATE COMMUNICATION LOGS
        // -----------------------------------------
        console.log("📧 Creating communication logs...");
        const channels = ["EMAIL", "SMS", "WHATSAPP", "CALL"];
        const subjects = [
            "Loan Application Received",
            "KYC Verification Required",
            "Loan Approved",
            "EMI Payment Reminder",
            "Margin Call Alert",
            "Payment Confirmation",
        ];

        for (let i = 0; i < 1000; i++) {
            const customer = randomElement(createdCustomers);
            await db.insert(communicationLogs).values({
                customerId: customer.id,
                loanId: createdLoans.length > 0 ? randomElement(createdLoans).id : null,
                userId: randomElement(createdUsers).id,
                channel: randomElement(channels),
                direction: randomElement(["OUTBOUND", "OUTBOUND", "INBOUND"]),
                subject: randomElement(subjects),
                content: `Dear ${customer.firstName}, ${randomElement(subjects)}. Thank you for banking with us.`,
                status: randomElement(["SENT", "DELIVERED", "READ", "FAILED"]),
                createdAt: generateDateISO(randomInt(1, 180)),
            });
        }
        console.log(`   ✓ Created 1000 communication log entries`);

        // -----------------------------------------
        // 15. CREATE DOCUMENTS
        // -----------------------------------------
        console.log("📄 Creating documents...");
        const docTypes = ["AADHAAR", "PAN", "BANK_STATEMENT", "SALARY_SLIP", "ITR"];
        for (const app of createdApplications) {
            // Add documents for random applications (70% chance)
            if (Math.random() > 0.3) {
                const numDocs = randomInt(1, 4);
                for (let i = 0; i < numDocs; i++) {
                    const docType = randomElement(docTypes);
                    await db.insert(documents).values({
                        customerId: app.customerId,
                        applicationId: app.id,
                        name: `${docType}_${app.applicationNumber}.pdf`,
                        type: docType,
                        url: `https://example.com/documents/${docType.toLowerCase()}.pdf`,
                        verified: Math.random() > 0.4,
                        createdAt: generateDateISO(randomInt(1, 60)),
                    });
                }
            }
        }
        console.log(`   ✓ Created documents for applications`);

        // -----------------------------------------
        // SUMMARY
        // -----------------------------------------
        console.log("\n✅ Admin data seeding completed successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`   Users:          ${createdUsers.length}`);
        console.log(`   Products:       ${createdProducts.length}`);
        console.log(`   Customers:      ${createdCustomers.length}`);
        console.log(`   Applications:   ${createdApplications.length}`);
        console.log(`   Loans:          ${createdLoans.length}`);
        console.log(`   Partners:       ${createdPartners.length}`);
        console.log(`   Credit Lines:   ${customersWithCreditLines.length}`);
        console.log(`   Recovery Agents: ${createdAgents.length}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    } catch (error) {
        console.error("❌ Error seeding data:", error);
        throw error;
    }
}

// Run if called directly
seedAdminData().catch(console.error);
