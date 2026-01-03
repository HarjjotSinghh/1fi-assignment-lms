/**
 * PDF Generator Library
 * Generates PDF documents for various LMS reports
 */

export type PDFTemplate = 
    | "LOAN_STATEMENT"
    | "PORTFOLIO_SUMMARY"
    | "NOC"
    | "FORECLOSURE_LETTER"
    | "COLLECTION_NOTICE"
    | "EMI_SCHEDULE";

export interface PDFGeneratorOptions {
    template: PDFTemplate;
    data: Record<string, unknown>;
    branding?: {
        logoUrl?: string;
        companyName?: string;
        primaryColor?: string;
    };
}

/**
 * Generate PDF content as HTML string (for server-side rendering)
 * This can be converted to PDF using puppeteer or similar
 */
export function generatePDFHtml(options: PDFGeneratorOptions): string {
    const { template, data, branding } = options;
    const companyName = branding?.companyName || "1Fi LMS";
    const primaryColor = branding?.primaryColor || "#4F46E5";

    const styles = `
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: ${primaryColor}; }
            .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px; color: ${primaryColor}; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { color: #666; }
            .value { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: ${primaryColor}; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #888; text-align: center; }
            .amount { font-size: 18px; font-weight: bold; color: ${primaryColor}; }
            .highlight { background-color: #f0f4ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    `;

    const header = `
        <div class="header">
            <div class="logo">${companyName}</div>
            <div>Generated: ${new Date().toLocaleDateString('en-IN')}</div>
        </div>
    `;

    const footer = `
        <div class="footer">
            <p>This is a computer-generated document. No signature required.</p>
            <p>${companyName} | Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
    `;

    let content = "";

    switch (template) {
        case "LOAN_STATEMENT":
            content = generateLoanStatement(data);
            break;
        case "NOC":
            content = generateNOC(data);
            break;
        case "FORECLOSURE_LETTER":
            content = generateForeclosureLetter(data);
            break;
        case "EMI_SCHEDULE":
            content = generateEMISchedule(data);
            break;
        case "PORTFOLIO_SUMMARY":
            content = generatePortfolioSummary(data);
            break;
        default:
            content = "<p>Template not found</p>";
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${template.replace(/_/g, " ")}</title>
            ${styles}
        </head>
        <body>
            <div class="container">
                ${header}
                ${content}
                ${footer}
            </div>
        </body>
        </html>
    `;
}

function generateLoanStatement(data: Record<string, unknown>): string {
    return `
        <div class="title">Loan Account Statement</div>
        <div class="section">
            <div class="section-title">Account Details</div>
            <div class="row"><span class="label">Loan Account Number:</span><span class="value">${data.loanNumber || "—"}</span></div>
            <div class="row"><span class="label">Customer Name:</span><span class="value">${data.customerName || "—"}</span></div>
            <div class="row"><span class="label">Loan Amount:</span><span class="value">₹${formatCurrency(data.loanAmount as number)}</span></div>
            <div class="row"><span class="label">Interest Rate:</span><span class="value">${data.interestRate || "—"}% p.a.</span></div>
            <div class="row"><span class="label">Tenure:</span><span class="value">${data.tenure || "—"} months</span></div>
        </div>
        <div class="section">
            <div class="section-title">Outstanding Summary</div>
            <div class="highlight">
                <div class="row"><span class="label">Principal Outstanding:</span><span class="amount">₹${formatCurrency(data.principalOutstanding as number)}</span></div>
                <div class="row"><span class="label">Interest Outstanding:</span><span class="value">₹${formatCurrency(data.interestOutstanding as number)}</span></div>
                <div class="row"><span class="label">Total Outstanding:</span><span class="amount">₹${formatCurrency(data.totalOutstanding as number)}</span></div>
            </div>
        </div>
    `;
}

function generateNOC(data: Record<string, unknown>): string {
    return `
        <div class="title">No Objection Certificate (NOC)</div>
        <div class="section">
            <p style="margin-bottom: 15px;">This is to certify that the loan account mentioned below has been closed and all dues have been cleared.</p>
            <div class="row"><span class="label">Loan Account Number:</span><span class="value">${data.loanNumber || "—"}</span></div>
            <div class="row"><span class="label">Borrower Name:</span><span class="value">${data.customerName || "—"}</span></div>
            <div class="row"><span class="label">Original Loan Amount:</span><span class="value">₹${formatCurrency(data.loanAmount as number)}</span></div>
            <div class="row"><span class="label">Closure Date:</span><span class="value">${data.closureDate || new Date().toLocaleDateString('en-IN')}</span></div>
        </div>
        <div class="section">
            <div class="highlight">
                <p style="text-align: center; font-weight: bold; color: green;">
                    ✓ All outstanding amounts have been fully paid and settled.
                </p>
                <p style="text-align: center; margin-top: 10px;">
                    We have no objection to the release of any collateral/security held against this loan.
                </p>
            </div>
        </div>
    `;
}

function generateForeclosureLetter(data: Record<string, unknown>): string {
    return `
        <div class="title">Foreclosure Statement</div>
        <div class="section">
            <div class="section-title">Loan Details</div>
            <div class="row"><span class="label">Loan Account Number:</span><span class="value">${data.loanNumber || "—"}</span></div>
            <div class="row"><span class="label">Customer Name:</span><span class="value">${data.customerName || "—"}</span></div>
            <div class="row"><span class="label">Statement Date:</span><span class="value">${new Date().toLocaleDateString('en-IN')}</span></div>
            <div class="row"><span class="label">Valid Until:</span><span class="value">${data.validUntil || "—"}</span></div>
        </div>
        <div class="section">
            <div class="section-title">Foreclosure Calculation</div>
            <table>
                <thead>
                    <tr><th>Component</th><th style="text-align: right;">Amount (₹)</th></tr>
                </thead>
                <tbody>
                    <tr><td>Principal Outstanding</td><td style="text-align: right;">${formatCurrency(data.principalOutstanding as number)}</td></tr>
                    <tr><td>Interest Outstanding</td><td style="text-align: right;">${formatCurrency(data.interestOutstanding as number)}</td></tr>
                    <tr><td>Prepayment Penalty</td><td style="text-align: right;">${formatCurrency(data.penaltyAmount as number)}</td></tr>
                    <tr><td>Waiver (if any)</td><td style="text-align: right;">-${formatCurrency(data.waiverAmount as number)}</td></tr>
                    <tr style="font-weight: bold; background-color: #f0f4ff;"><td>Total Payable</td><td style="text-align: right;">${formatCurrency(data.totalPayable as number)}</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function generateEMISchedule(data: Record<string, unknown>): string {
    const schedule = (data.schedule as Array<{month: number; emi: number; principal: number; interest: number; balance: number}>) || [];
    
    let rows = "";
    schedule.forEach((row) => {
        rows += `
            <tr>
                <td>${row.month}</td>
                <td style="text-align: right;">${formatCurrency(row.emi)}</td>
                <td style="text-align: right;">${formatCurrency(row.principal)}</td>
                <td style="text-align: right;">${formatCurrency(row.interest)}</td>
                <td style="text-align: right;">${formatCurrency(row.balance)}</td>
            </tr>
        `;
    });

    return `
        <div class="title">EMI Amortization Schedule</div>
        <div class="section">
            <div class="row"><span class="label">Loan Amount:</span><span class="value">₹${formatCurrency(data.loanAmount as number)}</span></div>
            <div class="row"><span class="label">Interest Rate:</span><span class="value">${data.interestRate}% p.a.</span></div>
            <div class="row"><span class="label">Tenure:</span><span class="value">${data.tenure} months</span></div>
            <div class="row"><span class="label">Monthly EMI:</span><span class="amount">₹${formatCurrency(data.emi as number)}</span></div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th style="text-align: right;">EMI (₹)</th>
                    <th style="text-align: right;">Principal (₹)</th>
                    <th style="text-align: right;">Interest (₹)</th>
                    <th style="text-align: right;">Balance (₹)</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function generatePortfolioSummary(data: Record<string, unknown>): string {
    return `
        <div class="title">Portfolio Summary Report</div>
        <div class="section">
            <div class="section-title">Overview</div>
            <div class="row"><span class="label">Report Date:</span><span class="value">${new Date().toLocaleDateString('en-IN')}</span></div>
            <div class="row"><span class="label">Total Loans:</span><span class="value">${data.totalLoans || 0}</span></div>
            <div class="row"><span class="label">Active Loans:</span><span class="value">${data.activeLoans || 0}</span></div>
        </div>
        <div class="section">
            <div class="section-title">Financial Summary</div>
            <div class="highlight">
                <div class="row"><span class="label">Total Disbursed:</span><span class="amount">₹${formatCurrency(data.totalDisbursed as number)}</span></div>
                <div class="row"><span class="label">Total Outstanding:</span><span class="value">₹${formatCurrency(data.totalOutstanding as number)}</span></div>
                <div class="row"><span class="label">Total Collected:</span><span class="value">₹${formatCurrency(data.totalCollected as number)}</span></div>
            </div>
        </div>
        <div class="section">
            <div class="section-title">Risk Distribution</div>
            <div class="row"><span class="label">Current (0 DPD):</span><span class="value">${data.currentLoans || 0} loans</span></div>
            <div class="row"><span class="label">SMA-0 (1-30 DPD):</span><span class="value">${data.sma0Loans || 0} loans</span></div>
            <div class="row"><span class="label">SMA-1 (31-60 DPD):</span><span class="value">${data.sma1Loans || 0} loans</span></div>
            <div class="row"><span class="label">SMA-2 (61-90 DPD):</span><span class="value">${data.sma2Loans || 0} loans</span></div>
            <div class="row"><span class="label">NPA (90+ DPD):</span><span class="value">${data.npaLoans || 0} loans</span></div>
        </div>
    `;
}

function formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return "0.00";
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Calculate EMI
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / tenureMonths;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi * 100) / 100;
}

/**
 * Generate amortization schedule
 */
export function generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    tenureMonths: number
): Array<{month: number; emi: number; principal: number; interest: number; balance: number}> {
    const schedule = [];
    const emi = calculateEMI(principal, annualRate, tenureMonths);
    const monthlyRate = annualRate / 12 / 100;
    let balance = principal;

    for (let month = 1; month <= tenureMonths; month++) {
        const interestComponent = balance * monthlyRate;
        const principalComponent = emi - interestComponent;
        balance = Math.max(0, balance - principalComponent);

        schedule.push({
            month,
            emi: Math.round(emi * 100) / 100,
            principal: Math.round(principalComponent * 100) / 100,
            interest: Math.round(interestComponent * 100) / 100,
            balance: Math.round(balance * 100) / 100,
        });
    }

    return schedule;
}
