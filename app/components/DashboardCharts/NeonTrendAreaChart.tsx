import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface NeonTrendAreaChartProps {
    data: any[];
    areas: string[];
    title?: string;
    yAxisFormatter?: (value: number) => string;
    xAxisKey?: string;
    searchType?: string;
}

const neonAreaColors = [
    { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)', glow: 'rgba(59, 130, 246, 0.3)' }, // Blue
    { line: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', glow: 'rgba(16, 185, 129, 0.3)' }, // Green
    { line: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)', glow: 'rgba(236, 72, 153, 0.3)' }, // Pink
    { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)', glow: 'rgba(139, 92, 246, 0.3)' }, // Purple
    { line: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', glow: 'rgba(6, 182, 212, 0.3)' }, // Cyan
    { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', glow: 'rgba(245, 158, 11, 0.3)' }, // Amber
    { line: '#6366f1', fill: 'rgba(99, 102, 241, 0.15)', glow: 'rgba(99, 102, 241, 0.3)' }, // Indigo
    { line: '#14b8a6', fill: 'rgba(20, 184, 166, 0.15)', glow: 'rgba(20, 184, 166, 0.3)' }, // Teal
    { line: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)', glow: 'rgba(244, 63, 94, 0.3)' }, // Rose
    { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.15)', glow: 'rgba(34, 197, 94, 0.3)' }, // Emerald
    { line: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)', glow: 'rgba(168, 85, 247, 0.3)' }, // Violet
    { line: '#0ea5e9', fill: 'rgba(14, 165, 233, 0.15)', glow: 'rgba(14, 165, 233, 0.3)' }  // Sky Blue
];

const NeonTrendAreaChart = ({
    data,
    areas,
    title = 'Area Sales Trend',
    yAxisFormatter,
    xAxisKey = 'period',
    searchType = 'amount'
}: NeonTrendAreaChartProps) => {
    const [hiddenAreas, setHiddenAreas] = useState<string[]>([]);

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                No data available
            </div>
        );
    }

    const handleLegendClick = (areaName: string) => {
        setHiddenAreas(prev =>
            prev.includes(areaName)
                ? prev.filter(a => a !== areaName)
                : [...prev, areaName]
        );
    };

    const isQuantity = searchType === 'quantity';

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                    <defs>
                        {areas.map((areaName: string, index: number) => {
                            const colorSet = neonAreaColors[index % neonAreaColors.length];
                            const idSafe = (`gradient-${areaName}`).replace(/[^a-z0-9-_]/gi, '-');
                            const glowId = (`glow-${areaName}`).replace(/[^a-z0-9-_]/gi, '-');
                            return (
                                <React.Fragment key={areaName}>
                                    <linearGradient
                                        id={idSafe}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="0%" stopColor={colorSet.line} stopOpacity={0.28} />
                                        <stop offset="60%" stopColor={colorSet.fill} stopOpacity={0.15} />
                                        <stop offset="100%" stopColor={colorSet.fill} stopOpacity={0.03} />
                                    </linearGradient>

                                    <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
                                        <feGaussianBlur in="SourceGraphic" stdDeviation="28" result="blur" />
                                        <feFlood floodColor={colorSet.glow || colorSet.line} floodOpacity="1" result="color" />
                                        <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
                                        <feGaussianBlur in="coloredBlur" stdDeviation="12" result="soft" />
                                        <feComponentTransfer in="soft" result="boosted">
                                            <feFuncA type="table" tableValues="0 0.95" />
                                        </feComponentTransfer>
                                        <feMerge>
                                            <feMergeNode in="boosted" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </React.Fragment>
                            );
                        })}
                    </defs>

                    <CartesianGrid
                        stroke="#e5e7eb"
                        strokeDasharray="3 3"
                        vertical={false}
                    />

                    <XAxis
                        dataKey={xAxisKey}
                        axisLine={{ stroke: '#d1d5db' }}
                        tick={(props) => {
                            const { x, y, payload } = props;
                            return (
                                <g transform={`translate(${x},${y}) rotate(-45)`}>
                                    <text
                                        x={0}
                                        y={0}
                                        dy={10}
                                        textAnchor="end"
                                        fill="#4b5563"
                                        fontSize={11}
                                    >
                                        {payload.value}
                                    </text>
                                </g>
                            );
                        }}
                        tickLine={{ stroke: '#d1d5db' }}
                        height={80}
                    />

                    <YAxis
                        axisLine={{ stroke: '#d1d5db' }}
                        tick={{ fill: '#4b5563', fontSize: 11 }}
                        tickLine={{ stroke: '#d1d5db' }}
                        tickFormatter={yAxisFormatter || ((value) => isQuantity ? `${value.toLocaleString()}` : ` ${(value / 100000).toFixed(2)}L`)}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            color: '#1f2937'
                        }}
                        labelStyle={{
                            color: '#374151',
                            fontWeight: 'bold',
                            marginBottom: '8px'
                        }}
                        formatter={(value: any, name: any) => [
                            <span key="value" style={{ color: neonAreaColors[areas.indexOf(name) % neonAreaColors.length]?.line || '#00f2fe' }}>
                                {isQuantity ? `${value.toLocaleString()}` : ` ${value.toLocaleString()}`}
                            </span>,
                            <span key="name" style={{ color: '#6b7280' }}>
                                {name}
                            </span>
                        ]}
                        itemStyle={{ padding: '4px 0' }}
                        cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />

                    <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{
                            paddingBottom: '20px',
                            color: '#1f2937',
                            height: '80px',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.value && handleLegendClick(e.value)}
                        formatter={(value) => (
                            <span style={{
                                color: hiddenAreas.includes(value) ? '#9ca3af' : '#4b5563',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textDecoration: hiddenAreas.includes(value) ? 'line-through' : 'none'
                            }}>
                                {value}
                            </span>
                        )}
                    />

                    {areas.map((areaName: string, index: number) => {
                        const colorSet = neonAreaColors[index % neonAreaColors.length];
                        const idSafe = (`gradient-${areaName}`).replace(/[^a-z0-9-_]/gi, '-');
                        const glowId = (`glow-${areaName}`).replace(/[^a-z0-9-_]/gi, '-');

                        return (
                            <Area
                                key={areaName}
                                type="monotone"
                                dataKey={areaName}
                                stroke={colorSet.line}
                                strokeWidth={3}
                                fill={`url(#${idSafe})`}
                                fillOpacity={0.35}
                                filter={`url(#${glowId})`}
                                dot={{
                                    r: 4,
                                    fill: colorSet.line,
                                    stroke: '#ffffff',
                                    strokeWidth: 2
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: colorSet.line,
                                    stroke: '#ffffff',
                                    strokeWidth: 2
                                }}
                                hide={hiddenAreas.includes(areaName)}
                                isAnimationActive={true}
                                animationBegin={index * 200}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        );
                    })}

                    <CartesianGrid
                        stroke="#e5e7eb"
                        strokeDasharray="3 3"
                        vertical={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default NeonTrendAreaChart;
