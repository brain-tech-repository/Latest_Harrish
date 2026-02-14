"use client";

import ApprovalStatus from "@/app/components/approvalStatus";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table, {
  configType,
  listReturnType,
  TableDataType,
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";
import { salesmanUnloadList,unloadExportCollapse, unloadGlobalFilter,unloadPdfDownload } from "@/app/services/agentTransaction";
import { downloadFile,downloadPDFGlobal } from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import FilterComponent from "@/app/components/filterComponent";
import { formatWithPattern } from "@/app/utils/formatDate";
export default function SalesmanUnloadPage() {
  const { can, permissions } = usePagePermissions();
  const { setLoading } = useLoading();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
const [threeDotLoading, setThreeDotLoading] = useState({
    csv: false,
    xlsx: false,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh table when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [permissions]);
  const [warehouseId, setWarehouseId] = useState<string>();
  const [routeId, setRouteId] = useState<string>();
  const [salesmanId, setSalesmanId] = useState<string>();
  const [filterPayload,setFilterPayload] = useState<any>();
  const {
    
    warehouseAllOptions,
    salesmanOptions,
    routeOptions,
    ensureWarehouseAllLoaded,
    ensureSalesmanLoaded,
     ensureRouteLoaded } = useAllDropdownListData();

  // Load dropdown data
  useEffect(() => {
   ensureWarehouseAllLoaded();
   ensureRouteLoaded();
   ensureSalesmanLoaded();
   
  }, [ensureRouteLoaded,ensureWarehouseAllLoaded,ensureSalesmanLoaded]);

  const [isFiltered, setIsFiltered] = useState(false);
  const [colFilter, setColFilter] = useState<boolean>(false);
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    region_id: "",
  });

  const routeTypeOptions = [
    { label: "Urban", value: "1" },
    { label: "Rural", value: "2" },
  ];

  // ✅ Handle input changes
  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ Allow any filter combination (at least one required)
  const validateFilters = () => {
    if (!form.start_date && !form.end_date && !form.region_id) {
      showSnackbar("Please select at least one filter", "warning");
      return false;
    }
    return true;
  };

  // ✅ Apply Filter
  const handleFilter = () => {
    if (!validateFilters()) return;
    setIsFiltered(true);
    setRefreshKey((prev) => prev + 1);
  };

  // ✅ Reset Filter
  const handleReset = () => {
    setForm({ start_date: "", end_date: "", region_id: "" });
    setIsFiltered(false);
    setRefreshKey((prev) => prev + 1);
  };

       useEffect(() => {
          setRefreshKey((k) => k + 1);
      }, [ warehouseId, routeId,salesmanId]);
  // ✅ Fetch Data API (used by Table)
  const fetchSalesmanUnloadHeader = useCallback(
    async (
      page: number = 1,
      pageSize: number = 50
    ): Promise<listReturnType> => {
      try {
        const params: any = {
          page: page.toString(),
          per_page: pageSize.toString(),
          submit: "Filter",
        };
           if (warehouseId) {
                params.warehouse_id = String(warehouseId);
            }
            if (routeId) {
                params.route_id = String(routeId);
            }
            if (salesmanId) {
                params.salesman_id = String(salesmanId);
            }
        if (form.start_date) params.start_date = form.start_date;
        if (form.end_date) params.end_date = form.end_date;
        if (form.region_id) params.region_id = form.region_id;

        const listRes = await salesmanUnloadList(params);

        return {
          data: Array.isArray(listRes.data) ? listRes.data : [],
          total: listRes?.pagination?.totalPages || 1,
          currentPage: listRes?.pagination?.page || 1,
          pageSize: listRes?.pagination?.limit || pageSize,
        };
      } catch (error) {
        setLoading(false);
        showSnackbar("Error fetching data", "error");
        return { data: [], total: 0, currentPage: 1, pageSize: 50 };
      }
    },
    [setLoading, isFiltered, form, showSnackbar,warehouseId,routeId,salesmanId]
  );

  const filterBy = useCallback(
    async (
      payload: Record<string, string | number | null>,
      pageSize: number
    ): Promise<listReturnType> => {
      let result;
      setLoading(true);
      setColFilter
      try {
        const params: Record<string, string> = {};
        Object.keys(payload || {}).forEach((k) => {
          const v = payload[k as keyof typeof payload];
          if (v !== null && typeof v !== "undefined" && String(v) !== "") {
            params[k] = String(v);
          }
        });
        result = await salesmanUnloadList(params);
      } finally {
        setLoading(false);
        setColFilter(false);
      }

      if (result?.error) throw new Error(result.data?.message || "Filter failed");
      else {
        const pagination = result.pagination?.pagination || result.pagination || {};
        return {
          data: result.data || [],
          total: pagination?.last_page || result.pagination?.last_page || 0,
          totalRecords: pagination?.total || result.pagination?.total || 0,
          currentPage: pagination?.current_page || result.pagination?.current_page || 0,
          pageSize: pagination?.per_page || pageSize,
        };
      }
    },
    [setLoading]
  );

        const fetchUnloadAccordingToGlobalFilter = useCallback(
          async (
            payload: Record<string, any>,
            pageSize: number = 50,
            pageNo: number = 1
          ): Promise<listReturnType> => {
      
            try {
              setLoading(true);
              setFilterPayload(payload);
              const body = {
                per_page: pageSize.toString(),
                current_page: pageNo.toString(),
                filter: payload
              }
              const listRes = await unloadGlobalFilter(body);
             const pagination =
              listRes.pagination?.pagination || listRes.pagination || {};
            return {
              data: listRes.data || [],
              total: pagination.last_page || listRes.pagination?.last_page || 1,
              totalRecords:
                pagination.total || listRes.pagination?.total || 0,
              currentPage: pagination.current_page || listRes.pagination?.current_page || 1,
              pageSize: pagination.per_page || pageSize,
            };
              // fetchOrdersCache.current[cacheKey] = result;
              // return listRes;
            } catch (error: unknown) {
              console.error("API Error:", error);
              setLoading(false);
              throw error;
            }
            finally{
                setLoading(false);
            }
          },
          [unloadGlobalFilter, warehouseId, salesmanId]
        );


  // ✅ Table Columns
  const columns: configType["columns"] = [
    { key: "osa_code", label: "Code",showByDefault: true,},
    { key: "unload_date", label: "Unload Date",render: (row: TableDataType) => {
      return formatWithPattern(
                new Date(row.unload_date),
                "DD MMM YYYY",
                "en-GB",
              );
            },
            showByDefault: true,
    },
    { key: "unload_time", label: "Unload Time",showByDefault: true,},
    { key: "laod_date", label: "Load Date",showByDefault: false  },
    {
      key: "salesman",
      label: "Sales Team",
      render: (row: TableDataType) => {
        const obj =
          typeof row.salesman === "string"
            ? JSON.parse(row.salesman)
            : row.salesman;
        return obj ? `${obj.code} - ${obj.name}` : "-";
      },
      showByDefault: true,
      filter: {
                isFilterable: true,
                width: 320,
                options: Array.isArray(salesmanOptions) ? salesmanOptions : [],
                onSelect: (selected) => {
                    setSalesmanId((prev) => (prev === selected ? "" : (selected as string)));
                },
                isSingle: false,
                selectedValue: salesmanId,
            },
    },
    {
      key: "warehouse",
      label: "Distributor ",
      render: (row: TableDataType) => {
        const obj =
          typeof row.warehouse === "string"
            ? JSON.parse(row.warehouse)
            : row.warehouse;
        return obj ? `${obj.code} - ${obj.name}` : "-";
      },
      showByDefault: true,
       filter: {
                isFilterable: true,
                width: 320,
                options: Array.isArray(warehouseAllOptions) ? warehouseAllOptions : [],
                onSelect: (selected) => {
                    setWarehouseId((prev) => (prev === selected ? "" : (selected as string)));
                },
                isSingle: false,
                selectedValue: warehouseId,
            },
    },
    {
      key: "route",
      label: "Route",
      render: (row: TableDataType) => {
        const obj =
          typeof row.route === "string" ? JSON.parse(row.route) : row.route;
        return obj ? `${obj.code} - ${obj.name}` : "-";
      },
      showByDefault: true,
      filter: {
                isFilterable: true,
                width: 320,
                options: Array.isArray(routeOptions) ? routeOptions : [],
                onSelect: (selected) => {
                    setRouteId((prev) => prev === selected ? "" : (selected as string));
                },
                isSingle: false,
                selectedValue: routeId,
            },
    },
    { key: "Salesman_type", label: "Sales Team Role",showByDefault: false, },
    { key: "unload_no", label: "Unload No.",showByDefault: true, },
    { key: "unload_from", label: "Unload By",showByDefault: true, },
    {
      key: "approval_status",
      label: "Approval Status",
      showByDefault: false,
      render: (row: TableDataType) => <ApprovalStatus status={row.approval_status || "-"} />,
    },
    // {
    //   key: "status",
    //   label: "Status",
    //   showByDefault: true,
    //   render: (row: TableDataType) => (<StatusBtn isActive={row.status ? true : false} />),
    // },
  ];

  const exportCollapseFile = async (format: "csv" | "xlsx" = "csv") => {
        try {
          setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
          const response = await unloadExportCollapse({ format , filter: filterPayload });
          if (response && typeof response === "object" && response.download_url) {
            await downloadFile(response.download_url);
            showSnackbar("File downloaded successfully ", "success");
          } else {
            showSnackbar("Failed to get download URL", "error");
          }
          setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
        } catch (error) {
          showSnackbar("Failed to download warehouse data", "error");
          setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
        } finally {
        }
      };

        const downloadPdf = async (uuid: string, unload_code: string) => {
          try {
            // setLoading(true);
            // setThreeDotLoading((prev) => ({ ...prev, pdf: true }));
            const response = await unloadPdfDownload({ uuid: uuid, format: "pdf" });
            if (response && typeof response === 'object' && response.download_url) {
               const fileName = `Unload - ${unload_code}.pdf`;
              await downloadPDFGlobal(response.download_url, fileName);
              // await downloadFile(response.download_url);
              showSnackbar("File downloaded successfully ", "success");
            } else {
              showSnackbar("Failed to get download URL", "error");
            }
          } catch (error) {
            showSnackbar("Failed to download file", "error");
          } finally {
            // setThreeDotLoading((prev) => ({ ...prev, pdf: false }));
            // setLoading(false);
          }
        };

  return (
    <div className="flex flex-col h-full">
      {/* <div className="gap-3 mb-4">
        <h1 className="text-bold-700 text-lg font-semibold">Sales Team Unload</h1>
      </div> */}

      {/* 📋 Table Section with Dynamic Filters */}
      <Table
        refreshKey={refreshKey}
        config={{
          api: { list: fetchSalesmanUnloadHeader,  filterBy: async (payload: Record<string, string | number | null |any>,pageSize: number) => {
                if (colFilter) {
                  return filterBy(payload, pageSize);
                } else {
                  let pageNo = 1;
                  if (payload && typeof payload.page === 'number') {
                    pageNo = payload.page;
                  } else if (payload && typeof payload.page === 'string' && !isNaN(Number(payload.page))) {
                    pageNo = Number(payload.page);
                  }
                  const { page, ...restPayload } = payload || {};
                  return fetchUnloadAccordingToGlobalFilter(restPayload as Record<string, any>, pageSize, pageNo);
                }
              },},
          header: {
            title: "Sales Team Unload",
            searchBar: false,
            columnFilter: true,
            threeDot: [
             {
               icon: threeDotLoading.csv ? "eos-icons:three-dots-loading" : "gala:file-document",
               label: "Export CSV",
               labelTw: "text-[12px] hidden sm:block",
               onClick: () => !threeDotLoading.csv && exportCollapseFile("csv"),
             },
             {
               icon: threeDotLoading.xlsx ? "eos-icons:three-dots-loading" : "gala:file-document",
               label: "Export Excel",
               labelTw: "text-[12px] hidden sm:block",
               onClick: () => !threeDotLoading.xlsx && exportCollapseFile("xlsx"),
             },
           ],
            filterRenderer: (props) => (
                                                                                                <FilterComponent
                                                                                                currentDate={true}
                                                                                                  {...props}
                                                                                                />
                                                                                              ),

            actions: can("create") ? [
              <SidebarBtn
                key={0}
                href="/salesTeamUnload/add"
                isActive
                leadingIcon="lucide:plus"
                label="Add"
                labelTw="hidden sm:block"
              />,
            ] : [],
          },
          localStorageKey: "salesmanUnload-table",
          footer: { nextPrevBtn: true, pagination: true },
          columns,
          rowActions: [
            {
              icon: "lucide:eye",
              onClick: (data: object) => {
                const row = data as TableDataType;
                router.push(`/salesTeamUnload/details/${String(row.uuid)}`);
              },
              
            },
            {
              icon: "material-symbols:download",
              showLoading: true,
              onClick: (row: TableDataType) => downloadPdf(row.uuid,row.osa_code),
            },
          ],
          pageSize: 50,
        }}
      />
    </div>
  );
}
