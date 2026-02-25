export interface ApiResponse<T> {
  Result: T[]
}

export interface DropdownOption {
  id: number
  region_name?: string
  sub_region_name?: string
  warehouse_name?: string
  route_name?: string
  trading_center_name?: string
  customer_name?: string
}

export interface SalesDashboardPayload {
  fromdate: string
  todate: string
  report_type: string

  region_id?: string
  sub_region_id?: string
  warehouse_id?: string
  route_id?: string
  trading_id?: string
  customer_id?: string
  mat_brand_id?: string
  mat_group_id?: string
  material_id?: string
}