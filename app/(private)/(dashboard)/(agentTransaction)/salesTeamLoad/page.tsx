"use client";

import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table, {
  configType,
  listReturnType,
  TableDataType,
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";
import { salesmanLoadHeaderList, exportSalesmanLoad, exportSalesmanLoadDownload, loadExportCollapse, salesmanLoadPdf, loadGlobalFilter } from "@/app/services/agentTransaction";
import { useRef } from "react";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { downloadFile } from "@/app/services/allApi";
import ApprovalStatus from "@/app/components/approvalStatus";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import FilterComponent from "@/app/components/filterComponent";
import { formatWithPattern } from "@/app/utils/formatDate";
import { formatDate } from "../../(master)/salesTeam/details/[uuid]/page";
import { downloadPDFGlobal } from "@/app/services/allApi";
import OrderStatus from "@/app/components/orderStatus";
// import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
interface SalesmanLoadRow {
  osa_code?: string;
  warehouse?: { code?: string; name?: string };
  route?: { code?: string; name?: string };
  salesman?: { code?: string; name?: string };
  salesman_type?: { id?: number; code?: string; name?: string };
  project_type?: { id?: number; code?: string; name?: string };
  status?: number | boolean;
  uuid?: string;
}

export default function SalemanLoad() {
  const { can, permissions } = usePagePermissions();
  const { warehouseAllOptions, salesmanOptions, ensureSalesmanLoaded, routeOptions, ensureRouteLoaded, ensureWarehouseAllLoaded } = useAllDropdownListData();
  const [warehouseId, setWarehouseId] = useState<string>();
  const [routeId, setRouteId] = useState<string>();
  const [salesmanId, setSalesmanId] = useState<string>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [colFilter, setColFilter] = useState<boolean>(false);
  const [filterPayload, setFilterPayload] = useState<any>();
  // Refresh table when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [permissions]);

  // Load dropdown data
  useEffect(() => {
    ensureRouteLoaded();
    ensureWarehouseAllLoaded();
    ensureSalesmanLoaded();
  }, [ensureRouteLoaded, ensureWarehouseAllLoaded, ensureSalesmanLoaded]);

  const columns: configType["columns"] = [
    {
      key: "osa_code",
      label: "Code",
      showByDefault: true,
    },
    {
      key: "created_at",
      label: "Load Date",
      render: (row: TableDataType) => formatDate(row?.created_at || "-"),
      showByDefault: true,
    },
    {
      key: "warehouse",
      label: "Distributor",
      render: (row: TableDataType) => {
        const s = row as SalesmanLoadRow;
        const nameParts = s.warehouse?.name?.split(" - ");
        const shortName =
          nameParts && nameParts.length > 1
            ? `${nameParts[0]} (${nameParts[1]})`
            : s.warehouse?.name || "-";
        return `${s.warehouse?.code ?? ""} - ${shortName}`;
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
        const s = row as SalesmanLoadRow;
        return `${s.route?.code || ""} - ${s.route?.name || ""}`;
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
    {
      key: "salesman",
      label: "Sales Team",
      render: (row: TableDataType) => {
        const s = row as SalesmanLoadRow;
        return `${s.salesman?.code ?? ""} - ${s.salesman?.name ?? ""}`;
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
      key: "salesman_type", label: "Sales Team Type",
      render: (row: TableDataType) => {
        const s = row as SalesmanLoadRow;
        return `${s.salesman_type?.name ?? ""}`;
      },
      showByDefault: true,
    },
    {
      key: "project_type",
      label: "Sales Team Role",
      render: (row: TableDataType) => {
        return `${(row as SalesmanLoadRow).project_type?.name ?? "-"}`;
      },
      showByDefault: true,
    },
    // {
    //     key: "approval_status",
    //     label: "Approval Status",
    //     render: (row: TableDataType) => <ApprovalStatus status={row.approval_status || "-"} />,
    // },
    {
      key: "is_confirmed",
      label: "Status",
      render: (row: TableDataType) => {
        const s = row as SalesmanLoadRow;
        return <OrderStatus order_flag={{ is_confirmed: row.is_confirmed }} />
        // return row.is_confirmed == 1 ? 'Sales Team Accepted' : 'Waiting For Accept'
      },
      showByDefault: true,
    },
  ];

  const { setLoading } = useLoading();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [threeDotLoading, setThreeDotLoading] = useState({
    pdf: false,
    csv: false,
    xlsx: false,
  });


  // In-memory cache for salesmanLoadHeaderList API calls
  const salesmanLoadHeaderCache = useRef<{ [key: string]: any }>({});
  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, [warehouseId, routeId, salesmanId]);

  const fetchSalesmanLoadHeader = useCallback(
    async (
      page: number = 1,
      pageSize: number = 50,
      payload?: Record<string, any>
    ): Promise<listReturnType> => {
      const params: any = {
                page: page.toString(),
                per_page: pageSize.toString(),
                ...payload,
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
      
       
      try {
        setLoading(true);
        const listRes = await salesmanLoadHeaderList(params);
        setLoading(false);
        return {
          data: Array.isArray(listRes.data) ? listRes.data : [],
          total: listRes?.pagination?.totalPages || 1,
          currentPage: listRes?.pagination?.page || 1,
          pageSize: listRes?.pagination?.limit || pageSize,
        };
        
      } catch (error) {
        setLoading(false);
        showSnackbar("Failed to load Salesman Load list", "error");
        return {
          data: [],
          total: 1,
          currentPage: 1,
          pageSize: pageSize,
        };
      }
    },
    [setLoading, showSnackbar, warehouseId, routeId, salesmanId]
  );


        const filterBy = useCallback(
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
        const listRes = await loadGlobalFilter(body);
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
      
            } catch (error: unknown) {
              console.error("API Error:", error);
              setLoading(false);
              throw error;
            }
            finally{
              setLoading(false);
            }
          },
          [loadGlobalFilter]
        );

  useEffect(() => {
    setLoading(true);
  }, [setLoading]);


  const downloadPdf = async (uuid: string,load_code:string) => {
    try {
      // setLoading(true);
      // setThreeDotLoading((prev) => ({ ...prev, pdf: true }));
      const response = await salesmanLoadPdf({ uuid: uuid, format: "pdf" });
      if (response && typeof response === 'object' && response.download_url) {
        const fileName = `Load - ${load_code}.pdf`;
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



  const exportFile = async (format: "csv" | "xlsx" = "csv") => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await exportSalesmanLoad({ format, filter: filterPayload });
      if (response && typeof response === 'object' && response.download_url) {
        await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
      }
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } catch (error) {
      showSnackbar("Failed to download Salesman Load data", "error");
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } finally {
    }
  };

  const exportCollapseFile = async (format: "csv" | "xlsx" = "csv") => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await loadExportCollapse({ format, filter: filterPayload });
      if (response && typeof response === "object" && response.download_url) {
        await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
      }
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } catch (error) {
      showSnackbar("Failed to download Distributor data", "error");
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } finally {
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Table
        refreshKey={refreshKey}
        config={{
          api: {
            list: fetchSalesmanLoadHeader,
            filterBy: filterBy,
         
        },
          header: {
            title: "Sales Team Load",
            searchBar: false,
            columnFilter: true,
            threeDot: [
              {
                icon: threeDotLoading.csv ? "eos-icons:three-dots-loading" : "gala:file-document",
                label: "Export CSV",
                labelTw: "text-[12px] hidden sm:block",
                onClick: () => !threeDotLoading.csv && exportFile("csv"),
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
                href="/salesTeamLoad/add"
                isActive
                leadingIcon="lucide:plus"
                label="Add"
                labelTw="hidden sm:block"
              />,
            ] : [],
          },
          localStorageKey: "salesmanLoad-table",
          footer: { nextPrevBtn: true, pagination: true },
          columns,
          // rowSelection: true,
          rowActions: [
            {
              icon: "lucide:eye",
              onClick: (data: object) => {
                const row = data as { uuid?: string };
                if (row.uuid) router.push(`/salesTeamLoad/details/${row.uuid}`);
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
