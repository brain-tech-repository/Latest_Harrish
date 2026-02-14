"use client";

import Table, { listReturnType, TableDataType } from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";
import { callRegisterList, callRegisterGlobalSearch, exportCallRegister, getTechicianList, callRegisterGlobalFilter } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import { downloadFile } from "@/app/services/allApi";
const dropdownDataList = [
    { icon: "lucide:radio", label: "Inactive", iconWidth: 20 },
    { icon: "lucide:delete", label: "Delete", iconWidth: 20 },
];

export default function CallRegister() {
    const { can, permissions } = usePagePermissions();
    const { setLoading } = useLoading();
    const [showDropdown, setShowDropdown] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [serarchQuery, setSearchQuery] = useState("");
    const [filterPayload, setFilterPayload] = useState({});
    const [threeDotLoading, setThreeDotLoading] = useState({
        csv: false,
        xlsx: false,
    });
    const [filters, setFilters] = useState({
        from_date: "",
        to_date: "",
    });
    const [technicianOptions, setTechnicianOptions] = useState([]);
    // Refresh table when permissions load
    useEffect(() => {
        if (permissions.length > 0) {
            setRefreshKey((prev) => prev + 1);
        }
    }, [permissions]);

    const router = useRouter();
    const { showSnackbar } = useSnackbar();

    const fetchTechnicians = useCallback(
        async () => {
            const res = await getTechicianList();
            const technicianData = res.data.map((item: any) => ({
                label: item.name,
                value: item.id,
            }));
            if (res.error) {
                showSnackbar(res.data.message || "failed to fetch the technicians", "error");
                throw new Error("Unable to fetch the technicians");
            } else {
                setTechnicianOptions(technicianData);
            }
        },
        [showSnackbar]
    );
    useEffect(() => {
        fetchTechnicians();
    }, [fetchTechnicians]);

    const fetchServiceTypes = useCallback(
        async (pageNo: number = 1, pageSize: number = 50): Promise<listReturnType> => {
            setLoading(true);
            const res = await callRegisterList({
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
                    pageSize: res?.pagination?.limit || 50,
                    total: res?.pagination?.totalPages || 0,
                };
            }
        }, []
    )
    const searchChiller = useCallback(
        async (query: string, pageSize: number = 50): Promise<listReturnType> => {
            setLoading(true);
            setSearchQuery(query);
            const res = await callRegisterGlobalSearch({
                search: query,
                per_page: pageSize.toString(),
            });

            setLoading(false);
            if (res.error) {
                showSnackbar(res.data.message || "failed to search the Chillers", "error");
                throw new Error("Unable to search the Chillers");
            } else {
                return {
                    data: res.data || [],
                    currentPage: res?.pagination?.page || 0,
                    pageSize: res?.pagination?.limit || 50,
                    total: res?.pagination?.totalPages || 0,
                };
            }
        }, []
    )

    useEffect(() => {
        setLoading(true);
    }, [])

    const exportFile = async (format: "csv" | "xlsx" = "csv") => {
        try {
            setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
            const response = await exportCallRegister({ format, filter: filterPayload });
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

    const fetchCallRegisterAccordingToGlobalFilter = useCallback(
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
                const listRes = await callRegisterGlobalFilter(body);
                const pagination =
                    listRes.pagination;
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
                            filterBy: fetchCallRegisterAccordingToGlobalFilter
                        },
                        header: {
                            exportButton: {
                threeDotLoading: threeDotLoading,
                show: true,
                onClick: () => exportFile("xlsx"),
              },
                            title: "Call Register",
                            // threeDot: [
                            //     {
                            //         icon: threeDotLoading.csv
                            //             ? "eos-icons:three-dots-loading"
                            //             : "gala:file-document",
                            //         label: "Export CSV",
                            //         labelTw: "text-[12px] hidden sm:block",
                            //         onClick: () => !threeDotLoading.csv && exportFile("csv"),
                            //     },
                            //     {
                            //         icon: threeDotLoading.xlsx
                            //             ? "eos-icons:three-dots-loading"
                            //             : "gala:file-document",
                            //         label: "Export Excel",
                            //         labelTw: "text-[12px] hidden sm:block",
                            //         onClick: () => !threeDotLoading.xlsx && exportFile("xlsx"),
                            //     },
                            // ],
                            filterByFields: [
                                {
                                    key: "from_date",
                                    label: "From Date",
                                    type: "date",
                                    multiSelectChips: true,
                                    onChange: (value: string) => {
                                        setFilters((prev) => ({
                                            ...prev,
                                            from_date: value,
                                            to_date:
                                                prev.to_date && new Date(prev.to_date) < new Date(value)
                                                    ? "" // reset invalid to_date
                                                    : prev.to_date,
                                        }));
                                    },
                                },
                                {
                                    key: "to_date",
                                    label: "To Date",
                                    type: "date",
                                    multiSelectChips: true,
                                    onChange: (value: string) => {
                                        setFilters((prev) => {
                                            if (prev.from_date && new Date(value) < new Date(prev.from_date)) {
                                                showSnackbar("To Date cannot be before From Date", "error");
                                                return prev; // ❌ block update
                                            }
                                            return { ...prev, to_date: value };
                                        });
                                    },
                                },
                                {
                                    key: "ticket_type",
                                    label: "Ticket Type",
                                    // isSingle: false,
                                    multiSelectChips: true,
                                    options: [{ label: "BD", value: "BD" }, { label: "TR", value: "TR" }, { label: "RB", value: "RB" }],
                                },
                                {
                                    key: "technician_id",
                                    label: "Technician",
                                    isSingle: false,
                                    multiSelectChips: true,
                                    options: technicianOptions || [],
                                },
                                {
                                    key: "status",
                                    label: "Status",
                                    // isSingle: false,
                                    multiSelectChips: true,
                                    options: [
                                        { value: "Pending", label: "Pending" },
                                        { value: "In Progress", label: "In Progress" },
                                        { value: "Closed By Technician", label: "Closed By Technician" },
                                        { value: "Completed", label: "Completed" },
                                        { value: "Cancelled", label: "Cancelled" },
                                    ],
                                },
                            ],
                            searchBar: false,
                            columnFilter: true,
                            actions: can("create") ? [
                                <SidebarBtn
                                    key="name"
                                    href="/callRegister/add"
                                    leadingIcon="lucide:plus"
                                    label="Add"
                                    labelTw="hidden lg:block"
                                    isActive
                                />,
                            ] : [],
                        },
                        localStorageKey: "call-register-table",

                        footer: { nextPrevBtn: true, pagination: true },
                        columns: [
                            { key: "osa_code", label: "Ticket Number",showByDefault: true, },
                            {
                                key: "technician_name,technician_code", label: "Technician",
                                render: (row: TableDataType) => (
                                    <span>
                                        {row.technician_code} - {row.technician_name}
                                    </span>
                                ),
                                showByDefault: true,
                            },
                            { key: "chiller_code", label: "Chiller Code", showByDefault: true },
                            { key: "asset_number", label: "Asset Number",showByDefault: true, },
                            { key: "model_number", label: "Model Number", render: (row: TableDataType) => row.model_number?.name,showByDefault: true, },
                            { key: "branding", label: "Branding", render: (row: TableDataType) => row.branding?.name,showByDefault: true, },
                            { key: "nature_of_call", label: "Nature of Call",showByDefault: true, },

                            // Assigned Outlet
                            {
                                key: "assigned_outlet",
                                label: "Assigned Outlet Details",
                                render: (row: TableDataType) => (
                                    <span>
                                        {row.assigned_customer?.code} - {row.assigned_customer?.name}
                                    </span>
                                ),
                                showByDefault: true,
                            },

                            // Current Outlet
                            {
                                key: "current_outlet",
                                label: "Current Outlet Details",
                                render: (row: TableDataType) => (
                                    <span>
                                        {row.current_customer?.code} - {row.current_customer?.name}
                                    </span>
                                ),
                                showByDefault: true,
                            },

                            // {
                            //     key: "approval_status",
                            //     label: "Approval Status",
                            //     showByDefault: true,
                            // },

                            {
                                key: "status",
                                label: "Status",
                                showByDefault: true,
                                render: (row: TableDataType) => {
                                    return (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            {row.status}
                                        </span>
                                    );
                                },
                            }
                        ],
                        // rowSelection: true,
                        rowActions: [
                            {
                                icon: "lucide:eye",
                                onClick: (data: TableDataType) => {
                                    router.push(`/callRegister/details/${data.uuid}`);
                                },
                            },
                            ...(can("edit") ? [{
                                icon: "lucide:edit-2",
                                onClick: (data: TableDataType) => {
                                    router.push(`/callRegister/${data.uuid}`);
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