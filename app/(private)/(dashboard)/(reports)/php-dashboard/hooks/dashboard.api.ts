

import api from "@/lib/apiClients"
import { ApiResponse, DropdownOption, SalesDashboardPayload } from "../index/dashboard.types"
import { useMutation, useQuery, UseQueryResult } from "@tanstack/react-query"
import { toast } from "sonner"


const BASE = "/mpldev/index.php/api"


export const dashboardAPI = {
  getRegions: async (): Promise<DropdownOption[]> => {
    const res = await api.get<ApiResponse<DropdownOption>>(
      `${BASE}/get_region_dashboard`
    )
    return res.data.Result
  },

  getSubRegions: async (ids: string) => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption>>(
      `${BASE}/get_sub_region_dashboard/${ids}`
    )
    return res.data.Result
  },

  getWarehouses: async (ids: string) => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption>>(
      `${BASE}/get_warehouse_dashboard/${ids}`
    )
    return res.data.Result
  },

  getRoutes: async (ids: string) => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption>>(
      `${BASE}/get_route_dashboard/${ids}`
    )
    return res.data.Result
  },

  getTrading: async (ids: string) => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption>>(
      `${BASE}/get_trading_dashboard/${ids}`
    )
    return res.data.Result
  },

  getCustomers: async (ids: string) => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption>>(
      `${BASE}/get_customer_dashboard/${ids}`
    )
    return res.data.Result
  },

getTableData: async (payload: SalesDashboardPayload) => {
  const res = await api.post(
    `${BASE}/get_sales_dashboard_data`,
    payload
  )
  return res.data   // ✅ return full response
},

  getMatBrands: async (): Promise<DropdownOption[]> => {
  const res = await api.get<ApiResponse<DropdownOption>>(
    `${BASE}/get_matbrands_dashboard`
  )
  return res.data.Result
},

getMatGroups: async (): Promise<DropdownOption[]> => {
  const res = await api.get<ApiResponse<DropdownOption>>(
    `${BASE}/get_matgroups_dashboard`
  )
  return res.data.Result
},

getMaterials: async (): Promise<DropdownOption[]> => {
  const res = await api.get<ApiResponse<DropdownOption>>(
    `${BASE}/get_materials_dashboard`
  )
  return res.data.Result
},
getGraphData: async (payload: SalesDashboardPayload) => {
  const res = await api.post(
    `${BASE}/get_sales_dashboard_data`, // 👈 NEW GRAPH API
    payload
  )
  return res.data
},
}



/* ===========================
   DROPDOWN HOOKS
=========================== */

export function useRegions(): UseQueryResult<
  DropdownOption[]
> {
  return useQuery({
    queryKey: ["regions"],
    queryFn: dashboardAPI.getRegions,
  })
}

export function useSubRegions(ids: string) {
  return useQuery({
    queryKey: ["subRegions", ids],
    queryFn: () => dashboardAPI.getSubRegions(ids),
    enabled: !!ids,
  })
}

export function useWarehouses(ids: string) {
  return useQuery({
    queryKey: ["warehouses", ids],
    queryFn: () => dashboardAPI.getWarehouses(ids),
    enabled: !!ids,
  })
}

export function useRoutes(ids: string) {
  return useQuery({
    queryKey: ["routes", ids],
    queryFn: () => dashboardAPI.getRoutes(ids),
    enabled: !!ids,
  })
}

export function useTrading(ids: string) {
  return useQuery({
    queryKey: ["trading", ids],
    queryFn: () => dashboardAPI.getTrading(ids),
    enabled: !!ids,
  })
}

export function useCustomers(ids: string) {
  return useQuery({
    queryKey: ["customers", ids],
    queryFn: () => dashboardAPI.getCustomers(ids),
    enabled: !!ids,
  })
}

/* ===========================
   TABLE HOOK
=========================== */

export function useSalesDashboard() {
  return useMutation({
    mutationFn: (payload: SalesDashboardPayload) =>
      dashboardAPI.getTableData(payload),

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to load dashboard"
      )
    },
  })
}

export function useMatBrands() {
  return useQuery({
    queryKey: ["matBrands"],
    queryFn: dashboardAPI.getMatBrands,
  })
}

export function useMatGroups() {
  return useQuery({
    queryKey: ["matGroups"],
    queryFn: dashboardAPI.getMatGroups,
  })
}

export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: dashboardAPI.getMaterials,
  })
}

export function useSalesDashboardGraph() {
  return useMutation({
    mutationFn: (payload: SalesDashboardPayload) =>
      dashboardAPI.getGraphData(payload),

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
        "Failed to load graph data"
      )
    },
  })
}