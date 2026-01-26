import React, { useState, useEffect } from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    Legend
} from 'recharts';

const StockChart = ({ data, period, onPeriodChange }) => {

    const periods = ['1mo', '3mo', '6mo', '1y', '5y', 'max'];
    const periodLabels = {
        '1mo': '1M', '3mo': '3M', '6mo': '6M', '1y': '1Y', '5y': '5Y', 'max': 'MAX'
    };

    const filterData = (rawData, currentPeriod) => {
        if (!rawData || rawData.length === 0) return [];
        // Handle case sensitivity
        const p = currentPeriod.toLowerCase();
        if (p === 'max') return rawData;

        const now = new Date();
        const cutoff = new Date();

        switch (p) {
            case '1mo':
            case '1m':
                cutoff.setMonth(now.getMonth() - 1); break;
            case '3mo':
            case '3m':
                cutoff.setMonth(now.getMonth() - 3); break;
            case '6mo':
            case '6m':
                cutoff.setMonth(now.getMonth() - 6); break;
            case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
            case '5y': cutoff.setFullYear(now.getFullYear() - 5); break;
            default: return rawData;
        }

        return rawData.filter(item => new Date(item.date) >= cutoff);
    };

    // OPTIMIZATION: Downsample data for large datasets
    const optimizeDataForChart = (rawData, currentPeriod) => {
        // 1. Filter by date first
        const filtered = filterData(rawData, currentPeriod);

        if (filtered.length === 0) return [];

        // 2. Downsample if needed
        const maxPoints = 500;
        if (filtered.length <= maxPoints) return filtered;

        const step = Math.ceil(filtered.length / maxPoints);
        return filtered.filter((_, index) => index % step === 0);
    };

    const [chartData, setChartData] = useState([]);
    const [isChartLoading, setIsChartLoading] = useState(false);

    useEffect(() => {
        setIsChartLoading(true);
        // Simulate a small delay or just process
        const timer = setTimeout(() => {
            const optimized = optimizeDataForChart(data, period);
            console.log("StockChart optimized data:", optimized?.length, "Period:", period);
            if (optimized && optimized.length > 0) {
                console.log("First point:", optimized[0]);
                console.log("Last point:", optimized[optimized.length - 1]);
            }
            setChartData(optimized);
            setIsChartLoading(false);
        }, 50); // Small processing delay to allow UI to show loading if needed
        return () => clearTimeout(timer);
    }, [data, period]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border p-3 rounded shadow-md text-sm">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.stroke || entry.fill }}>
                            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card border border-border rounded-lg p-4 h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Price History & Indicators</h3>

                {/* Time Range Selectors */}
                <div className="flex gap-1 bg-secondary/30 p-1 rounded-md">
                    {periods.map((p) => (
                        <button
                            key={p}
                            onClick={() => onPeriodChange && onPeriodChange(p)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-all ${period === p
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                {isChartLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                                dataKey="date" // Consistent lowercase 'date'
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                minTickGap={30}
                                tickFormatter={(str) => {
                                    // Robust date formatting
                                    try {
                                        return new Date(str).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                                    } catch (e) { return str; }
                                }}
                            />
                            <YAxis
                                yAxisId="left"
                                domain={['auto', 'auto']}
                                orientation="right"
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            />

                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="close" // Consistent lowercase 'close'
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorClose)"
                                name="Price"
                            />

                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="SMA_20"
                                stroke="#ff7300"
                                dot={false}
                                strokeWidth={1.5}
                                connectNulls={true}
                                name="SMA 20"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p>No hay datos disponibles para mostrar</p>
                            <p className="text-sm mt-2">Intenta seleccionar otro período</p>
                            {/* Debug info in UI if needed, or check Console */}
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
};

export default StockChart;
