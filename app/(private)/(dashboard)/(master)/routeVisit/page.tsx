"use client";

import Table, {
  listReturnType,
  searchReturnType,
  TableDataType,
} from "@/app/components/customTable";
import UploadPopup from "@/app/components/UploadPopup";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { getRouteVisitList, downloadFile, exportRouteVisit, routeVisitGlobalSearch, getRouteVisitListBasedOnHeader, statusFilter,dummyImport,routeVisitCustomerImport } from "@/app/services/allApi"; // Adjust import path
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useRouter } from "next/navigation";
import StatusBtn from "@/app/components/statusBtn2";
import { useCallback, useEffect, useState } from "react";
import { formatDate, formatWithPattern } from "@/app/(private)/utils/date";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";



export default function RouteVisits() {
  const [threeDotLoading, setThreeDotLoading] = useState({
        csv: false,
        xlsx: false,
        xls: false,
    });
  const { can, permissions } = usePagePermissions();
  const { setLoading } = useLoading();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [currentStatusFilter, setCurrentStatusFilter] = useState<boolean | null>(null);

  // Refresh table when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [permissions]);

  const handleStatusFilter = async (status: boolean) => {
    try {
      // If clicking the same filter, clear it
      const newFilter = currentStatusFilter === status ? null : status;
      setCurrentStatusFilter(newFilter);
      
      // Refresh the table with the new filter
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Error filtering by status:", error);
      showSnackbar("Failed to filter by status", "error");
    }
  };

  const [filters, setFilters] = useState({
    from_date: null as string | null,
    to_date: null as string | null,
    customer_type: null as string | null,
    status: null as string | null,
  });
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  type TableRow = TableDataType & { uuid?: string };



  const fetchRouteVisits = useCallback(
    async (
      page: number = 1,
      pageSize: number = 50,
      payload?: Record<string, any>
    ): Promise<listReturnType> => {
      try {
        // setLoading(true);

        // Prepare params for the API call
        const params: any = {
          from_date: filters.from_date,
          to_date: filters.to_date,
          customer_type: filters.customer_type,
          status: filters.status,
          page: page,
          per_page: pageSize,
          // ...payload,
        };
        
        // Add status filter if active (true=1, false=0)
        if (currentStatusFilter !== null) {
          params.status = currentStatusFilter ? "1" : "0";
        }

        const listRes = await getRouteVisitListBasedOnHeader(params);

        // setLoading(false);

        // ✅ Added: transform customer_type names only, with safety check
        const transformedData = (listRes.data || []).map((item: any) => {
          const rv = Array.isArray(item.route_visits) && item.route_visits.length > 0 ? item.route_visits[0] : undefined;
          return {
            ...item,
            customer_type:
              rv && rv.customer_type == 1 ? "Field Customer" : rv && rv.customer_type == 2 ? "Merchandiser" : "",
            status: rv ? rv.status : "",
            from_date: rv && rv.from_date ? rv.from_date : "",
            to_date: rv && rv.to_date ? rv.to_date : "",
          };
        });

        // Adjust this based on your actual API response structure
        return {
          data: transformedData,
          total: listRes.pagination?.totalPages || 1,
          currentPage: listRes.pagination?.page || 1,
          pageSize: listRes.pagination?.per_page || pageSize,
        };
      } catch (error: unknown) {
        console.error("API Error:", error);
        setLoading(false);
        showSnackbar("Failed to fetch route visits", "error");
        throw error;
      }
    },
    [filters, setLoading, showSnackbar, currentStatusFilter]
  );

  const searchRouteVisits = useCallback(
    async (
      query: string,
      pageSize: number = 50,
      column?: string,
      page: number = 1
    ): Promise<listReturnType> => {
      try {
        setLoading(true);
        const listRes = await routeVisitGlobalSearch({
          query,
          per_page: pageSize.toString(),
          page: page.toString(),
        });
         const transformedData = (listRes.data || []).map((item: any) => {
          const rv = Array.isArray(item.route_visits) && item.route_visits.length > 0 ? item.route_visits[0] : undefined;
          return {
            ...item,
            customer_type:
              rv && rv.customer_type == 1 ? "Field Customer" : rv && rv.customer_type == 2 ? "Merchandiser" : "",
            status: rv ? rv.status : "",
            from_date: rv && rv.from_date ? rv.from_date : "",
            to_date: rv && rv.to_date ? rv.to_date : "",
          };
        });
        setLoading(false);
        return {
          data: transformedData,
          total: listRes.pagination.totalPages,
          totalRecords: listRes.pagination.total,
          currentPage: listRes.pagination.page,
          pageSize: listRes.pagination.per_page,
        };
      } catch (error: unknown) {
        console.error("API Error:", error);
        setLoading(false);
        throw error;
      }
    },
    []
  );
  const exportFile = async (format: string) => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await exportRouteVisit({ format });
      if (response && typeof response === 'object' && response.file_url) {
        await downloadFile(response.file_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
        showSnackbar("Failed to get download URL", "error");
      }
    } catch (error) {
      showSnackbar("Failed to download route visit data", "error");
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } finally {
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    }
  };
  // Refresh table when filters change
  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [filters, currentStatusFilter]);

  const columns = [
  { key: "osa_code", label: "Code" },
  { key: "from_date", label: "From Date", render: (row: TableDataType) => row.from_date ? formatWithPattern(new Date(row.from_date), "DD MMM YYYY", "en-GB") : "-" },
  { key: "to_date", label: "To Date", render: (row: TableDataType) => row.to_date ? formatWithPattern(new Date(row.to_date), "DD MMM YYYY", "en-GB") : "-" },
  {
    key: "customer_type",
    label: "Customer Type",
    render: (row: TableDataType) =>
      {
        return row.customer_type || "-";
      }
  },

  {
    key: "status",
    label: "Status",
    render: (row: TableDataType) => (
      <StatusBtn isActive={String(row.status) === "1"} />
    ),
    filterStatus: {
      enabled: true,
      onFilter: handleStatusFilter,
      currentFilter: currentStatusFilter,
    },
  },
];

  return (
    <>
      <div className="h-[calc(100%-60px)]">
        {/* Filter Section */}
        {/* <FilterSection /> */}

        <Table
          refreshKey={refreshKey}
          config={{
            api: {
              list: fetchRouteVisits,
              search: searchRouteVisits,
            },
            header: {
              title: "Route Visit Plan",
              exportButton: {
                threeDotLoading: threeDotLoading,
                show: true,
                onClick: () => exportFile("xls"),
              },
              upload: {
                dummyApi: dummyImport,
                api: async (...args: [any]) => {
                  const res = await routeVisitCustomerImport(...args);
                  // If upload is successful, refresh the table
                  if (res && (res.status === true || (res.data && res.data.status === true) || res.success === true)) {
                    setRefreshKey((prev) => prev + 1);
                  }
                  return res;
                },
              },
              searchBar: true,
              columnFilter: true,
              actions: can("create") ? [
                <SidebarBtn
                  key={0}
                  href="/routeVisit/add"
                  isActive
                  leadingIcon="lucide:plus"
                  label="Add"
                  labelTw="hidden sm:block"
                />,
              ] : [],
            },
            localStorageKey: "route-visits-table",
            table: {
              height: 500,
            },
            footer: {
              nextPrevBtn: true,
              pagination: true,
            },
            columns,
            rowSelection: false, // Set to true if you need row selection
            rowActions: can("edit") ? [
              {
                icon: "lucide:edit-2",
                onClick: (data: object) => {
                  const row = data as TableRow;
                  router.push(`/routeVisit/${row.uuid}`);
                },
              },
            ] : [],
            pageSize: 50,
          }}
        />
      </div>
    </>
  );
}
