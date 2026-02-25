"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  data: any
  loading?: boolean
}

export default function SalesReportGraph({ data, loading }: Props) {

  /* Extract correct dataset automatically */
  const rows = useMemo(() => {
    if (Array.isArray(data?.Result?.details_wiase_data)) {
      return data.Result.details_wiase_data
    }
    if (Array.isArray(data?.Result?.headers_wiase_data)) {
      return data.Result.headers_wiase_data
    }
    return []
  }, [data])

  /* Transform data for graph */
  const chartData = useMemo(() => {
    return rows
      .filter((row: any) => row.invoice_date && row.total)
      .map((row: any) => ({
        date: row.invoice_date.split(" ")[0],
        total: Number(row.total),
      }))
  }, [rows])
if (loading) {
  return (
    <Card className="p-6 space-y-4">
      
      {/* Title skeleton */}
      <Skeleton className="h-6 w-48 rounded-md" />

      {/* Chart area skeleton with light gray border */}
      <div className="h-[400px] w-full rounded-md border border-gray-100 relative overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>

    </Card>
  )
}

  if (!loading && !chartData.length) {
    return <div className="p-6 text-center">No graph data available</div>
  }

  return (
  
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>

            {/* Gradient Fill Definition */}
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#349258" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#349258" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="total"
              stroke="#349258"
              strokeWidth={2}
              fill="url(#colorTotal)"
            />

          </AreaChart>
        </ResponsiveContainer>
      </div>
  
  )
}