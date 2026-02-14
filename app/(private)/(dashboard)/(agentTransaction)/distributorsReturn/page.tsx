"use client";

import { useState, useCallback,useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import Table, {
    listReturnType,
    TableDataType,
    searchReturnType,
} from "@/app/components/customTable";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useLoading } from "@/app/services/loadingContext";
import DismissibleDropdown from "@/app/components/dismissibleDropdown";
import CustomDropdown from "@/app/components/customDropdown";
import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { returnList, returnHeader, exportReturneWithDetails,returnExportCollapse, returnGlobalFilter } from "@/app/services/agentTransaction";
import StatusBtn from "@/app/components/statusBtn2";
import BorderIconButton from "@/app/components/borderIconButton";
import { downloadFile } from "@/app/services/allApi";
import toInternationalNumber, { FormatNumberOptions } from "@/app/(private)/utils/formatNumber";
import FilterComponent from "@/app/components/filterComponent";
import ApprovalStatus from "@/app/components/approvalStatus";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import { downloadPDFGlobal } from "@/app/services/allApi";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
const dropdownDataList = [
    // { icon: "lucide:layout", label: "SAP", iconWidth: 20 },
    // { icon: "lucide:download", label: "Download QR Code", iconWidth: 20 },
    // { icon: "lucide:printer", label: "Print QR Code", iconWidth: 20 },
    { icon: "lucide:radio", label: "Inactive", iconWidth: 20 },
    { icon: "lucide:delete", label: "Delete", iconWidth: 20 },
];

// 🔹 Table Columns


export default function CustomerInvoicePage() {
    const { can, permissions } = usePagePermissions();
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const router = useRouter();
    const [colFilter, setColFilter] = useState<boolean>(false);
    const [filterPayload,setFilterPayload] = useState<any>();
    const { warehouseAllOptions, salesmanOptions,ensureWarehouseAllLoaded,ensureSalesmanLoaded } = useAllDropdownListData();
    const [warehouseId, setWarehouseId] = useState("");
    const [salesmanId, setSalesmanId] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [returnCode, setReturnCode] = useState("");
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().split("T")[0],
        toDate: new Date().toISOString().split("T")[0],
        region: "",
        routeCode: "",
    });
     const [threeDotLoading, setThreeDotLoading] = useState({
    csv: false,
    xlsx: false,
  });

    useEffect(() => {
    ensureSalesmanLoaded();
    ensureWarehouseAllLoaded();
  }, [ensureSalesmanLoaded, ensureWarehouseAllLoaded]);

  const columns = [
    { key: "osa_code", label: "Code", showByDefault: true },
    { key: "invoice_code", label: "Invoice Code", showByDefault: true },
    // { key: "delivery_code", label: "Delivery Code", showByDefault: true },
    {
        key: "warehouse_code", label: "Distributor", showByDefault: true, render: (row: TableDataType) => {
            const code = row.warehouse_code || "";
            const name = row.warehouse_name || "";
            return `${code}${code && name ? " - " : "-"}${name}`;
        },
        filter: {
        isFilterable: true,
        width: 320,
        filterkey: "warehouse_id",
        options: Array.isArray(warehouseAllOptions) ? warehouseAllOptions : [],
        onSelect: (selected: string | string[]) => {
            setWarehouseId((prev) => (prev === selected ? "" : (selected as string)));
        },
        isSingle: false,
        selectedValue: warehouseId,
    },
    },
    {
        key: "route_code", label: "Route", showByDefault: true, render: (row: TableDataType) => {
            const code = row.route_code || "";
            const name = row.route_name || "";
            return `${code}${code && name ? " - " : "-"}${name}`;
        }
    },
    {
        key: "customer_code", label: "Customer", showByDefault: true, render: (row: TableDataType) => {
            const code = row.customer_code || "";
            const name = row.customer_name || "";
            return `${code}${code && name ? " - " : "-"}${name}`;
        }
    },
    // {
    //     key: "salesman_code", label: "Sales Team", showByDefault: true, render: (row: TableDataType) => {
    //         const code = row.salesman_code || "";
    //         const name = row.salesman_name || "";
    //         return `${code}${code && name ? " - " : "-"}${name}`;
    //     },
    //     filter: {
    //     isFilterable: true,
    //     width: 320,
    //     filterkey: "salesman_id",
    //     options: Array.isArray(salesmanOptions) ? salesmanOptions : [],
    //     onSelect: (selected: string | string[]) => {
    //         setSalesmanId((prev) => (prev === selected ? "" : (selected as string)));
    //     },
    //     isSingle: false,
    //     selectedValue: salesmanId,
    // },
    // },
    {
        key: "total", label: "Amount", showByDefault: true, render: (row: TableDataType) => {
            // row.total_amount may be string or number; toInternationalNumber handles both
            return toInternationalNumber(row.total, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            } as FormatNumberOptions);
        },
    },
    {
        key: "approval_status",
        label: "Approval Status",
        showByDefault: false,
        render: (row: TableDataType) => <ApprovalStatus status={row.approval_status || "-"} />,
    },
    // {
    //     key: "status",
    //     label: "Status",
    //     isSortable: true,
    //     render: (row: TableDataType) => {
    //         // Treat status 1 or 'active' (case-insensitive) as active
    //         const isActive =
    //             String(row.status) === "1" ||
    //             (typeof row.status === "string" &&
    //                 row.status.toLowerCase() === "active");
    //         return <StatusBtn isActive={isActive} />;
    //     },
    //     showByDefault: true,
    // },
];

    const [refreshKey, setRefreshKey] = useState(0);

    // Refresh table when permissions load
    useEffect(() => {
        if (permissions.length > 0) {
            setRefreshKey((prev) => prev + 1);
        }
    }, [permissions]);
    const [showDropdown, setShowDropdown] = useState(false);

  // Load dropdown data

    const handleChange = (name: string, value: string) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };
