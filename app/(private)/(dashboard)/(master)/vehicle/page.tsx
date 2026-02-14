"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Table, { TableDataType, listReturnType, searchReturnType } from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { downloadFile, exportVehicleData, vehicleGlobalSearch, vehicleListData, vehicleStatusUpdate, statusFilter } from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import StatusBtn from "@/app/components/statusBtn2";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import { formatWithPattern } from "@/app/utils/formatDate";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
// 🔹 API response type
interface Vehicle {
  id?: string | number;
  vehicle_code?: string;
  description?: string;
  number_plat?: string;
  vehicle_chesis_no?: string;
  opening_odometer?: string;
  vehicle_type?: string;
  capacity?: string;
  owner_type?: string;
  warehouse?: { id: string, warehouse_code: string, warehouse_name: string, owner_name: string };
  owner_reference?: string;
  vehicle_route?: string;
  status?: number;
  [key: string]: string | number | object | undefined;
}

// 🔹 Dropdown menu data
interface DropdownItem {
  icon: string;
  label: string;
  iconWidth: number;
}

// const dropdownDataList: DropdownItem[] = [
//   // { icon: "lucide:layout", label: "SAP", iconWidth: 20 },
//   // { icon: "lucide:download", label: "Download QR Code", iconWidth: 20 },
//   // { icon: "lucide:printer", label: "Print QR Code", iconWidth: 20 },
//   { icon: "lucide:radio", label: "Inactive", iconWidth: 20 },
//   { icon: "lucide:delete", label: "Delete", iconWidth: 20 },
// ];

// 🔹 Table columns


