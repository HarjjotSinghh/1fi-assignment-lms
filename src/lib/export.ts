import { formatCurrency, formatDate, formatPercent } from "./utils";

/**
 * Column definition for CSV export
 */
export interface ExportColumn<T> {
    key: keyof T | ((row: T) => string | number | null | undefined);
    header: string;
    formatter?: (value: unknown) => string;
}

/**
 * Generate CSV content from data array
 */
export function generateCSV<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn<T>[]
): string {
    // Generate header row
    const headers = columns.map((col) => `"${col.header}"`).join(",");

    // Generate data rows
    const rows = data.map((row) => {
        return columns
            .map((col) => {
                let value: unknown;

                if (typeof col.key === "function") {
                    value = col.key(row);
                } else {
                    value = row[col.key];
                }

                // Apply formatter if provided
                if (col.formatter && value !== null && value !== undefined) {
                    value = col.formatter(value);
                }

                // Handle null/undefined
                if (value === null || value === undefined) {
                    return '""';
                }

                // Escape double quotes and wrap in quotes
                const stringValue = String(value).replace(/"/g, '""');
                return `"${stringValue}"`;
            })
            .join(",");
    });

    return [headers, ...rows].join("\n");
}

/**
 * Trigger CSV file download in browser
 */
export function downloadCSV(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============================================
// Export Column Definitions
// ============================================

export const loansExportColumns = [
    { key: "loanNumber" as const, header: "Loan Number" },
    {
        key: (row: { customerFirstName?: string; customerLastName?: string }) =>
            `${row.customerFirstName || ""} ${row.customerLastName || ""}`.trim(),
        header: "Customer Name"
    },
    { key: "customerEmail" as const, header: "Customer Email" },
    { key: "productName" as const, header: "Product" },
    { key: "principalAmount" as const, header: "Principal Amount", formatter: (v: unknown) => formatCurrency(v as number) },
    { key: "interestRate" as const, header: "Interest Rate", formatter: (v: unknown) => formatPercent(v as number) },
    { key: "tenure" as const, header: "Tenure (Months)" },
    { key: "emiAmount" as const, header: "EMI Amount", formatter: (v: unknown) => formatCurrency(v as number) },
    { key: "totalOutstanding" as const, header: "Outstanding", formatter: (v: unknown) => formatCurrency(v as number || 0) },
    { key: "currentLtv" as const, header: "Current LTV", formatter: (v: unknown) => formatPercent(v as number || 0) },
    { key: "status" as const, header: "Status" },
    { key: "disbursedAt" as const, header: "Disbursed Date", formatter: (v: unknown) => v ? formatDate(v as string) : "" },
    { key: "maturityDate" as const, header: "Maturity Date", formatter: (v: unknown) => v ? formatDate(v as string) : "" },
];

export const applicationsExportColumns = [
    { key: "applicationNumber" as const, header: "Application Number" },
    {
        key: (row: { customerFirstName?: string; customerLastName?: string }) =>
            `${row.customerFirstName || ""} ${row.customerLastName || ""}`.trim(),
        header: "Customer Name"
    },
    { key: "customerEmail" as const, header: "Customer Email" },
    { key: "productName" as const, header: "Product" },
    { key: "requestedAmount" as const, header: "Requested Amount", formatter: (v: unknown) => formatCurrency(v as number) },
    { key: "approvedAmount" as const, header: "Approved Amount", formatter: (v: unknown) => v ? formatCurrency(v as number) : "" },
    { key: "tenure" as const, header: "Tenure (Months)" },
    { key: "status" as const, header: "Status" },
    { key: "source" as const, header: "Source" },
    { key: "createdAt" as const, header: "Application Date", formatter: (v: unknown) => formatDate(v as string) },
];

export const customersExportColumns = [
    {
        key: (row: { firstName?: string; lastName?: string }) =>
            `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        header: "Full Name"
    },
    { key: "email" as const, header: "Email" },
    { key: "phone" as const, header: "Phone" },
    { key: "dateOfBirth" as const, header: "Date of Birth" },
    { key: "kycStatus" as const, header: "KYC Status" },
    { key: "aadhaarVerified" as const, header: "Aadhaar Verified", formatter: (v: unknown) => v ? "Yes" : "No" },
    { key: "panVerified" as const, header: "PAN Verified", formatter: (v: unknown) => v ? "Yes" : "No" },
    {
        key: (row: { city?: string; state?: string }) =>
            row.city && row.state ? `${row.city}, ${row.state}` : "",
        header: "Location"
    },
    { key: "employmentType" as const, header: "Employment Type" },
    { key: "monthlyIncome" as const, header: "Monthly Income", formatter: (v: unknown) => v ? formatCurrency(v as number) : "" },
    { key: "creditScore" as const, header: "Credit Score" },
    { key: "createdAt" as const, header: "Joined Date", formatter: (v: unknown) => formatDate(v as string) },
];

export const collateralExportColumns = [
    { key: "schemeName" as const, header: "Scheme Name" },
    { key: "amcName" as const, header: "AMC" },
    { key: "folioNumber" as const, header: "Folio Number" },
    { key: "schemeType" as const, header: "Scheme Type" },
    {
        key: (row: { customerFirstName?: string; customerLastName?: string }) =>
            `${row.customerFirstName || ""} ${row.customerLastName || ""}`.trim(),
        header: "Customer Name"
    },
    { key: "units" as const, header: "Units", formatter: (v: unknown) => (v as number).toLocaleString("en-IN", { maximumFractionDigits: 3 }) },
    { key: "purchaseNav" as const, header: "Purchase NAV", formatter: (v: unknown) => (v as number).toFixed(2) },
    { key: "currentNav" as const, header: "Current NAV", formatter: (v: unknown) => (v as number).toFixed(2) },
    { key: "purchaseValue" as const, header: "Purchase Value", formatter: (v: unknown) => formatCurrency(v as number) },
    { key: "currentValue" as const, header: "Current Value", formatter: (v: unknown) => formatCurrency(v as number) },
    { key: "pledgeStatus" as const, header: "Pledge Status" },
    { key: "loanNumber" as const, header: "Linked Loan" },
];

export const productsExportColumns = [
    { key: "name" as const, header: "Product Name" },
    { key: "description" as const, header: "Description" },
    { key: "minAmount" as const, header: "Min Amount", formatter: (v: unknown) => formatCurrency(v as number) },
    { key: "maxAmount" as const, header: "Max Amount", formatter: (v: unknown) => formatCurrency(v as number) },
    { key: "minTenureMonths" as const, header: "Min Tenure (Months)" },
    { key: "maxTenureMonths" as const, header: "Max Tenure (Months)" },
    { key: "interestRatePercent" as const, header: "Interest Rate", formatter: (v: unknown) => formatPercent(v as number) },
    { key: "processingFeePercent" as const, header: "Processing Fee", formatter: (v: unknown) => formatPercent(v as number || 0) },
    { key: "maxLtvPercent" as const, header: "Max LTV", formatter: (v: unknown) => formatPercent(v as number || 0) },
    { key: "isActive" as const, header: "Status", formatter: (v: unknown) => v ? "Active" : "Inactive" },
];
