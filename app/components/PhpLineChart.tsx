"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface PhpLineChartProps {
  data: any[];
  isLoading: boolean;
}

const PhpLineChart: React.FC<PhpLineChartProps> = ({
  data,
  isLoading,
}) => {
  const [isActive, setIsActive] = React.useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          Loading chart...
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-20 text-center text-gray-500">
          No chart data available
        </CardContent>
      </Card>
    );
  }

  // 🔥 SAME PREVIOUS LOGIC
  const grouped: Record<string, number> = {};

  data.forEach((item) => {
    const date = item.invoice_date?.split(" ")[0];
    const total = Number(item.total) || 0;

    if (!date) return;

    if (!grouped[date]) grouped[date] = 0;
    grouped[date] += total;
  });

  const chartData = Object.keys(grouped)
    .sort() // important for proper date order
    .map((date) => ({
      date,
      total: grouped[date],
    }));

  // Calculate growth for badge (optional dynamic)
  const firstValue = chartData[0]?.total ?? 0;
  const lastValue = chartData[chartData.length - 1]?.total ?? 0;
  const growth =
    firstValue !== 0
      ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
      : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Total Sales
          <Badge
            variant="outline"
            className="text-green-500 bg-green-500/10 border-none"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            {growth}% 
          </Badge>
        </CardTitle>

        <CardDescription>
          Showing invoice totals by date
        </CardDescription>
      </CardHeader>

      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <Tooltip />

            <defs>
              {/* Animated Hatch Pattern */}
              <pattern
                id="hatched-pattern"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-45)"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0 0"
                  to="6 0"
                  dur="1s"
                  repeatCount="indefinite"
                />
                <rect width="10" height="10" opacity={0.05} fill="var(--chart-1)" />
                <rect width="1" height="10" fill="var(--chart-1)" />
              </pattern>

              {/* Gradient */}
              <linearGradient
                id="gradient-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <Area
              type="natural"
              dataKey="total"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill={isActive ? "url(#hatched-pattern)" : "url(#gradient-fill)"}
              fillOpacity={1}
              onMouseEnter={() => setIsActive(true)}
              onMouseLeave={() => setIsActive(false)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PhpLineChart;