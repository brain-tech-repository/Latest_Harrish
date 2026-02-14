"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import StatusBtn from "@/app/components/statusBtn2";
import { fridgeUpdateCustomerByUUID } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ImagePreviewModal from "@/app/components/ImagePreviewModal";
import WorkflowApprovalActions from "@/app/components/workflowApprovalActions";

type fridgeUpdate = {
    osa_code?: string | null;
    outlet_name?: string | null;
    owner_name?: string | null;
    contact_number?: string | null;
    outlet_type?: string | null;
    landmark?: string | null;
    machine_number?: string | null;
    asset_number?: string | null;
    brand?: string | null;
    status?: number;
    fridge_status?: number;
    iro_id?: number;
    remark?: string | null;
    national_id_file?: string | null;
    password_photo_file?: string | null;
    outlet_stamp_file?: string | null;
    trading_licence_file?: string | null;
    lc_letter_file?: string | null;
    outlet_address_proof_file?: string | null;
    sign__customer_file?: string | null;
    national_id1_file?: string | null;
    password_photo1_file?: string | null;
    outlet_address_proof1_file?: string | null;
    trading_licence1_file?: string | null;
    lc_letter1_file?: string | null;
    outlet_stamp1_file?: string | null;
    sign_salesman_file?: string | null;
    fridge_scan_img?: string | null;
    agent?: { name?: string };
    salesman?: { name?: string };
    warehouse?: { name?: string };
    route?: { name?: string };
    request_step_id?: number;
};

const title = "Fridge Update Customer Details";

