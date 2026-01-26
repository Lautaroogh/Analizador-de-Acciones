export function calculateMonthlyReturnsHeatmap(data) {
    if (!data || data.length === 0) return { index: [], data: [] };

    // Organize by Year -> Month
    const returnsByYear = {}; // { 2020: { 0: 0.05, 1: -0.02, ... } }

    // Sort data chronologically first
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate monthly returns
    // We need start and end price of each month
    // Strategy: Group prices by month, take first and last
    const monthlyPrices = {}; // { "2020-0": [prices...], "2020-1": ... }

    sortedData.forEach(day => {
        const date = new Date(day.date);
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

    // Format for Heatmap (years as rows, months as cols)
    const years = Object.keys(returnsByYear).sort().map(Number);
    const heatmapData = years.map(year => returnsByYear[year]);

    return { index: years, data: heatmapData };
}

export function calculateAvgMonthlyPerformance(data) {
    // Similar to heatmap but average by month index (0-11)
    if (!data || data.length === 0) return {};

    const returnsByMonthInfo = {}; // { 0: [], 1: [] ... }

    // Reuse logic to get monthly returns first
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const monthlyPrices = {};

    sortedData.forEach(day => {
        const date = new Date(day.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyPrices[key]) monthlyPrices[key] = [];
        monthlyPrices[key].push(day.close || day.Close);
    });

    // Calculate return for each specific month-year instance
    Object.entries(monthlyPrices).forEach(([key, prices]) => {
        const [_, month] = key.split('-').map(Number);
        const first = prices[0];
        const last = prices[prices.length - 1];
        const ret = (last - first) / first;

        if (!returnsByMonthInfo[month]) returnsByMonthInfo[month] = [];
        returnsByMonthInfo[month].push(ret);
    });

    // Average them
    const avgMonthly = {};
    for (let m = 0; m < 12; m++) {
        const rets = returnsByMonthInfo[m] || [];
        const avg = rets.length > 0 ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
        avgMonthly[m + 1] = avg; // Backend used 1-based index string usually? 
        // frontend expects object keys 1..12 or 0..11? 
        // Statistics.jsx uses: monthsShort[parseInt(m) - 1] so it expects keys "1", "2"... "12"
    }

    return avgMonthly;
}

export function calculateAvgDailyPerformance(data) {
    if (!data || data.length < 2) return {};

    const returnsByDay = { 0: [], 1: [], 2: [], 3: [], 4: [] }; // Mon-Fri

    for (let i = 1; i < data.length; i++) {
        const date = new Date(data[i].date);
        const day = date.getDay(); // 0=Sun, 1=Mon... 6=Sat

        // Skip weekends
        if (day === 0 || day === 6) continue;

        // Map JS day to 0=Mon, 4=Fri logic if needed, or just use 1-5
        // Statistics.jsx expects keys 0..4 (Mon..Fri) based on "daysShort[parseInt(d)]"
        // JS: 1=Mon, 5=Fri. So index = day - 1.
        const index = day - 1;

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
        avgDaily[idx] = rets.length > 0 ? (rets.reduce((a, b) => a + b, 0) / rets.length) * 100 : 0; // Return as percentage directly to match existing
    });

    return avgDaily;
}

export function calculateDistributionOfReturns(data, bins = 20) {
    if (!data || data.length < 2) return { histogram: [], bins: [], skew: 0, kurtosis: 0 };

    const dailyReturns = [];
    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1].close || data[i - 1].Close;
        const curr = data[i].close || data[i].Close;
        if (prev) dailyReturns.push((curr - prev) / prev);
    }

    if (dailyReturns.length === 0) return { histogram: [], bins: [], skew: 0, kurtosis: 0 };

    // Histogram
    const min = Math.min(...dailyReturns);
    const max = Math.max(...dailyReturns);
    const range = max - min;
    const step = range / bins;

    const histogram = new Array(bins).fill(0);
    const binEdges = [];

    for (let i = 0; i <= bins; i++) {
        binEdges.push(min + i * step);
    }

    dailyReturns.forEach(ret => {
        let binIndex = Math.floor((ret - min) / step);
        if (binIndex >= bins) binIndex = bins - 1; // max value goes to last bin
        histogram[binIndex]++;
    });

    // Moments
    const n = dailyReturns.length;
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / n;

    // Standard deviation
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Skewness
    const m3 = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
    const skew = m3 / Math.pow(stdDev, 3);

    // Kurtosis (Fisher's definition: normal = 0, so subtract 3)
    const m4 = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
    const kurtosis = (m4 / Math.pow(stdDev, 4)) - 3;

    return {
        histogram,
        bins: binEdges,
        skew: isNaN(skew) ? 0 : skew,
        kurtosis: isNaN(kurtosis) ? 0 : kurtosis
    };
}

export function calculateDrawdownAnalysis(data) {
    if (!data || data.length < 2) return { max_drawdown: 0 };

    // We already have max_drawdown in finance.js, but let's re-use or re-implement if needed for stats structure
    // Stats tab expects { drawdowns: { max_drawdown: X } }

    let maxDrawdown = 0;
    let peak = -Infinity;

    data.forEach(pt => {
        const price = pt.close || pt.Close;
        if (price > peak) peak = price;
        const dd = (price - peak) / peak;
        if (dd < maxDrawdown) maxDrawdown = dd;
    });

    return { max_drawdown: maxDrawdown };
}

// Placeholder for Correlation if we only have 1 asset, meaningful only with benchmark
// For now returns mock or empty
export function calculateCorrelationMatrix(data) {
    return {};
}
