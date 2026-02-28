import api from "@/lib/apiClients"
import {
  ApiResponse,
  DropdownOption,
  SalesDashboardPayload,
  SalesDashboardResponse,
} from "../index/dashboard.types"

import {
  useMutation,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query"
import { toast } from "sonner"

const BASE = "/mpldev/index.php/api"

/* =====================================================
   API METHODS
===================================================== */

export const dashboardAPI = {
  /* ================= DROPDOWNS ================= */

  getRegions: async (): Promise<DropdownOption[]> => {
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_region_dashboard`
    )
    return res.data.Result
  },

  getSubRegions: async (ids: string): Promise<DropdownOption[]> => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_sub_region_dashboard/${ids}`
    )
    return res.data.Result
  },

  getWarehouses: async (ids: string): Promise<DropdownOption[]> => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_warehouse_dashboard/${ids}`
    )
    return res.data.Result
  },

  getRoutes: async (ids: string): Promise<DropdownOption[]> => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_route_dashboard/${ids}`
    )
    return res.data.Result
  },

  getTrading: async (ids: string): Promise<DropdownOption[]> => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_trading_dashboard/${ids}`
    )
    return res.data.Result
  },

  getCustomers: async (ids: string): Promise<DropdownOption[]> => {
    if (!ids) return []
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_customer_dashboard/${ids}`
    )
    return res.data.Result
  },

  getMatBrands: async (): Promise<DropdownOption[]> => {
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_matbrands_dashboard`
    )
    return res.data.Result
  },

  getMatGroups: async (): Promise<DropdownOption[]> => {
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_matgroups_dashboard`
    )
    return res.data.Result
  },

  getMaterials: async (): Promise<DropdownOption[]> => {
    const res = await api.get<ApiResponse<DropdownOption[]>>(
      `${BASE}/get_materials_dashboard`
    )
    return res.data.Result
  },

  /* ================= TABLE DATA ================= */

  getTableData: async (
    payload: SalesDashboardPayload
  ): Promise<SalesDashboardResponse> => {
    const res = await api.get<SalesDashboardResponse>(
      `${BASE}/get_sales_dashboard_data`,
      {
        params: payload, // server-side pagination params
      }
    )

    if (res.data.API_Status !== 1) {
      throw new Error(res.data.Message || "Failed to load data")
    }

    return res.data
  },

  /* ================= GRAPH DATA ================= */

  getGraphData: async (
    payload: SalesDashboardPayload
  ): Promise<SalesDashboardResponse> => {
    const res = await api.get<SalesDashboardResponse>(
      `${BASE}/get_sales_dashboard_data`,
      {
        params: payload,
      }
    )

    if (res.data.API_Status !== 1) {
      throw new Error(res.data.Message || "Failed to load graph data")
    }

    return res.data
  },
}

/* =====================================================
   DROPDOWN HOOKS
===================================================== */

export function useRegions(): UseQueryResult<DropdownOption[]> {
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

/* =====================================================
   TABLE HOOK (SERVER PAGINATION)
===================================================== */

export function useSalesDashboard(
  payload: SalesDashboardPayload,
  enabled: boolean
) {
  return useQuery<SalesDashboardResponse>({
    queryKey: ["salesDashboard", payload],
    queryFn: () => dashboardAPI.getTableData(payload),
    placeholderData: (prev) => prev,
    enabled,
  })
}
/* =====================================================
   GRAPH HOOK
===================================================== */

export function useSalesDashboardGraph() {
  return useMutation<
    SalesDashboardResponse,
    Error,
    SalesDashboardPayload
  >({
    mutationFn: (payload) =>
      dashboardAPI.getGraphData(payload),

    onError: (error) => {
      toast.error(error.message || "Failed to load graph data")
    },
  })
}