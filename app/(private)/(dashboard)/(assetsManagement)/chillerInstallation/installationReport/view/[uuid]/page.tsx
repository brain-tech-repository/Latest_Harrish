"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify-icon/react";

import Table, { listReturnType, TableDataType } from "@/app/components/customTable";
import ContainerCard from "@/app/components/containerCard";
import KeyValueData from "@/app/components/keyValueData";
import Link from "@/app/components/smartLink";

import { irReportByUUID } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { label } from "framer-motion/client";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";

/* ---------------------------------- Types --------------------------------- */

interface IRHeaderData {
    osa_code?: string;
    warehouse?: { code: string; name: string };
    salesman?: { code: string; name: string };
    status?: string;
}

// const Status = [
//     { label: "Waiting For Creating IR", value: "0" },
//     { label: "IR Created", value: "1" },
//     { label: "Technician Accepted", value: "2" },
//     { label: "Technician Rejected", value: "3" },
//     { label: "Reschedule By Technician", value: "4" },
//     { label: "Request For Close", value: "5" },
//     { label: "Closed", value: "6" },
// ];

/* -------------------------------- Component -------------------------------- */

export default function CustomerInvoicePage() {
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const router = useRouter();
    const params = useParams();
    const uuid = params?.uuid as string;

    const [refreshKey, setRefreshKey] = useState(0);
    const [headerData, setHeaderData] = useState<IRHeaderData | null>(null);

    /* ------------------------------ Fetch Table ------------------------------ */

    const fetchIRO = useCallback(async (): Promise<listReturnType> => {
        try {
            setLoading(true);

            const res = await irReportByUUID(uuid);
            const data = res?.data;

            if (!data) {
                return { data: [], total: 0, currentPage: 1, pageSize: 0 };
            }

            // Header info (top card)
            setHeaderData({
                osa_code: data?.osa_code ?? "-",
                warehouse: data?.iro?.warehouses?.[0]
                    ? {
                        code: data.iro.warehouses[0].warehouse_code,
                        name: data.iro.warehouses[0].warehouse_name,
                    }
                    : undefined,
                salesman: data?.salesman
                    ? {
                        code: data.salesman.code,
                        name: data.salesman.name,
                    }
                    : undefined,
                status: data?.status ?? "-",
            });

            const rows = data.details.map((detail: any) => {
                const asset = detail.asset ?? {};

                return {
                    id: detail.id,
                    asset_uuid: asset.uuid,
                    chiller_code: asset.osa_code ?? "-",
                    serial_number: asset.serial_number ?? "-",
                    asset_number: asset.asset_number?.name ?? "-",
                    model: asset.model?.name ?? "-",
                    model_type: asset.assets_type ?? "-",
                    crf_id: detail.crf_id ?? null,
                    acf_number: asset.acf_number ?? null,
                    status: asset.status ?? "-",
                };
            });


            return {
                data: rows,
                total: rows.length,
                currentPage: 1,
                pageSize: rows.length,
            };
        } catch (error) {
            showSnackbar("Failed to fetch IR details", "error");
            return { data: [], total: 0, currentPage: 1, pageSize: 0 };
        } finally {
            setLoading(false);
        }
    }, [uuid, setLoading, showSnackbar]);

    /* ------------------------------- Table Cols ------------------------------ */

    const columns = [
        { key: "chiller_code", label: "Chiller Code" },
        { key: "serial_number", label: "Serial Number" },
        { key: "asset_number", label: "Asset Number" },
        { key: "model", label: "Model Number" },
        { key: "model_type", label: "Model Type" },
        {
            key: "acf_number",
            label: "ACF Number",
            render: (row: any) => {
                const id = row.acf_number?.id;
                if (!id) return "-";

                return (
                    <SidebarBtn
                        href={`/fridgeUpdateCustomer/${row.acf_number?.uuid}`}
                        label={`ACF${String(id).padStart(4, "0")}`}
                        isActive
                    />
                );
            },
        },
        {
            key: "crf_code", label: "CRF Code",
            render: (row: any) => {
                const id = row.crf_id;

                if (!id) return "-";

                const formatted = String(id).padStart(4, "0");

                return <span>{`CRF${formatted}`}</span>;
            },
        },

        {
            key: "status",
            label: "Installation Status",
            render: (row: any) => (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {row.status}
                </span>
            )
        }
    ];

    /* ---------------------------------- JSX ---------------------------------- */

    return (
        <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/chillerInstallation/installationReport">
                    <Icon icon="lucide:arrow-left" width={24} />
                </Link>
                <h1 className="text-xl font-semibold">
                    Installation Report Details
                </h1>
            </div>

            <div className="flex flex-col h-full gap-4">
                {/* IR Basic Info */}
                <ContainerCard className="w-full">
                    <KeyValueData
                        title=""
                        data={[
                            { key: "Distributor", value: `${headerData?.warehouse?.code} - ${headerData?.warehouse?.name}` },
                            { key: "IR Code", value: headerData?.osa_code ?? "-" },
                            {
                                key: "Salesman",
                                value: headerData?.salesman
                                    ? `${headerData.salesman.code} - ${headerData.salesman.name}`
                                    : "-",
                            },
                            {
                                key: "Status",
                                value: (
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        {headerData?.status ?? "-"}
                                    </span>
                                ),
                            }
                        ]}
                    />
                </ContainerCard>

                {/* Table */}
                <Table
                    refreshKey={refreshKey}
                    config={{
                        api: { list: fetchIRO },
                        header: {
                            columnFilter: true,
                            searchBar: false,
                        },
                        columns,
                        rowSelection: false,
                        localStorageKey: "installation-report-table",
                        rowActions: [
                            {
                                icon: "lucide:eye",
                                onClick: (data: TableDataType) => {
                                    if (!data.asset_uuid) return;
                                    router.push(`/assetsMaster/view/${data.asset_uuid}`);
                                },
                            },
                        ],
                        pageSize: 50,
                    }}
                />
            </div>
        </>
    );
}
