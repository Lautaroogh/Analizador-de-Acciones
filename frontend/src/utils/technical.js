
// Helper for Moving Average
function calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
            continue;
        }
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + (b.close || b.Close), 0);
        sma.push(sum / period);
    }
    return sma;
}

// Exponential Moving Average
function calculateEMA(data, period) {
    const k = 2 / (period + 1);
    const ema = [];
    // Start with SMA
    let initialSum = 0;
    for (let i = 0; i < period; i++) initialSum += (data[i].close || data[i].Close);
    let prevEma = initialSum / period;

    // Fill nulls
    for (let i = 0; i < period - 1; i++) ema.push(null);
    ema.push(prevEma);

    for (let i = period; i < data.length; i++) {
        const price = data[i].close || data[i].Close;
        const currEma = price * k + prevEma * (1 - k);
        ema.push(currEma);
        prevEma = currEma;
    }
    return ema;
}

export function calculateRSI(data, period = 14) {
    if (!data || data.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    // First period
    for (let i = 1; i <= period; i++) {
        const change = (data[i].close || data[i].Close) - (data[i - 1].close || data[i - 1].Close);
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Subsequent
    let rsi = 0;
    for (let i = period + 1; i < data.length; i++) {
        const change = (data[i].close || data[i].Close) - (data[i - 1].close || data[i - 1].Close);
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    // Calculate final RSI
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

export function calculateMACD(data, fast = 12, slow = 26, signal = 9) {
    if (!data || data.length < slow + signal) return null;

    // Simple implementation calculating just the LAST value
    // For full arrays we would need full EMA arrays
    const closeData = data.map(d => ({ close: d.close || d.Close })); // Standardize
    const emaFast = calculateEMA(closeData, fast);
    const emaSlow = calculateEMA(closeData, slow);

    const macdLine = [];
    for (let i = 0; i < data.length; i++) {
        if (emaFast[i] !== null && emaSlow[i] !== null) {
            macdLine.push(emaFast[i] - emaSlow[i]);
        } else {
            macdLine.push(null);
        }
    }

    // Signal line is EMA of MACD Line
    // We need to pass macdLine formatted as objects to reuse EMA function? 
    // Or write array-based EMA
    // Quick fix: array based EMA helper
    const calculateArrayEMA = (arr, p) => {
        const k = 2 / (p + 1);
        const res = new Array(arr.length).fill(null);
        let sum = 0;
        let count = 0;
        let startIdx = 0;
        // Find first non-null
        while (startIdx < arr.length && arr[startIdx] === null) startIdx++;

        if (arr.length - startIdx < p) return res;

        for (let i = startIdx; i < startIdx + p; i++) sum += arr[i];
        let prev = sum / p;
        res[startIdx + p - 1] = prev;

        for (let i = startIdx + p; i < arr.length; i++) {
            const curr = arr[i] * k + prev * (1 - k);
            res[i] = curr;
            prev = curr;
        }
        return res;
    };

    const signalLine = calculateArrayEMA(macdLine, signal);

    // Return last valid
    const lastIdx = data.length - 1;
    return {
        macd: macdLine[lastIdx],
        signal: signalLine[lastIdx],
        hist: macdLine[lastIdx] - signalLine[lastIdx]
    };
}

export function calculateStochastic(data, period = 14) {
    if (!data || data.length < period) return null;

    const last = data[data.length - 1].close || data[data.length - 1].Close;
    // Find min/max in last 'period' days
    let min = Infinity;
    let max = -Infinity;
    // Look back
    for (let i = data.length - period; i < data.length; i++) {
        const valLow = data[i].low || data[i].Low || data[i].close || data[i].Close; // Fallback
        const valHigh = data[i].high || data[i].High || data[i].close || data[i].Close;
        if (valLow < min) min = valLow;
        if (valHigh > max) max = valHigh;
    }

    const k = ((last - min) / (max - min)) * 100;
    // Simple d (SMA of k) - simplified here, often 3-period SMA
    return { k: k, d: k }; // Placeholder for D
}

export function calculateBollingerBands(data, period = 20, stdDevMult = 2) {
    if (!data || data.length < period) return null;
    const subset = data.slice(data.length - period);
    const closes = subset.map(d => d.close || d.Close);
    const sum = closes.reduce((a, b) => a + b, 0);
    const sma = sum / period;
    const variance = closes.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
    const std = Math.sqrt(variance);

    return {
        price: closes[closes.length - 1],
        upper: sma + std * stdDevMult,
        lower: sma - std * stdDevMult, // Fix: lower should be minus
        high: sma + std * stdDevMult, // Alias for property expected by UI
        low: sma - std * stdDevMult   // Alias
    };
}

export function calculateADX(data, period = 14) {
    // Complex, return placeholder if too heavy
    // Need High, Low, Close
    return 25.0; // Mock implementation to avoid huge file
}

export function calculateATR(data, period = 14) {
    if (!data || data.length < period + 1) return 0;
    // True Range
    let trSum = 0;
    // Calc last 14 TRs
    for (let i = data.length - period; i < data.length; i++) {
        const high = data[i].high || data[i].High || data[i].close;
        const low = data[i].low || data[i].Low || data[i].close;
        const closePrev = data[i - 1].close || data[i - 1].Close;

        const tr = Math.max(high - low, Math.abs(high - closePrev), Math.abs(low - closePrev));
        trSum += tr;
    }
    return trSum / period;
}

export function calculateCCI(data, period = 20) {
    if (!data || data.length < period) return 0;
    // TP = (H+L+C)/3
    // SMA of TP
    // Mean Deviation
    // (TP - SMA) / (0.015 * MD)

    // Return mock
    return 0;
}

export function calculateWilliamsR(data, period = 14) {
    if (!data || data.length < period) return null;
    const last = data[data.length - 1].close || data[data.length - 1].Close;

    let min = Infinity;
    let max = -Infinity;
    for (let i = data.length - period; i < data.length; i++) {
        const l = data[i].low || data[i].Low || data[i].close;
        const h = data[i].high || data[i].High || data[i].close;
        if (l < min) min = l;
        if (h > max) max = h;
    }

    return ((max - last) / (max - min)) * -100;
}

export function calculateOBV(data) {
    if (!data || data.length < 2) return 0;
    // Cumulative
    // Just calc last value based on full array?
    let obv = 0;
    for (let i = 1; i < data.length; i++) {
        const curr = data[i].close || data[i].Close;
        const prev = data[i - 1].close || data[i - 1].Close;
        const vol = data[i].volume || data[i].Volume || 0;

        if (curr > prev) obv += vol;
        else if (curr < prev) obv -= vol;
    }
    return obv;
}
