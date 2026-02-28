/* ===========================
   GENERIC API RESPONSE
=========================== */
export interface ApiResponse<T> {
  API_Status?: number
  Message?: string
  Count?: number
  Result: T
}

/* ===========================
   SALES DASHBOARD RESPONSE
=========================== */

export interface SalesDashboardResponse {
  API_Status: number
  Message: string
  Count: number

  Pagination: {
    total: number
    current_page: number
    per_page: string
    last_page: number
    next_page_url: string | null
    previous_page_url: string | null
  }

  Result: {
    details_wiase_data?: SalesDetailRow[]
    headers_wiase_data?: SalesHeaderRow[]

    /* Graph Related */
    top_brand?: TopBrand[]
    material_group?: MaterialGroup[]
    region?: RegionWise[]
    sales_trend?: SalesTrend[]
  }
}

/* ===========================
   TABLE ROW TYPES
=========================== */

export interface SalesHeaderRow {
  net_amount?: string | null
  vat?: string | null
  total?: string | null
  currency_notation?: string | null

  invoice_number?: string
  invoice_date?: string

  customer_code?: string
  customer_name?: string

  warehouse_name?: string
  route_name?: string
  trading_name?: string
}

export interface SalesDetailRow extends SalesHeaderRow {
  mat_code?: string | null
  material_name?: string | null
  unite_price?: string | null
  unit_notation?: string | null
  quantity?: number | null
}

/* ===========================
   GRAPH TYPES
=========================== */

export interface TopBrand {
  brand_name: string | null
  total_sales: string | null
}

export interface MaterialGroup {
  category_name: string | null
  total_sales: string | null
}

export interface RegionWise {
  region_name: string | null
  total_sales: string | null
}

export interface SalesTrend {
  sale_date: string
  total_sales: string
}

/* ===========================
   DROPDOWN OPTION
=========================== */

export interface DropdownOption {
  id: number

  region_name?: string
  sub_region_name?: string
  warehouse_name?: string
  route_name?: string
  trading_center_name?: string
  customer_name?: string

  brand_name?: string
  category_name?: string
  material_name?: string
}

/* ===========================
   PAYLOAD
=========================== */

export interface SalesDashboardPayload {
  fromdate: string
  todate: string
  report_type: string
  page: number
  per_page: number

  region_id?: string
  sub_region_id?: string
  warehouse_id?: string
  route_id?: string
  trading_center_id?: string
  customer_id?: string
  brand_id?: string
  material_group_id?: string
  material_id?: string
}