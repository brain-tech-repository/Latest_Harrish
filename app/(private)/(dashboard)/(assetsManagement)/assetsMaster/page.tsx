"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react";
import { useRouter } from "next/navigation";
import DismissibleDropdown from "@/app/components/dismissibleDropdown";
import CustomDropdown from "@/app/components/customDropdown";
import BorderIconButton from "@/app/components/borderIconButton";
import Table, { listReturnType, TableDataType } from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useLoading } from "@/app/services/loadingContext";
import { assetsMasterExport, chillerList, deleteChiller, deleteServiceTypes, serviceTypesList, chillerGlobalFilter } from "@/app/services/assetsApi";
import StatusBtn from "@/app/components/statusBtn2";
import { downloadFile } from "@/app/services/allApi";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import { formatDate } from "../../(master)/salesTeam/details/[uuid]/page";
import FilterComponent from "@/app/components/filterComponent";

const dropdownDataList = [
  { icon: "lucide:radio", label: "Inactive", iconWidth: 20 },
  { icon: "lucide:delete", label: "Delete", iconWidth: 20 },
];

export default function ShelfDisplay() {
  const { can, permissions } = usePagePermissions();
  const { setLoading } = useLoading();
  const [showDropdown, setShowDropdown] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [threeDotLoading, setThreeDotLoading] = useState<{ pdf: boolean; xlsx: boolean; csv: boolean }>({ pdf: false, xlsx: false, csv: false });
  const [filterPayload, setFilterPayload] = useState({});


  // Refresh table when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [permissions]);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const fetchServiceTypes = useCallback(
    async (pageNo: number = 1, pageSize: number = 10): Promise<listReturnType> => {
      setLoading(true);
      const res = await chillerList({
        page: pageNo.toString(),
        per_page: pageSize.toString(),
      });
      setLoading(false);
      if (res.error) {
        showSnackbar(res.data.message || "failed to fetch the Chillers", "error");
        throw new Error("Unable to fetch the Chillers");
      } else {
        return {
          data: res.data || [],
          currentPage: res?.pagination?.page || 0,
          pageSize: res?.pagination?.limit || 10,
          total: res?.pagination?.totalPages || 0,
        };
      }
    }, []
  )
  const searchChiller = useCallback(
    async (
      query: string,
      pageSize: number = 10,
      columnName?: string
    ): Promise<listReturnType> => {
      try {
        setLoading(true);

        const payload: any = {
          query,
          per_page: pageSize.toString(),
        };

        // 👇 only add column filter if it exists
        if (columnName) {
          payload[columnName] = query;
        }

        const res = await chillerList(payload);

        if (res?.error) {
          showSnackbar(
            res?.data?.message || "Failed to search the Chillers",
            "error"
          );
          throw new Error("Unable to search the Chillers");
        }

        return {
          data: res?.data || [],
          currentPage: res?.pagination?.page || 0,
          pageSize: res?.pagination?.limit || pageSize,
          total: res?.pagination?.totalPages || 0,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );


  const handleExport = async (fileType: "csv" | "xlsx") => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [fileType]: true }));
      const response = await assetsMasterExport({ format: fileType });
      if (response && typeof response === "object" && response.download_url) {
        await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
      }
    } catch (error) {
      showSnackbar("Failed to download warehouse data", "error");
      setThreeDotLoading((prev) => ({ ...prev, [fileType]: false }));
    } finally {
      setThreeDotLoading((prev) => ({ ...prev, [fileType]: false }));
      //   setShowExportDropdown(false);
    }
    // try {
    //   // setLoading(true);
    //   setThreeDotLoading((prev) => ({ ...prev, [fileType]: true }));

    //   const res = await assetsMasterExport({ format: fileType });

    //   let downloadUrl = "";

    //   if (res?.download_url && res.download_url.startsWith("blob:")) {
    //     downloadUrl = res.download_url;
    //   } else if (res?.download_url && res.download_url.startsWith("http")) {
    //     downloadUrl = res.download_url;
    //   } else if (typeof res === "string" && res.includes(",")) {
    //     const blob = new Blob([res], {
    //       type:
    //         fileType === "csv"
    //           ? "text/csv;charset=utf-8;"
    //           : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //     });
    //     downloadUrl = URL.createObjectURL(blob);
    //   } else {
    //     showSnackbar("No valid file or URL returned from server", "error");
    //     return;
    //   }

    //   // ⬇️ Trigger browser download
    //   const link = document.createElement("a");
    //   link.href = downloadUrl;
    //   link.download = `assets_export.${fileType}`;
    //   document.body.appendChild(link);
    //   link.click();
    //   document.body.removeChild(link);

    //   showSnackbar(
    //     `Download started for ${fileType.toUpperCase()} file`,
    //     "success"
    //   );
    // } catch (error) {
    //   console.error("Export error:", error);
    //   showSnackbar("Failed to export Assets Master data", "error");
    // } finally {
    //   // setLoading(false);
    //   setThreeDotLoading((prev) => ({ ...prev, [fileType]: false }));
    //   setShowExportDropdown(false);
    // }
  };


  useEffect(() => {
    setLoading(true);
  }, [])

  const fetchChillerAccordingToGlobalFilter = useCallback(
    async (
      payload: Record<string, any>,
      pageSize: number = 50,
      pageNo: number = 1
    ): Promise<listReturnType> => {

      try {
        setLoading(true);
        setFilterPayload(payload);
        const body = {
          limit: pageSize.toString(),
          page: pageNo.toString(),
          filter: payload
        }
        const listRes = await chillerGlobalFilter(body);
        const pagination =
          listRes.pagination?.pagination || listRes.pagination || {};
        return {
          data: listRes.data || [],
          total: pagination.totalPages || listRes.pagination?.totalPages || 1,
          totalRecords:
            pagination.totalRecords || listRes.pagination?.totalRecords || 0,
          currentPage: pagination.page || listRes.pagination?.page || 1,
          pageSize: pagination.limit || pageSize,
        };
        // fetchOrdersCache.current[cacheKey] = result;
        // return listRes;
      } catch (error: unknown) {
        console.error("API Error:", error);
        setLoading(false);
        throw error;
      }
      finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <>
      {/* Table */}
      <div className="flex flex-col h-full">
        <Table
          refreshKey={refreshKey}
          config={{
            api: {
              list: fetchServiceTypes,
              search: searchChiller,
              filterBy: fetchChillerAccordingToGlobalFilter
            },
            header: {
              title: "Assets Master",
              exportButton: {
                threeDotLoading: threeDotLoading,
                show: true,
                onClick: () => handleExport("xlsx"),
              },
              // threeDot: [
              //   {
              //     icon: threeDotLoading.csv || threeDotLoading.xlsx ? "eos-icons:three-dots-loading" : "gala:file-document",
              //     label: "Export CSV",
              //     onClick: (data: TableDataType[], selectedRow?: number[]) => {
              //       handleExport("csv");
              //     },
              //   },
              //   {
              //     icon: threeDotLoading.xlsx || threeDotLoading.xlsx ? "eos-icons:three-dots-loading" : "gala:file-document",
              //     label: "Export Excel",
              //     onClick: (data: TableDataType[], selectedRow?: number[]) => {
              //       handleExport("xlsx");
              //     },
              //   },
              // ],
              filterRenderer: (props) => (
                <FilterComponent
                  currentDate={true}
                  onlyFilters={["company_id", "region_id", "area_id", "warehouse_id", "route_id", "salesman_id", 'model', 'status']}
                  {...props}
                />
              ),
              searchBar: false,
              columnFilter: true,
              actions: can("create") ? [
                <SidebarBtn
                  key="name"
                  href="/assetsMaster/add"
                  leadingIcon="lucide:plus"
                  label="Add"
                  labelTw="hidden lg:block"
                  isActive
                />,
              ] : [],
            },
            localStorageKey: "assetsMasterTable",

            footer: { nextPrevBtn: true, pagination: true },
            columns: [
              {
                key: "osa_code", label: "Asset Code",
                showByDefault: true,
                render: (row: TableDataType) => (
                  <span className="font-semibold text-[#181D27] text-[14px]">
                    {row.osa_code}
                  </span>
                ),
              },
              // {
              //   key: "sap_code", label: "SAP Code",
              //   showByDefault: true,
              //   // showByDefault: false,
              //   render: (row: TableDataType) => (
              //     <span className="font-semibold text-[#181D27] text-[14px]">
              //       {row.sap_code}
              //     </span>
              //   ),
              // },
              {
                key: "warehouse",
                label: "Distributor",
                showByDefault: true,
                render: (row: TableDataType) => {
                  return `${row?.warehouse?.code || ""} - ${row?.warehouse?.name || ""}`;
                },
              },
              {
                key: "customer",
                label: "Customer",
                showByDefault: true,
                render: (row: TableDataType) => {
                  return `${row?.customer?.code || ""} - ${row?.customer?.name || ""}`;
                },
              },
              { key: "serial_number", label: "Serial Number", showByDefault: true, },
              {
                key: "assets_category", label: "Asset number", render: (data: TableDataType) =>
                  typeof data.assets_category === "object" && data.assets_category !== null
                    ? `${(data.assets_category as { name?: string }).name || ""}`
                    : "-",
                showByDefault: true,
              },
              {
                key: "model_number", label: "Model Number", render: (data: TableDataType) =>
                  typeof data.model_number === "object" && data.model_number !== null
                    ? `${(data.model_number as { name?: string }).name || ""}`
                    : "-",
                showByDefault: true,
              },
              { key: "acquisition", showByDefault: true, label: "Acquisition", render: (data: TableDataType) => formatDate(data.acquisition) },
              {
                key: "country", label: "Country", render: (data: TableDataType) =>
                  typeof data.country === "object" && data.country !== null
                    ? `${(data.country as { name?: string }).name || ""}`
                    : "-",
              },
              { key: "assets_type", label: "Assets Type" },
              { key: "capacity", label: "Capacity" },
              { key: "manufacturing_year", label: "Year" },
              {
                key: "status",
                label: "Status",
                showByDefault: true,
                render: (data: TableDataType) => {
                  const statusName =
                    typeof data.status === "object" && data.status !== null
                      ? (data.status as { name?: string }).name
                      : "";

                  const isActive = statusName?.toLowerCase() === "active";

                  return statusName ? (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
          ${isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {statusName}
                    </span>
                  ) : (
                    "-"
                  );
                },
              }
            ],
            // rowSelection: true,
            rowActions: [
              {
                icon: "lucide:eye",
                onClick: (data: TableDataType) => {
                  router.push(`/assetsMaster/view/${data.uuid}`);
                },
              },

              ...(can("edit") ? [{
                icon: "lucide:edit-2",
                onClick: (data: TableDataType) => {
                  router.push(`/assetsMaster/${data.uuid}`);
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