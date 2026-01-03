/**
 * NAV Prediction Library (Phase 5)
 * Provides basic trend analysis and volatility-based margin suggestions
 */

export interface NavPrediction {
    predictedNav: number;
    confidence: number; // 0-100%
    trend: "UP" | "DOWN" | "STABLE";
    volatility: number; // Annualized volatility %
    suggestedMarginBuffer: number; // Additional margin % to add
    movingAverage7Day: number;
    movingAverage30Day: number;
}

export interface NavHistoryPoint {
    date: string;
    nav: number;
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(data: number[], period: number): number {
    if (data.length < period) return data.reduce((a, b) => a + b, 0) / data.length;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squareDiffs = data.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate daily returns
 */
function calculateDailyReturns(navHistory: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < navHistory.length; i++) {
        returns.push((navHistory[i] - navHistory[i - 1]) / navHistory[i - 1]);
    }
    return returns;
}

/**
 * Predict NAV based on historical data using moving averages
 */
export function predictNav(history: NavHistoryPoint[]): NavPrediction {
    if (history.length < 7) {
        throw new Error("Insufficient history for prediction (need at least 7 days)");
    }

    const navValues = history.map(h => h.nav);
    const latestNav = navValues[navValues.length - 1];

    // Calculate moving averages
    const ma7 = calculateSMA(navValues, 7);
    const ma30 = calculateSMA(navValues, Math.min(30, navValues.length));

    // Calculate daily returns and volatility
    const dailyReturns = calculateDailyReturns(navValues);
    const dailyStdDev = calculateStdDev(dailyReturns);
    const annualizedVolatility = dailyStdDev * Math.sqrt(252) * 100; // 252 trading days

    // Determine trend
    let trend: "UP" | "DOWN" | "STABLE";
    const trendThreshold = 0.02; // 2% threshold
    const trendRatio = (ma7 - ma30) / ma30;

    if (trendRatio > trendThreshold) {
        trend = "UP";
    } else if (trendRatio < -trendThreshold) {
        trend = "DOWN";
    } else {
        trend = "STABLE";
    }

    // Simple prediction: weighted average of MAs with momentum
    const momentum = (latestNav - ma7) / ma7;
    const predictedNav = ma7 * (1 + momentum * 0.5);

    // Confidence based on volatility (lower volatility = higher confidence)
    const confidence = Math.max(20, Math.min(95, 100 - annualizedVolatility));

    // Margin buffer suggestion based on volatility
    let suggestedMarginBuffer: number;
    if (annualizedVolatility < 10) {
        suggestedMarginBuffer = 5;
    } else if (annualizedVolatility < 20) {
        suggestedMarginBuffer = 10;
    } else if (annualizedVolatility < 35) {
        suggestedMarginBuffer = 15;
    } else {
        suggestedMarginBuffer = 25;
    }

    return {
        predictedNav: Math.round(predictedNav * 100) / 100,
        confidence: Math.round(confidence),
        trend,
        volatility: Math.round(annualizedVolatility * 100) / 100,
        suggestedMarginBuffer,
        movingAverage7Day: Math.round(ma7 * 100) / 100,
        movingAverage30Day: Math.round(ma30 * 100) / 100,
    };
}

/**
 * Calculate Value at Risk (VaR) at 95% confidence
 */
export function calculateVaR(history: NavHistoryPoint[], currentValue: number, holdingDays = 10): number {
    const navValues = history.map(h => h.nav);
    const dailyReturns = calculateDailyReturns(navValues);

    // Sort returns to find 5th percentile
    const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
    const percentileIndex = Math.floor(sortedReturns.length * 0.05);
    const dailyVaR = Math.abs(sortedReturns[percentileIndex] || 0);

    // Scale to holding period
    const periodVaR = dailyVaR * Math.sqrt(holdingDays);

    return Math.round(currentValue * periodVaR);
}
