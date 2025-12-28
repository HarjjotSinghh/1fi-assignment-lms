import { ForeclosureCalculator } from "@/components/tools/foreclosure-calculator";
import { Metadata } from "next";
import { RiAlertLine } from "react-icons/ri";

export const metadata: Metadata = {
    title: "Foreclosure Calculator | LMS",
    description: "Calculate foreclosure charges and settlement amount for early loan closure",
};

export default function ForeclosureCalculatorPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-none bg-destructive/10">
                            <RiAlertLine className="h-6 w-6 text-destructive" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Foreclosure Calculator</h2>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        Simulate early loan closure to calculate the total settlement amount, 
                        including foreclosure charges, outstanding interest, and potential savings.
                    </p>
                </div>
            </div>

            <ForeclosureCalculator />
        </div>
    );
}
