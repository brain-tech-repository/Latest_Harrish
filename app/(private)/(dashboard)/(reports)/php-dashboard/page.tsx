"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useCallback, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useMemo } from "react"

import {
  useRegions,
  useSubRegions,
  useWarehouses,
  useRoutes,
  useTrading,
  useCustomers,
  useMatBrands,
  useMatGroups,
  useMaterials,
  useSalesDashboard,
  useSalesDashboardGraph,
} from "./hooks/dashboard.api"

import SalesReportFilters from "./components/dashboard-filters"
import SalesReportDragFilters, {
  FilterConfig,
} from "./components/drag"
import SalesReportTable from "./components/table"
import SalesReportGraph from "./components/graph-model/graph"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"

export default function SalesReportDashboard() {

  /* ================= STATE ================= */

  const [view, setView] = useState<"table" | "graph">("table")
  // const [submitted, setSubmitted] = useState(false)

  const [fromDate, setFromDate] = useState<Date>()
  const [toDate, setToDate] = useState<Date>()
  const [reportType, setReportType] = useState("2")

  const [dropped, setDropped] = useState<string[]>([])
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const perPage = 10

  const joinIds = useCallback(
    (ids?: string[]) => (ids?.length ? ids.join(",") : ""),
    []
  )

  /* ================= DROPDOWN DATA ================= */

  const { data: regions } = useRegions()
  const { data: subRegions } = useSubRegions(joinIds(selected.region))
  const { data: warehouses } = useWarehouses(joinIds(selected.sub_region))
  const { data: routes } = useRoutes(joinIds(selected.warehouse))
  const { data: trading } = useTrading(joinIds(selected.route))
  const { data: customers } = useCustomers(joinIds(selected.trading))

  const { data: matBrands } = useMatBrands()
  const { data: matGroups } = useMatGroups()
  const { data: materials } = useMaterials()

  /* ================= FILTER CONFIG ================= */

  const FILTER_CONFIG: FilterConfig[] = [
    { id: "region", name: "Region", data: regions, field: "region_name", dependsOn: null },
    { id: "sub_region", name: "Sub Region", data: subRegions, field: "sub_region_name", dependsOn: "region" },
    { id: "warehouse", name: "Warehouse", data: warehouses, field: "warehouse_name", dependsOn: "sub_region" },
    { id: "route", name: "Route", data: routes, field: "route_name", dependsOn: "warehouse" },
    { id: "trading", name: "Trading", data: trading, field: "trading_name", dependsOn: "route" },
    { id: "customer", name: "Customer", data: customers, field: "customer_name", dependsOn: "trading" },
    { id: "mat_brand", name: "Material Brand", data: matBrands, field: "brand_name", dependsOn: null },
    { id: "mat_group", name: "Material Group", data: matGroups, field: "category_name", dependsOn: null },
    { id: "material", name: "Material", data: materials, field: "material_name", dependsOn: null },
  ]

  const FILTER_KEY_MAP: Record<string, string> = {
    region: "region_id",
    sub_region: "sub_region_id",
    warehouse: "warehouse_id",
    route: "route_id",
    trading: "trading_center_id",
    customer: "customer_id",
    mat_brand: "brand_id",
    mat_group: "material_group_id",
    material: "material_id",
  }

  /* ================= BUILD PAYLOAD ================= */

  const buildPayload = useCallback(() => {
    const payload: any = {
      fromdate: fromDate ? format(fromDate, "yyyy-MM-dd") : "",
      todate: toDate ? format(toDate, "yyyy-MM-dd") : "",
      report_type: reportType,
      page,
      per_page: perPage,
    }

    FILTER_CONFIG.forEach((filter) => {
      const apiKey = FILTER_KEY_MAP[filter.id]
      payload[apiKey] = selected[filter.id]
        ? joinIds(selected[filter.id])
        : ""
    })

    return payload
  }, [fromDate, toDate, reportType, selected, joinIds, page])

  const payload = useMemo(() => buildPayload(), [buildPayload])

  useEffect(() => {
  setTableEnabled(false)
}, [fromDate, toDate, reportType, selected])
  const [tableEnabled, setTableEnabled] = useState(false)

  /* ================= TABLE QUERY ================= */

  const shouldFetchTable =
    view === "table" &&
    fromDate &&
    toDate

const {
  data: tableData,
  isLoading,
  isFetching,
} = useSalesDashboard(payload, tableEnabled)

  const tableLoading = isLoading || isFetching

  /* ================= GRAPH MUTATION ================= */

  const {
    mutate: fetchGraphData,
    isPending: graphLoading,
    data: graphData,
  } = useSalesDashboardGraph()

  /* ================= UI ================= */

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-semibold">
          Sales Dashboard
        </CardTitle>
      </CardHeader>

      <div className="p-6 space-y-6 bg-gray-50 min-h-screen pt-0 mt-0">

        <SalesReportFilters
          fromDate={fromDate}
          toDate={toDate}
          reportType={reportType}
          setFromDate={setFromDate}
          setToDate={setToDate}
          setReportType={setReportType}
          loading={view === "table" ? tableLoading : graphLoading}
          view={view}
          setView={setView}
          onSubmit={(type) => {
            setPage(1)

        if (type === "table") {
  setView("table")
  setTableEnabled(true)   // ✅ enable query
}

            if (type === "graph") {
              setView("graph")
              fetchGraphData(buildPayload())
            }
          }} />

        <Card className="border border-gray-200/80 shadow-sm bg-white rounded-xl">
          <CardHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-lg font-semibold">
                Filters & Report
              </CardTitle>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-between min-w-[120px]"
                  >
                    <div className="flex items-center gap-2">
                      Exports
                      <Download className="h-4 w-4" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-2">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem>Export as PDF</CommandItem>
                        <CommandItem>Export as Excel</CommandItem>
                        <CommandItem>Export as CSV</CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <SalesReportDragFilters
              filters={FILTER_CONFIG}
              dropped={dropped}
              selected={selected}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              setDropped={setDropped}
              setSelected={setSelected}
            />

            <CardContent>
              {view === "table" && (
                <SalesReportTable
                  loading={tableLoading}
                  data={tableData}
                  reportType={reportType}
                  page={page}
                  setPage={setPage}
                  showHeader={true}
                  totalCount={tableData?.Pagination?.last_page}
                />
              )}

              {view === "graph" && (
                <SalesReportGraph
                  data={graphData}
                  loading={graphLoading}
                />
              )}
            </CardContent>

          </CardContent>
        </Card>
      </div>
    </>
  )
}