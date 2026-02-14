"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Table, {
    listReturnType,
    searchReturnType,
    TableDataType,
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";

import { getTechicianList, serviceVisitExport, serviceVisitGlobalFilter, ServiceVisitList } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import { useEffect } from "react";
import ApprovalStatus from "@/app/components/approvalStatus";

// ✅ SERVICE VISIT ROW TYPE
interface ServiceVisitRow {
    uuid: string;
    osa_code: string;
    ticket_type: string;
    time_in: string;
    time_out: string;
    ct_status: string;
    model_no: string;
    asset_no: string;
    serial_no: string;
    branding: string;
    scan_image: string;

    outlet_code: string;
    outlet_name: string;
    owner_name: string;
    landmark: string;
    location: string;
    town_village: string;
    district: string;

    contact_no: string;
    contact_no2: string;
    contact_person: string;

    longitude: string;
    latitude: string;

    technician: {
        id: number;
        name: string;
        code: string;
    } | null;

    current_voltage: string;
    amps: string;
    cabin_temperature: string;

    work_status: string;
    spare_request: string;
    work_done_type: string;

    technical_behavior: string;
    service_quality: string;

    nature_of_call: {
        id: number;
        name: string;
        code: string;
    } | null;

    comment: string;
    cts_comment: string;
}

