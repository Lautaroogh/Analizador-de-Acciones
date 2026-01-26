import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

// Tooltip Component (Active for Risk Metrics)
const MetricTooltip = ({ title, description, calculation }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block ml-2 z-10">
            <button
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-gray-400 hover:text-blue-400 transition-colors cursor-help"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {isVisible && (
                <div className="absolute right-0 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 bottom-6 z-50">
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

const riskExplanations = {
    maxDrawdown: {
        title: "Max Drawdown",
        description: "La mayor caída porcentual desde un pico hasta un valle en el período.",
        calculation: "(Min - Pico) / Pico"
    },
    avgDrawdown: {
        title: "Avg Drawdown",
        description: "La profundidad promedio de las caídas diarias durante períodos negativos.",
        calculation: "Promedio(Caídas Diarias < 0)"
    },
    var95: {
        title: "Value at Risk (95%)",
        description: "La pérdida máxima diaria esperada con un 95% de confianza.",
        calculation: "Percentil 5 de retornos diarios"
    },
    sortino: {
        title: "Sortino Ratio",
        description: "Mide el rendimiento ajustado por el riesgo a la baja (volatilidad negativa).",
        calculation: "Retorno Anualizado / Desv. Bajista Anualizada"
    },
    skewness: {
        title: "Skewness (Asimetría)",
        description: "Indica hacia dónde se inclina la distribución de retornos. Negativo = más caídas fuertes.",
        calculation: "3er Momento / Desv.Est^3"
    },
    kurtosis: {
        title: "Kurtosis (Curtosis)",
        description: "Mide la frecuencia de eventos extremos ('colas gordas'). Alto = más riesgo de sorpresas.",
        calculation: "(4to Momento / Desv.Est^4) - 3"
    }
};

const Statistics = ({ data }) => {
    if (!data) return <div className="p-8 text-center text-muted-foreground">Cargando estadística...</div>;

    // De-structure from backend response
    const { seasonality, distribution, drawdowns } = data;

    // Prepare Heatmap Data
    const years = seasonality.monthly_heatmap.index;
    const heatmapData = seasonality.monthly_heatmap.data;
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsFull = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const getHeatmapColor = (val) => {
        if (val === 0) return 'bg-gray-800';
        if (val > 0) return `rgba(34, 197, 94, ${Math.min(val * 8, 1)})`; // Green
        else return `rgba(239, 68, 68, ${Math.min(Math.abs(val) * 8, 1)})`; // Red
    };

    // Prepare Charts with Full Names for Tooltips
    const monthlyChartData = Object.entries(seasonality.avg_monthly).map(([m, val]) => ({
        name: monthsShort[parseInt(m) - 1],
        fullName: monthsFull[parseInt(m) - 1], // Added for tooltip
        value: val * 100
    }));

    const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const daysFull = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    // Backend avg_daily keys might be 0-6. Let's assume 0=Mon for now or check backend.
    const dailyChartData = Object.entries(seasonality.avg_daily)
        .filter(([d]) => d < 5) // Exclude Sat/Sun if present
        .map(([d, val]) => ({
            name: daysShort[parseInt(d)],
            fullName: daysFull[parseInt(d)], // Added for tooltip
            value: val // Already percent from backend
        }));

    const getColorForReturn = (returnValue) => {
        if (returnValue <= -5) return '#dc2626';  // Rojo muy oscuro
        if (returnValue <= -3) return '#ef4444';  // Rojo oscuro
        if (returnValue <= -1) return '#f87171';  // Rojo medio
        if (returnValue < 0) return '#fca5a5';    // Rojo claro
        if (returnValue === 0) return '#6b7280';  // Gris neutral
        if (returnValue < 1) return '#86efac';    // Verde claro
        if (returnValue < 3) return '#4ade80';    // Verde medio
        if (returnValue < 5) return '#22c55e';    // Verde oscuro
        return '#16a34a';                          // Verde muy oscuro
    };

    const distChartData = distribution.histogram.map((count, i) => {
        // bins[i] is start edge, bins[i+1] is end edge (raw logic returns)
        // Convert to percentage
        const start = distribution.bins[i] * 100;
        const end = distribution.bins[i + 1] * 100;
        const midpoint = (start + end) / 2;

        return {
            rangeStart: start.toFixed(2),
            rangeEnd: end.toFixed(2),
            midpoint: midpoint.toFixed(2),
            count: count
        };
    });

    // Detailed Tooltip Component
    const CustomBarTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const value = data.value;
            const label = data.fullName || data.name; // Use Full Name if available
            const color = value >= 0 ? '#4ade80' : '#f87171'; // Green or Red

            return (
                <div className="bg-popover border border-border p-2 rounded shadow-md">
                    <p style={{ color }} className="font-semibold">
                        {label}: {value >= 0 ? '+' : ''}{value.toFixed(2)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">

            {/* 1. HEATMAP (No Date Selectors in V3) */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Returns Heatmap</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 text-left">Year</th>
                                {monthsShort.map(m => <th key={m} className="p-2">{m}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {years.map((year, i) => (
                                <tr key={year}>
                                    <td className="font-medium p-2 border-t border-border">{year}</td>
                                    {heatmapData[i].map((val, j) => (
                                        <td
                                            key={j}
                                            className="p-2 text-center border border-border/20"
                                            style={{ backgroundColor: getHeatmapColor(val), color: val ? 'white' : 'transparent' }}
                                        >
                                            {val ? (val * 100).toFixed(1) + '%' : ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6 h-80">
                    <h3 className="text-lg font-semibold mb-4">Avg Monthly Performance</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                            <Bar dataKey="value" name="Return %">
                                {monthlyChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#4ade80' : '#f87171'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 h-80">
                    <h3 className="text-lg font-semibold mb-4">Avg Daily Performance</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                            <Bar dataKey="value" name="Return %">
                                {dailyChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#4ade80' : '#f87171'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 bg-card border border-border rounded-lg p-6 h-96">
                    <h3 className="text-lg font-semibold mb-4">Return Distribution</h3>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-xs justify-center md:justify-start">
                        <span className="text-gray-400 font-semibold">Leyenda:</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                            <span className="text-gray-400">≤ -5%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f87171' }}></div>
                            <span className="text-gray-400">-5% a -1%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6b7280' }}></div>
                            <span className="text-gray-400">~0%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#86efac' }}></div>
                            <span className="text-gray-400">0% a 1%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                            <span className="text-gray-400">1% a 5%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#16a34a' }}></div>
                            <span className="text-gray-400">&gt; 5%</span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={distChartData} margin={{ top: 5, bottom: 20 }}>
                            <XAxis
                                dataKey="midpoint"
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                tickFormatter={(value) => `${value}%`}
                                label={{
                                    value: 'Retorno diario (%)',
                                    position: 'insideBottom',
                                    offset: -10,
                                    style: { fill: '#9ca3af', fontSize: 12 }
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        // Calculate percentage of total days
                                        const totalDays = distChartData.reduce((acc, curr) => acc + curr.count, 0);
                                        const percentage = ((d.count / totalDays) * 100).toFixed(1);

                                        return (
                                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
                                                <p className="text-white font-semibold mb-1">
                                                    Rango: {d.rangeStart}% a {d.rangeEnd}%
                                                </p>
                                                <p className="text-blue-400 text-sm">
                                                    Frecuencia: {d.count} días
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {percentage}% del período analizado
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" name="Days">
                                {distChartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getColorForReturn(parseFloat(entry.midpoint))}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="col-span-1 bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-1">Risk Metrics</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                        (Calculado según el período seleccionado)
                    </p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <div className="flex items-center">
                                <span className="text-muted-foreground">Max Drawdown</span>
                                <MetricTooltip {...riskExplanations.maxDrawdown} />
                            </div>
                            <span className="font-bold text-red-500">{(drawdowns.max_drawdown * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <div className="flex items-center">
                                <span className="text-muted-foreground">Avg Drawdown</span>
                                <MetricTooltip {...riskExplanations.avgDrawdown} />
                            </div>
                            <span className="font-bold text-red-400">{(drawdowns.avg_drawdown * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <div className="flex items-center">
                                <span className="text-muted-foreground">VaR (95%)</span>
                                <MetricTooltip {...riskExplanations.var95} />
                            </div>
                            <span className="font-bold text-red-400">{(drawdowns.var_95 * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <div className="flex items-center">
                                <span className="text-muted-foreground">Sortino Ratio</span>
                                <MetricTooltip {...riskExplanations.sortino} />
                            </div>
                            <span className="font-mono">{drawdowns.sortino?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <div className="flex items-center">
                                <span className="text-muted-foreground">Skewness</span>
                                <MetricTooltip {...riskExplanations.skewness} />
                            </div>
                            <span className="font-mono">{distribution.skew.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <div className="flex items-center">
                                <span className="text-muted-foreground">Kurtosis</span>
                                <MetricTooltip {...riskExplanations.kurtosis} />
                            </div>
                            <span className="font-mono">{distribution.kurtosis.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
