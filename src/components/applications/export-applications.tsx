"use client";

import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { getApplicationsForExportAction } from "@/app/actions/applications";
import { toast } from "sonner";

export function ExportApplications() {
    async function handleExport() {
        const res = await getApplicationsForExportAction();

        if (res.success && res.data) {
            // Convert to CSV
            const headers = ["Application No", "Customer", "Email", "Amount", "Tenure", "Product", "Status", "Date"];
            const csvContent = [
                headers.join(","),
                ...res.data.map(row => [
                    row.applicationNo,
                    row.customer || "N/A",
                    row.customerEmail || "N/A",
                    row.requestedAmount,
                    row.tenure,
                    row.product || "N/A",
                    row.status,
                    row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "N/A"
                ].join(","))
            ].join("\n");

            // Download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Export downloaded successfully");
        } else {
            toast.error("Failed to export data");
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    );
}
