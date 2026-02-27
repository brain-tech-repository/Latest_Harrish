// graphColumns.ts

import { Column } from "./DynamicGraphTable"

export const salesTrendColumns: Column[] = [
  { header: "Date", accessor: "date" },
  {
    header: "Total Sales",
    accessor: "total",
    align: "right",
    formatter: (v: number) => v.toLocaleString(),
  },
]

export const topBrandColumns: Column[] = [
  { header: "Brand Name", accessor: "name" },
  {
    header: "Total Sales",
    accessor: "total",
    align: "right",
    formatter: (v: number) => v.toLocaleString(),
  },
]

export const materialGroupColumns: Column[] = [
  { header: "Category", accessor: "name" },
  {
    header: "Total Sales",
    accessor: "total",
    align: "right",
    formatter: (v: number) => v.toLocaleString(),
  },
]

export const regionColumns: Column[] = [
  { header: "Region", accessor: "name" },
  {
    header: "Total Sales",
    accessor: "total",
    align: "right",
    formatter: (v: number) => v.toLocaleString(),
  },
]