"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import StatusBtn from "@/app/components/statusBtn2";
import { chillerRequestByUUID } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ImagePreviewModal from "@/app/components/ImagePreviewModal";
import WorkflowApprovalActions from "@/app/components/workflowApprovalActions";

type ChillerRequest = {
  osa_code?: string | null;
  customer?: { id?: number; name?: string; code?: string };
  owner_name?: string | null;
  contact_number?: string | null;
  warehouse?: { id?: number; name?: string; code?: string };
  outlet?: { id?: number; name?: string; code?: string };
  landmark?: string | null;
  location?: string | null;
  machine_number?: string | null;
  asset_number?: string | null;
  model?: { id?: number; name?: string; code?: string };
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
  agent?: { name?: string };
  salesman?: { name?: string };
  route?: { name?: string };
  request_step_id?: number;
  approval_status?: number;
};

const CHILLER_REQUEST_STATUS_MAP: Record<string | number, string> = {
  1: "Salesman Requested",
  2: "Area Sales Manager Accepted",
  3: "Area Sales Manager Rejected",
  4: "Chiller Officer Accepted",
  5: "Chiller Officer Rejected",
  6: "Completed",
  7: "Chiller Manager Rejected",
};


const title = "Assets Request Details";

export default function ViewPage() {
  const params = useParams();
  const uuid: string = Array.isArray(params?.uuid)
    ? params?.uuid[0]
    : (params?.uuid as string);

  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();
  const [chillerRequest, setChillerRequest] = useState<ChillerRequest | null>(
    null
  );

  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imagesToShow, setImagesToShow] = useState<string[]>([]);
  const [startIndex, setStartIndex] = useState(1);
  // const url = process.env.NEXT_PUBLIC_API_URL;
  const url = "https://api.coreexl.com/osa_developmentV2/public/";
  useEffect(() => {
    const fetchChillerDetails = async () => {
      setLoading(true);
      const res = await chillerRequestByUUID(uuid);
      setLoading(false);

      if (res.error) {
        showSnackbar(
          res.data.message || "Unable to fetch Assets Request Details",
          "error"
        );
      } else {
        setChillerRequest(res.data);
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

  // Helper to get full image URL or null
  const getImageUrl = (file?: string | null) => {
    if (
      !file ||
      file === "null" ||
      file === "undefined" ||
      file === "No Image"
    ) {
      return null;
    }

    if (file.startsWith("http://") || file.startsWith("https://")) {
      return file;
    }

    return `${url}/${file}`;
  };

  const getFileView = (file?: string | null) => {
    const imageUrl = getImageUrl(file);

    return imageUrl ? (
      <button
        className="text-blue-600 underline hover:text-blue-800 transition cursor-pointer"
        onClick={() => openImageModal([imageUrl], 0)}
      >
        View Image
      </button>
    ) : (
      <span className="text-gray-400">No Image</span>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/assetsRequest" back>
          <Icon icon="lucide:arrow-left" width={24} />
        </Link>
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
      </div>

      <WorkflowApprovalActions
        requestStepId={chillerRequest?.request_step_id}
        redirectPath="/assetsRequest"
        model="Chiller_Request"
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
              {chillerRequest?.osa_code || ""}
            </h2>
            <span className="flex items-center text-[#414651] text-[16px]">
              <Icon
                icon="mdi:location"
                width={16}
                className="text-[#EA0A2A] mr-[5px]"
              />
              <span>
                {chillerRequest?.location}
              </span>
              {/* <span className="flex justify-center p-[10px] sm:p-0 sm:inline-block mt-[10px] sm:mt-0 sm:ml-[10px]">
                                                <StatusBtn status="active" />
                                            </span> */}
            </span>
          </div>
        </div>
        {/* action buttons */}
        <div className="flex items-center gap-[10px]">
          <div className="flex items-center gap-[10px] text-[14px] font-medium">
            {/* {chillerRequest?.status ? (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
        ${Number(chillerRequest.status) === 6
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                  }`}
              >
                {CHILLER_REQUEST_STATUS_MAP[chillerRequest.status] || "-"}
              </span>
            ) : (
              "-"
            )} */}

            {chillerRequest?.approval_status ? (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-700`}
              >
                {chillerRequest.status}
              </span>
            ) : (
              "-"
            )}
          </div>



        </div>
      </ContainerCard>

      {/* Quadrant Grid Layout */}
      <div
        className="
          grid grid-cols-1 
          md:grid-cols-2 
          gap-6 
          w-full
          pb-10
        "
      >
        {/* 1️⃣ Documents & Attachments — most fields → Top-Left */}
        <ContainerCard className="h-full">
          <KeyValueData
            title="Documents & Attachments"
            data={[
              {
                key: "National ID",
                value: getFileView(chillerRequest?.national_id_file || "No Image"),
              },
              {
                key: "Password Photo",
                value: getFileView(chillerRequest?.password_photo_file || "No Image"),
              },
              {
                key: "Outlet Stamp",
                value: getFileView(chillerRequest?.outlet_stamp_file || "No Image"),
              },
              {
                key: "Trading Licence",
                value: getFileView(chillerRequest?.trading_licence_file || "No Image"),
              },
              {
                key: "LC Letter",
                value: getFileView(chillerRequest?.lc_letter_file || "No Image"),
              },
              {
                key: "Address Proof",
                value: getFileView(chillerRequest?.outlet_address_proof_file || "No Image"),
              },
              {
                key: "Customer Signature",
                value: getFileView(chillerRequest?.sign__customer_file || "No Image"),
              },
            ]}
          />
        </ContainerCard>

        {/* 2️⃣ Outlet & Owner Info — Top-Right */}
        <ContainerCard className="h-full">
          <KeyValueData
            title="Outlet & Owner Information"
            data={[
              {
                key: "Distributor",
                value: chillerRequest?.warehouse ? `${chillerRequest.warehouse.code} - ${chillerRequest.warehouse.name}` : "-",
              },
              {
                key: "Outlet Name",
                value: chillerRequest?.customer
                  ? `${chillerRequest.customer.code} - ${chillerRequest.customer.name}`
                  : "-"
              },
              { key: "Owner Name", value: chillerRequest?.owner_name || "-" },
              {
                key: "Contact Number",
                value: chillerRequest?.contact_number || "-",
              },
              { key: "Outlet Type", value: chillerRequest?.outlet?.name || "-" },
              { key: "Landmark", value: chillerRequest?.landmark || "-" },
              {
                key: "Model",
                value: chillerRequest?.model?.name || "-",
              },
            ]}
          />
        </ContainerCard>
      </div>

      {/* Reusable Image Modal */}
      <ImagePreviewModal
        images={imagesToShow}
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        startIndex={startIndex}
      />
    </>
  );
}
