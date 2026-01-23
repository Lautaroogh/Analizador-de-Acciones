import React from 'react';

const StatsGrid = ({ stats }) => {
    if (!stats) return null;

    const metrics = [
        { label: "Current Price", value: stats.current_price?.toFixed(2), unit: "$" },
        { label: "Total Return", value: stats.total_return_pct?.toFixed(2), unit: "%", color: true },
        { label: "Volatility (Ann.)", value: stats.annualized_volatility_pct?.toFixed(2), unit: "%" },
        { label: "Sharpe Ratio", value: stats.sharpe_ratio?.toFixed(2), unit: "" },
        { label: "Max Drawdown", value: stats.max_drawdown_pct?.toFixed(2), unit: "%", inverseColor: true },
    ];

    const getColor = (value, inverse = false) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "text-foreground";
        if (num > 0) return inverse ? "text-red-500" : "text-green-500";
        if (num < 0) return inverse ? "text-green-500" : "text-red-500";
        return "text-foreground";
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {metrics.map((metric, index) => (
                <div key={index} className="bg-card border border-border p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{metric.label}</div>
                    <div className={`text-2xl font-bold ${metric.color || metric.inverseColor ? getColor(metric.value, metric.inverseColor) : ''}`}>
                        {metric.value}{metric.unit}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;
