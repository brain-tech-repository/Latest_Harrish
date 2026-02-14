"use client";

import Table, {
    listReturnType,
    searchReturnType,
    TableDataType,
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";
import { acfList, addAcf, crfExport, crfGlobalFilter } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { downloadFile } from "@/app/services/allApi";
import { useFormik } from "formik";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import InputFields from "@/app/components/inputFields";
// import { Icon } from "lucide-react";
import { Icon } from "@iconify-icon/react";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import FilterComponent from "@/app/components/filterComponent";

// Type definitions for the ACF API response
interface ChillerRequest {
    id: number;
    uuid: string;
    osa_code: string | null;
    owner_name: string;
    contact_number: string;
    landmark: string;
    outlet_id: number;
    existing_coolers: string;
    outlet_weekly_sale_volume: string;
    display_location: string;
    chiller_safty_grill: string;
    customer_id: number;
    machine_number: string;
    brand: string;
    asset_number: string | null;
    model_number: {
        id: number;
        name: string;
    };
    salesman_id: number;
    warehouse_id: number;
    status: number;
    fridge_status: number;
    iro_id: number;
    // model: number;
    [key: string]: any; // For other fields we don't explicitly need
}

interface WorkflowStep {
    id: number;
    workflow_request_id: number;
    step_order: number;
    title: string;
    approval_type: string;
    status: string;
    uuid: string;
    [key: string]: any;
}

interface ACFDataRow {
    chiller_request: ChillerRequest;
    workflow_request_id: number;
    approved_steps: WorkflowStep[];
    pending_steps: WorkflowStep[];
    customer?: { code?: string; name?: string };
    warehouse?: { code?: string; name?: string };
    outlet?: { code?: string; name?: string };
    salesman?: { code?: string; name?: string };
}

const hasChillerRequest = (data: TableDataType): data is TableDataType & { chiller_request: ChillerRequest } => {
    return data && typeof data === 'object' && 'chiller_request' in data &&
        data.chiller_request !== null && typeof data.chiller_request === 'object';
};

const renderNestedField = (
    data: TableDataType,
    field: string,
    subField: string
) => {
    if (
        data[field] &&
        typeof data[field] === "object" &&
        data[field] !== null &&
        subField in (data[field] as object)
    ) {
        return (data[field] as Record<string, string>)[subField] || "-";
    }
    return "-";
};


const renderCombinedField = (data: TableDataType, field: string) => {
    const code = renderNestedField(data, field, "code");
    const name = renderNestedField(data, field, "name");
    if (code !== "-" && name !== "-") {
        return `${code} - ${name}`;
    } else if (name !== "-") {
        return name;
    } else if (code !== "-") {
        return code;
    }
    return "-"; 99999999999
};

// 🔹 Table Columns


export default function CustomerInvoicePage() {
    const { can, permissions } = usePagePermissions();
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const router = useRouter();
    const [warehouseId, setWarehouseId] = useState<string>("");
    const [selectedRowsData, setSelectedRowsData] = useState<any[]>([]);
    const { values, setFieldValue } = useFormik({
        initialValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        onSubmit: (values) => {
        },
    });
    const [colFilter, setColFilter] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [threeDotLoading, setThreeDotLoading] = useState({
        csv: false,
        xlsx: false,
    });
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().split("T")[0],
        toDate: new Date().toISOString().split("T")[0],
        region: "",
        routeCode: "",
    });

    const {
        warehouseAllOptions,
        routeOptions,
        regionOptions,
        areaOptions,
        assetsModelOptions
        , ensureAreaLoaded, ensureAssetsModelLoaded, ensureRegionLoaded, ensureRouteLoaded, ensureWarehouseAllLoaded } = useAllDropdownListData();

    // Load dropdown data
    useEffect(() => {
        ensureAreaLoaded();
        ensureAssetsModelLoaded();
        ensureRegionLoaded();
        ensureRouteLoaded();
        ensureWarehouseAllLoaded();
    }, [ensureAreaLoaded, ensureAssetsModelLoaded, ensureRegionLoaded, ensureRouteLoaded, ensureWarehouseAllLoaded]);

    const [refreshKey, setRefreshKey] = useState(0);

    // Refresh table when permissions load
    useEffect(() => {
        if (permissions.length > 0) {
            setRefreshKey((prev) => prev + 1);
        }
    }, [permissions]);

    const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleChange = (name: string, value: string) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // 🔹 Fetch Invoices
    // const fetchInvoices = useCallback(
    //     async (
    //         page: number = 1,
    //         pageSize: number = 50,
    //         appliedFilters: Record<string, any> = {}
    //     ): Promise<listReturnType> => {
    //         try {
    //             setLoading(true);

    //             const result = await acfList({
    //                 page: page.toString(),
    //                 per_page: pageSize.toString(),
    //                 ...appliedFilters, // ⬅️ Merge filters into API call
    //             });

    //             return {
    //                 data: Array.isArray(result.data) ? result.data : [],
    //                 total: result?.pagination?.totalPages || 1,
    //                 currentPage: result?.pagination?.page || 1,
    //                 pageSize: result?.pagination?.limit || pageSize,
    //             };
    //         } catch (error) {
    //             console.error(error);
    //             showSnackbar("Failed to fetch invoices", "error");
    //             return {
    //                 data: [],
    //                 total: 1,
    //                 currentPage: 1,
    //                 pageSize: pageSize,
    //             };
    //         } finally {
    //             setLoading(false);
    //         }
    //     },
    //     [setLoading, showSnackbar]
    // );
    useEffect(() => {
        setRefreshKey((k) => k + 1);
    }, [warehouseId]);
    const filterBy = useCallback(
        async (
            payload: Record<string, string | number | null>,
            pageSize: number,
        ): Promise<listReturnType> => {
            let result;
            // setLoading(true);
            setColFilter(true);
            try {
                const params: Record<string, string> = {
                    per_page: pageSize.toString(),
                };
                Object.keys(payload || {}).forEach((k) => {
                    const v = payload[k as keyof typeof payload];
                    if (v !== null && typeof v !== "undefined" && String(v) !== "") {
                        params[k] = String(v);
                    }
                });
                result = await acfList(params);
            } finally {
                // setLoading(false);
                setColFilter(false);
            }

            if (result?.error)
                throw new Error(result.data?.message || "Filter failed");
            else {
                const pagination =
                    result.pagination?.pagination || result.pagination || {};
                return {
                    data: result.data || [],
                    total: pagination.last_page || result.pagination?.last_page || 1,
                    totalRecords:
                        pagination.total || result.pagination?.total || 0,
                    currentPage: pagination.current_page || result.pagination?.current_page || 1,
                    pageSize: pagination.per_page || pageSize,
                };
            }
        },
        [refreshKey],
    );




    const fetchAssetAccordingToGlobalFilter = useCallback(
        async (
            payload: Record<string, any>,
            pageSize: number = 50,
            pageNo: number = 1
        ): Promise<listReturnType> => {
            // Always send these keys as arrays
            const keysToArray = [
                "area_id",
                "region_id",
                "warehouse_id",
                "route_id",
                "company_id",
                "salesman_id",
                "model",
            ];
            const toArray = (v: any) => {
                if (Array.isArray(v)) return v;
                if (typeof v === "string" && v.includes(",")) return v.split(",").filter(Boolean);
                if (typeof v === "string" && v !== "") return [v];
                if (typeof v === "number") return [String(v)];
                return [];
            };
            // Patch payload to ensure arrays
            let patchedPayload = { ...payload };
            keysToArray.forEach((key) => {
                if (patchedPayload[key] && !Array.isArray(patchedPayload[key])) {
                    patchedPayload[key] = toArray(patchedPayload[key]);
                }
            });
            try {
                setLoading(true);
                const body = {
                    limit: pageSize.toString(),
                    page: pageNo.toString(),
                    filter: patchedPayload
                }
                const listRes = await crfGlobalFilter(body);
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
            } catch (error: unknown) {
                console.error("API Error:", error);
                setLoading(false);
                throw error;
            }
            finally {
                setLoading(false);
            }
        },
        [crfGlobalFilter, warehouseId]
    );

    // 🔹 Search Invoices (Mock)





    useEffect(() => {
        setRefreshKey((k) => k + 1);
    }, [
        routeOptions,
        warehouseAllOptions,
        areaOptions,
        regionOptions,
        assetsModelOptions
    ]);


    const columns = [
        // Essential Information (flat fields)
        {
            key: "osa_code",
            label: "OSA Code",
            render: (data: TableDataType) => data.osa_code || "-",
        },
        {
            key: "warehouse_id",
            label: "Distributor",
            render: (data: TableDataType) => `${data.warehouse?.warehouse_code || ""} - ${data.warehouse?.warehouse_name || ""}`,
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



        // If you have nested fields, use renderCombinedField, otherwise use direct access
        // For now, Customer, Distributor, Outlet, Sales Team are flat fields or can be adjusted as needed
        {
            key: "customer_id",
            label: "Customer",
            render: (data: TableDataType) => `${data.customer?.osa_code || ""} - ${data.customer?.name || ""}`,
        },
        {
            key: "owner_name",
            label: "Owner Name",
            render: (data: TableDataType) => data.owner_name || "-",
        },
        {
            key: "contact_number",
            label: "Contact Number",
            render: (data: TableDataType) => data.contact_number || "-",
        },

        {
            key: "outlet_id",
            label: "Outlet",
            render: (data: TableDataType) => `${data.outlet.outlet_channel || "-"}`,
        },
        {
            key: "salesman_id",
            label: "Sales Team",
            render: (data: TableDataType) => `${data.salesman?.osa_code || ""} - ${data.salesman?.name || ""}`,
        },


        {
            key: "model_number",
            label: "Model",
            render: (data: TableDataType) => data.model_number?.name || "-",
        },


        // Status
        // {
        //     key: "status",
        //     label: "Status",
        //     render: (data: TableDataType) => (
        //         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        //             {data.status || "-"}
        //         </span>
        //     ),
        // }
    ];

    const listAPI = useCallback(
        async (
            page: number = 1,
            pageSize: number = 50
        ): Promise<listReturnType> => {

            const result = {
                data: [],
                total: 1,
                currentPage: 1,
                pageSize: 50,
            };
            return result;
        },
        []
    );

    return (
        <div className="flex flex-col h-full">
            {/* 🔹 Table Section */}
            <Table
                refreshKey={refreshKey}
                config={{
                    api: {
                        list: listAPI,
                        filterBy: fetchAssetAccordingToGlobalFilter
                    },
                    header: {
                        title: "Approve CRF Request",
                        columnFilter: true,
                        searchBar: false,

                        filterRenderer: (props) => (
                            <FilterComponent
                                currentDate={true}
                                onlyFilters={["from_date", "to_date", "company_id", "region_id", "area_id", "warehouse_id", "route_id", "salesman_id", 'model']}
                                {...props}
                            />
                        ),
                        actionsWithData: (data: TableDataType[], selectedRow?: number[]) => {
                            // if (!can("create")) return [];
                            // gets the ids of the selected rows with type narrowing
                            const ids = selectedRow
                                ?.map((index) => {
                                    const row = data?.[index];
                                    if (!row || !row.id) return null;
                                    return row.id;
                                })
                                .filter((id): id is number => typeof id === "number");



                            return [
                                <SidebarBtn
                                    disabled={!ids || ids.length === 0}
                                    key="key-companu-customer-with-data"
                                    onClick={async () => {
                                        if (!ids || ids.length === 0) {
                                            showSnackbar("No valid rows selected", "error");
                                            return;
                                        }
                                        try {
                                            const res = await addAcf({ crf_id: ids });
                                            if (res.error) {
                                                showSnackbar(res.message || "Failed to add ACF", "error");
                                            } else {
                                                showSnackbar(res.message || "ACF added successfully", "success");
                                                // Force refresh after a short delay to ensure state update
                                                setTimeout(() => setRefreshKey(k => k + 1), 200);
                                            }
                                        } catch (error) {
                                            showSnackbar("Failed to add ACF", "error");
                                        }
                                    }}
                                    leadingIcon="lucide:plus"
                                    label="Convert IRO"
                                    labelTw="hidden sm:block"
                                    isActive
                                />
                            ];
                        },
                    },
                    footer: { nextPrevBtn: true, pagination: true },
                    columns,
                    rowSelection: true,
                    // rowSelection: true,
                    floatingInfoBar: {
                        showByDefault: false,
                        showSelectedRow: true,
                        buttons: [
                            {
                                label: "Selected Rows",
                                onClick: (data, selectedRow) => {
                                    const rows = selectedRow?.map(i => data[i]) || [];
                                    setSelectedRowsData(rows);
                                    setSidebarRefreshKey(k => k + 1);
                                    setShowSidebar(true);
                                }
                            }
                        ]
                    },

                    localStorageKey: "invoice-table",
                    rowActions: [
                        {
                            icon: "lucide:eye",
                            onClick: (row: TableDataType) => {
                                router.push(`/assetsRequest/view/${row.uuid}`);
                            },
                        },
                    ],
                    pageSize: 10,
                }}
            />
            {showSidebar && (
                <>
                    {/* Overlay */}
                    <div
                        className="h-full fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={() => setShowSidebar(false)}
                    />

                    {/* Sidebar */}
                    <div className="fixed top-0 right-0 h-full w-1/3 bg-white z-50 shadow-lg transform transition-transform duration-300">

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold">Selected Chiller</h2>
                            <button onClick={() => setShowSidebar(false)}>
                                <Icon icon="lucide:x" width={22} />
                            </button>
                        </div>

                        {/* TABLE INSIDE SIDEBAR */}
                        <div className="p-5">
                            <Table
                                refreshKey={sidebarRefreshKey}
                                data={selectedRowsData && selectedRowsData.length > 0 ? selectedRowsData : []}
                                config={{
                                    columns: [
                                        {
                                            key: "osa_code",
                                            label: "Code",
                                            render: (row: any) =>
                                                row?.chiller_request?.osa_code || row?.osa_code || "-",
                                        },
                                        {
                                            key: "model_number",
                                            label: "Model Code",
                                            render: (row: any) => {
                                                const model =
                                                    row?.chiller_request?.model_number ??
                                                    row?.model_number;

                                                if (!model) return "-";

                                                // if it's already a string
                                                if (typeof model === "string") return model;

                                                // if it's an object
                                                return model?.name || "-";
                                            },
                                        }
                                    ],
                                    pageSize: 5,
                                    rowSelection: false,
                                    footer: { pagination: false },
                                    header: { title: "", searchBar: false },
                                }}
                            />

                        </div>
                    </div>
                </>
            )}


        </div>
    );
}
