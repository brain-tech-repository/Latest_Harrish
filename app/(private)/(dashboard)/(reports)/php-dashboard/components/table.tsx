"use client"
import { useState, useEffect, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  data: any
  reportType: string
  loading: boolean
  totalCount?: number
  showHeader?: boolean   // 👈 add this
   page: number                // ✅ add
  setPage: (page: number) => void  // ✅ add
}

export default function SalesReportTable({
  data,
  loading,
  totalCount,
  showHeader = false,
   page,
  setPage,
}: Props) {

  const [search] = useState("")

  const totalPages = totalCount
  ? Math.ceil(totalCount / 10)
  : 1


  const rows = useMemo(() => {
    if (Array.isArray(data?.Result?.details_wiase_data)) {
      return data.Result.details_wiase_data
    }
    if (Array.isArray(data?.Result?.headers_wiase_data)) {
      return data.Result.headers_wiase_data
    }
    return []
  }, [data])

  const isDetails = Array.isArray(data?.Result?.details_wiase_data)

  const filteredData = useMemo(() => {
    return rows.filter((row: any) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    )
  }, [rows, search])





  // useEffect(() => {
  //   setPage(1)
  // }, [rows])

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200/60">
                {Array.from({ length: isDetails ? 8 : 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="border-b border-gray-300/30"
                >
                  {Array.from({ length: isDetails ? 8 : 6 }).map(
                    (_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    )
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

   if (!loading && !filteredData.length) {
    return <div className="p-6 text-center">No Table data available</div>
  }

  /* ================= TABLE ================= */

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200/60 overflow-hidden bg-white">
        <Table>

          {/* HEADER */}
          {showHeader && (
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200/60">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Invoice No
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </TableHead>

                {isDetails && (
                  <>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Material
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Qty
                    </TableHead>
                  </>
                )}

                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Warehouse
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Route
                </TableHead>
              </TableRow>
            </TableHeader>
          )}

          {/* BODY */}
          <TableBody>
            {rows.map((row: any, index: number) => (
              <TableRow
                key={index}
                className="border-b border-gray-300/30 hover:bg-gray-50 transition-colors"
              >
                <TableCell className="text-sm text-gray-700">
                  {row.invoice_number ?? "-"}
                </TableCell>

                <TableCell className="text-sm text-gray-700">
                  {row.invoice_date?.split(" ")[0] ?? "-"}
                </TableCell>

                <TableCell className="text-sm text-gray-700">
                  {row.customer_name ?? "-"}
                </TableCell>

                {isDetails && (
                  <>
                    <TableCell className="text-sm text-gray-700">
                      {row.material_name ?? "-"}
                    </TableCell>

                    <TableCell className="text-sm text-gray-700">
                      {row.quantity ?? "-"}
                    </TableCell>
                  </>
                )}

                <TableCell className="text-sm text-gray-700 font-medium">
                  {row.total
                    ? `${row.currency_notation} ${Number(
                      row.total
                    ).toLocaleString()}`
                    : "-"}
                </TableCell>

                <TableCell className="text-sm text-gray-700">
                  {row.warehouse_name ?? "-"}
                </TableCell>

                <TableCell className="text-sm text-gray-700">
                  {row.route_name ?? "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
     {totalPages > 1 && (
  <div className="flex justify-end gap-3 items-center">
    <Button
      variant="outline"
      size="sm"
      disabled={page === 1}
      onClick={() => setPage(page - 1)}
    >
      Previous
    </Button>

    <span className="text-sm text-gray-600">
      Page {page} of {totalPages}
    </span>

    <Button
      variant="outline"
      size="sm"
      disabled={page === totalPages}
      onClick={() => setPage(page + 1)}
    >
      Next
    </Button>
  </div>
)}
    </div>
  )
}