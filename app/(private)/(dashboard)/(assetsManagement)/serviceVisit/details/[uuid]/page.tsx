"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import StatusBtn from "@/app/components/statusBtn2";
import { serviceVisitByUUID } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Map from "@/app/components/map";
import ImagePreviewModal from "@/app/components/ImagePreviewModal";
import TabBtn from "@/app/components/tabBtn";
import WorkflowApprovalActions from "@/app/components/workflowApprovalActions";
import Table from "@/app/components/customTable";
const title = "Service Visit Details";
const backBtnUrl = "/serviceVisit";

export const tabs = [
    { name: "Basic Details" },
    { name: "Work Done" },
    { name: "Equipment Condition" },
];




export default function ViewPage() {
    const params = useParams();
    const uuid = Array.isArray(params?.uuid) ? params?.uuid[0] : params?.uuid;
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const [data, setData] = useState<any>(null);
    const onTabClick = (index: number) => setActiveTab(index);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!uuid) return;
            setLoading(true);
            const res = await serviceVisitByUUID(uuid);
            setLoading(false);


            if (res.error) {
                showSnackbar(res.data?.message || "Unable to fetch Service Visit", "error");
            } else {
                setData(res.data);
            }
        };
        fetchDetails();
    }, [uuid]);

    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

    const openImage = (url: string) => {
        if (!url) return;
        setPreviewImages([url]);
        setIsImagePreviewOpen(true);
    };

    const renderViewImageBtn = (url: string | null) => {
        if (!url) return null;
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    openImage(url);
                }}
                className="ml-2 inline-flex items-center text-[#EA0A2A] hover:text-[#b4061e] transition-colors cursor-pointer"
                title="View Image"
            >
                <Icon icon="mdi:eye" width={18} />
            </button>
        );
    };

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
                requestStepId={data?.request_step_id}
                redirectPath={backBtnUrl}
                model="Service_Visit"
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
                            {data?.osa_code || ""}
                        </h2>
                    </div>
                </div>
                {/* action buttons */}
                <div className="flex items-center gap-[10px]">
                    <span className="px-2 py-1 rounded-full bg-[#E9EAEB] text-[12px] font-semibold">
                        {data?.ticket_status === "0" ? "Pending" : "Closed By Technician"}
                    </span>
                </div>
            </ContainerCard>

            <ContainerCard className="w-full flex gap-[4px] overflow-x-auto" padding="5px">
                {tabs.map((tab, index) => (
                    <TabBtn
                        key={index}
                        label={tab.name}
                        isActive={activeTab === index}
                        onClick={() => onTabClick(index)}
                    />
                ))}
            </ContainerCard>


            {activeTab === 0 && (
                <section className="space-y-6">

                    {/* ================= TOP GRID ================= */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Service Visit Details */}
                        <ContainerCard className="w-full">
                            <h2 className="text-lg font-semibold mb-4 text-[#181D27]">
                                Service Visit Details
                            </h2>

                            <KeyValueData
                                data={[
                                    // { key: "Ticket Type", value: data?.ticket_type },
                                    { key: "Ticket Number", value: data?.osa_code },
                                    { key: "Time In", value: data?.time_in || "-" },
                                    { key: "Time Out", value: data?.time_out || "-" },
                                    { key: "Technician", value: `${data?.technician?.code} - ${data?.technician?.name}` },
                                    // { key: "Technician", value: data?.technician?.code },
                                ]}
                            />
                        </ContainerCard>

                        {/* Current Customer Details */}
                        <ContainerCard className="w-full">
                            <h2 className="text-lg font-semibold mb-4 text-[#181D27]">
                                Current Customer Details
                            </h2>

                            <KeyValueData
                                data={[
                                    { key: "Outlet", value: `${data?.outlet_code || ""} - ${data?.outlet_name || ""}` },
                                    // { key: "Outlet Name", value: data?.outlet_name || "-" },
                                    { key: "Owner Name", value: data?.owner_name || "-" },
                                    { key: "Landmark", value: data?.landmark || "-" },
                                    // {
                                    //     key: "Location",
                                    //     value: "",
                                    //     component:
                                    //         typeof data?.location === "string" &&
                                    //             data.location.includes(",") ? (
                                    //             <div className="rounded-lg overflow-hidden border">
                                    //                 <Map
                                    //                     latitude={data.location.split(",")[0].trim()}
                                    //                     longitude={data.location.split(",")[1].trim()}
                                    //                     title="Location"
                                    //                 />
                                    //             </div>
                                    //         ) : (
                                    //             data?.location || "-"
                                    //         ),
                                    // },
                                    { key: "Town / Village", value: data?.town_village || "-" },
                                    { key: "District", value: data?.district || "-" },
                                    { key: "Contact No 1", value: data?.contact_no || "-" },
                                    { key: "Contact No 2", value: data?.contact_no2 || "-" },
                                    { key: "Contact Person", value: data?.contact_person || "-" },
                                ]}
                            />
                        </ContainerCard>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Service Visit Details */}
                        <ContainerCard className="w-full">
                            <h2 className="text-lg font-semibold mb-4 text-[#EA0A2A]">
                                Fridge Details
                            </h2>

                            <KeyValueData
                                data={[
                                    { key: "Model Number", value: data?.model_no || "-" },
                                    { key: "Asset Number", value: data?.asset_no || "-" },
                                    { key: "Serial Number", value: data?.serial_no || "-" },
                                    { key: "Branding", value: data?.branding || "-" },
                                    {
                                        key: "Cooler Image",
                                        value: data?.cooler_image ? "View Image" : "-",
                                        component: renderViewImageBtn(data?.cooler_image),
                                    },
                                    {
                                        key: "Cooler Image 2",
                                        value: data?.cooler_image2 ? "View Image" : "-",
                                        component: renderViewImageBtn(data?.cooler_image2),
                                    },
                                    {
                                        key: "Type Details Photo 1",
                                        value: data?.type_details_photo1 ? "View Image" : "-",
                                        component: renderViewImageBtn(data?.type_details_photo1),
                                    },
                                    {
                                        key: "Type Details Photo 2",
                                        value: data?.type_details_photo2 ? "View Image" : "-",
                                        component: renderViewImageBtn(data?.type_details_photo2),
                                    },
                                ]}
                            />

                        </ContainerCard>

                        {/* Current Customer Details */}
                        <ContainerCard className="w-full">
                            {/* <h2 className="text-lg font-semibold mb-4 text-[#181D27]">
                                Location
                            </h2> */}
                            <div>
                                <Map
                                    latitude={data?.location?.split(",")[0]?.trim() || "0"}
                                    longitude={data?.location?.split(",")[1]?.trim() || "0"}
                                    title="Location"
                                />
                            </div>
                            {/* <KeyValueData
                                data={[
                                    // { key: "Outlet Code", value: data?.outlet_code || "-" },
                                    // { key: "Outlet Name", value: data?.outlet_name || "-" },
                                    // { key: "Owner Name", value: data?.owner_name || "-" },
                                    // { key: "Landmark", value: data?.landmark || "-" },
                                    {
                                        key: "Location",
                                        value: "",
                                        component:
                                            typeof data?.location === "string" &&
                                                data.location.includes(",") ? (
                                                <div className="rounded-lg overflow-hidden border">
                                                    <Map
                                                        latitude={data.location.split(",")[0].trim()}
                                                        longitude={data.location.split(",")[1].trim()}
                                                        title="Location"
                                                    />
                                                </div>
                                            ) : (
                                                data?.location || "-"
                                            ),
                                    },
                                    // { key: "Town / Village", value: data?.town_village || "-" },
                                    // { key: "District", value: data?.district || "-" },
                                    // { key: "Contact No 1", value: data?.contact_no || "-" },
                                    // { key: "Contact No 2", value: data?.contact_no2 || "-" },
                                    // { key: "Contact Person", value: data?.contact_person || "-" },
                                ]}
                            /> */}
                        </ContainerCard>
                    </div>

                    {/* ================= FRIDGE DETAILS ================= */}
                    {/* <ContainerCard className="w-full lg:w-[680px] bg-[#FFF5F7]">
                        <h2 className="text-lg font-semibold mb-4 text-[#EA0A2A]">
                            Fridge Details
                        </h2>

                        <KeyValueData
                            data={[
                                { key: "Model Number", value: data?.model_no || "-" },
                                { key: "Asset Number", value: data?.asset_no || "-" },
                                { key: "Serial Number", value: data?.serial_no || "-" },
                                { key: "Branding", value: data?.branding || "-" },
                                {
                                    key: "Cooler Image",
                                    value: data?.cooler_image ? "View Image" : "-",
                                    component: renderViewImageBtn(data?.cooler_image),
                                },
                                {
                                    key: "Cooler Image 2",
                                    value: data?.cooler_image2 ? "View Image" : "-",
                                    component: renderViewImageBtn(data?.cooler_image2),
                                },
                            ]}
                        />

                    </ContainerCard> */}

                </section>
            )}



            {activeTab === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Work Details</h2>
                        <ContainerCard className="w-full">
                            <KeyValueData
                                data={[
                                    // { key: "Complaint Type", value: data?.complaint_type || "-" },
                                    { key: "Nature of Call", value: data?.nature_of_call?.name || "-" },
                                    { key: "Current Voltage", value: data?.current_voltage || "-" },
                                    { key: "Amps", value: data?.amps || "-" },
                                    { key: "Cabin Temperature", value: data?.cabin_temperature || "-" },
                                ]}
                            />
                        </ContainerCard>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-2">Work Done Details</h2>
                        <ContainerCard className="w-full">
                            <KeyValueData
                                data={[
                                    // { key: "Work Done Type", value: data?.work_done_type || "-" },
                                    // { key: "Spare Part Used", value: data?.spare_part_used || "-" },
                                    // { key: "Spare Details", value: data?.spare_details || "-" },
                                    { key: "Technical Behavior Rating", value: data?.technical_behavior || "-" },
                                    { key: "Service Quality Rating", value: data?.service_quality || "-" },
                                    {
                                        key: "Customer Signature",
                                        value: data?.customer_signature ? "View Signature" : "-",
                                        component: renderViewImageBtn(data?.customer_signature),
                                    },
                                ]}
                            />
                        </ContainerCard>
                    </div>
                </div>
            )}


            {activeTab === 2 && (
                <div>

                    {/* ================= EQUIPMENT CONDITION ================= */}
                    <h2 className="text-lg font-semibold">Equipment Condition</h2>
                    <div className="flex flex-wrap gap-5">
                        <ContainerCard className="w-full lg:w-full">
                            <KeyValueData
                                data={[
                                    {
                                        key: "Machine Working",
                                        value: data?.is_machine_in_working == 1 ? "Yes" : "No",
                                        component: renderViewImageBtn(data?.is_machine_in_working_img)
                                    },
                                    {
                                        key: "Cleanliness",
                                        value: data?.cleanliness === 1 ? "Yes" : "No",
                                        component: renderViewImageBtn(data?.cleanliness_img)
                                    },
                                    {
                                        key: "Condenser Coil Cleaned",
                                        value: data?.condensor_coil_cleand === 1 ? "Yes" : "No",
                                        component: renderViewImageBtn(data?.condensor_coil_cleand_img)
                                    },
                                    {
                                        key: "Gaskets",
                                        value: data?.gaskets === 1 ? "Yes" : "No",
                                        component: renderViewImageBtn(data?.gaskets_img)
                                    },
                                    {
                                        key: "Light Working",
                                        value: data?.light_working === 1 ? "Yes" : "No",
                                        component: renderViewImageBtn(data?.light_working_img)
                                    },
                                    {
                                        key: "Proper Ventilation",
                                        value: data?.propper_ventilation_available === 1 ? "Yes" : "No",
                                        component: renderViewImageBtn(data?.propper_ventilation_available_img)
                                    },
                                    {
                                        key: "Leveling Positioning",
                                        value: data?.leveling_positioning === 1 ? "Yes" : "No",
                                        component: renderViewImageBtn(data?.leveling_positioning_img)
                                    },
                                    {
                                        key: "Stock Availability %",
                                        value: data?.stock_availability_in === 1 ? "Yes" : "No",
                                        component: renderViewImageBtn(data?.stock_availability_in_img)
                                    },
                                ]}
                            />
                        </ContainerCard>
                    </div>
                </div>
            )}

            <ImagePreviewModal
                images={previewImages}
                isOpen={isImagePreviewOpen}
                onClose={() => setIsImagePreviewOpen(false)}
            />
        </>
    );
}
