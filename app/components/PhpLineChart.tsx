"use client";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface PhpLineChartProps {
  data: any[];
  isLoading: boolean;
}

const PhpLineChart: React.FC<PhpLineChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="py-20 text-center">Loading chart...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        No chart data available
      </div>
    );
  }

  // 🔥 Group by Invoice Date and sum Total
  const grouped: Record<string, number> = {};

  data.forEach((item) => {
    const date = item.invoice_date?.split(" ")[0];
    const total = Number(item.total) || 0;

    if (!date) return;

    if (!grouped[date]) {
      grouped[date] = 0;
    }

    grouped[date] += total;
  });

  const chartData = Object.keys(grouped).map((date) => ({
    date,
    total: grouped[date],
  }));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#2563eb"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PhpLineChart;
