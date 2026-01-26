// Helper to parse date string YYYY-MM-DD safely without timezone shift
// Returns a Date object set to noon local time or extracts components
function getSafeDate(dateStr) {
    if (!dateStr) return new Date();
    // Assuming format YYYY-MM-DD or similar
    // We append T12:00:00 to ensure we stay in the same day regardless of small timezone offsets
    // Or better: parse components
    const part = new Date(dateStr);
    // If it's a valid date object already
    if (!isNaN(part.getTime())) {
        // Fix: interpret as user local time, not UTC, if it was ISO string without time
        // Actually, easiest way for day-of-week:
        const d = new Date(dateStr);
        // Add timezone offset correction if it's defaulting to UTC midnight
        // But simpler: just use getUTCDay() if the source is YYYY-MM-DD?
        // Let's stick to appending time to force a safe middle-of-day
        if (dateStr.length === 10) return new Date(dateStr + "T12:00:00");
        return d;
    }
    return new Date();
}

export function calculateMonthlyReturnsHeatmap(data) {
    if (!data || data.length === 0) return { index: [], data: [] };

    const returnsByYear = {};

    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const monthlyPrices = {};

    sortedData.forEach(day => {
        const date = getSafeDate(day.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyPrices[key]) monthlyPrices[key] = [];
        monthlyPrices[key].push(day.close || day.Close);
    });

    Object.entries(monthlyPrices).forEach(([key, prices]) => {
        const [year, month] = key.split('-').map(Number);
        const first = prices[0];
        const last = prices[prices.length - 1];
        const ret = (last - first) / first;

        if (!returnsByYear[year]) returnsByYear[year] = Array(12).fill(0);
        returnsByYear[year][month] = ret;
    });

    const years = Object.keys(returnsByYear).sort().map(Number);
    const heatmapData = years.map(year => returnsByYear[year]);

    return { index: years, data: heatmapData };
}

export function calculateAvgMonthlyPerformance(data) {
    if (!data || data.length === 0) return {};

    const returnsByMonthInfo = {};
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const monthlyPrices = {};

    sortedData.forEach(day => {
        const date = getSafeDate(day.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyPrices[key]) monthlyPrices[key] = [];
        monthlyPrices[key].push(day.close || day.Close);
    });

    Object.entries(monthlyPrices).forEach(([key, prices]) => {
        const [_, month] = key.split('-').map(Number);
        const first = prices[0];
        const last = prices[prices.length - 1];
        const ret = (last - first) / first;

        if (!returnsByMonthInfo[month]) returnsByMonthInfo[month] = [];
        returnsByMonthInfo[month].push(ret);
    });

    const avgMonthly = {};
    for (let m = 0; m < 12; m++) {
        const rets = returnsByMonthInfo[m] || [];
        const avg = rets.length > 0 ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
        avgMonthly[m + 1] = avg;
    }

    return avgMonthly;
}

export function calculateAvgDailyPerformance(data) {
    if (!data || data.length < 2) return {};

    const returnsByDay = { 0: [], 1: [], 2: [], 3: [], 4: [] }; // Mon-Fri

    for (let i = 1; i < data.length; i++) {
        // Fix: Use Safe Date parsing to avoid Timezone shift (Mon -> Sun)
        const date = getSafeDate(data[i].date);
        const day = date.getDay(); // 0=Sun, 1=Mon... 6=Sat

        // Skip weekends
        if (day === 0 || day === 6) continue;

        const index = day - 1; // 0=Mon, 4=Fri

        const prev = data[i - 1].close || data[i - 1].Close;
        const curr = data[i].close || data[i].Close;
        const ret = (curr - prev) / prev;

        if (returnsByDay[index]) {
            returnsByDay[index].push(ret);
        }
    }

    const avgDaily = {};
    Object.keys(returnsByDay).forEach(idx => {
        const rets = returnsByDay[idx];
        avgDaily[idx] = rets.length > 0 ? (rets.reduce((a, b) => a + b, 0) / rets.length) * 100 : 0;
    });

    return avgDaily;
}

