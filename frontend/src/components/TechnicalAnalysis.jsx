import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const TechnicalAnalysis = ({ data }) => {
    if (!data) return <div className="text-center p-8 text-muted-foreground">No technical data available.</div>;

    const getSignal = (value, type) => {
        // Helper to determine signal color and text
        // Returns { color: 'text-green-500', icon: ..., text: '...' }
        // Logic can be complex, simplified here for display

        // Example logic
        if (type === 'RSI') {
            if (value > 70) return { color: 'text-red-500', icon: <ArrowDown />, text: 'Overbought' };
            if (value < 30) return { color: 'text-green-500', icon: <ArrowUp />, text: 'Oversold' };
            return { color: 'text-gray-400', icon: <Minus />, text: 'Neutral' };
        }
        if (type === 'MACD') {
            if (value.macd > value.signal) return { color: 'text-green-500', icon: <ArrowUp />, text: 'Bullish' };
            return { color: 'text-red-500', icon: <ArrowDown />, text: 'Bearish' };
        }
        if (type === 'Stoch') {
            if (value.k > 80) return { color: 'text-red-500', icon: <ArrowDown />, text: 'Overbought' };
            if (value.k < 20) return { color: 'text-green-500', icon: <ArrowUp />, text: 'Oversold' };
            return { color: 'text-gray-400', icon: <Minus />, text: 'Neutral' };
        }
        // Default
        return { color: 'text-gray-400', icon: <Minus />, text: 'Neutral' };
    };

    const IndicatorCard = ({ title, value, signal, notes, progress }) => (
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between">
            <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{value}</span>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${signal.color}`}>
                        {signal.icon}
                        {signal.text}
                    </div>
                </div>
                {progress !== undefined && (
                    <div className="w-full bg-secondary rounded-full h-2 mb-2">
                        <div
                            className={`h-2 rounded-full ${signal.color.replace('text', 'bg')}`}
                            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        ></div>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{notes}</p>
        </div>
    );

    const rsiSignal = getSignal(data.RSI, 'RSI');
    const macdSignal = getSignal(data.MACD, 'MACD');
    const stochSignal = getSignal(data.Stoch, 'Stoch');
    // ... others

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <IndicatorCard
                    title="RSI (14)"
                    value={data.RSI?.toFixed(2)}
                    signal={rsiSignal}
                    progress={data.RSI}
                    notes="Relative Strength Index. >70 Overbought, <30 Oversold."
                />
                <IndicatorCard
                    title="MACD (12, 26, 9)"
                    value={data.MACD?.macd?.toFixed(3)}
                    signal={macdSignal}
                    notes={`Signal: ${data.MACD?.signal?.toFixed(3)} | Hist: ${data.MACD?.hist?.toFixed(3)}`}
                />
                <IndicatorCard
                    title="Stochastic Oscillator"
                    value={`${data.Stoch?.k?.toFixed(1)}%`}
                    signal={stochSignal}
                    progress={data.Stoch?.k}
                    notes={`%K: ${data.Stoch?.k?.toFixed(1)} | %D: ${data.Stoch?.d?.toFixed(1)}`}
                />
                <IndicatorCard
                    title="Bollinger Bands"
                    value={`$${data.BB?.price?.toFixed(2)}`}
                    signal={{ color: 'text-blue-400', icon: <Minus />, text: 'Volatility' }}
                    notes={`Upper: ${data.BB?.high?.toFixed(2)} | Lower: ${data.BB?.low?.toFixed(2)}`}
                />
                <IndicatorCard
                    title="ADX (Trend Strength)"
                    value={data.ADX?.toFixed(2)}
                    signal={{ color: data.ADX > 25 ? 'text-green-500' : 'text-gray-400', icon: <ArrowUp />, text: data.ADX > 25 ? 'Strong Trend' : 'Weak Trend' }}
                    notes=">25 indicates strong trend"
                />
                <IndicatorCard
                    title="ATR (Volatility)"
                    value={data.ATR?.toFixed(2)}
                    signal={{ color: 'text-yellow-500', icon: <Minus />, text: 'Check Drawdown' }}
                    notes="Average True Range (Volatility measure)"
                />
                <IndicatorCard
                    title="CCI"
                    value={data.CCI?.toFixed(2)}
                    signal={data.CCI > 100 ? { color: 'text-red-500', text: 'Overbought', icon: <ArrowDown /> } : data.CCI < -100 ? { color: 'text-green-500', text: 'Oversold', icon: <ArrowUp /> } : { color: 'text-gray-500', text: 'Neutral', icon: <Minus /> }}
                    notes="Commodity Channel Index"
                />

                <IndicatorCard
                    title="Williams %R"
                    value={data.Williams?.toFixed(2)}
                    signal={data.Williams > -20 ? { color: 'text-red-500', text: 'Overbought', icon: <ArrowDown /> } : data.Williams < -80 ? { color: 'text-green-500', text: 'Oversold', icon: <ArrowUp /> } : { color: 'text-gray-500', text: 'Neutral', icon: <Minus /> }}
                    notes="Momentum indicator"
                />
                <IndicatorCard
                    title="OBV"
                    value={(data.OBV / 1000000)?.toFixed(1) + 'M'}
                    signal={{ color: 'text-blue-400', text: 'Volume', icon: <Minus /> }}
                    notes="On Balance Volume"
                />
            </div>
        </div>
    );
};

export default TechnicalAnalysis;
