import React, { useState } from 'react';
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
    // Priority 1 & 5
    // Removed Volume Bar, Upper_Band, Lower_Band
    // Added Period Selectors

    const periods = ['3mo', '6mo', '1y', '5y', 'max'];
    const periodLabels = {
        '3mo': '3M', '6mo': '6M', '1y': '1Y', '5y': '5Y', 'max': 'MAX'
    };

    // OPTIMIZATION: Downsample data for large datasets
    const optimizeDataForChart = (rawData, currentPeriod) => {
        if (!rawData || rawData.length === 0) return [];

        // No sampling for short periods
        if (['3mo'].includes(currentPeriod)) return rawData;

        const maxPoints = 500;
        if (rawData.length <= maxPoints) return rawData;

        const step = Math.ceil(rawData.length / maxPoints);
        return rawData.filter((_, index) => index % step === 0);
    };

    const [chartData, setChartData] = useState([]);
    const [isChartLoading, setIsChartLoading] = useState(false);

    React.useEffect(() => {
        setIsChartLoading(true);
        // Simulate a small delay or just process
        const timer = setTimeout(() => {
            setChartData(optimizeDataForChart(data, period));
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
                ) : (
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
                                dataKey="Date"
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                minTickGap={30}
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
                                dataKey="Close"
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

                            {/* 
                            Removed Volume Bar, UpperBB, LowerBB as requested 
                            This significantly improves render performance by reducing SVG nodes.
                        */}

                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

    );
};

export default StockChart;
