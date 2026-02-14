"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState,useEffect } from "react";
import { downloadFile } from "@/app/services/allApi";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table, {
  listReturnType,
  TableDataType,
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";
import {
  exportSalesmanData,
  salesmanList,
  SalesmanListGlobalSearch,
  updateSalesmanStatus,
  statusFilter,
} from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import ItemCellWithPopup from "@/app/components/multipleDataPopUp";
const SalesmanPage = () => {
  const { can, permissions } = usePagePermissions();
  const { setLoading } = useLoading();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const [threeDotLoading, setThreeDotLoading] = useState({
        csv: false,
        xlsx: false,
    });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentStatusFilter, setCurrentStatusFilter] = useState<boolean | null>(null);
  const [searchFilterValue, setSearchFilterValue] = useState<string>("");

  // Refresh table when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [permissions]);

  const { salesmanOptions, warehouseOptions, routeOptions , ensureSalesmanLoaded, ensureRouteLoaded, ensureWarehouseLoaded} = useAllDropdownListData();

  // Load dropdown data
  useEffect(() => {
    ensureSalesmanLoaded();
    ensureRouteLoaded();
    ensureWarehouseLoaded();
  }, [ensureSalesmanLoaded, ensureRouteLoaded, ensureWarehouseLoaded]);
  const [warehouseId, setWarehouseId] = useState<string>();
  const [routeId, setRouteId] = useState<string>("");

  const handleStatusFilter = async (status: boolean) => {
    try {
      const newFilter = currentStatusFilter === status ? null : status;
      setCurrentStatusFilter(newFilter);
      
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Error filtering by status:", error);
      showSnackbar("Failed to filter by status", "error");
    }
  };

    const statusUpdate = async (ids?: (string | number)[], status: number = 0) => {
      try {
        // setLoading(true);
        if (!ids || ids.length === 0) {
          showSnackbar("No vehicle selected", "error");
          return;
        }
        const selectedRowsData: number[] = ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
        if (selectedRowsData.length === 0) {
          showSnackbar("No vehicle selected", "error");
          return;
        }
        await updateSalesmanStatus({ salesman_ids: selectedRowsData, status });
        // Refresh vehicle list after 3 seconds
        // (async () => {
          // fetchVehicles();
          setRefreshKey((k) => k + 1);
        // });
        showSnackbar("Vehicle status updated successfully", "success");
        // setLoading(false);
      } catch (error) {
        showSnackbar("Failed to update vehicle status", "error");
        // setLoading(false);
      }
    };

const exportFile = async (format: string) => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await exportSalesmanData({ format, search: searchFilterValue, filter:{ status: currentStatusFilter == false ? "0" : "1" } });
      if (response && typeof response === 'object' && response.download_url) {
        await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
        setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
      }
    } catch (error) {
      showSnackbar("Failed to download vehicle data", "error");
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } finally {
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    }
  };

  const searchSalesman = useCallback(
    async (
      query: string,
      pageSize: number = 50,
      columnName?: string,
      page: number = 1,
    ): Promise<listReturnType> => {
      try {
        // setLoading(true);
        const res = await SalesmanListGlobalSearch({ query: query, per_page: pageSize.toString(), page: page.toString() });
        // setLoading(false);
        setSearchFilterValue(query);

        return {
          data: res.data || [],
          total: res?.pagination?.totalPages || 1,
          currentPage: res?.pagination?.page || 1,
          pageSize: res?.pagination?.limit || pageSize
        };
      } catch (error) {
        setLoading(false);
        console.error(error);
        throw error;
      }
    },
    []
  );

  const fetchSalesman = useCallback(
    async (
      page: number = 1,
      pageSize: number = 50,
      payload?: Record<string, any>
    ): Promise<listReturnType> => {
      try {
        // setLoading(true);
        
        // Build params with all filters
        const params: any = {
          page: page.toString(),
          
        };
        if (warehouseId) {
            params.warehouse_id = warehouseId;
        }
        
        // Add status filter if active (true=1, false=0)
        if (currentStatusFilter !== null) {
          params.status = currentStatusFilter ? "1" : "0";
        }
        
        const listRes = await salesmanList(params);
        // setLoading(false);
        return {
          data: listRes.data || [],
          total: listRes.pagination.totalPages || 1,
          currentPage: listRes.pagination.page || 1,
          pageSize: listRes.pagination.limit || pageSize,
        };
      } catch (error: unknown) {
        console.error("API Error:", error);
        setLoading(false);
        throw error;
      }
    },
    [warehouseId, currentStatusFilter]
  );

  const columns = [
    {
      key: "osa_code",
      label: "Sales Team",
      render: (row: TableDataType) => (
        <span className="font-semibold text-[#181D27] text-[14px]">
          {row.osa_code} - {row.name}
        </span>
      ),
      showByDefault: true,
      // filter: {
      //     isFilterable: true,
      //     width: 320,
      //     filterkey: "salesteam_id",
      //     options: Array.isArray(salesmanOptions) ? salesmanOptions : [],
      //     onSelect: (selected: string | string[]) => {
      //         setWarehouseId((prev) => (prev === selected ? "" : (selected as string)));
      //     },
      //     isSingle: false,
      //     selectedValue: warehouseId,
      // },
    },
    {
      key: "salesman_type",
      label: "Sales Team Type",
      render: (row: TableDataType) => {
        const obj =
          typeof row.salesman_type === "string"
            ? JSON.parse(row.salesman_type)
            : row.salesman_type;
        return obj?.salesman_type_name || "-";
      },
      showByDefault: true,
    },
    {
      key: "warehouse",
      label: "Distributor",
      render: (row: TableDataType) => {
        // Accepts array or single object
        const warehouses = Array.isArray(row.warehouses)
          ? row.warehouses
          : row.warehouse
            ? [row.warehouse]
            : [];
        return (
          <ItemCellWithPopup
          title="Distributors List"
          title1="Distributors"
            details={warehouses.map((w: any) => ({
              erp_code: w.warehouse_code,
              item_name: w.warehouse_name,
            }))}
          />
        );
      },
      filter: {
        isFilterable: true,
        isSingle: false,
        width: 320,
        options: Array.isArray(warehouseOptions) ? warehouseOptions : [],
        onSelect: (selected: string | string[]) => {
          setWarehouseId((prev) => prev === selected ? "" : (selected as string));
        },
        selectedValue: warehouseId,
      },
      showByDefault: true,
    },

    { key: "designation", label: "Designation" },
  
    //   {
    //       key: "route",
    //       label: "Route",
    //       render: (row: TableDataType) => {
    //           if (
    //               typeof row.route === "object" &&
    //               row.route !== null &&
    //               "route_name" in row.route
    //           ) {
    //               return (row.route as { route_name?: string }).route_name || "-";
    //           }
    //           return typeof row.route === 'string' ? row.route : "-";
    //       },
    //       filter: {
    //           isFilterable: true,
    //           width: 320,
    //           options: Array.isArray(routeOptions) ? routeOptions : [],
    //           onSelect: (selected: string | string[]) => {
    //               setRouteId((prev) => prev === selected ? "" : (selected as string));
    //           },
    //           selectedValue: routeId,
    //       },

    //       showByDefault: true,
    //   },
    { key: "contact_no", label: "Contact No",showByDefault: true, },

    {
      key: "status",
      label: "Status",
      render: (row: TableDataType) => (
        <StatusBtn isActive={String(row.status) === "1"} />
      ),
      showByDefault: true,
      filterStatus: {
        enabled: true,
        onFilter: handleStatusFilter,
        currentFilter: currentStatusFilter,
      },
    },
  ];

  useEffect(() => {
        setRefreshKey((k) => k + 1);
    }, [warehouseId, currentStatusFilter]);

  return (
    <>
      {/* Table */}

      <div className="flex flex-col h-full">
        <Table
          refreshKey={refreshKey}
     
          config={{
            api: { list: fetchSalesman, search: searchSalesman },
            
            header: {
              title: "Sales Team",
              exportButton: {
                threeDotLoading: threeDotLoading,
                show: true,
                onClick: () => exportFile("xlsx"), // Only onClick, no api property
              },
              threeDot: [
                // {
                //   icon: "gala:file-document",
                //   label: "Export CSV",
                //   onClick: () => handleExport("csv")
                // },
                // {
                //   icon: "gala:file-document",
                //   label: "Export Excel",
                //   onClick: () => handleExport("xlsx")
                // },
                 {
                  icon: "lucide:radio",
                  label: "Inactive",
                  // showOnSelect: true,
                  showWhen: (data: TableDataType[], selectedRow?: number[]) => {
                    if (!selectedRow || selectedRow.length === 0) return false;
                    const status = selectedRow?.map((id) => data[id]?.status).map(String);
                    return status?.includes("1") || false;
                  },
                  onClick: (data: TableDataType[], selectedRow?: number[]) => {
                    const status: string[] = [];
                    const ids = selectedRow?.map((id) => {
                      const currentStatus = data[id].status;
                      if (!status.includes(currentStatus)) {
                        status.push(currentStatus);
                      }
                      return data[id].id;
                    })
                    statusUpdate(ids, Number(0));
                  },
                },
                {
                  icon: "lucide:radio",
                  label: "Active",
                  // showOnSelect: true,
                  showWhen: (data: TableDataType[], selectedRow?: number[]) => {
                    if (!selectedRow || selectedRow.length === 0) return false;
                    const status = selectedRow?.map((id) => data[id]?.status).map(String);
                    return status?.includes("0") || false;
                  },
                  onClick: (data: TableDataType[], selectedRow?: number[]) => {
                    const status: string[] = [];
                    const ids = selectedRow?.map((id) => {
                      const currentStatus = data[id].status;
                      if (!status.includes(currentStatus)) {
                        status.push(currentStatus);
                      }
                      return data[id].id;
                    })
                    statusUpdate(ids, Number(1));
                  },
                },
                // {
                //   icon: "lucide:radio",
                //   label: "Active",
                //   showOnSelect: true,
                //   onClick: (data: TableDataType[], selectedRow?: number[]) => {
                //     handleStatusChange(data, selectedRow, "1");
                //   }
                // },
                // {
                //   icon: "lucide:radio",
                //   label: "Inactive",
                //   showOnSelect: true,
                //   onClick: (data: TableDataType[], selectedRow?: number[]) => {
                //     handleStatusChange(data, selectedRow, "0");
                //   }
                // }
              ],
              searchBar: true,
              columnFilter: true,
              actions: can("create") ? [
                <SidebarBtn
                  key={0}
                  href="/salesTeam/add"
                  isActive
                  leadingIcon="lucide:plus"
                  label="Add"
                  labelTw="hidden sm:block"
                />,
              ] : [],
            },
            localStorageKey: "salesman-table",
            footer: { nextPrevBtn: true, pagination: true },
            columns: columns,
            rowSelection: true,
            rowActions: [
              {
                icon: "lucide:eye",
                onClick: (data: TableDataType) => {
                  router.push(`/salesTeam/details/${data.uuid}`);
                },
              },
              ...(can("edit") ? [{
                icon: "lucide:edit-2",
                onClick: (row: object) => {
                  const r = row as TableDataType;
                  router.push(`/salesTeam/${r.uuid}`);
                },
              }] : []),
            ],
            pageSize: 50,
          }}
        />
      </div>
    </>
  );
};

export default SalesmanPage;