export default function ViewPage() {
    const params = useParams();
    const uuid: string = Array.isArray(params?.uuid)
        ? params?.uuid[0]
        : (params?.uuid as string);

    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const [fridgeUpdate, setfridgeUpdate] = useState<fridgeUpdate | null>(
        null
    );

    const Status: Record<string, string> = {
        "1": "Sales Team Requested",
        "2": "Area Sales Manager Accepted",
        "3": "Area Sales Manager Rejected",
        "4": "Chiller officer Accepted",
        "5": "Chiller officer Rejected",
        "6": "Completed",
        "7": "Chiller Manager Rejected",
    };

    const base_url_img = "https://api.coreexl.com/osa_developmentV2/public";

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imagesToShow, setImagesToShow] = useState<string[]>([]);
    const [startIndex, setStartIndex] = useState(0);

    useEffect(() => {
        const fetchChillerDetails = async () => {
            setLoading(true);
            const res = await fridgeUpdateCustomerByUUID(uuid);
            setLoading(false);

            if (res.error) {
                showSnackbar(
                    res.data.message || "Unable to fetch fridge update customer Details",
                    "error"
                );
            } else {
                setfridgeUpdate(res.data);
            }
        };
        fetchChillerDetails();
    }, [uuid]);

    const openImageModal = (images: string[], index: number) => {
        setImagesToShow(images);
        setStartIndex(index);
        setIsImageModalOpen(true);
    };

    const closeImageModal = () => {
        setIsImageModalOpen(false);
        setImagesToShow([]);
        setStartIndex(0);
    };

    const getFullImageUrl = (file?: string | null) => {
        if (!file) return null;
        return `${base_url_img}/${file}`;
    };


    const allImageFiles = [
        fridgeUpdate?.national_id_file,
        fridgeUpdate?.password_photo_file,
        fridgeUpdate?.outlet_stamp_file,
        fridgeUpdate?.trading_licence_file,
        fridgeUpdate?.lc_letter_file,
        fridgeUpdate?.outlet_address_proof_file,
        fridgeUpdate?.sign__customer_file,
        fridgeUpdate?.national_id1_file,
        fridgeUpdate?.password_photo1_file,
        fridgeUpdate?.outlet_address_proof1_file,
        fridgeUpdate?.trading_licence1_file,
        fridgeUpdate?.lc_letter1_file,
        fridgeUpdate?.outlet_stamp1_file,
        fridgeUpdate?.sign_salesman_file,
        fridgeUpdate?.fridge_scan_img,
    ]
        .map(getFullImageUrl)
        .filter(Boolean) as string[];


    const getFileView = (file?: string | null) => {
        if (!file) return "No Image";

        const fullUrl = getFullImageUrl(file);
        const index = allImageFiles.indexOf(fullUrl!);

        return (
            <button
                className="text-blue-600 underline hover:text-blue-800 transition"
                onClick={() => openImageModal(allImageFiles, index)}
            >
                View Image
            </button>
        );
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/fridgeUpdateCustomer" back>
                    <Icon icon="lucide:arrow-left" width={24} />
                </Link>
                <h1 className="text-xl font-semibold mb-1">{title}</h1>
            </div>

            <WorkflowApprovalActions
                requestStepId={fridgeUpdate?.request_step_id}
                redirectPath="/fridgeUpdateCustomer"
                model="Frige_Customer_Update"
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
                            {fridgeUpdate?.osa_code || ""}
                        </h2>
                    </div>
                </div>
                {/* action buttons */}
                <div className="flex items-center gap-[10px]">
                    <span className="text-sm text-[#027A48] bg-[#ECFDF3] font-[500] p-1 px-4 rounded-xl text-[12px]">
                        {Status[fridgeUpdate?.status?.toString() || ""]}
                    </span>
                </div>
            </ContainerCard>

            <div
                className="
          grid grid-cols-1 
          md:grid-cols-2 
          gap-6 
          w-full
          pb-10
        "
            >
                <ContainerCard className="h-full">
                    <KeyValueData
                        title="Documents & Attachments"
                        data={[
                            {
                                key: "National ID",
                                value: getFileView(fridgeUpdate?.national_id_file),
                            },
                            {
                                key: "Password Photo",
                                value: getFileView(fridgeUpdate?.password_photo_file),
                            },
                            {
                                key: "Outlet Stamp",
                                value: getFileView(fridgeUpdate?.outlet_stamp_file),
                            },
                            {
                                key: "Trading Licence",
                                value: getFileView(fridgeUpdate?.trading_licence_file),
                            },
                            {
                                key: "LC Letter",
                                value: getFileView(fridgeUpdate?.lc_letter_file),
                            },
                            {
                                key: "Address Proof",
                                value: getFileView(fridgeUpdate?.outlet_address_proof_file),
                            },
                            {
                                key: "Customer Signature",
                                value: getFileView(fridgeUpdate?.sign__customer_file),
                            },
                            {
                                key: "National ID 1",
                                value: getFileView(fridgeUpdate?.national_id1_file),
                            },
                            {
                                key: "Password Photo 1",
                                value: getFileView(fridgeUpdate?.password_photo1_file),
                            },
                            {
                                key: "Outlet Address Proof 1",
                                value: getFileView(fridgeUpdate?.outlet_address_proof1_file),
                            },
                            {
                                key: "Trading Licence 1",
                                value: getFileView(fridgeUpdate?.trading_licence1_file),
                            },
                            {
                                key: "LC Letter 1",
                                value: getFileView(fridgeUpdate?.lc_letter1_file),
                            },
                            {
                                key: "Outlet Stamp 1",
                                value: getFileView(fridgeUpdate?.outlet_stamp1_file),
                            },
                            {
                                key: "Salesman Signature",
                                value: getFileView(fridgeUpdate?.sign_salesman_file),
                            },
                            {
                                key: "Fridge Scan",
                                value: getFileView(fridgeUpdate?.fridge_scan_img),
                            },
                        ]}
                    />
                </ContainerCard>

                <ContainerCard className="h-full">
                    <KeyValueData
                        title="Outlet & Owner Information"
                        data={[
                            { key: "Outlet Name", value: fridgeUpdate?.outlet_name || "-" },
                            { key: "Owner Name", value: fridgeUpdate?.owner_name || "-" },
                            {
                                key: "Contact Number",
                                value: fridgeUpdate?.contact_number || "-",
                            },
                            { key: "Outlet Type", value: fridgeUpdate?.outlet_type || "-" },
                            { key: "Landmark", value: fridgeUpdate?.landmark || "-" },
                            {
                                key: "Machine Number",
                                value: fridgeUpdate?.machine_number || "-",
                            },
                            {
                                key: "Asset Number",
                                value: fridgeUpdate?.asset_number || "-",
                            },
                            { key: "Brand", value: fridgeUpdate?.brand || "-" },
                            {
                                key: "Fridge Status",
                                value: fridgeUpdate?.fridge_status ? "Active" : "Inactive",
                            },
                            { key: "Remarks", value: fridgeUpdate?.remark || "-" },
                            {
                                key: "Status",
                                value: Status[String(fridgeUpdate?.status)] ?? "-",
                            }
                        ]}
                    />
                </ContainerCard>

            </div>

            <ImagePreviewModal
                images={imagesToShow}
                isOpen={isImageModalOpen}
                onClose={closeImageModal}
                startIndex={startIndex}
            />
        </>
    );
}
