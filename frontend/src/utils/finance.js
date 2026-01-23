/**
 * Calculate the Total Return percentage for a given period.
 * @param {Array} historicalData - Array of objects with 'close' property, sorted chronologically.
 * @returns {number} - Total return percentage.
 */
export function calculateTotalReturn(historicalData) {
    if (!historicalData || historicalData.length < 2) {
        return 0;
    }

    // Ensure sorted chronologically just in case, though API usually returns sorted
    // Assuming 'Date' or simple index order. We trust the array order from API for now.
    // first element = start of period, last element = end of period

    // Check if data is reversed? Yahoo usually gives old -> new.
    // If [0] is recent, we need to swap. Let's assume standard old -> new.

    const firstPrice = historicalData[0].close || historicalData[0].Close;
    const lastPrice = historicalData[historicalData.length - 1].close || historicalData[historicalData.length - 1].Close;

    if (!firstPrice) return 0;

    const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;

    // console.log('=== DEBUG TOTAL RETURN ===');
    // console.log('First:', firstPrice, 'Last:', lastPrice, 'Return:', totalReturn);

    return totalReturn;
}

/**
 * Calculate the Sharpe Ratio for a given period.
 * @param {Array} historicalData - Array of objects with 'close' property.
 * @param {number} riskFreeRate - Annual risk free rate (decimal). Default 0.04.
 * @returns {number} - Sharpe Ratio.
 */
export function calculateSharpeRatio(historicalData, riskFreeRate = 0.04) {
    if (!historicalData || historicalData.length < 2) {
        return 0;
    }

    const dailyReturns = [];
    for (let i = 1; i < historicalData.length; i++) {
        const prev = historicalData[i - 1].close || historicalData[i - 1].Close;
        const curr = historicalData[i].close || historicalData[i].Close;
        if (prev) {
            dailyReturns.push((curr - prev) / prev);
        }
    }

    if (dailyReturns.length === 0) return 0;

    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const tradingDaysPerYear = 252;
    const annualizedReturn = avgDailyReturn * tradingDaysPerYear;
    const annualizedVolatility = stdDev * Math.sqrt(tradingDaysPerYear);

    const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedVolatility;

    return sharpeRatio;
}

/**
 * Calculate the Maximum Drawdown percentage for a given period.
 * @param {Array} historicalData - Array of objects with 'close' property.
 * @returns {number} - Max Drawdown percentage (negative number).
 */
export function calculateMaxDrawdown(historicalData) {
    if (!historicalData || historicalData.length < 2) {
        return 0;
    }

    let maxDrawdown = 0;
    let peak = historicalData[0].close || historicalData[0].Close;

    for (let i = 0; i < historicalData.length; i++) {
        const price = historicalData[i].close || historicalData[i].Close;

        if (price > peak) {
            peak = price;
        }

        const drawdown = ((price - peak) / peak) * 100;

        if (drawdown < maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }

    return maxDrawdown;
}
