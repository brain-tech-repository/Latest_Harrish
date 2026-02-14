"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import StatusBtn from "@/app/components/statusBtn2";
import { BulkTransferByUUID } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import WorkflowApprovalActions from "@/app/components/workflowApprovalActions";
type BulkTransferData = {
    id: number;
    uuid: string;
    osa_code: string;
    region: {
        id: number;
        code: string;
        name: string;
    };
    area: {
        id: number;
        code: string;
        name: string;
    };
    warehouse: {
        id: number;
        code: string;
        name: string;
    };
    model_number: {
        id: number;
        code: string;
        name: string;
    };
    requestes_asset: number;
    available_stock: number;
    approved_qty: string | number;
    allocate_asset: string | number;
    status: number;
    comment_reject: string | null;
    created_at: string;
};

const title = "Bulk Transfer Details";
const backBtnUrl = "/chillerInstallation/bulkTransfer"

export default function ViewPage() {
    const params = useParams();
    let uuid: string = "";
    if (params?.uuid) {
        if (Array.isArray(params?.uuid)) {
            uuid = params?.uuid[0] || "";
        } else {
            uuid = params?.uuid as string;
        }
    }

    // state variables
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const [transferData, setTransferData] = useState<BulkTransferData | null>(null);
    const [approvalId,setApprovalId]=useState<any>();
    useEffect(() => {
        const fetchTransferDetails = async () => {
            setLoading(true);
            const res = await BulkTransferByUUID(uuid);
            setLoading(false);
            setApprovalId(res.data?.request_step_id);
            if (res.error) {
                showSnackbar(
                    res.data?.message || "Unable to fetch Bulk Transfer Details",
                    "error"
                );
            } else {
                setTransferData(res.data);
            }
        };
        fetchTransferDetails();
    }, [uuid]);

    return (
        <>
            <div className="flex items-center gap-4 mb-6">
                <Link href={backBtnUrl} back>
                    <Icon icon="lucide:arrow-left" width={24} />
                </Link>
                <h1 className="text-xl font-semibold mb-1">{title}</h1>
            </div>
            <WorkflowApprovalActions
                    requestStepId={approvalId}
                    redirectPath="/chillerInstallation/bulkTransfer"
                    model="bulk_transfer"
                    uuid={uuid}
                  />
            <ContainerCard className="w-full flex flex-col sm:flex-row items-center justify-between gap-[10px] md:gap-0">
                {/* profile details */}
                <div className="flex flex-col sm:flex-row items-center gap-[20px]">
                    <div className="w-[80px] h-[80px] flex justify-center items-center rounded-full bg-[#E9EAEB]">
                        <Icon
                            icon="mdi:fridge-outline"
                            width={40}
                            className="text-[#535862] scale-[1.5]"
                        />
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className="text-[20px] font-semibold text-[#181D27] mb-[10px]">
                            {transferData?.osa_code || ""}
                        </h2>
                    </div>
                </div>
                {/* action buttons */}
                <div className="flex items-center gap-[10px]">
                    <StatusBtn
                        isActive={transferData?.status === 1}
                    />
                </div>
            </ContainerCard>
            <div className="flex flex-wrap gap-x-[30px] gap-y-[6px]">
                <ContainerCard className="w-full">
                    <KeyValueData
                        data={[
                            { value: `${transferData?.region?.code || ''} - ${transferData?.region?.name || ''}`, key: "Region" },
                            { value: `${transferData?.area?.code || ''} - ${transferData?.area?.name || ''}`, key: "Area" },
                            { value: `${transferData?.warehouse?.code || ''} - ${transferData?.warehouse?.name || ''}`, key: "Distributor" },
                            { value: transferData?.model_number?.name || "-", key: "Model Number" },

                        ]}
                    />
                </ContainerCard>
                <ContainerCard className="w-full">
                    <KeyValueData
                        data={[

                            { value: transferData?.available_stock, key: "Available Stock" },
                            { value: transferData?.requestes_asset, key: "Requested Assets" },
                            { value: transferData?.approved_qty || "-", key: "Approved Quantity" },
                            { value: transferData?.allocate_asset || "-", key: "Allocated Assets" },
                        ]}
                    />
                </ContainerCard>

                {transferData?.comment_reject && (
                    <ContainerCard className="w-full">
                        <div>
                            <h3 className="font-semibold mb-2">Rejection Comment</h3>
                            <p className="text-gray-700">{transferData.comment_reject}</p>
                        </div>
                    </ContainerCard>
                )}
            </div>
        </>
    );
}
