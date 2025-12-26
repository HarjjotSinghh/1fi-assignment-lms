import { EMICalculator } from "@/components/tools/emi-calculator";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "EMI Calculator | LMS",
    description: "Calculate loan Equated Monthly Installments",
};

export default function EMICalculatorPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">EMI Calculator</h2>
                    <p className="text-muted-foreground">
                        Plan your loan repayment with our interactive tool
                    </p>
                </div>
            </div>

            <EMICalculator />
        </div>
    );
}
