import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

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

    const distChartData = distribution.histogram.map((count, i) => ({
        range: `${(distribution.bins[i] * 100).toFixed(1)}%`,
        count: count
    }));

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
                        <BarChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
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
                        <BarChart data={dailyChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
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
                <div className="col-span-1 md:col-span-2 bg-card border border-border rounded-lg p-6 h-80">
                    <h3 className="text-lg font-semibold mb-4">Return Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distChartData}>
                            <XAxis dataKey="range" tick={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }} />
                            <Bar dataKey="count" fill="#3b82f6" name="Days" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="col-span-1 bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-border pb-2">
                            <span className="text-muted-foreground">Max Drawdown</span>
                            {/* Priority 2/4: Max Drawdown in RED */}
                            <span className="font-bold text-red-500">{(drawdowns.max_drawdown * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                            <span className="text-muted-foreground">Avg Drawdown</span>
                            <span className="font-bold text-red-500 text-xs">N/A (Update to V4 for Avg)</span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                            <span className="text-muted-foreground">Skewness</span>
                            <span className="font-mono">{distribution.skew.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                            <span className="text-muted-foreground">Kurtosis</span>
                            <span className="font-mono">{distribution.kurtosis.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
