"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useCallback } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { BarChart2, Download, Package, TableIcon } from "lucide-react"

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
import SalesReportGraph from "./components/graph"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"

export default function SalesReportDashboard() {

  /* ================= STATE ================= */

  const [view, setView] = useState<"table" | "graph">("table")

  const [fromDate, setFromDate] = useState<Date>()
  const [toDate, setToDate] = useState<Date>()
  const [reportType, setReportType] = useState("2")
  const [dropped, setDropped] = useState<string[]>([])
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  const joinIds = useCallback(
    (ids?: string[]) => (ids?.length ? ids.join(",") : ""),
    []
  )

  /* ================= API HOOKS ================= */

  const { data: regions } = useRegions()
  const { data: subRegions } = useSubRegions(joinIds(selected.region))
  const { data: warehouses } = useWarehouses(joinIds(selected.sub_region))
  const { data: routes } = useRoutes(joinIds(selected.warehouse))
  const { data: trading } = useTrading(joinIds(selected.route))
  const { data: customers } = useCustomers(joinIds(selected.trading))

  const { data: matBrands } = useMatBrands()
  const { data: matGroups } = useMatGroups()
  const { data: materials } = useMaterials()

  const {
    mutate: fetchTableData,
    isPending: tableLoading,
    data: tableData,
  } = useSalesDashboard()

  const {
    mutate: fetchGraphData,
    isPending: graphLoading,
    data: graphData,
  } = useSalesDashboardGraph()

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

  /* ================= BUILD PAYLOAD ================= */

  const buildPayload = useCallback(() => {
    const payload: any = {
      fromdate: fromDate ? format(fromDate, "yyyy-MM-dd") : "",
      todate: toDate ? format(toDate, "yyyy-MM-dd") : "",
      report_type: reportType,
    }

    Object.keys(selected).forEach((key) => {
      payload[`${key}_id`] = joinIds(selected[key])
    })

    return payload
  }, [fromDate, toDate, reportType, selected, joinIds])

  /* ================= UI ================= */

  return (

    <>

      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-semibold">
          Sales Report Dashboard
        </CardTitle>
      </CardHeader>

      <div className="p-6 space-y-6 bg-gray-50 min-h-screen pt-0 mt-0">

        {/* ================= HEADER ================= */}

        {/* <Card className="border border-gray-200/80 shadow-sm bg-white rounded-xl">
          <CardContent className="p-6 space-y-6"> */}
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
            const payload = buildPayload()
            if (type === "table") fetchTableData(payload)
            if (type === "graph") fetchGraphData(payload)
          }}
        />
        {/* </CardContent>
            </Card> */}


        {/* ================= FILTER SECTION ================= */}
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

                        <CommandItem
                          onSelect={() => console.log("Export PDF")}
                          className="flex justify-between"
                        >
                          Export as PDF
                        </CommandItem>

                        <CommandItem
                          onSelect={() => console.log("Export Excel")}
                          className="flex justify-between"
                        >
                          Export as Excel
                        </CommandItem>

                        <CommandItem
                          onSelect={() => console.log("Export CSV")}
                          className="flex justify-between"
                        >
                          Export as CSV
                        </CommandItem>

                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <SalesReportDragFilters
              filters={FILTER_CONFIG}
              dropped={dropped}
              selected={selected}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              setDropped={setDropped}
              setSelected={setSelected}
            />
            <CardContent className="p-6">
              {view === "table" && (
                <SalesReportTable
                  loading={tableLoading}
                  data={tableData}
                  reportType={reportType}
                  totalCount={tableData?.Count}
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