export function calculateDistributionOfReturns(data, targetBins = 20) {
    if (!data || data.length < 2) return { histogram: [], bins: [], skew: 0, kurtosis: 0 };

    const dailyReturns = [];
    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1].close || data[i - 1].Close;
        const curr = data[i].close || data[i].Close;
        if (prev) dailyReturns.push((curr - prev) / prev);
    }

    if (dailyReturns.length === 0) return { histogram: [], bins: [], skew: 0, kurtosis: 0 };

    // Moments (calculated on raw data)
    const n = dailyReturns.length;
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / n;

    // Standard deviation
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Skewness
    const m3 = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
    const skew = m3 / Math.pow(stdDev, 3);

    // Kurtosis
    const m4 = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
    const kurtosis = (m4 / Math.pow(stdDev, 4)) - 3;

    // Zero-Aligned Histogram
    // We want 0.0 to be a bin boundary.
    const min = Math.min(...dailyReturns);
    const max = Math.max(...dailyReturns);

    // Determine a "nice" step size
    // Raw range
    const range = max - min;
    const approxStep = range / targetBins;

    // We stick to the approx step but anchor at 0
    const step = approxStep;

    // Calculate start and end bins aligned to step from 0
    // start = floor(min / step) * step
    // end = ceil(max / step) * step

    const startEdge = Math.floor(min / step) * step;
    const endEdge = Math.ceil(max / step) * step;

    // Create bins
    const binEdges = [];
    let currentEdge = startEdge;

    // Safety break to prevent infinite loops if step is 0 (though range > 0 check handles it implicitly if data distinct)
    if (step <= 0) return { histogram: [], bins: [], skew: 0, kurtosis: 0 };

    // Build edges array
    // We add a small epsilon to endEdge comparison to handle float precision issues
    while (currentEdge <= endEdge + step / 1000) {
        binEdges.push(currentEdge);
        currentEdge += step;
    }

    const numBins = binEdges.length - 1;
    const histogram = new Array(numBins).fill(0);

    dailyReturns.forEach(ret => {
        // Find bin index
        // index = floor((ret - startEdge) / step)
        let binIndex = Math.floor((ret - startEdge) / step);

        // Handle edge cases (max value might fall exactly on last edge or slightly over due to precision)
        if (binIndex < 0) binIndex = 0;
        if (binIndex >= numBins) binIndex = numBins - 1;

        histogram[binIndex]++;
    });

    return {
        histogram,
        bins: binEdges, // These are raw values (e.g. -0.05, 0.0, 0.05)
        skew: isNaN(skew) ? 0 : skew,
        kurtosis: isNaN(kurtosis) ? 0 : kurtosis
    };
}

export function calculateDrawdownAnalysis(data) {
    if (!data || data.length < 2) return { max_drawdown: 0, avg_drawdown: 0, sortino: 0, var_95: 0 };

    let maxDrawdown = 0;
    let peak = -Infinity;

    // For Avg Drawdown: average of daily drawdowns (when in drawdown)
    // Or average of distinct drawdown periodic maximums?
    // "Avg Daily Drawdown" is a common simple interpretation: average of all 'dd' values where dd < 0.
    let drawdownSum = 0;
    let drawdownCount = 0;

    const drawdowns = [];

    data.forEach(pt => {
        const price = pt.close || pt.Close;
        if (price > peak) peak = price;
        const dd = (price - peak) / peak; // negative or 0

        if (dd < maxDrawdown) maxDrawdown = dd;

        // Track for average
        if (dd < 0) {
            drawdownSum += dd;
            drawdownCount++;
            drawdowns.push(dd); // Store all daily drawdowns
        }
    });

    // Average Drawdown (of days spent in drawdown)
    const avgDrawdown = drawdownCount > 0 ? drawdownSum / drawdownCount : 0;

    // --- Additional Risk Metrics ---

    // 1. Value at Risk (VaR) 95%
    // Sort daily returns and find the 5th percentile
    const returns = [];
    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1].close || data[i - 1].Close;
        const curr = data[i].close || data[i].Close;
        returns.push((curr - prev) / prev);
    }

    returns.sort((a, b) => a - b);
    const varIndex = Math.floor(returns.length * 0.05);
    const var95 = returns[varIndex] || 0;

    // 2. Sortino Ratio
    // (Mean Return - Target) / Downside Deviation
    // Target = 0 (Risk Free assumption for simplicity in this func, logic usually in finance.js but we can adding here)
    const meanRet = returns.reduce((a, b) => a + b, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVariance = downsideReturns.reduce((a, b) => a + Math.pow(b - 0, 2), 0) / returns.length; // Divide by total N, not just downside N
    const downsideDev = Math.sqrt(downsideVariance);

    // Annualize (Optional, but Ratios are usually annualized)
    // Assuming daily data (252)
    const annualizedReturn = meanRet * 252;
    const annualizedDownsideDev = downsideDev * Math.sqrt(252);

    const sortino = annualizedDownsideDev !== 0 ? annualizedReturn / annualizedDownsideDev : 0;

    return {
        max_drawdown: maxDrawdown,
        avg_drawdown: avgDrawdown,
        var_95: var95,
        sortino: sortino
    };
}

export function calculateCorrelationMatrix(data) {
    return {};
}
