import React from 'react';

const Ratios = ({ data }) => {
    if (!data || Object.keys(data).length === 0) return <div className="p-8 text-center text-muted-foreground">No fundamental data available (likely an ETF or Crypto).</div>;

    const sections = [
        { key: "Valuation", title: "Valuation", color: "border-blue-500" },
        { key: "Profitability", title: "Profitability", color: "border-green-500" },
        { key: "Liquidity & Debt", title: "Liquidity & Debt", color: "border-purple-500" },
        { key: "Cash Flow", title: "Cash Flow", color: "border-teal-500" },
        { key: "Growth", title: "Growth", color: "border-yellow-500" },
        { key: "Dividends", title: "Dividends", color: "border-pink-500" },
        { key: "Analyst Targets", title: "Analyst Estimates", color: "border-indigo-500" },
        { key: "Short Info", title: "Short Interest", color: "border-red-400" },
        { key: "General", title: "General Info", color: "border-gray-500" },
    ];

    const formatValue = (val) => {
        if (val === "N/A" || val === null || val === undefined) return "N/A";
        if (typeof val === 'number') {
            if (val > 1000000000) return (val / 1000000000).toFixed(2) + 'B';
            if (val > 1000000) return (val / 1000000).toFixed(2) + 'M';
            // Check if it looks like a ratio or percentage
            if (Math.abs(val) < 10 && val !== parseInt(val)) return val.toFixed(2);
            // Assume percentage if key implies? Hard to guess strictly from value.
            // Relying on backend naming conventions in future, but for now raw numbers.
            return val.toFixed(2);
        }
        return val;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map(section => (
                data[section.key] && (
                    <div key={section.key} className={`bg-card border-l-4 ${section.color} border-y border-r border-border rounded-lg p-5`}>
                        <h3 className="text-lg font-bold mb-4">{section.title}</h3>
                        <div className="space-y-3">
                            {Object.entries(data[section.key]).map(([label, value]) => (
                                <div key={label} className="flex justify-between items-center border-b border-border/50 pb-1 last:border-0 last:pb-0">
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                    <span className={`font-mono font-medium ${value === "N/A" ? "text-muted" : "text-foreground"
                                        }`}>
                                        {formatValue(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
};

export default Ratios;
