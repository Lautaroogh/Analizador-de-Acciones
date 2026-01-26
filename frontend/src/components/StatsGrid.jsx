import React from 'react';

const StatsGrid = ({ metrics, period = "MAX" }) => {
    // Now receives pre-calculated metrics from App.jsx based on chartPeriod.

    if (!metrics) return null;

    // Helper to format period label
    const formatPeriod = (p) => {
        if (!p) return "";
        return p.toUpperCase();
    }

    const displayPeriod = formatPeriod(period);

    const statsItems = [
        { label: "Current Price", value: metrics.currentPrice?.toFixed(2), unit: "$" },
        {
            label: `Total Return (${displayPeriod})`,
            value: metrics.totalReturn?.toFixed(2),
            unit: "%",
            color: true
        },
        {
            label: `Volatility (${displayPeriod})`,
            value: metrics.volatility?.toFixed(2),
            unit: "%"
        },
        {
            label: `Sharpe Ratio (${displayPeriod})`,
            value: metrics.sharpeRatio?.toFixed(2),
            unit: ""
        },
        {
            label: `Max Drawdown (${displayPeriod})`,
            value: metrics.maxDrawdown?.toFixed(2),
            unit: "%",
            isNegative: true
        },
    ];

    const getColor = (value, isNegative = false) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "text-foreground";

        // Priority: Max Drawdown always red/negative color logic
        if (isNegative) return "text-red-400";

        if (num > 0) return "text-green-500";
        if (num < 0) return "text-red-500";
        return "text-foreground";
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {statsItems.map((metric, index) => (
                <div key={index} className="bg-card border border-border p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{metric.label}</div>
                    <div className={`text-2xl font-bold ${metric.isNegative ? 'text-red-400' : (metric.color ? getColor(metric.value) : '')}`}>
                        {metric.value}{metric.unit}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;