export default function ServiceVisit() {
    const { can, permissions } = usePagePermissions();
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const router = useRouter();
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [threeDotLoading, setThreeDotLoading] = useState<{ pdf: boolean; xlsx: boolean; csv: boolean }>({ pdf: false, xlsx: false, csv: false });
    const [filters, setFilters] = useState({
        from_date: "",
        to_date: "",
    });
    const [filterPayload, setFilterPayload] = useState({});
    const [technicianOptions, setTechnicianOptions] = useState([]);

    // Refresh table when permissions load
    useEffect(() => {
        if (permissions.length > 0) {
            setRefreshKey((prev) => prev + 1);
        }
    }, [permissions]);

    // ✅ COLUMNS
    const columns = useMemo(
        () => [
            { key: "osa_code", label: "OSA Code", render: (r: any) => (r as ServiceVisitRow).osa_code || "-" },
            // { key: "ticket_type", label: "Ticket Type", render: (r: any) => (r as ServiceVisitRow).ticket_type || "-" },

            {
                key: "technician",
                label: "Technician",
                render: (r: any) => {
                    const row = r as ServiceVisitRow;
                    return row.technician?.code
                        ? `${row.technician.code} - ${row.technician.name || ""}`
                        : "-";
                },
            },

            { key: "model_no", label: "Model No" },
            { key: "asset_no", label: "Asset No" },
            { key: "serial_no", label: "Serial No" },
            { key: "outlet_code,outlet_name", label: "Outlet",render: (r: any) => {
               return `${r.outlet_code || ""} - ${r.outlet_name || ""}`;
            },
            },
            // { key: "outlet_name", label: "Outlet Name" },
            { key: "owner_name", label: "Owner Name" },
            // { key: "location", label: "Location" },
            { key: "town_village", label: "Town/Village" },
            { key: "district", label: "District" },
            { key: "contact_no", label: "Contact No" },
            // { key: "contact_no2", label: "Contact" },
            // { key: "current_voltage", label: "Voltage" },
            // { key: "amps", label: "Amps" },

            // {
            //     key: "cabin_temperature",
            //     label: "Temperature",
            //     render: (r: any) => (r as ServiceVisitRow).cabin_temperature || "-",
            // },


            // { key: "work_done_type", label: "Work Done Type" },
            // { key: "spare_request", label: "Spare Request" },
            // { key: "technical_behavior", label: "Tech Behavior" },
            // { key: "service_quality", label: "Service Quality" },

            // {
            //     key: "nature_of_call",
            //     label: "Nature of Call",
            //     render: (r: any) => (r as ServiceVisitRow).nature_of_call?.name || "-",
            // },

            { key: "comment", label: "Comment" },
            { key: "cts_comment", label: "CTS Comment" },
            {
                key: "work_status",
                label: "Work Status",
                render: (r: any) => (
                    <StatusBtn
                        isActive={(r as ServiceVisitRow).work_status === "completed"}
                    />
                ),
            },

            // {
            //     key: "approval_status",
            //     label: "Approval Status",
            //     showByDefault: false,
            //     render: (row: TableDataType) => <ApprovalStatus status={row.approval_status || "-"} />,
            // },
        ],
        []
    );

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

    // ✅ FIXED PAGINATION API HANDLER (NO DUPLICATE per_page)
    const fetchServiceVisitList = useCallback(
        async (
            page: number = 1,
            pageSize: number = 20,
            appliedFilters: Record<string, any> = {}
        ): Promise<listReturnType> => {
            try {
                setLoading(true);

                const result = await ServiceVisitList({
                    page: page,
                    per_page: pageSize,
                    ...appliedFilters,
                });

                const data = Array.isArray(result?.data) ? result.data : [];

                const totalRecords = result?.pagination?.total || data.length;
                const perPage = result?.pagination?.per_page || pageSize;
                const currentPage = result?.pagination?.current_page || page;

                return {
                    data,
                    total: Math.ceil(totalRecords / perPage),
                    currentPage,
                    pageSize: perPage,
                };
            } catch (error) {
                console.error(error);
                showSnackbar("Failed to fetch Service Visit list", "error");

                return {
                    data: [],
                    total: 1,
                    currentPage: 1,
                    pageSize,
                };
            } finally {
                setLoading(false);
            }
        },
        [setLoading, showSnackbar]
    );

    const handleExport = async (fileType: "csv" | "xlsx") => {
        try {
            // setLoading(true);
            setThreeDotLoading((prev) => ({ ...prev, [fileType]: true }));

            const res = await serviceVisitExport({ format: fileType ,filter: filterPayload });

            let downloadUrl = "";

            if (res?.download_url && res.download_url.startsWith("blob:")) {
                downloadUrl = res.download_url;
            } else if (res?.download_url && res.download_url.startsWith("http")) {
                downloadUrl = res.download_url;
            } else if (typeof res === "string" && res.includes(",")) {
                const blob = new Blob([res], {
                    type:
                        fileType === "csv"
                            ? "text/csv;charset=utf-8;"
                            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                downloadUrl = URL.createObjectURL(blob);
            } else {
                showSnackbar("No valid file or URL returned from server", "error");
                return;
            }

            // ⬇️ Trigger browser download
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `assets_export.${fileType}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showSnackbar(
                `Download started for ${fileType.toUpperCase()} file`,
                "success"
            );
        } catch (error) {
            console.error("Export error:", error);
            showSnackbar("Failed to export Assets Master data", "error");
        } finally {
            // setLoading(false);
            setThreeDotLoading((prev) => ({ ...prev, [fileType]: false }));
            setShowExportDropdown(false);
        }
    };

    // ✅ SEARCH PLACEHOLDER
    const searchInvoices = useCallback(async (): Promise<searchReturnType> => {
        return { data: [], currentPage: 1, total: 0, pageSize: 20 };
    }, []);

    const fetchServiceVisitAccordingToGlobalFilter = useCallback(
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
                const listRes = await serviceVisitGlobalFilter(body);
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
        <div className="flex flex-col h-full">
            <Table
                refreshKey={refreshKey}
                config={{
                    api: {
                        list: fetchServiceVisitList,
                        search: searchInvoices,
                        filterBy: fetchServiceVisitAccordingToGlobalFilter,
                    },

                    header: {
                        title: "Service Visit",
                         exportButton: {
                threeDotLoading: threeDotLoading,
                show: true,
                onClick: () => handleExport("xlsx"),
              },
                        // threeDot: [
                        //     {
                        //         icon: threeDotLoading.csv || threeDotLoading.xlsx ? "eos-icons:three-dots-loading" : "gala:file-document",
                        //         label: "Export CSV",
                        //         onClick: (data: TableDataType[], selectedRow?: number[]) => {
                        //             handleExport("csv");
                        //         },
                        //     },
                        //     {
                        //         icon: threeDotLoading.csv || threeDotLoading.xlsx ? "eos-icons:three-dots-loading" : "gala:file-document",
                        //         label: "Export Excel",
                        //         onClick: (data: TableDataType[], selectedRow?: number[]) => {
                        //             handleExport("xlsx");
                        //         },
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
                                options:[
                                        { label: "SER BD", value: "SER_BD" },
                                        { label: "AUD", value: "AUD" },
                                        { label: "INS", value: "INS" },
                                        { label: "PM", value: "PM" },
                                    ],
                            },
                            {
                                key: "technician_id",
                                label: "Technician",
                                isSingle: false,
                                multiSelectChips: true,
                                options: technicianOptions || [],
                            },
                        ],
                        columnFilter: false,
                        searchBar: false,
                        actions: can("create") ? [
                            <SidebarBtn
                                key="add"
                                href="/serviceVisit/add"
                                leadingIcon="lucide:plus"
                                label="Add"
                                labelTw="hidden lg:block"
                                isActive
                            />,
                        ] : [],
                    },

                    columns,
                    // rowSelection: true,

                    rowActions: [
                        {
                            icon: "lucide:eye",
                            onClick: (row: any) => {
                                router.push(`/serviceVisit/details/${(row as ServiceVisitRow).uuid}`);
                            },
                        },
                        ...(can("edit") ? [
                            {
                                icon: "lucide:edit",
                                onClick: (row: any) => {
                                    // console.log("Edit clicked for row:", row?.uuid);
                                    router.push(`/serviceVisit/${row?.uuid}`);
                                },
                            },
                        ] : [])
                    ],

                    footer: { nextPrevBtn: true, pagination: true },
                    pageSize: 50,
                    localStorageKey: "service-visit-table",
                }}
            />
        </div>
    );
}
