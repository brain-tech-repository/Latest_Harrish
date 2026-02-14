"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatusBtn from "@/app/components/statusBtn2";
import Table, {
    configType,
    listReturnType,
    searchReturnType,
    TableDataType,
} from "@/app/components/customTable";
import { capsCollectionList, collectionList } from "@/app/services/agentTransaction";
import { useSnackbar } from "@/app/services/snackbarContext"; // ✅ import snackbar
import { useLoading } from "@/app/services/loadingContext";
import toInternationalNumber, { FormatNumberOptions } from "@/app/(private)/utils/formatNumber";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import FilterComponent from "@/app/components/filterComponent";
export default function SalemanLoad() {
    const { can, permissions } = usePagePermissions();
    const { warehouseAllOptions, salesmanOptions, ensureSalesmanLoaded, ensureWarehouseAllLoaded} = useAllDropdownListData();
    const [salesmanId, setSalesmanId] = useState<string>("");
    const [warehouseId, setWarehouseId] = useState<string>("");
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Refresh table when permissions load
    useEffect(() => {
        if (permissions.length > 0) {
            setRefreshKey((prev) => prev + 1);
        }
    }, [permissions]);

  // Load dropdown data
  useEffect(() => {
    ensureSalesmanLoaded();
    ensureWarehouseAllLoaded();
  }, [ensureSalesmanLoaded, ensureWarehouseAllLoaded]);
    const columns: configType["columns"] = [
        { key: "code", label: "Invoice Code" },
        { key: "collection_no", label: "Collection No." },
        {
            key: "ammount", label: "Amout", render: (row: TableDataType) => {
                // row.total_amount may be string or number; toInternationalNumber handles both
                return toInternationalNumber(row.total, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                } as FormatNumberOptions);
            },
        },
        { key: "outstanding", label: "Outstanding" },
        // { key: "date", label: "Collection Date" },
        {
            key: "warehouse_code", label: "Distributor", render: (row: TableDataType) => {
                const code = row.warehouse_code || "-";
                const name = row.warehouse_name || "-";
                return `${code}${code && name ? " - " : ""}${name}`;
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
            key: "route_code", label: "Route", render: (row: TableDataType) => {
                const code = row.route_code || "-";
                const name = row.route_name || "-";
                return `${code}${code && name ? " - " : ""}${name}`;
            }
        },
        {
            key: "customer_code", label: "Customer", render: (row: TableDataType) => {
                const code = row.customer_code || "-";
                const name = row.customer_name || "-";
                return `${code}${code && name ? " - " : ""}${name}`;
            }
        },
        {
            key: "salesman_code", label: "Sales Team", render: (row: TableDataType) => {
                const code = row.salesman_code || "-";
                const name = row.salesman_name || "-";
                return `${code}${code && name ? " - " : ""}${name}`;
            },
             filter: {
        isFilterable: true,
        width: 320,
        filterkey: "salesman_id",
        options: Array.isArray(salesmanOptions) ? salesmanOptions : [],
        onSelect: (selected: string | string[]) => {
            setSalesmanId((prev) => (prev === selected ? "" : (selected as string)));
        },
        isSingle: false,
        selectedValue: salesmanId,
    },
        },
        {
            key: "status",
            label: "Status",
            render: (row: TableDataType) => {
                return row.status ? "Confirmed" : "Waiting";
            },
        }
    ];

    const { setLoading } = useLoading();
    const router = useRouter();
    const { showSnackbar } = useSnackbar();
    type TableRow = TableDataType & { id?: string };

    useEffect(() => {
        setRefreshKey((k) => k + 1);
    }, [salesmanId, warehouseId]);
    const fetchSalesmanLoadHeader = useCallback(
        async (
            page: number = 1,
            pageSize: number = 50
        ): Promise<listReturnType> => {
            try {
                setLoading(true);
                const params : any = {
                    page: page.toString(),
                    per_page: pageSize.toString(),
                }
                if (salesmanId) {
                    params.salesman_id = salesmanId;
                }
                if (warehouseId) {
                    params.warehouse_id = warehouseId;
                }
                const listRes = await collectionList(params);
                setLoading(false);
                return {
                    data: Array.isArray(listRes.data) ? listRes.data : [],
                    total: listRes?.pagination?.totalPages || 1,
                    currentPage: listRes?.pagination?.page || 1,
                    pageSize: listRes?.pagination?.limit || pageSize,
                };
            } catch (error: unknown) {
                setLoading(false);
                return {
                    data: [],
                    total: 1,
                    currentPage: 1,
                    pageSize: 5,
                };
            }
        }, [setLoading, salesmanId, warehouseId]);

    useEffect(() => {
        setLoading(true);
    }, []);

    return (
        <>
            <div className="flex flex-col h-full">
                <Table
                    refreshKey={refreshKey}
                    config={{
                        api: {
                            list: fetchSalesmanLoadHeader,
                            // filterBy: filterBy,
                        },
                        header: {
                             filterRenderer: (props) => (
                                                                                                                              <FilterComponent
                                                                                                                              currentDate={true}
                                                                                                                                {...props}
                                                                                                                              />
                                                                                                                            ),
                            title: "Collection",
                            searchBar: false,
                            columnFilter: true,
                            // actions: [
                            //     <SidebarBtn
                            //         key={0}
                            //         href="/c/add"
                            //         isActive
                            //         leadingIcon="lucide:plus"
                            //         label="Add"
                            //         labelTw="hidden sm:block"
                            //     />
                            // ],
                        },
                        footer: { nextPrevBtn: true, pagination: true },
                        columns,
                        // rowSelection: true,
                        // rowActions: [
                        //     {
                        //         icon: "lucide:eye",
                        //         onClick: (data: object) => {
                        //             const row = data as TableRow;
                        //             router.push(`/capsCollection/details/${row.uuid}`);
                        //         },
                        //     },
                        // ],
                        pageSize: 50,
                    }}
                />
            </div>
        </>
    );
}
