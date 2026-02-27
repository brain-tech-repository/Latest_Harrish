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

import { Card } from "@/components/ui/card"
import { useMemo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Maximize2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  salesTrendColumns,
  topBrandColumns,
  materialGroupColumns,
  regionColumns,
} from "./graphColumns"

import DynamicGraphView from "../graph-model/DynamicGraphTable"
interface Props {
  data: any
  loading?: boolean
}

type ModalType =
  | "salesTrend"
  | "topBrand"
  | "materialGroup"
  | "region"

export default function SalesReportGraph({ data, loading }: Props) {
  const result = data?.Result
  const [activeModal, setActiveModal] = useState<ModalType | null>(null)
  /* ================= DATA TRANSFORM ================= */
  const salesTrend = useMemo(() => {
    return (
      result?.sales_trend?.map((item: any) => ({
        date: item.sale_date,
        total: Number(item.total_sales),
      })) || []
    )
  }, [result])

  const topBrand = useMemo(() => {
    return (
      result?.top_brand?.map((item: any) => ({
        name: item.brand_name,
        total: Number(item.total_sales),
      })) || []
    )
  }, [result])

  const materialGroup = useMemo(() => {
    return (
      result?.material_group?.map((item: any) => ({
        name: item.category_name,
        total: Number(item.total_sales),
      })) || []
    )
  }, [result])

  const region = useMemo(() => {
    return (
      result?.region?.map((item: any) => ({
        name: item.region_name,
        total: Number(item.total_sales),
      })) || []
    )
  }, [result])

  /* ================= CONFIG AFTER DATA ================= */

  const modalConfig = {
    salesTrend: {
      title: "Sales Trend Details",
      chartType: "area" as const,
      data: salesTrend,
      xKey: "date",
      color: "#349258",
      columns: salesTrendColumns,
    },
    topBrand: {
      title: "Top Brand Details",
      chartType: "area" as const,
      data: topBrand,
      xKey: "name",
      color: "#2563eb",
      columns: topBrandColumns,
    },
    materialGroup: {
      title: "Material Group Details",
      chartType: "bar" as const,
      data: materialGroup,
      xKey: "name",
      color: "#ea580c",
      columns: materialGroupColumns,
    },
    region: {
      title: "Region Details",
      chartType: "bar" as const,
      data: region,
      xKey: "name",
      color: "#7c3aed",
      columns: regionColumns,
    },
  }

  const current = activeModal ? modalConfig[activeModal] : null

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-48 rounded-md" />
        <div className="h-[400px] w-full rounded-md border border-gray-100">
          <Skeleton className="h-full w-full" />
        </div>
      </Card>
    )
  }

  if (!result) {
    return <div className="p-6 text-center">No graph data available</div>
  }

  /* ================= COMPONENT RETURN ================= */

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-8">
        {salesTrend.length > 0 && (
          <Card className="p-2">
            <div className="flex justify-between mb-3">
              <h2 className="font-semibold ms-">Sales Trend</h2>
              <Maximize2
                className="w-4 h-4 cursor-pointern me-4"
                onClick={() => setActiveModal("salesTrend")}
              />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis width={100} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#349258"
                    fill="#34925833"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
        {topBrand.length > 0 && (
          <Card className="p-2">
            <div className="flex justify-between mb-3">
              <h2 className="font-semibold ms-">Top Brand</h2>
              <Maximize2
                className="w-4 h-4 cursor-pointern me-4"
                onClick={() => setActiveModal("topBrand")}
              />
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={topBrand}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis width={100} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    fill="#2563eb33"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {materialGroup.length > 0 && (
          <Card className="p-2">
            <div className="flex justify-between mb-3">
              <h2 className="font-semibold ms-">Material Group</h2>
              <Maximize2
                className="w-4 h-4 cursor-pointern me-4"
                onClick={() => setActiveModal("materialGroup")}
              />
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialGroup}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis width={100} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#ea580c" barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {region.length > 0 && (
          <Card className="p-2">
            <div className="flex justify-between mb-3">
              <h2 className="font-semibold ms-">Region Wise Sales</h2>
              <Maximize2
                className="w-4 h-4 cursor-pointern me-4"
                onClick={() => setActiveModal("region")}
              />
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={region}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis width={100} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#7c3aed" barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* ================= MODAL ================= */}

      <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="w-[95vw] max-w-none rounded-2xl p-0">

          <div className="p-6 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold ms-">
                {current?.title}
              </DialogTitle>
            </DialogHeader>
          </div>

          {current && (
            <DynamicGraphView
              title={current.title}
              chartType={current.chartType}
              data={current.data}
              xKey={current.xKey}
              color={current.color}
              columns={current.columns}
            />
          )}

        </DialogContent>
      </Dialog>
    </>
  )
}