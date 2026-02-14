"use client";
import Table, {
    listReturnType,
    TableDataType,
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { adjustmentList } from "@/app/services/loyaltyProgramApis";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import {  useEffect, useState } from "react";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";

export default function Tier() {
    const { can, permissions } = usePagePermissions();
    const [warehouseId, setWarehouseId] = useState<string[]>([]);
    const { warehouseAllOptions, ensureWarehouseAllLoaded } = useAllDropdownListData();
    const [refreshKey, setRefreshKey] = useState(0);
    useEffect(() => {
        ensureWarehouseAllLoaded();
    }, [ensureWarehouseAllLoaded]);
    useEffect(() => {
        if (permissions.length > 0) {
            setRefreshKey((prev) => prev + 1);
        }
    }, [permissions]);


    useEffect(() => {
        setRefreshKey((k) => k + 1);
    }, [warehouseId]);

    const fetchTiers = async (
        pageNo: number = 1,
        pageSize: number = 10
    ): Promise<listReturnType> => {
        try {
            const params: any = {
                current_page: pageNo.toString(),
                limit: pageSize.toString(),
            };
            if (warehouseId && warehouseId.length > 0) {
                params.warehouse_id = warehouseId.join(",");
            }
            const listRes = await adjustmentList(params);
            return {
                data: listRes?.data || [],
                currentPage: listRes?.meta?.current_page || pageNo,
                pageSize: listRes?.meta?.limit || pageSize,
                total: listRes?.meta?.total_pages || 1,
                totalRecords: listRes?.meta?.total || 0,
            };
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        } finally {
        }
    };






 

        const columns = [
        {
            key: "osa_code",
            label: "Code",
            render: (data: TableDataType) => (
                <span className="font-semibold text-[#181D27] text-[14px]">
                    {`${data.osa_code || ""}`}
                </span>
            ),
        },
        {
            key: "warehouse_code,warehouse_name",
            label: "Distributor",
            render: (data: TableDataType) => {
                return `${data?.warehouse_code ||  ""} - ${data?.warehouse_name ||  ""}`;
            },
            filter: {
                isFilterable: true,
                width: 320,
                options: Array.isArray(warehouseAllOptions) ? warehouseAllOptions : [],
                onSelect: (selected: any) => {
                    // selected can be string or array depending on filter component
                    if (Array.isArray(selected)) {
                        setWarehouseId(selected);
                    } else if (typeof selected === "string") {
                        setWarehouseId(selected ? [selected] : []);
                    } else {
                        setWarehouseId([]);
                    }
                },
                isSingle: false,
                selectedValue: warehouseId,
            },
        },
        {
            key: "route_code,route_name",
            label: "Route",
            render: (data: TableDataType) => {
                return `${data?.route_code ||  ""} - ${data?.route_name ||  ""}`;
            },
        },
        {
            key: "customer_code,customer_name",
            label: "Customer",
            render: (data: TableDataType) => {
                return `${data?.customer_code ||  ""} - ${data?.customer_name ||  ""}`;
            },
        },
        {
            key: "currentreward_points",
            label: "Reward Points",
            render: (data: TableDataType) => {
                return toInternationalNumber(data?.currentreward_points ||  "-");
            },
        },
        {
            key: "adjustment_points",
            label: "Adjustment Points",
            render: (data: TableDataType) => {
                return toInternationalNumber(data?.adjustment_points ||  "-");
            },
        },
        {
            key: "closing_points",
            label: "Closing Points",
            render: (data: TableDataType) => {
                return toInternationalNumber(data?.closing_points ||  "-");
            },
        },
        
    ];

    return (
        <>
            <div className="flex flex-col h-full">
                <Table
                    refreshKey={refreshKey}
                    config={{
                        api: {
                            list: fetchTiers,
                        },
                        header: {
                            title: "Points Adjustment",
                            columnFilter: true,
                            actions: can("create") ? [
                                <SidebarBtn
                                    key={0}
                                    href="/pointsAdjustment/add"
                                    isActive={true}
                                    leadingIcon="lucide:plus"
                                    label="Add"
                                    labelTw="hidden sm:block"
                                />,
                            ] : [],
                        },
                        localStorageKey: "route-table",
                        footer: {
                            nextPrevBtn: true,
                            pagination: true,
                        },
                        columns: columns,
                        pageSize: 50,
                    }}
                />
            </div>

           
        </>
    );
}