export default function VehiclePage() {
  const { warehouseAllOptions, ensureWarehouseAllLoaded } = useAllDropdownListData();
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [statusFilterValue, setStatusFilterValue] = useState<string>("");
  const [currentStatusFilter, setCurrentStatusFilter] = useState<boolean | null>(null);
  const { can, permissions } = usePagePermissions();
  const { setLoading } = useLoading();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchFilterValue, setSearchFilterValue] = useState<string>("");
  useEffect(() => {
    ensureWarehouseAllLoaded()
  }, [ensureWarehouseAllLoaded]);
  // Refresh table when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [permissions]);

  const searchParams = useSearchParams();

  // Sync Status Filter from URL
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const type = searchParams.get('_type');

    // Only sync if it's a column filter or just standard filter logic
    if (statusParam !== null && (type === 'columnFilter' || type === 'filter')) {
      setCurrentStatusFilter(statusParam === '1');
    } else {
      // Only clear if explicitly missing and we are in a mode that implies clearing?
      // Or just basic sync.
      if (statusParam === null) setCurrentStatusFilter(null);
    }
  }, [searchParams]);

  const [threeDotLoading, setThreeDotLoading] = useState<{ csv: boolean; xlsx: boolean; xslx: boolean }>({ csv: false, xlsx: false, xslx: false });
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const handleStatusFilter = async (status: boolean) => {
    try {
      // Toggle logic: If clicking the same filter, clear it
      const newFilter = currentStatusFilter === status ? null : status;

      const params = new URLSearchParams(searchParams.toString());
      if (params.has("search")) {
        params.delete("search");
      }

      if (newFilter !== null) {
        params.set("status", newFilter ? "1" : "0");
        params.set("_type", "columnFilter");
      } else {
        params.delete("status");
        // If no other filters, remove _type (simplified check)
        if (!params.has("warehouse_id")) {
          params.delete("_type");
        }
      }
      params.delete("page");
      router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });

    } catch (error) {
      console.error("Error filtering by status:", error);
      showSnackbar("Failed to filter by status", "error");
    }
  };

  const columns = [
    { key: "vehicle_code", label: "Vehicle Code", render: (row: TableDataType) => (<span className="font-semibold text-[14px]" style={{ color: 'var(--text-primary-color, #181D27)' }}>{row.vehicle_code || "-"}</span>) },
    { key: "number_plat", label: "Number Plate", render: (row: TableDataType) => row.number_plat || "-" },
    { key: "vehicle_chesis_no", label: "Chassis Number", render: (row: TableDataType) => row.vehicle_chesis_no || "-" },
    { key: "vehicle_brand", label: "Brand", render: (row: TableDataType) => row.vehicle_brand || "-" },
    { key: "opening_odometer", label: "Odo Meter", render: (row: TableDataType) => toInternationalNumber(row.opening_odometer, { maximumFractionDigits: 0 }) || "-" },
    {
      key: "vehicle_type",
      label: "Vehicle Type",
      render: (row: TableDataType) => {
        const value = row.vehicle_type;
        if (value == null || value === "") return "-";
        const strValue = String(value);
        if (strValue === "1") return "Truck";
        if (strValue === "2") return "Van";
        if (strValue === "3") return "Bike";
        if (strValue === "4") return "Tuktuk";
        return strValue;
      },
    },
    { key: "capacity", label: "Capacity", render: (row: TableDataType) => toInternationalNumber(row.capacity, { maximumFractionDigits: 0 }) || "-" },
    {
      key: "owner_type",
      label: "Owner Type",
      render: (row: TableDataType) => {
        const value = row.owner_type;
        if (value == null || value === "") return "-";
        const strValue = String(value);
        if (strValue === "0") return "Company Owned";
        if (strValue === "1") return "Contractor";
        return strValue;
      },
    },
    {
      key: "warehouse", label: "Distributor", render: (row: TableDataType) => {
        const wh = row.warehouse;
        let code = "";
        let name = "";
        if (wh && typeof wh === "object" && wh !== null) {
          const w = wh as { warehouse_code?: string; warehouse_name?: string };
          code = w.warehouse_code ?? "-";
          name = w.warehouse_name ?? "-";
        } else if (typeof wh === "string") {
          name = wh;
        }


        return <>{code && name ? code + " - " + name : "-"}</>;
      },
      filter: {
        isFilterable: true,
        width: 320,
        filterkey: "warehouse_id",
        options: warehouseAllOptions,
        onSelect: (selected: string | string[]) => {
          const val = Array.isArray(selected) ? selected.join(',') : selected;
          setWarehouseId(val);
        },
        isSingle: false,
        selectedValue: warehouseId,
      },
    },
    // { key: "ownerReference", label: "Owner Reference" },
    // { key: "vehicleRoute", label: "Vehicle Route" },
    { key: "description", label: "Description", render: (row: TableDataType) => row.description || "-" },
    { key: "valid_from", label: "Valid From", render: (row: TableDataType) => formatWithPattern(new Date(row.valid_from), "DD MMM YYYY", "en-GB") || "-" },
    { key: "valid_to", label: "Valid To", render: (row: TableDataType) => formatWithPattern(new Date(row.valid_to), "DD MMM YYYY", "en-GB") || "-" },
    {
      key: "status",
      label: "Status",
      render: (row: TableDataType) => (
        <StatusBtn isActive={String(row.status) > "0"} />
      ),
      filterStatus: {
        enabled: true,
        onFilter: handleStatusFilter,
        currentFilter: currentStatusFilter,
      },
    },
  ];

  const fetchVehicles = async (

    page: number = 1,
    pageSize: number = 50,
    payload?: Record<string, any>
  ): Promise<listReturnType> => {
    try {
      // setLoading(true);
      // Build params with all filters
      const params: any = {
        page: page.toString(),
        per_page: pageSize.toString(),
        // ...payload,
      };

      // Add warehouse filter if selected
      if (warehouseId) {
        params.warehouse_id = warehouseId;
      }

      // Add status filter if active (true=1, false=0)
      if (currentStatusFilter !== null) {
        params.status = currentStatusFilter ? "1" : "0";
      }

      const listRes = await vehicleListData(params);
      // setLoading(false);
      return {
        data: listRes.data || [],
        total: listRes.pagination.totalPages,
        currentPage: listRes.pagination.page,
        pageSize: listRes.pagination.limit,
      };
    } catch (error: unknown) {
      console.error("API Error:", error);
      setLoading(false);
      throw error;
    }
  };



  const searchVehicle = useCallback(
    async (
      searchQuery: string,
      pageSize: number = 10,
      columnName?: string,
      page: number = 1
    ): Promise<searchReturnType> => {
      // setLoading(true);
      const result = await vehicleGlobalSearch({
        search: searchQuery,
        per_page: pageSize.toString(),
        page: page.toString(),
      });
      // setLoading(false);
      setSearchFilterValue(searchQuery);
      if (result.error) throw new Error(result.data.message);
      const pagination = result.pagination || result.pagination.pagination || {};
      return {
        data: result.data || [],
        total: pagination.totalPages || 1,
        totalRecords: pagination.totalRecords,
        currentPage: pagination.current_page || 1,
        pageSize: pagination.limit || 1,
      };
    },
    []
  );

  const exportFile = async (format: string) => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await exportVehicleData({ format, search: searchFilterValue, filter: { status: currentStatusFilter == false ? "0" : "1", warehouse_id: warehouseId } });
      if (response && typeof response === 'object' && response.url) {
        await downloadFile(response.url);
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
      await vehicleStatusUpdate({ vehicle_ids: selectedRowsData, status });
      // Refresh vehicle list after 3 seconds
      // (async () => {
      fetchVehicles();
      setRefreshKey((k) => k + 1);
      // });
      showSnackbar("Vehicle status updated successfully", "success");
      // setLoading(false);
    } catch (error) {
      showSnackbar("Failed to update vehicle status", "error");
      // setLoading(false);
    }
  };
  return (
    <>

      <div className="flex flex-col h-full">
        <Table
          refreshKey={refreshKey}
          config={{
            api: {
              list: fetchVehicles,
              search: searchVehicle,
            },
            header: {
              exportButton: {
                threeDotLoading: threeDotLoading,
                show: true,
                onClick: () => exportFile("xlsx"),
              },
              threeDot: [

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
                      const currentStatus = data[id]?.status;
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
                      const currentStatus = data[id]?.status;
                      if (!status.includes(currentStatus)) {
                        status.push(currentStatus);
                      }
                      return data[id].id;
                    })
                    statusUpdate(ids, Number(1));
                  },
                },

              ],
              title: "Vehicle",
              searchBar: true,
              columnFilter: true,
              actions: can("create") ? [
                <SidebarBtn
                  key={0}
                  href="/vehicle/add"
                  isActive
                  leadingIcon="lucide:plus"
                  label="Add"
                  labelTw="hidden sm:block"
                />,
              ] : [],
            },
            localStorageKey: "vehicle-table",
            footer: { nextPrevBtn: true, pagination: true },
            columns,
            rowSelection: true,
            showNestedLoading: true,
            rowActions: [
              {
                icon: "lucide:eye",
                onClick: (data: TableDataType) => {
                  router.push(`/vehicle/details/${data.uuid}`);
                },
              },
              ...(can("edit") ? [{
                icon: "lucide:edit-2",
                onClick: (row: object) => {
                  const r = row as TableDataType;
                  router.push(
                    `/vehicle/${r.uuid}`
                  );
                },
              }] : []),
              // {
              //   icon: "lucide:trash-2",
              //   onClick: (row: object) => {
              //     const r = row as TableDataType;
              //     setSelectedRow({ id: r.id });
              //     setShowDeletePopup(true);
              //   },
              // },
            ],
            pageSize: 50,
          }}
        />
      </div>

      {/* Delete Popup */}
      {/* {showDeletePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <DeleteConfirmPopup
            title="Delete Vehicle"
            onClose={() => setShowDeletePopup(false)}
            onConfirm={handleConfirmDelete}
          />
        </div>
      )} */}
    </>
  );
}