useEffect(() => {
        setRefreshKey((k) => k + 1);
      }, [warehouseId, salesmanId]);
    // 🔹 Fetch Invoices
    const fetchInvoices = useCallback(async (
        page: number = 1,
        pageSize: number = 50
    ): Promise<listReturnType> => {
        try {
            setLoading(true);
             let params: any = {
          limit: pageSize.toString(),
          page: page.toString(),
        };
        if (warehouseId) {
            params.warehouse_id = warehouseId;
        }
        if (salesmanId) {
            params.salesman_id = salesmanId;
        }
            const result = await returnList(params);
            setReturnCode(result.data.osa_code);
            return {
                data: Array.isArray(result.data) ? result.data : [],
                total: result?.pagination?.totalPages || 1,
                currentPage: result?.pagination?.page || 1,
                pageSize: result?.pagination?.limit || pageSize,
            };
        } catch (error) {
            console.error(error);
            showSnackbar("Failed to fetch invoices", "error");
            return {
                data: [],
                total: 1,
                currentPage: 1,
                pageSize: pageSize,
            };
        } finally {
            setLoading(false);
        }
    }, [setLoading, showSnackbar, warehouseId, salesmanId]);

    // 🔹 Search Invoices (Mock)
    const searchInvoices = useCallback(async (): Promise<searchReturnType> => {
        try {
            setLoading(true);
            return {
                data: [],
                currentPage: 1,
                pageSize: 10,
                total: 0,
            };
        } finally {
            setLoading(false);
        }
    }, [setLoading]);

    const filterBy = useCallback(
        async (
            payload: Record<string, string | number | null>,
            pageSize: number
        ): Promise<listReturnType> => {
            let result;
            setColFilter(true);
            setLoading(true);
            try {
                const params: Record<string, string> = {};
                Object.keys(payload || {}).forEach((k) => {
                    const v = payload[k as keyof typeof payload];
                    if (v !== null && typeof v !== "undefined" && String(v) !== "") {
                        params[k] = String(v);
                    }
                });
                result = await returnList(params);
            } finally {
                setLoading(false);
                setColFilter(false);
            }

            if (result?.error) throw new Error(result.data?.message || "Filter failed");
            else {
                const pagination = result.pagination?.pagination || result.pagination || {};
                return {
                    data: result.data || [],
                    total: pagination.totalPages || result.pagination?.totalPages || 0,
                    totalRecords: pagination.totalRecords || result.pagination?.totalRecords || 0,
                    currentPage: pagination.current_page || result.pagination?.currentPage || 0,
                    pageSize: pagination.limit || pageSize,
                };
            }
        },
        [setLoading]
    );

      const fetchReturnsAccordingToGlobalFilter = useCallback(
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
            const listRes = await returnGlobalFilter(body);
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
        [returnGlobalFilter, warehouseId, salesmanId]
      );

    const exportFile = async (format: string) => {
        if (isExporting) return; // Prevent multiple clicks
        setIsExporting(true);
        // setLoading(true);
        try {
            setThreeDotLoading((prev) => ({ ...prev, csv: true }));
            const response = await returnHeader({ format ,filter:filterPayload });
            if (response && typeof response === 'object' && response.download_url) {
                await downloadFile(response.download_url);
                showSnackbar("File downloaded successfully ", "success");
            } else {
                showSnackbar("Failed to get download URL", "error");
            }
        } catch (error) {
            showSnackbar("Failed to download Distributor data", "error");
        } finally {
            setIsExporting(false);
            setThreeDotLoading((prev) => ({ ...prev, csv: false }));
            // setLoading(false);
        }
    };
  const exportCollapseFile = async (format: "csv" | "xlsx" = "xlsx") => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, xlsx: true }));
      const response = await returnExportCollapse({ format ,filter:filterPayload });
      if (response && typeof response === "object" && response.download_url) {
        await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
      }
    } catch (error) {
      showSnackbar("Failed to download Distributor data", "error");
    } finally {
        setThreeDotLoading((prev) => ({ ...prev, xlsx: false }));
    }
  };
    const downloadPdf = async (uuid: string,retunCode: string) => {
        try {
            // setLoading(true);
            const response = await exportReturneWithDetails({ uuid: uuid, format: "pdf" });
            if (response && typeof response === 'object' && response.download_url) {
                const fileName = `Return - ${retunCode}.pdf`;
                await downloadPDFGlobal(response.download_url, fileName);
                // await downloadFile(response.download_url);
                showSnackbar("File downloaded successfully ", "success");
            } else {
                showSnackbar("Failed to get download URL", "error");
            }
        } catch (error) {
            showSnackbar("Failed to download file", "error");
        } finally {
            // setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* 🔹 Table Section */}
            <Table
                refreshKey={refreshKey}
                config={{
                    api: { list: fetchInvoices, search: searchInvoices, filterBy: async (payload: Record<string, string | number | null | any>,pageSize: number) => {
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
                  return fetchReturnsAccordingToGlobalFilter(restPayload as Record<string, any>, pageSize, pageNo);
                }
              }, },
                    header: {
                        title: "Distributor's Return",
                        columnFilter: true,
                        threeDot: [
                            {
                                icon: threeDotLoading.csv
                    ? "eos-icons:three-dots-loading"
                    : "gala:file-document",
                                label: "Export Header",
                                onClick: () => 
                                   
                                   !threeDotLoading.csv && exportFile("csv"),
                            },
                            {
                               icon: threeDotLoading.xlsx
                    ? "eos-icons:three-dots-loading"
                    : "gala:file-document",
                                label: "Export Details",
                                
                                onClick: () => 
                                    !threeDotLoading.xlsx && exportCollapseFile("xlsx"),
                            },
                        ],
                           filterRenderer: (props) => (
                                                                                                               <FilterComponent
                                                                                                               currentDate={true}
                                                                                                                 {...props}
                                                                                                               />
                                                                                                             ),
                            wholeTableActions: [
                            <div key={0} className="flex gap-[12px] relative">
                                <DismissibleDropdown
                                    isOpen={showDropdown}
                                    setIsOpen={setShowDropdown}
                                    button={
                                        <BorderIconButton icon="ic:sharp-more-vert" />
                                    }
                                    dropdown={
                                        <div className="absolute top-[40px] right-0 z-30 w-[226px]">
                                            <CustomDropdown>
                                                {dropdownDataList.map(
                                                    (link, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="px-[14px] py-[10px] flex items-center gap-[8px] hover:bg-[#FAFAFA]"
                                                        >
                                                            <Icon
                                                                icon={
                                                                    link.icon
                                                                }
                                                                width={
                                                                    link.iconWidth
                                                                }
                                                                className="text-[#717680]"
                                                            />
                                                            <span className="text-[#181D27] font-[500] text-[16px]">
                                                                {
                                                                    link.label
                                                                }
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </CustomDropdown>
                                        </div>
                                    }
                                />
                            </div>
                        ],
                        searchBar: false,
                        actions: can("create") ? [
                            <SidebarBtn
                                key={1}
                                href="/distributorsReturn/add"
                                isActive
                                leadingIcon="mdi:plus"
                                label="Add"
                                labelTw="hidden lg:block"
                            />
                        ] : []
                    },
                    footer: { nextPrevBtn: true, pagination: true },
                    columns,
                    localStorageKey: "return-table",
                    rowActions: [
                        {
                            icon: "lucide:eye",
                            onClick: (row: TableDataType) =>
                                router.push(
                                    `/distributorsReturn/details/${row.uuid}`
                                ),
                        },
                        {
                            icon: "lucide:download",
                            showLoading: true,
                            onClick: (row: TableDataType) => downloadPdf(row.uuid,row.osa_code),
                        },
                    ],
                    pageSize: 10,
                }}
            />
        </div>
    );
}