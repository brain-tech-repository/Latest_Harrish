"use client"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export interface Column {
  header: string
  accessor: string
  align?: "left" | "right" | "center"
  formatter?: (value: any) => React.ReactNode
}

type ChartType = "area" | "bar"

interface Props {
  title: string
  chartType: ChartType
  data: any[]
  xKey: string
  color: string
  columns: Column[]
}

export default function DynamicGraphView({
  title,
  chartType,
  data,
  xKey,
  color,
  columns,
}: Props) {
  return (
    <div className="h-[80vh] p-6 overflow-hidden">
      

      <div className="grid grid-cols-1 xl:grid-cols-[60%_35%] gap-6 h-full">

        {/* GRAPH SECTION */}
        <div className="h-full bg-white p-6 rounded-xl shadow">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis width={120} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={color}
                  fill={`${color}33`}
                  strokeWidth={1.5}
                />
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis width={120} />
                <Tooltip />
                <Bar dataKey="total" fill={color} barSize={40} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* TABLE SECTION */}
        <div className="h-full overflow-y-auto bg-white rounded-xl shadow border border-gray-100">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className={`px-6 py-3 border-b border-gray-100 text-${col.align || "left"} font-medium text-gray-600`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data?.length ? (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition">
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-6 py-3 border-b border-gray-100 text-${col.align || "left"} text-gray-700`}
                      >
                        {col.formatter
                          ? col.formatter(row[col.accessor])
                          : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-10 text-gray-400"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}