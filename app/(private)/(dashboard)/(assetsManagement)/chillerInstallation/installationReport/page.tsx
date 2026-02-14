"use client";

import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table, {
    listReturnType,
    searchReturnType,
    TableDataType
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";
import { irList, irReportList } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatDate } from "../../../(master)/salesTeam/details/[uuid]/page";


// ✅ TYPE FOR INSTALLATION REPORT API ITEM
interface InstallationReportRow {
    id: number;
    uuid: string;
    osa_code: string;
    iro_id: number;
    salesman_id: number;
    schedule_date: string;
    status: number;
    created_user: number;
    created_at: string;
    iro_code: string;
    warehouse_code: string;
    warehouse_name: string;
    salesman_code: string;
    salesman_name: string;
    count: number;
}

// ✅ TABLE COLUMNS FOR INSTALLATION REPORT
const columns = [
    {
        key: "osa_code",
        label: "OSA Code",
        showByDefault: true,
    },
    {
        key: "iro_code",
        label: "IRO Code",
        showByDefault: true,
        render: (data: TableDataType) => {
            const count = Array.isArray(data.details) ? data.details.length : 0;
            // Show OSA code and count together
            return `${data.iro.code || "-"} (${count} CRF)`;
        },
    },
    {
        key: "warehouse",
        label: "Distributor",
        showByDefault: true,
        render: (row: any) => {
            const warehouse = row.details?.[0]?.asset?.warehouse;

            return (
                <p>
                    {warehouse
                        ? `${warehouse.code} - ${warehouse.name}`
                        : "-"}
                </p>
            );
        },
    },

    {
        key: "salesman",
        label: "Sales Team",
        showByDefault: true,
        render: (row: any) => <p>{row.salesman.code || ""} - {row.salesman.name || ""}</p>,
    },

    {
        key: "schedule_date",
        label: "Schedule Date",
        showByDefault: true,
        render: (row: any) => <p>{formatDate(row.schedule_date || "-")}</p>,
    },
    {
        key: "status",
        label: "Status",
        showByDefault: true,
        render: (row: any) => (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {row.status}
            </span>
        ),
    },
];


export default function BulkTransferListPage() {
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const router = useRouter();

    const { warehouseAllOptions, regionOptions, areaOptions, assetsModelOptions, ensureAreaLoaded, ensureAssetsModelLoaded, ensureRegionLoaded, ensureWarehouseAllLoaded } =
        useAllDropdownListData();

    // Load dropdown data
    useEffect(() => {
        ensureAreaLoaded();
        ensureAssetsModelLoaded();
        ensureRegionLoaded();
        ensureWarehouseAllLoaded();
    }, [ensureAreaLoaded, ensureAssetsModelLoaded, ensureRegionLoaded, ensureWarehouseAllLoaded]);

    const [refreshKey, setRefreshKey] = useState(0);

    // -----------------------------------------
    // 🔥 FETCH FUNCTION FOR TABLE
    // -----------------------------------------
    const fetchBulkTransfer = useCallback(
        async (
            page: number = 1,
            pageSize: number = 20,
            appliedFilters: Record<string, any> = {}
        ): Promise<listReturnType> => {
            try {
                setLoading(true);

                const result = await irList({
                    page: page.toString(),
                    per_page: pageSize.toString(),
                    ...appliedFilters,
                });

                if (result?.data && result?.pagination) {
                    const totalPages = Math.ceil(result.pagination.total / result.pagination.per_page);
                    return {
                        data: Array.isArray(result.data) ? result.data : [],
                        total: totalPages, // total number of PAGES, not records
                        currentPage: result.pagination.current_page,
                        pageSize: result.pagination.per_page,
                    };
                }

                if (Array.isArray(result)) {
                    return {
                        data: result,
                        total: result.length,
                        currentPage: page,
                        pageSize: pageSize,
                    };
                }

                // Handle object response without pagination
                if (result?.data) {
                    return {
                        data: Array.isArray(result.data) ? result.data : [],
                        total: result?.pagination?.total || (Array.isArray(result.data) ? result.data.length : 0),
                        currentPage: result?.pagination?.current_page || page,
                        pageSize: result?.pagination?.per_page || pageSize,
                    };
                }

                // Fallback
                console.warn("⚠️ Unexpected response structure");
                return {
                    data: [],
                    total: 0,
                    currentPage: 1,
                    pageSize: pageSize,
                };
            } catch (error) {
                // console.error("❌ Error fetching installation reports:", error);
                showSnackbar("Failed to fetch installation report list", "error");

                return {
                    data: [],
                    total: 1,
                    currentPage: 1,
                    pageSize: pageSize,
                };
            } finally {
                setLoading(false);
            }
        },
        [setLoading, showSnackbar]
    );

    const searchInvoices = useCallback(async (): Promise<searchReturnType> => {
        return { data: [], currentPage: 1, total: 0, pageSize: 20 };
    }, []);


    // Refresh table when dropdown options load
    // useEffect(() => {
    //     setRefreshKey((k) => k + 1);
    // }, [warehouseAllOptions, regionOptions, areaOptions, assetsModelOptions]);


    return (
        <div className="flex flex-col h-full">
            <Table
                refreshKey={refreshKey}
                config={{
                    api: { list: fetchBulkTransfer, search: searchInvoices },

                    header: {
                        title: "Installation Report",
                        columnFilter: true,
                        searchBar: false,
                        actions: [
                            <SidebarBtn
                                key="add"
                                href="/chillerInstallation/installationReport/add"
                                leadingIcon="lucide:plus"
                                label="Add"
                                labelTw="hidden lg:block"
                                isActive
                            />,
                            // <SidebarBtn
                            //     key="addAllocate"
                            //     href="/chillerInstallation/bulkTransfer/addAllocate"
                            //     leadingIcon="lucide:plus"
                            //     label="Add Allocate"
                            //     labelTw="hidden lg:block"
                            //     isActive
                            // />,
                        ],

                        // 🔥 FILTER FIELDS THAT MATCH YOUR API
                        filterByFields: [
                            {
                                key: "region_id",
                                label: "Region",
                                isSingle: false,
                                multiSelectChips: true,
                                options: regionOptions || [],
                            },
                            {
                                key: "area_id",
                                label: "Area",
                                isSingle: false,
                                multiSelectChips: true,
                                options: areaOptions || [],
                            },
                            {
                                key: "warehouse_id",
                                label: "Warehouse",
                                isSingle: false,
                                multiSelectChips: true,
                                options: warehouseAllOptions || [],
                            },
                            {
                                key: "assets_id",
                                label: "Model / Assets",
                                isSingle: false,
                                multiSelectChips: true,
                                options: assetsModelOptions || [],
                            },
                        ],
                    },

                    footer: { nextPrevBtn: true, pagination: true },

                    columns,

                    rowSelection: true,
                    rowActions: [
                        {
                            icon: "lucide:eye",
                            onClick: (data: TableDataType) => {
                                router.push(`/chillerInstallation/installationReport/view/${data.uuid}`);
                            },
                        },
                    ],

                    pageSize: 20,
                    localStorageKey: "bulk-transfer-table",
                }}
            />
        </div>
    );
}
