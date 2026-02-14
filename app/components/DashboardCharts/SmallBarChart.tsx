import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SmallBarChartProps {
    data: any[];
    height?: number | string;
    searchType?: string;
    neonColors?: string[];
}

const SmallBarChart = ({
    data,
    height = 220,
    searchType = 'amount',
    neonColors = [
        '#00f2fe', '#4facfe', '#00ff9d', '#ff2e63', '#ff9a00', '#aa00ff',
        '#00e5ff', '#f4d03f', '#1cefff', '#ff4081', '#18dcff', '#ff4d8d'
    ]
}: SmallBarChartProps) => {
    if (!data || data.length === 0) return <div className="w-full h-full flex items-center justify-center text-gray-500">No data</div>;

    return (
        <div className="w-full h-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, dy: 5 }} angle={-30} textAnchor="end" height={40} />
                    <YAxis tickFormatter={(v) => (searchType === 'quantity' ? v : ` ${v.toLocaleString()}`)} />
                    <Tooltip formatter={(value: any) => (searchType === 'quantity' ? `${value.toLocaleString()}` : ` ${value.toLocaleString()}`)} />
                    <Bar dataKey="value">
                        {data.map((entry: any, idx: number) => (
                            <Cell key={`cell-${idx}`} fill={entry.color || neonColors[idx % neonColors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SmallBarChart;
