"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Table, { TableDataType, listReturnType } from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { getWarehouse, deleteWarehouse, warehouseListGlobalSearch, exportWarehouseData, warehouseStatusUpdate, downloadFile, statusFilter } from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import DeleteConfirmPopup from "@/app/components/deletePopUp";
import { useSnackbar } from "@/app/services/snackbarContext";
import StatusBtn from "@/app/components/statusBtn2";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";



export default function Warehouse() {
  const { warehouseOptions, ensureWarehouseLoaded, salesmanOptions, ensureSalesmanLoaded, regionOptions, ensureRegionLoaded, areaOptions, ensureAreaLoaded } = useAllDropdownListData();
  const [warehouseId, setWarehouseId] = useState<string>();
  const { can, permissions } = usePagePermissions("/distributors");
  const { setLoading } = useLoading();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  useEffect(() => {
    ensureSalesmanLoaded();
    ensureWarehouseLoaded();
    ensureRegionLoaded();
    ensureAreaLoaded();
  }, [ensureSalesmanLoaded, ensureWarehouseLoaded, ensureRegionLoaded, ensureAreaLoaded]);

  const [areaId, setAreaId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const [currentStatusFilter, setCurrentStatusFilter] = useState<boolean | null>(null);
  // Refresh table when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [permissions]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  const [threeDotLoading, setThreeDotLoading] = useState({
    csv: false,
    xlsx: false,
  });

  // Sync state with URL params
  useEffect(() => {
    const wId = searchParams.get("warehouse_id") || "";
    if (wId !== warehouseId) setWarehouseId(wId);

    const rId = searchParams.get("region_id") || "";
    if (rId !== regionId) setRegionId(rId);

    const aId = searchParams.get("area_id") || "";
    if (aId !== areaId) setAreaId(aId);

    const s = searchParams.get("status");
    let sVal: boolean | null = null;
    if (s === "1") sVal = true;
    else if (s === "0") sVal = false;

    if (sVal !== currentStatusFilter) setCurrentStatusFilter(sVal);

    // If search is present, ensure we are not filtering by status (Mutual Exclusion)
    if (searchParams.has("search")) {
      if (currentStatusFilter !== null) setCurrentStatusFilter(null);
    }
  }, [searchParams]);

  const handleStatusFilter = async (status: boolean) => {
    try {
      // If clicking the same filter, clear it
      const newFilter = currentStatusFilter === status ? null : status;
      setCurrentStatusFilter(newFilter);

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      if (newFilter !== null) {
        params.set("status", newFilter ? "1" : "0");
        params.set("_type", "filter");
        params.delete("search"); // Clear search when filtering status
      } else {
        params.delete("status");
        // Remove _type only if no other filters active
        if (!params.has("region_id") && !params.has("area_id")) {
          params.delete("_type");
        }
      }
      // Reset page on filter change
      params.delete("page");
      router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    } catch (error) {
      console.error("Error filtering by status:", error);
      showSnackbar("Failed to filter by status", "error");
    }
  };

  const columns = [
    // { key: "warehouse_code", label: "Warehouse Code", showByDefault: true, render: (row: WarehouseRow) =>(<span className="font-semibold text-[#181D27] text-[14px]">{ row.warehouse_code || "-"}</span>) },
    // { key: "registation_no", label: "Registration No.", render: (row: WarehouseRow) => (<span className="font-semibold text-[#181D27] text-[14px]">{row.registation_no || "-" }</span>)},
    {
      key: "warehouse_name", label: "Distributors", render: (row: WarehouseRow) => row.warehouse_code + " - " + row.warehouse_name || "-",
      // filter: {
      //       isFilterable: true,
      //       width: 320,
      //       filterkey: "warehouse_id",
      //       options: Array.isArray(warehouseOptions) ? warehouseOptions : [],
      //       onSelect: (selected: string | string[]) => {
      //           setWarehouseId((prev) => (prev === selected ? "" : (selected as string)));
      //       },
      //       isSingle: false,
      //       selectedValue: warehouseId,
      //   },
    },
    { key: "owner_name", label: "Owner Name", render: (row: WarehouseRow) => row.owner_name || "-" },
    { key: "owner_number", label: "Owner Contact No.", render: (row: WarehouseRow) => row.owner_number || "-" },
    // { key: "owner_email", label: "Owner Email", render: (row: WarehouseRow) => row.owner_email || "-" },
    // { key: "location", label: "Warehouse Location", render: (row: WarehouseRow) => row.location || "-" },
    // { key: "company", label: "Company Code", render: (row: WarehouseRow) => row.company?.company_code || "-" },
    // { key: "company", label: "Company Name", render: (row: WarehouseRow) => row.company?.company_name || "-" },
    { key: "warehouse_manager", label: "Distributors Manager", render: (row: WarehouseRow) => row.warehouse_manager || "-" },
    { key: "warehouse_manager_contact", label: "Distributors Manager Contact", render: (row: WarehouseRow) => row.warehouse_manager_contact || "-" },
    // {
    //   key: "warehouse_type",
    //   label: "Warehouse Type",
    //   showByDefault: true,
    //   render: (row: WarehouseRow) => {
    //     const value = row.warehouse_type;
    //     const strValue = value != null ? String(value) : "";
    //     if (strValue === "0") return "Agent";
    //     if (strValue === "1") return "Outlet";
    //     return strValue || "-";
    //   },
    // },
    // { key: "business_type", label: "Business Type", render: (row: WarehouseRow) => {
    //     const value = row.business_type;
    //     const strValue = value != null ? String(value) : "";
    //     if (strValue === "1") return "B2B";
    //     return strValue || "-";
    //   }, },
    // { key: "region_id", label: "Region"},
    { key: "tin_no", label: "TIN No.", render: (row: WarehouseRow) => row.tin_no || "-" },
    {
      label: 'Region',
      // showByDefault: true,
      key: 'region',
      render: (row: WarehouseRow) => {
        return row.region?.name || row.region?.region_name || '-';
      },
      filter: {
        isFilterable: true,
        width: 320,
        filterkey: "region_id",
        options: Array.isArray(regionOptions) ? regionOptions : [],
        onSelect: (selected: string | string[]) => {
          const val = selected as string;
          setRegionId((prev) => (prev === val ? "" : val));

          const params = new URLSearchParams(searchParams.toString());
          if (val && val !== regionId) {
            params.set("region_id", val);
            params.set("_type", "filter");
            params.delete("search"); // Clear search
          } else if (val === regionId) {
            // toggle off
            params.delete("region_id");
            if (!params.has("status") && !params.has("area_id")) {
              params.delete("_type");
            }
          }
          params.delete("page");
          router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
        },
        isSingle: false,
        selectedValue: regionId,
      },
    },
    {
      label: 'Area',
      // showByDefault: true,
      key: 'area',
      render: (row: WarehouseRow) => {
        return row.area?.name || row.area?.area_name || '-';

      },
      filter: {
        isFilterable: true,
        width: 320,
        filterkey: "area_id",
        options: Array.isArray(areaOptions) ? areaOptions : [],
        onSelect: (selected: string | string[]) => {
          const val = selected as string;
          setAreaId((prev) => (prev === val ? "" : val));

          const params = new URLSearchParams(searchParams.toString());
          if (val && val !== areaId) {
            params.set("area_id", val);
            params.set("_type", "filter");
            params.delete("search"); // Clear search
          } else if (val === areaId) {
            // toggle off
            params.delete("area_id");
            if (!params.has("status") && !params.has("region_id")) {
              params.delete("_type");
            }
          }
          params.delete("page");
          router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
        },
        isSingle: false,
        selectedValue: areaId,
      },
    },
    // { key: "sub_region_id", label: "Sub Region"},
    { key: "city", label: "City", render: (row: WarehouseRow) => row.city || "-", },
    {
      key: "location", label: "Location", render: (row: WarehouseRow) => {
        return row.location?.name || row.location?.location_name || row.location_relation?.name || '-';
      }
    },
    // { key: "town_village", label: "Town", render: (row: WarehouseRow) => row.town_village || "-" },
    // { key: "street", label: "Street", render: (row: WarehouseRow) => row.street || "-" },
    // { key: "landmark", label: "Landmark", render: (row: WarehouseRow) => row.landmark || "-" },
    // { key: "agreed_stock_capital", label: "Stock Capital", render: (row: WarehouseRow) => row.agreed_stock_capital || "-" },
    {
      key: "is_efris", label: "EFRIS",
      // showByDefault: true,
      render: (row: WarehouseRow) => {
        const value = row.is_efris;
        const strValue = value != null ? String(value) : "";
        if (strValue === "0") return "Disable";
        if (strValue === "1") return "Enable";
        return strValue || "-";
      },
    },
    {
      key: "status",
      label: "Status",
      // showByDefault: true,
      // isSortable: true,
      render: (row: WarehouseRow) => <StatusBtn isActive={String(row.status) > "0"} />,
      filterStatus: {
        enabled: true,
        onFilter: handleStatusFilter,
        currentFilter: currentStatusFilter,
      },
    },
  ];

  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, [warehouseId, regionId, areaId, currentStatusFilter]);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  type TableRow = TableDataType & { id?: string };
  // typed row for warehouse table
  type WarehouseRow = TableDataType & {
    id?: string;
    code?: string;
    warehouseName?: string;
    tin_no?: string;
    ownerName?: string;
    owner_email?: string;
    ownerContact?: string;
    warehouse_type?: string;
    business_type?: string;
    // depotName?: string;
    warehouse_manager?: string;
    warehouse_manager_contact?: string;
    district?: string;
    street?: string;
    branch_id?: string;
    town_village?: string;
    region?: { code?: string; name: string; region_name?: string; }
    get_company_customer?: { owner_name?: string };
    city?: string;
    location?: { code?: string; name?: string; location_code?: string; location_name?: string; }
    landmark?: string;
    latitude?: string;
    longitude?: string;
    threshold_radius?: string;
    device_no?: string;
    is_branch?: string;
    p12_file?: string;
    is_efris?: string;
    agreed_stock_capital?: string;
    deposite_amount?: string;
    // depotLocation?: string;
    // depotLocation?: string;
    phoneNumber?: string;
    address?: string;

    status?: string | boolean | number;
  };

  const [selectedRow, setSelectedRow] = useState<WarehouseRow | null>(null);

  const fetchWarehouse = useCallback(
    async (
      page: number = 1,
      pageSize: number = 50
    ): Promise<listReturnType> => {
      try {
        //  setLoading(true);

        // Build params with all filters
        const params: any = {
          page: page.toString(),
          per_page: pageSize.toString(),
        };

        // if (warehouseId) {
        //   params.warehouse_id = warehouseId;
        // }
        if (regionId) {
          params.region_id = regionId;
        }
        if (areaId) {
          params.area_id = areaId;
        }

        // Add status filter if active (true=1, false=0)
        if (currentStatusFilter !== null) {
          params.status = currentStatusFilter ? "1" : "0";
        }
        const listRes = await getWarehouse(params);
        //  setLoading(false);
        return {
          data: listRes.data || [],
          total: listRes?.pagination?.last_page || listRes?.pagination?.pagination?.last_page || 1,
          currentPage: listRes?.pagination?.current_page || listRes?.pagination?.pagination?.current_page || 1,
          pageSize: listRes?.pagination?.limit || listRes?.pagination?.pagination?.limit || pageSize,
        };
      } catch (error: unknown) {
        console.error("API Error:", error);
        setLoading(false);
        throw new Error(String(error));
      }
    },
    [warehouseId, areaId, regionId, currentStatusFilter]
  );

  const searchWarehouse = useCallback(
    async (
      query: string,
      pageSize: number = 50,
      columns?: string,
      page: number = 1
    ): Promise<listReturnType> => {
      try {
        //  setLoading(true);
        const listRes = await warehouseListGlobalSearch({
          query,
          per_page: pageSize.toString(),
          page: page.toString(),
        });
        setSearchFilter(query);
        //  setLoading(false);
        return {
          data: listRes.data || [],
          total: listRes.pagination.last_page || 1,
          currentPage: listRes.pagination.current_page || 1,
          pageSize: listRes.pagination.limit || pageSize,
          totalRecords: listRes.pagination.total || 0,
        };
      } catch (error: unknown) {
        console.error("API Error:", error);
        setLoading(false);
        throw error;
      }
    },
    [warehouseId, areaId, regionId, currentStatusFilter]
  );


  const exportFile = async (format: string) => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await exportWarehouseData({ format, search: searchFilter, filters: { area_id: areaId, region_id: regionId, status: currentStatusFilter === null ? undefined : (currentStatusFilter ? "1" : "0") } });
      if (response && typeof response === 'object' && response.download_url) {
        await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
      }
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } catch (error) {
      showSnackbar("Failed to download Distributors data", "error");
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } finally {
    }
  };

  const statusUpdate = async (ids?: (string | number)[], status: number = 0) => {
    try {
      if (!ids || ids.length === 0) {
        showSnackbar("No Distributors selected", "error");
        return;
      }
      const selectedRowsData: number[] = ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
      if (selectedRowsData.length === 0) {
        showSnackbar("No Distributors selected", "error");
        return;
      }
      await warehouseStatusUpdate({ warehouse_ids: selectedRowsData, status });
      setRefreshKey((k) => k + 1);
      showSnackbar("Distributors status updated successfully", "success");
    } catch (error) {
      showSnackbar("Failed to update Distributors status", "error");
    }
  };


  const handleConfirmDelete = async () => {
    if (!selectedRow) return;

    try {
      if (!selectedRow?.id) throw new Error('Missing id');
      await deleteWarehouse(String(selectedRow.id)); // call API

      showSnackbar("Distributors deleted successfully ", "success");
      setLoading(false);
    } catch (error) {
      console.error("Delete failed :", error);
      showSnackbar("Failed to delete Distributors", "error");
    } finally {
      setShowDeletePopup(false);
      setSelectedRow(null);
    }
  };
  // useEffect(() => {
  //   setLoading(true);
  // }, []);
  return (
    <>


      <div className="flex flex-col h-full">
        <Table
          refreshKey={refreshKey}
          config={{
            api: {
              list: fetchWarehouse,
              search: searchWarehouse
            },

            header: {
              exportButton: {
                threeDotLoading: threeDotLoading,
                show: true,
                onClick: () => exportFile("xlsx"),
              },
              threeDot: [
                // {
                //   icon: threeDotLoading.csv ? "eos-icons:three-dots-loading" : "gala:file-document",
                //   label: "Export CSV",
                //   labelTw: "text-[12px] hidden sm:block",
                //   onClick: () => !threeDotLoading.csv && exportFile("csv"),
                // },
                // {
                //   icon: threeDotLoading.xlsx ? "eos-icons:three-dots-loading" : "gala:file-document",
                //   label: "Export Excel",
                //   labelTw: "text-[12px] hidden sm:block",
                //   onClick: () => !threeDotLoading.xlsx && exportFile("xlsx"),
                // },
                {
                  icon: "lucide:radio",
                  label: "Inactive",
                  // showOnSelect: true,
                  showWhen: (data: TableDataType[], selectedRow?: number[]) => {
                    if (!selectedRow || selectedRow.length === 0) return false;
                    const status = selectedRow?.map((id) => data[id].status).map(String);
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
                    const status = selectedRow?.map((id) => data[id].status).map(String);
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
              ],
              title: "Distributors",
              searchBar: true,
              columnFilter: true,
              actions: can("create") ? [
                <SidebarBtn
                  key={0}
                  href="/distributors/add"
                  isActive
                  leadingIcon="lucide:plus"
                  label="Add"
                  labelTw="hidden sm:block"
                />,
              ] : [],
            },
            localStorageKey: "master-warehouse-table",
            footer: { nextPrevBtn: true, pagination: true },
            columns,
            rowSelection: true,
            rowActions: [
              {
                icon: "lucide:eye",
                onClick: (data: object) => {
                  const row = data as TableRow;
                  router.push(`/distributors/details/${row.uuid}`);
                },
              },

              ...(can("edit") ? [{
                icon: "lucide:edit-2",
                onClick: (data: object) => {
                  const row = data as TableRow;
                  router.push(`/distributors/${row.uuid}`);
                },
              }] : []),

            ],
            pageSize: 50,
          }}
        />
      </div>
    </>
  );
}