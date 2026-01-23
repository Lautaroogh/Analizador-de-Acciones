import React, { useMemo } from 'react';
import { calculateTotalReturn, calculateSharpeRatio, calculateMaxDrawdown } from '../utils/finance';

const StatsGrid = ({ stats, data, period = "MAX" }) => {
    // We use the backend stats as a fallback or for 'Current Price', 
    // but specific risk metrics we calculate client-side to ensure they match the period exactly.

    // Memoize calculations
    const dynamicStats = useMemo(() => {
        if (!data || data.length === 0) return {};
        return {
            totalReturn: calculateTotalReturn(data),
            sharpeRatio: calculateSharpeRatio(data),
            maxDrawdown: calculateMaxDrawdown(data)
        };
    }, [data]);

    if (!stats) return null;

    // Helper to format period label
    const formatPeriod = (p) => {
        if (!p) return "MAX";
        return p.toUpperCase();
    }

    const displayPeriod = formatPeriod(period);

    const metrics = [
        { label: "Current Price", value: stats.current_price?.toFixed(2), unit: "$" },
        {
            label: `Total Return (${displayPeriod})`,
            value: dynamicStats.totalReturn !== undefined ? dynamicStats.totalReturn.toFixed(2) : stats.total_return_pct?.toFixed(2),
            unit: "%",
            color: true
        },
        {
            label: "Volatility (Ann.)",
            value: stats.annualized_volatility_pct?.toFixed(2),
            unit: "%"
        },
        {
            label: `Sharpe Ratio (${displayPeriod})`,
            value: dynamicStats.sharpeRatio !== undefined ? dynamicStats.sharpeRatio.toFixed(2) : stats.sharpe_ratio?.toFixed(2),
            unit: ""
        },
        {
            label: `Max Drawdown (${displayPeriod})`,
            value: dynamicStats.maxDrawdown !== undefined ? dynamicStats.maxDrawdown.toFixed(2) : stats.max_drawdown_pct?.toFixed(2),
            unit: "%",
            isNegative: true
        },
    ];

    const getColor = (value, inverse = false, isNegative = false) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "text-foreground";

        // Priority 4: Max Drawdown always red (negative implication)
        if (isNegative) return "text-red-400";

        if (num > 0) return inverse ? "text-red-500" : "text-green-500";
        if (num < 0) return inverse ? "text-green-500" : "text-red-500";
        return "text-foreground";
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <div key={index} className="bg-card border border-border p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{metric.label}</div>
                    <div className={`text-2xl font-bold ${metric.isNegative ? 'text-red-400' : (metric.color || metric.inverseColor ? getColor(metric.value, metric.inverseColor) : '')}`}>
                        {metric.value}{metric.unit}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;
