import React, { useState } from 'react';

// Tooltip Component
const MetricTooltip = ({ title, description, calculation }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block ml-2 z-20">
            <button
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-gray-400 hover:text-blue-400 transition-colors cursor-help align-middle"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {isVisible && (
                <div className="absolute left-0 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 top-6 z-50">
                    <h4 className="text-white font-semibold mb-1 text-xs">{title}</h4>
                    <p className="text-xs text-gray-300 mb-2 leading-snug">{description}</p>
                    {calculation && (
                        <div>
                            <p className="text-[10px] font-semibold text-blue-400 mb-0.5">Cálculo:</p>
                            <p className="text-[10px] text-gray-400 font-mono bg-gray-900 p-1 rounded">
                                {calculation}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const statExplanations = {
    totalReturn: {
        title: "Total Return",
        description: "Rendimiento porcentual total del activo en el período seleccionado.",
        calculation: "(Precio Final - Precio Inicial) / Precio Inicial"
    },
    volatility: {
        title: "Volatility (Volatilidad)",
        description: "Mide cuánto varía el precio día a día. Alta volatilidad implica mayor riesgo.",
        calculation: "Desv. Estándar Anualizada de Retornos Log."
    },
    sharpe: {
        title: "Sharpe Ratio",
        description: "Mide el retorno extra obtenido por cada unidad de riesgo asumido. >1 es bueno.",
        calculation: "(Retorno Anual - Tasa Libre 4%) / Volatilidad Anual"
    },
    maxDrawdown: {
        title: "Max Drawdown",
        description: "La mayor caída porcentual desde un máximo hasta un mínimo en el período.",
        calculation: "(Min - Pico) / Pico"
    }
};

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
        { label: "Current Price", value: metrics.currentPrice?.toFixed(2), unit: "$", key: null },
        {
            label: `Total Return (${displayPeriod})`,
            value: metrics.totalReturn?.toFixed(2),
            unit: "%",
            color: true,
            key: "totalReturn"
        }
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
        <div className="grid grid-cols-2 gap-4 mb-6">
            {statsItems.map((metric, index) => (
                <div key={index} className="bg-card border border-border p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1 flex items-center">
                        {metric.label}
                        {metric.key && statExplanations[metric.key] && (
                            <MetricTooltip {...statExplanations[metric.key]} />
                        )}
                    </div>
                    <div className={`text-2xl font-bold ${metric.isNegative ? 'text-red-400' : (metric.color ? getColor(metric.value) : '')}`}>
                        {metric.value}{metric.unit}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;
