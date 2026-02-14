
"use client";

import { formatDate } from "@/app/(private)/(dashboard)/(master)/salesTeam/details/[uuid]/page";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table, {
    listReturnType,
    TableDataType
} from "@/app/components/customTable";
import StatusBtn from "@/app/components/statusBtn2";
import { iroViewList } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import Link from "@/app/components/smartLink";
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
    model: string;
    salesman_id: number;
    warehouse_id: number;
    status: number;
    fridge_status: number;
    iro_id: number;
    model_number: number;
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

// 🔹 Table Columns



export default function CustomerInvoicePage() {
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const router = useRouter();
    const params = useParams();
    const id: string = Array.isArray(params?.id)
        ? params?.id[0]
        : (params?.id as string);
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

    // Load dropdown data

    const [refreshKey, setRefreshKey] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleChange = (name: string, value: string) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // 🔹 Fetch Invoices
    const fetchIRO = useCallback(
        async (
            page: number = 1,
            pageSize: number = 50,
            appliedFilters: Record<string, any> = {}
        ): Promise<listReturnType> => {
            try {
                setLoading(true);

                const result = await iroViewList(id);

                const mapped =
                    result?.data?.flatMap((h: any) => {
                        const details = Array.isArray(h.details) ? h.details : [];
                        return details.map((detail: any, index: any) => ({
                            id: h.id,
                            uuid: details[index].chillerRequest?.uuid,
                            osa_code: h.osa_code,
                            chiller_code: detail.chillerRequest?.code || "-",
                            customer: `${detail.customer?.code || ""} - ${detail.customer?.name || ""}`,
                            warehouse: `${detail.warehouse?.code || ""} - ${detail.warehouse?.name || ""}`,
                            location: detail.customer?.location || "-",
                            contact_number: detail.customer?.contact_no || "-",
                            model: detail.chillerRequest?.model?.name || "-",
                            date: detail.created_at ? formatDate(detail.created_at) : "-",
                            status: h.status,
                        }));
                    }) || [];

                return {
                    data: mapped,
                    total: mapped.length,
                    currentPage: 1,
                    pageSize: mapped.length,
                };
            } catch (error) {
                console.error(error);
                showSnackbar("Failed to fetch IRO list", "error");

                return {
                    data: [],
                    total: 0,
                    currentPage: 1,
                    pageSize: 0,
                };
            } finally {
                setLoading(false);
            }
        },
        [setLoading, showSnackbar]
    );


    const columns = [
        {
            key: "date",
            label: "Date",
        },
        {
            key: "chiller_code",
            label: "CRF Code",
        },
        {
            key: "warehouse",
            label: "Distributor",
        },
        {
            key: "customer",
            label: "Customer",
        },
        {
            key: "location",
            label: "Location",
        },
        {
            key: "contact_number",
            label: "Contact Number",
        },
        {
            key: "model",
            label: "Model",
        },

        {
            key: "status",
            label: "Installation Status",
            render: (data: TableDataType) => (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {data.status || "-"}
                </span>
            ),
        },
    ];


    return (
        <>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/chillerInstallation/iro" back>
                    <Icon icon="lucide:arrow-left" width={24} />
                </Link>
                <h1 className="text-xl font-semibold mb-1">Installation Request Order Details</h1>
                {/* <h1 className="text-2xl font-semibold">Installation Request Order Details</h1> */}
            </div>
            <div className="flex flex-col h-full">

                <Table
                    refreshKey={refreshKey}
                    config={{
                        api: { list: fetchIRO },
                        header: {
                            // title: "Installation Request Order Details",
                            columnFilter: true,
                            searchBar: false,
                        },
                        // footer: { nextPrevBtn: true, pagination: true },
                        columns,
                        rowSelection: true,

                        localStorageKey: "invoice-table",
                        rowActions: [
                            {
                                icon: "lucide:eye",
                                onClick: (row: TableDataType) => {
                                    router.push(`/assetsRequest/view/${row.uuid}`);
                                },
                            },
                            {
                                icon: "lucide:edit-2",
                                onClick: (row: TableDataType) => {
                                    router.push(`/assetsRequest/${row.uuid}`);
                                },
                            },
                        ],
                        pageSize: 10,
                    }}
                />
            </div>
        </>
    );
}