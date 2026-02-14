"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import StatusBtn from "@/app/components/statusBtn2";
import { stockTransferByUUID } from "@/app/services/agentTransaction";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import WorkflowApprovalActions from "@/app/components/workflowApprovalActions";
import Table from "@/app/components/customTable";
import { formatDate } from "@/app/(private)/(dashboard)/(master)/salesTeam/details/[uuid]/page";

const title = "Stock Transfer Details";
const backBtnUrl = "/stocktransfer";

export default function ViewPage() {
    const params = useParams();
    const uuid = params?.uuid as string;

    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();

    const [transferData, setTransferData] =
        useState<any | null>(null);

    useEffect(() => {
        const fetchTransferDetails = async () => {
            setLoading(true);
            const res = await stockTransferByUUID(uuid);
            setLoading(false);

            if (res.error) {
                showSnackbar(
                    res.data?.message || "Unable to fetch Stock Transfer Details",
                    "error"
                );
            } else {
                setTransferData(res.data);
            }
        };

        fetchTransferDetails();
    }, [uuid]);

  const columns = [
  { key: "item_name", label: "Item", showByDefault: true,render: (item: any) => `${item.erp_code} - ${item.item_name}` || "-" },
  { key: "transfer_qty", label: "Transfer Qty", showByDefault: true },
  {
    key: "source_warehouse_stock",
    label: "Source Stock",
    showByDefault: true,
  },
  {
    key: "destiny_warehouse_stock",
    label: "Destination Stock",
    showByDefault: true,
  },
];

    return (
        <>
            {/* HEADER */}
			<div className="flex items-center gap-4 mb-6">
                <Link href={backBtnUrl} back>
                    <Icon icon="lucide:arrow-left" width={24} />
                </Link>
                <h1 className="text-xl font-semibold">{title}</h1>
            </div>

            <WorkflowApprovalActions
                requestStepId={transferData?.request_step_id}
                redirectPath={backBtnUrl}
                model="Distributor_Stock_Transfer"
            />

            {/* SUMMARY CARDS */}
            <div className="flex flex-wrap gap-5">
                <ContainerCard className="w-full">
                    <KeyValueData
                        data={[
                            { key: "OSA Code", value: transferData?.osa_code },
                            {
                                key: "Source Distributor",
                                value: `${transferData?.source_warehouse?.code} - ${transferData?.source_warehouse?.name}`,
                            },
                            {
                                key: "Destination Distributor",
                                value: `${transferData?.destiny_warehouse?.code} - ${transferData?.destiny_warehouse?.name}`,
                            },
                            {
                                key: "Transfer Date",
                                value: formatDate(transferData?.transfer_date),
                            },
                            
                        ]}
                    />
                </ContainerCard>
            </div>

            {/* ITEMS LIST */}
            {/* <ContainerCard className="mt-6"> */}
                {/* <h3 className="text-lg font-semibold mb-4">
                    Transfer Items
                </h3> */}

                <div className="overflow-x-auto">
                    {/* <table></table> */}
                    <Table
                            //  refreshKey={refreshKey}
                             config={{
                            //    api: { list: fetchOrders, filterBy: filterBy },
                               header: {
                                 title: "Transfer Items",
                                
                               },
                               columns,
                               
                               pageSize: 50,
                             }}
                             data={transferData?.items}
                           />
                    {/* <table className="w-full border border-gray-200 text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 border">Item Name</th>
                                <th className="p-2 border">ERP Code</th>
                                <th className="p-2 border">Transfer Qty</th>
                                <th className="p-2 border">
                                    Source Stock
                                </th>
                                <th className="p-2 border">
                                    Destination Stock
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transferData?.items?.map((item: any) => (
                                <tr key={item.item_id}>
                                    <td className="p-2 border">
                                        {item.item_name}
                                    </td>
                                    <td className="p-2 border">
                                        {item.erp_code}
                                    </td>
                                    <td className="p-2 border text-center">
                                        {item.transfer_qty}
                                    </td>
                                    <td className="p-2 border text-center">
                                        {item.source_warehouse_stock}
                                    </td>
                                    <td className="p-2 border text-center">
                                        {item.destiny_warehouse_stock}
                                    </td>
                                </tr>
                            ))}

                            {!transferData?.items?.length && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="p-4 text-center text-gray-500"
                                    >
                                        No items found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table> */}
                </div>
            {/* </ContainerCard> */}
        </>
    );
}
