"use client";

import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table, {
    listReturnType,
    TableDataType
} from "@/app/components/customTable";
import StatusBtn from "@/app/components/statusBtn2";
import { iroList } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { formatDate } from "../../../(master)/salesTeam/details/[uuid]/page";
import { formatWithPattern } from "@/app/utils/formatDate";

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
    model: string;
    salesman_id: number;
    warehouse_id: number;
    status: number;
    fridge_status: number;
    iro_id: number;
    model_number: number;
    [key: string]: any;
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

const Status = [
    { label: "Waiting For Creating IR", value: "0" },
    { label: "IR Created", value: "1" },
    { label: "Technician Accepted", value: "2" },
    { label: "Technician Rejected", value: "3" },
    { label: "Reschedule By Technician", value: "4" },
    { label: "Request For Close", value: "5" },
    { label: "Closed", value: "6" },
]
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
    return "-";
};

const columns = [
    {
        key: "osa_code",
        label: "OSA Code",
        showByDefault: true,
        render: (data: TableDataType) => {
            const count = Array.isArray(data.details) ? data.details.length : 0;
            // Show OSA code and count together
            return `${data.osa_code || "-"} (${count} CRF)`;
        },
    },
    {
        key: "warehouse",
        label: "Distributors",
        showByDefault: true,
        render: (data: TableDataType) => {
            const warehouse = Array.isArray(data.details)
                ? data.details[0]?.warehouse
                : null;

            if (!warehouse) return "-";

            return `${warehouse.code || "-"} - ${warehouse.name || "-"}`;
        },
    },
    {
        key: "created_user",
        label: "Regional Manager",
        showByDefault: false,
        render: (data: TableDataType) => {
            return renderCombinedField(data, "created_user");
        },
    },
    {
        key: "created_at",
        label: "Created Date",
        showByDefault: true,
        render: (data: any) => {
            return formatWithPattern(
                new Date(data.details[0].created_at),
                "DD MMM YYYY",
                "en-GB",
            ).toLowerCase()
        }
    },
    {
        key: "status",
        label: "Status",
        showByDefault: true,
        render: (data: TableDataType) => (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {data.status || "-"}
            </span>
        ),
    },

];


export default function CustomerInvoicePage() {
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const router = useRouter();
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

    const [refreshKey, setRefreshKey] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleChange = (name: string, value: string) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const fetchIRO = useCallback(
        async (
            page: number = 1,
            pageSize: number = 20,
            appliedFilters: Record<string, any> = {}
        ): Promise<listReturnType> => {
            try {
                setLoading(true);

                const result = await iroList({
                    current_page: page.toString(),
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


    return (
        <div className="flex flex-col h-full">
            <Table
                refreshKey={refreshKey}
                config={{
                    api: { list: fetchIRO },
                    header: {
                        title: "Installation Request Order",
                        columnFilter: true,
                        searchBar: false,
                    },
                    footer: { nextPrevBtn: true, pagination: true },
                    columns,
                    // rowSelection: true,

                    rowActions: [
                        {
                            icon: "lucide:eye",
                            onClick: (row: TableDataType) => {
                                router.push(`/chillerInstallation/iro/view/${row.id}`);
                            },
                        },
                        {
                            icon: "jam:refresh-reverse",
                            onClick: (row: TableDataType) => {
                                router.push(`/chillerInstallation/iro/view/${row.id}`);
                            },
                        },
                    ],
                    pageSize: 50,
                }}
            />
        </div>
    );
}
