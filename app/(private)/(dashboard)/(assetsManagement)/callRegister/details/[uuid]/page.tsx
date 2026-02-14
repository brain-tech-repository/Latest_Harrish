"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import StatusBtn from "@/app/components/statusBtn2";
import { callRegisterByUUID } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TabBtn from "@/app/components/tabBtn";
import { formatWithPattern } from "@/app/utils/formatDate";
import WorkflowApprovalActions from "@/app/components/workflowApprovalActions";
import Table from "@/app/components/customTable";

const title = "View Call Register";
const backBtnUrl = "/callRegister";

export const tabs = [
    { name: "Overview" },
    { name: "Customer" },
    { name: "Nature of Call" },
];

const columns = [
    { key: "", label: "" }

];

export default function ViewPage() {
    const params = useParams();
    const uuid = Array.isArray(params?.uuid) ? params?.uuid[0] : params?.uuid;
    const onTabClick = (index: number) => setActiveTab(index);
    const [activeTab, setActiveTab] = useState(0);
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!uuid) return;
            setLoading(true);
            const res = await callRegisterByUUID(uuid);
            setLoading(false);

            if (res.error) {
                showSnackbar(res.data?.message || "Unable to fetch Call Register details", "error");
            } else {
                setData(res.data);
            }
        };
        fetchDetails();
    }, [uuid]);

    const fetchServiceVisitList = async () => {
        if (!uuid) return;
        setLoading(true);
        const res = await callRegisterByUUID(uuid);
        setLoading(false);


        if (res.error) {
            showSnackbar(res.data?.message || "Unable to fetch Service Visit", "error");
        } else {
            setData(res.data);
        }
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
                redirectPath="/callRegister"
                model="Call_Register"
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
                            {data?.osa_code || ""}
                        </h2>
                    </div>
                </div>
                {/* action buttons */}
                <div className="flex rounded-full px-3 py-1 text-xs font-medium bg-gray-100 gap-[10px]">
                    {data?.status}
                </div>
            </ContainerCard>

            {/* <ContainerCard className="w-full flex gap-[4px] overflow-x-auto" padding="5px">
                {tabs.map((tab, index) => (
                    <TabBtn
                        key={index}
                        label={tab.name}
                        isActive={activeTab === index}
                        onClick={() => onTabClick(index)}
                    />
                ))}
            </ContainerCard> */}

            <ContainerCard
                className="w-full flex gap-[4px] overflow-x-auto"
                padding="5px"
            >
                {tabs.map((tab, index) => (
                    <div key={index}>
                        <TabBtn
                            label={tab.name}
                            isActive={activeTab === index}
                            onClick={() => {
                                onTabClick(index);
                            }}
                        />
                    </div>
                ))}
            </ContainerCard>

            {activeTab === 0 && (
                <>
                    <h2 className="text-lg font-semibold mt-2">Call Register Details</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px] mt-4">
                        <ContainerCard className="w-full">
                            <KeyValueData
                                data={[
                                    { key: "Ticket Type", value: data?.ticket_type },
                                    { key: "Ticket Date", value: formatWithPattern(new Date(data?.ticket_date as string), "DD MMM YYYY", "en-GB")?.toLowerCase() },
                                    { key: "Chiller Serial Number", value: data?.chiller_serial_number },
                                    { key: "Asset Number", value: data?.asset_number || "-" },
                                    { key: "Model Number", value: data?.model_number?.name || "-" },
                                    { key: "Chiller Code", value: data?.chiller_code },
                                ]}
                            />
                        </ContainerCard>

                        <ContainerCard className="w-full">
                            <KeyValueData
                                data={[
                                    { key: "Branding", value: data?.branding?.name || "-" },
                                    { key: "CTC Status", value: data?.ctc_status },
                                    {
                                        key: "Follow-up Status",
                                        value: data?.followup_status,
                                    },
                                    { key: "Nature of Call", value: data?.nature_of_call },
                                    { key: "Follow-up Action", value: data?.follow_up_action },
                                ]}
                            />
                        </ContainerCard>
                    </div>
                </>
            )}


            {activeTab === 1 && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px] mt-4">

                        {/* Assign Customer Details */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">
                                Assign Customer Details
                            </h2>

                            <ContainerCard className="w-full">
                                <KeyValueData
                                    data={[
                                        { key: "Outlet Code", value: data?.assigned_customer?.code || "-" },
                                        { key: "Outlet Name", value: data?.assigned_customer?.name || "-" },
                                        { key: "Owner Name", value: data?.assigned_customer?.owner_name || "-" },
                                        { key: "Distributors", value: `${data?.assigned_customer?.Warehouse_code || ""} - ${data?.assigned_customer?.Warehouse_name || ""}` || "-" },
                                        { key: "Road/Street", value: data?.assigned_customer?.street || "-" },
                                        { key: "District", value: data?.assigned_customer?.district || "-" },
                                        { key: "Town", value: data?.assigned_customer?.town || "-" },
                                        { key: "Landmark", value: data?.assigned_customer?.landmark || "-" },
                                        { key: "Contact Number 1", value: data?.assigned_customer?.contact_no_1 || "-" },
                                        { key: "Contact Number 2", value: data?.assigned_customer?.contact_no_2 || "-" },
                                    ]}
                                />
                            </ContainerCard>
                        </div>

                        {/* Current Customer Details */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">
                                Current Customer Details
                            </h2>

                            <ContainerCard className="w-full">
                                <KeyValueData
                                    data={[
                                        { key: "Outlet Code", value: data?.current_customer?.code || "-" },
                                        { key: "Outlet Name", value: data?.current_customer?.name || "-" },
                                        { key: "Owner Name", value: data?.current_owner_name || "-" },
                                        { key: "Road/Street", value: data?.current_road_street || "-" },
                                        { key: "District", value: data?.current_district || "-" },
                                        { key: "Town", value: data?.current_town || "-" },
                                        { key: "Landmark", value: data?.current_landmark || "-" },
                                        { key: "Contact Number 1", value: data?.current_contact_no1 || "-" },
                                        { key: "Contact Number 2", value: data?.current_contact_no2 || "-" },
                                    ]}
                                />
                            </ContainerCard>
                        </div>

                    </div>
                </>
            )}
            {activeTab === 2 && (
                <div className="space-y-6">
                    <ContainerCard className="w-full">
                        <Table
                            config={{
                                api: {
                                    list: fetchServiceVisitList,
                                },

                                header: {
                                    columnFilter: false,
                                    searchBar: false,
                                },

                                columns,
                                // rowSelection: true,
                                footer: { nextPrevBtn: true, pagination: true },
                                pageSize: 50,
                                localStorageKey: "service-visit-table",
                            }}
                        />
                    </ContainerCard>
                </div>
            )}


        </>
    );
}
