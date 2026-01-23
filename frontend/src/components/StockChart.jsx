import React, { useState } from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    Legend
} from 'recharts';

const StockChart = ({ data }) => {
    const [chartType, setChartType] = useState('line'); // 'line' or 'candle' (candle requires more complex custom shape in Recharts, sticking to composed for now)

    // Format data for Recharts
    // data matches backend: { Date, Open, High, Low, Close, Volume, SMA_20, ... }

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
                <div className="flex gap-2">
                    {/* Chart controls could go here */}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                        <YAxis
                            yAxisId="right"
                            orientation="left"
                            tick={false}
                            axisLine={false}
                            width={0}
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
                            name="SMA 20"
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Upper_Band"
                            stroke="#82ca9d"
                            strokeDasharray="5 5"
                            dot={false}
                            strokeWidth={1}
                            name="Upper BB"
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Lower_Band"
                            stroke="#82ca9d"
                            strokeDasharray="5 5"
                            dot={false}
                            strokeWidth={1}
                            name="Lower BB"
                        />

                        <Bar
                            yAxisId="right"
                            dataKey="Volume"
                            fill="hsl(var(--muted))"
                            opacity={0.3}
                            name="Volume"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StockChart;
