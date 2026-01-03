/**
 * Interest Rate Optimizer (Phase 5)
 * Risk-based pricing model for personalized interest rates
 */

export interface RiskFactors {
    creditScore?: number; // 300-900
    repaymentHistory: number; // 0-100% on-time payments
    collateralLtv: number; // Loan to value ratio %
    tenure: number; // Loan tenure in months
    loanAmount: number;
    employmentType?: "SALARIED" | "SELF_EMPLOYED" | "BUSINESS";
    existingCustomer?: boolean;
}

export interface RateOptimization {
    baseRate: number;
    riskPremium: number;
    finalRate: number;
    riskCategory: "LOW" | "MEDIUM" | "HIGH";
    adjustments: RateAdjustment[];
    savingsOpportunity?: number;
    competitorBenchmark?: number;
}

export interface RateAdjustment {
    factor: string;
    impact: number; // Basis points
    direction: "INCREASE" | "DECREASE";
    reason: string;
}

/**
 * Calculate optimized interest rate based on risk factors
 */
export function optimizeInterestRate(factors: RiskFactors, benchmarkRate = 9.5): RateOptimization {
    const adjustments: RateAdjustment[] = [];
    let riskPremium = 0;

    // Credit Score Adjustment
    if (factors.creditScore) {
        if (factors.creditScore >= 800) {
            adjustments.push({
                factor: "Credit Score",
                impact: -75,
                direction: "DECREASE",
                reason: "Excellent credit score (800+)"
            });
            riskPremium -= 0.75;
        } else if (factors.creditScore >= 750) {
            adjustments.push({
                factor: "Credit Score",
                impact: -50,
                direction: "DECREASE",
                reason: "Very good credit score (750-799)"
            });
            riskPremium -= 0.50;
        } else if (factors.creditScore >= 700) {
            adjustments.push({
                factor: "Credit Score",
                impact: -25,
                direction: "DECREASE",
                reason: "Good credit score (700-749)"
            });
            riskPremium -= 0.25;
        } else if (factors.creditScore < 650) {
            adjustments.push({
                factor: "Credit Score",
                impact: 100,
                direction: "INCREASE",
                reason: "Below average credit score (<650)"
            });
            riskPremium += 1.0;
        }
    }

    // Repayment History Adjustment
    if (factors.repaymentHistory >= 98) {
        adjustments.push({
            factor: "Repayment History",
            impact: -50,
            direction: "DECREASE",
            reason: "Excellent payment track record (98%+ on-time)"
        });
        riskPremium -= 0.50;
    } else if (factors.repaymentHistory >= 90) {
        adjustments.push({
            factor: "Repayment History",
            impact: -25,
            direction: "DECREASE",
            reason: "Good payment history (90-97%)"
        });
        riskPremium -= 0.25;
    } else if (factors.repaymentHistory < 80) {
        adjustments.push({
            factor: "Repayment History",
            impact: 75,
            direction: "INCREASE",
            reason: "Poor payment history (<80%)"
        });
        riskPremium += 0.75;
    }

    // LTV Adjustment
    if (factors.collateralLtv <= 40) {
        adjustments.push({
            factor: "Collateral Coverage",
            impact: -50,
            direction: "DECREASE",
            reason: "Strong collateral (LTV ≤40%)"
        });
        riskPremium -= 0.50;
    } else if (factors.collateralLtv <= 60) {
        adjustments.push({
            factor: "Collateral Coverage",
            impact: -25,
            direction: "DECREASE",
            reason: "Adequate collateral (LTV 40-60%)"
        });
        riskPremium -= 0.25;
    } else if (factors.collateralLtv > 80) {
        adjustments.push({
            factor: "Collateral Coverage",
            impact: 50,
            direction: "INCREASE",
            reason: "High LTV (>80%)"
        });
        riskPremium += 0.50;
    }

    // Existing Customer Loyalty Discount
    if (factors.existingCustomer) {
        adjustments.push({
            factor: "Customer Loyalty",
            impact: -25,
            direction: "DECREASE",
            reason: "Existing customer relationship"
        });
        riskPremium -= 0.25;
    }

    // Employment Type
    if (factors.employmentType === "SALARIED") {
        adjustments.push({
            factor: "Employment Stability",
            impact: -15,
            direction: "DECREASE",
            reason: "Stable salaried employment"
        });
        riskPremium -= 0.15;
    } else if (factors.employmentType === "SELF_EMPLOYED") {
        adjustments.push({
            factor: "Employment Type",
            impact: 25,
            direction: "INCREASE",
            reason: "Self-employed income variability"
        });
        riskPremium += 0.25;
    }

    // Calculate final rate
    const finalRate = Math.max(benchmarkRate + riskPremium, benchmarkRate - 2); // Min 2% below benchmark
    const cappedRate = Math.min(finalRate, benchmarkRate + 4); // Max 4% above benchmark

    // Determine risk category
    let riskCategory: "LOW" | "MEDIUM" | "HIGH";
    if (riskPremium <= -0.25) {
        riskCategory = "LOW";
    } else if (riskPremium <= 0.5) {
        riskCategory = "MEDIUM";
    } else {
        riskCategory = "HIGH";
    }

    return {
        baseRate: benchmarkRate,
        riskPremium: Math.round(riskPremium * 100) / 100,
        finalRate: Math.round(cappedRate * 100) / 100,
        riskCategory,
        adjustments,
        competitorBenchmark: benchmarkRate + 0.5, // Assumed competitor rate
        savingsOpportunity: riskPremium < 0 ? Math.abs(riskPremium) : undefined,
    };
}

/**
 * Calculate eligibility score (0-100)
 */
export function calculateEligibilityScore(factors: RiskFactors): number {
    let score = 50; // Base score

    // Credit score contributes up to 25 points
    if (factors.creditScore) {
        score += Math.max(0, Math.min(25, (factors.creditScore - 600) / 12));
    }

    // Repayment history contributes up to 25 points
    score += factors.repaymentHistory / 4;

    // Low LTV contributes up to 15 points
    score += Math.max(0, (100 - factors.collateralLtv) / 6.67);

    // Existing customer bonus
    if (factors.existingCustomer) score += 5;

    return Math.min(100, Math.round(score));
}
