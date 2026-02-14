"use client";

import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table, {
    configType,
    listReturnType,
    TableDataType,
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";
import { agentCustomerGlobalSearch, agentCustomerList, agentCustomerStatusUpdate, downloadFile, exportAgentCustomerData, statusFilter } from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { getPaymentType } from "../companyCustomer/details/[uuid]/page";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";

export default function AgentCustomer() {
    const { can, permissions } = usePagePermissions();
    const { allCustomerTypeOptions,ensureAllCustomerTypesLoaded,customerSubCategoryOptions, itemCategoryOptions,customerCategoryOptions,ensureCustomerCategoryLoaded, channelOptions, warehouseAllOptions, routeOptions, ensureChannelLoaded, ensureCustomerSubCategoryLoaded, ensureItemCategoryLoaded, ensureRouteLoaded, ensureWarehouseAllLoaded } = useAllDropdownListData();
    const [searchFilter,setSearchFilter]=useState<any>(null);
    // Load dropdown data
    useEffect(() => {
        ensureChannelLoaded();
        ensureCustomerSubCategoryLoaded();
        ensureItemCategoryLoaded();
        ensureRouteLoaded();
        ensureWarehouseAllLoaded();
        ensureCustomerCategoryLoaded();
        ensureAllCustomerTypesLoaded();
    }, [ensureChannelLoaded, ensureCustomerSubCategoryLoaded, ensureItemCategoryLoaded, ensureRouteLoaded, ensureWarehouseAllLoaded,ensureAllCustomerTypesLoaded]);
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>();
    const [warehouseId, setWarehouseId] = useState<string>();
    const [channelId, setChannelId] = useState<string>();
    const [customerCategoryId, setCustomerCategoryId] = useState<string>();
    const [routeId, setRouteId] = useState<string>();
    const [customerTypeId, setCustomerTypeId] = useState<string>();
    const [refreshKey, setRefreshKey] = useState(0);
    const [currentStatusFilter, setCurrentStatusFilter] = useState<boolean | null>(null);

    // Refresh table when permissions load
    useEffect(() => {
        if (permissions.length > 0) {
            setRefreshKey((prev) => prev + 1);
        }
    }, [permissions]);

    const { setLoading } = useLoading();
    const router = useRouter();
    const { showSnackbar } = useSnackbar();
    type TableRow = TableDataType & { id?: string };
    const [threeDotLoading, setThreeDotLoading] = useState({
        csv: false,
        xlsx: false,
    });

    const handleStatusFilter = async (status: boolean) => {
        try {
            // If clicking the same filter, clear it
            const newFilter = currentStatusFilter === status ? null : status;
            setCurrentStatusFilter(newFilter);
            
            // Refresh the table with the new filter
            setRefreshKey((k) => k + 1);
        } catch (error) {
            console.error("Error filtering by status:", error);
            showSnackbar("Failed to filter by status", "error");
        }
    };

    const columns: configType["columns"] = [
        {
            key: "osa_code, name",
            label: "Outlet",
            render: (row: TableDataType) => (
                <span className="font-semibold text-[#181D27] text-[14px]">
                    {`${row.osa_code || ""} - ${row.name || ""}` || "-"}
                </span>
            ),
            // showByDefault: true,
        },
        { key: "owner_name", label: "Owner Name" },
        {
            key: "customer_type",
            label: "Customer Type",
            render: (row: TableDataType) => {
                if (
                    typeof row.customer_type === "object" &&
                    row.customer_type !== null &&
                    "name" in row.customer_type
                ) {
                    return (row.customer_type as { name?: string }).name || "-";
                }
                return row.customer_type || "-";
            },
            filter: {
                isFilterable: true,
                width: 320,
                options: allCustomerTypeOptions,
                onSelect: (selected) => {
                    setCustomerTypeId((prev) => prev === selected ? "" : (selected as string));
                },
                isSingle: false,
                selectedValue: customerTypeId,
            },
        },
         {
            key: "getWarehouse",
            label: "Distributor",
            render: (row: TableDataType) => {
                const wh = row.getWarehouse as
                    | { warehouse_code?: string; warehouse_name?: string }
                    | string
                    | null
                    | undefined;

                // If getWarehouse is an object with proper fields
                if (wh && typeof wh === "object") {
                    const code = wh.warehouse_code ?? "";
                    const name = wh.warehouse_name ?? "";

                    // Show "-" if both missing
                    return code || name ? `${code} - ${name}` : "-";
                }

                // If getWarehouse is a simple string
                if (typeof wh === "string") return wh;

                // Default fallback
                return "-";
            },
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
            // showByDefault: true,
        },
        {
            key: "route",
            label: "Route",
            render: (row: TableDataType) => {
                 const wh = row.route as
                    | { route_code?: string; route_name?: string }
                    | string
                    | null
                    | undefined;

                // If getWarehouse is an object with proper fields
                if (wh && typeof wh === "object") {
                    const code = wh.route_code ?? "";
                    const name = wh.route_name ?? "";

                    // Show "-" if both missing
                    return code || name ? `${code} - ${name}` : "-";
                }

                // If getWarehouse is a simple string
                if (typeof wh === "string") return wh;

                // Default fallback
                return "-";
                // if (
                //     typeof row.route === "object" &&
                //     row.route !== null &&
                //     "route_name" in row.route
                // ) {
                //     return (row.route as { route_name?: string }).route_name || "-";
                // }
                // return typeof row.route === 'string' ? row.route : "-";
            },
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

            // showByDefault: true,
        },
         {
            key: "outlet_channel",
            label: "Outlet Channel",
            render: (row: TableDataType) =>
                typeof row.outlet_channel === "object" &&
                    row.outlet_channel !== null &&
                    "outlet_channel" in row.outlet_channel
                    ? (row.outlet_channel as { outlet_channel?: string })
                        .outlet_channel || "-"
                    : "-",
            filter: {
                isFilterable: true,
                width: 320,
                options: Array.isArray(channelOptions) ? channelOptions : [], // [{ value, label }]
                onSelect: (selected) => {
                    setChannelId((prev) => prev === selected ? "" : (selected as string));
                },
                isSingle: false,
                selectedValue: channelId,
            },

            // showByDefault: true,
        },
        {
            key: "category",
            label: "Customer Category",
            render: (row: TableDataType) =>
                typeof row.category === "object" &&
                    row.category !== null &&
                    "customer_category_name" in row.category
                    ? (row.category as { customer_category_name?: string })
                        .customer_category_name || "-"
                    : "-",
            filter: {
                isFilterable: true,
                width: 320,
                options: Array.isArray(customerCategoryOptions) ? customerCategoryOptions : [], // [{ value, label }]
                onSelect: (selected) => {
                    setCustomerCategoryId((prev) => prev === selected ? "" : (selected as string));
                },
                isSingle: false,
                selectedValue: customerCategoryId,
            },
            // showByDefault: true
        },
       
       
        { key: "contact_no", label: "Contact No." },
        { key: "whatsapp_no", label: "Whatsapp No." },
        { key: "street", label: "Street" },
        { key: "town", label: "Town" },
        { key: "landmark", label: "Landmark" },
        { key: "district", label: "District" },
        { key: "buyertype", label: "Buyer Type", render: (row: TableDataType) => (row.buyertype === "0" ? "B2B" : "B2C") },
        { key: "payment_type", label: "Payment Type", render: (row: TableDataType) => getPaymentType(String(row.payment_type)) },



        {
            key: "status",
            label: "Status",
            render: (row: TableDataType) => {
                // Treat status 1 or 'active' (case-insensitive) as active
                const isActive =
                    String(row.status) === "1" ||
                    (typeof row.status === "string" &&
                        row.status.toLowerCase() === "active");
                return <StatusBtn isActive={isActive} />;
            },
            filterStatus: {
                enabled: true,
                onFilter: handleStatusFilter,
                currentFilter: currentStatusFilter,
            },
            // showByDefault: true,
        },
    ];

    const lastCallRef = useRef<{ params: any, result: listReturnType } | null>(null);
    const fetchAgentCustomers = useCallback(
        async (
            page: number = 1,
            pageSize: number = 5,
            payload?: Record<string, any>
        ): Promise<listReturnType> => {
            // Build params with all filters
            const params: Record<string, string> = {
                page: page.toString(),
                // ...payload
            };
            if (selectedSubCategoryId) {
                params.subcategory_id = String(selectedSubCategoryId);
            }
            if (warehouseId) {
                params.warehouse_id= String(warehouseId);
            }
            if (channelId) {
                params.outlet_channel_id = String(channelId);
            }
            if (customerCategoryId) {
                params.category_id = String(customerCategoryId);
            }
            if (customerTypeId) {
                params.customer_type = String(customerTypeId);
            }
            if (routeId) {
                params.route_id = String(routeId);
            }
            // Add status filter if active (true=1, false=0)
            if (currentStatusFilter !== null) {
                params.status = currentStatusFilter ? "1" : "0";
            }
            // Debounce: Only call API if params changed
            if (
                lastCallRef.current &&
                JSON.stringify(lastCallRef.current.params) === JSON.stringify(params)
            ) {
                return lastCallRef.current.result;
            }
            try {
                const listRes = await agentCustomerList(params);
                const result = {
                    data: Array.isArray(listRes.data) ? listRes.data : [],
                    total: listRes?.pagination?.totalPages || 1,
                    currentPage: listRes?.pagination?.page || 1,
                    pageSize: listRes?.pagination?.limit || pageSize,
                };
                lastCallRef.current = { params, result };
                return result;
            } catch (error: unknown) {
                return {
                    data: [],
                    total: 1,
                    currentPage: 1,
                    pageSize: 5,
                };
            }
        },
        [selectedSubCategoryId, warehouseId, channelId, customerTypeId,customerCategoryId,routeId, currentStatusFilter]
    );

    const exportfile = async (format: string) => {
        try {
            setThreeDotLoading((prev) => ({ ...prev, [format]: true }))
            const response = await exportAgentCustomerData({
                format:format,search:searchFilter,filters:{
                    warehouse_id:warehouseId,
                    channel_id:channelId,
                    category_id:customerCategoryId,
                    route_id:routeId,
                    customer_type:customerTypeId,
                    status: currentStatusFilter !== null ? (currentStatusFilter ? "1" : "0") : undefined,
                }
            });
            if (response && typeof response === 'object' && response.url) {
                await downloadFile(response.url);
                showSnackbar("File downloaded successfully ", "success");
            } else {
                showSnackbar("Failed to get download URL", "error");
                setThreeDotLoading((prev) => ({ ...prev, [format]: false }))
            }
        } catch (error) {
            showSnackbar("Failed to download Field Customer data", "error");
            setThreeDotLoading((prev) => ({ ...prev, [format]: false }))

        }
        finally {
            setThreeDotLoading((prev) => ({ ...prev, [format]: false }))
        }
    }

    const handleStatusChange = async (ids: (string | number)[] | undefined, status: number) => {
        if (!ids || ids.length === 0) return;
        const res = await agentCustomerStatusUpdate({
            ids: ids,
            status: Number(status)
        });

        if (res.error) {
            showSnackbar(res.data.message || "Failed to update status", "error");
            throw new Error(res.data.message);
        }
        setRefreshKey(refreshKey + 1);
        showSnackbar("Status updated successfully", "success");
        return res;
    }

    const search = useCallback(
        async (
            searchQuery: string,
            pageSize: number,
            columnName?: string,
            page: number = 1
        ): Promise<listReturnType> => {
            let result;
            // setLoading(true);
            if (columnName) {
                result = await agentCustomerList({
                    per_page: pageSize.toString(),
                    [columnName]: searchQuery,
                    page: page.toString(),
                });
            }
            else {
                result = await agentCustomerGlobalSearch({
                    per_page: pageSize.toString(),
                    query: searchQuery,
                    page: page.toString(),
                });
            }
            setSearchFilter(searchQuery);
            // setLoading(false);
            if (result.error) throw new Error(result.data.message);
            return {
                data: result?.data || [],
                total: result?.pagination?.totalPages || 1,
                totalRecords: result?.pagination?.totalRecords || 1,
                currentPage: result?.pagination?.page || 1,
                pageSize: result?.pagination?.limit || pageSize,
            };
        },
        []
    );

    useEffect(() => {
        setRefreshKey((k) => k + 1);
    }, [selectedSubCategoryId, warehouseId, channelId, customerTypeId, customerCategoryId, routeId, currentStatusFilter]);

    return (
        <>
            <div className="flex flex-col h-full">
                <Table
                    refreshKey={refreshKey}
                    config={{
                        api: {
                            list: fetchAgentCustomers,
                            search: search
                        },
                        header: {
                            title: "Field Customers",
                              exportButton: {
                                threeDotLoading: threeDotLoading,
                show: true,
                onClick: () => exportfile("xlsx"), 
              },
                            threeDot: [

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
                                        handleStatusChange(ids, Number(0));
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
                                        handleStatusChange(ids, Number(1));
                                    },
                                },
                            ],
                            searchBar: true,
                            columnFilter: true,
                            actions: can("create") ? [
                                <SidebarBtn
                                    key={0}
                                    href="/fieldCustomer/new"
                                    isActive
                                    leadingIcon="lucide:plus"
                                    label="Add"
                                    labelTw="hidden sm:block"
                                />,
                            ] : [],
                        },
                        localStorageKey: "agentCustomer-table",
                        footer: { nextPrevBtn: true, pagination: true },
                        dragableColumn: true,
                        columns,
                        rowSelection: true,
                        rowActions: [
                            {
                                icon: "lucide:eye",
                                onClick: (data: object) => {
                                    const row = data as TableRow;
                                    router.push(`/fieldCustomer/details/${row.uuid}`);
                                },
                            },
                            ...(can("edit") ? [{
                                icon: "lucide:edit-2",
                                onClick: (data: object) => {
                                    const row = data as TableRow;
                                    router.push(
                                        `/fieldCustomer/${row.uuid}`
                                    );
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
