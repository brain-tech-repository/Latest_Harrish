"use client";

import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import ExportDropdownButton from "@/app/components/ExportDropdownButton";
import ContainerCard from "@/app/components/containerCard";
import Table, { configType, listReturnType, searchReturnType, TableDataType } from "@/app/components/customTable";
import StatusBtn from "@/app/components/statusBtn2";
import TabBtn from "@/app/components/tabBtn";
import { exportAllInvoices, agentCustomerReturnExport, exportSpecificCustomerReturn, exportInvoice, exportOrderInvoice, getAgentCustomerByReturnId, getAgentCustomerBySalesId, invoiceList } from "@/app/services/agentTransaction";
import { agentCustomerById, downloadFile, downloadPDFGlobal } from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Additional from "./additional";
import Financial from "./financial";
import Location from "./location";
import Overview from "./overview";
import { formatDate } from "../../../salesTeam/details/[uuid]/page";
import Skeleton from "@mui/material/Skeleton";
import FilterComponent from "@/app/components/filterComponent";
import Drawer from "@mui/material/Drawer";
import { SideBarDetailPage } from "@/app/components/sideDrawer";
import Link from "@/app/components/smartLink";
export interface AgentCustomerDetails {
    id: string;
    uuid: string;
    osa_code: string;
    name: string;
    contact_no: string;
    contact_no2: string;
    whatsapp_no: string;
    is_whatsapp: string;
    vat_no: string;
    get_warehouse: { warehouse_code: string; warehouse_name: string };
    district: string;
    street: string;
    landmark: string;
    town: string;
    owner_name: string;
    latitude: string;
    longitude: string;
    creditday: string;
    payment_type: string;
    buyertype: string;
    credit_limit: string;
    outlet_channel: {
        outlet_channel: string;
        outlet_channel_code: string;
    };
    region: { region_code: string; region_name: string };
    customertype: { name: string; code: string };
    route: { route_name: string; route_code: string };
    category: {
        customer_category_name: string;
        customer_category_code: string;
    };
    subcategory: {
        customer_sub_category_name: string;
        customer_sub_category_code: string;
    };
    status: number | string;
}

const tabs = ["Overview", "Sales", "Market Return"];


export default function CustomerDetails() {
    const router = useRouter(); 
      const [selectedRow, setSelectedRow] = useState<TableDataType | null>(null);
    const [showDrawer, setShowDrawer] = useState(false);
      const [selectedReturnRow, setSelectedReturnRow] = useState<TableDataType | null>(null);
    const [showReturnDrawer, setShowReturnDrawer] = useState(false);
    
    const [threeDotLoading, setThreeDotLoading] = useState<{ pdf: boolean; xlsx: boolean; csv: boolean }>({ pdf: false, xlsx: false, csv: false });
    const [activeTab, setActiveTab] = useState("Overview");
    const [salesData, setSalesData] = useState<TableDataType[]>([]);
    const [returnData, setReturnData] = useState<TableDataType[]>([]);
    const onTabClick = (name: string) => {
        setActiveTab(name);
    };

    const params = useParams();
    let uuid: string = "";
    if (params?.uuid) {
        if (Array.isArray(params?.uuid)) {
            uuid = params?.uuid[0] || "";
        } else {
            uuid = params?.uuid as string;
        }
    }
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const [item, setItem] = useState<AgentCustomerDetails | null>(null);

    useEffect(() => {
        if (!uuid) return;

        let mounted = true;
        const fetchPlanogramImageDetails = async () => {
            setLoading(true);
            try {
                const res = await agentCustomerById(uuid);
                if (!mounted) return;
                if (res?.error) {
                    showSnackbar(
                        res?.data?.message ||
                        "Unable to fetch Agent Customer Details",
                        "error"
                    );
                    return;
                }
                setItem(res.data);
            } catch (err) {
                if (mounted) {
                    showSnackbar(
                        "Unable to fetch Agent Customer Details",
                        "error"
                    );
                    console.error(err);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchPlanogramImageDetails();
        return () => {
            mounted = false;
        };
    }, []);
    const IconComponentData2 = ({ row }: { row: TableDataType }) => {
        const [smallLoading, setSmallLoading] = useState(false)
        const { showSnackbar } = useSnackbar();

        const exportOrderFile = async (uuid: string, format: string) => {
            try {
                setSmallLoading(true)
                const response = await exportOrderInvoice({ uuid, format }); // send proper body object

                if (response && typeof response === "object" && response.download_url) {
                    await downloadFile(response.download_url);
                    showSnackbar("File downloaded successfully", "success");
                    setSmallLoading(false)


                } else {
                    showSnackbar("Failed to get download URL", "error");
                    setSmallLoading(false)

                }
            } catch (error) {
                console.error(error);
                showSnackbar("Failed to download data", "error");
                setSmallLoading(false)

            }
        };

        return (smallLoading ? <Skeleton /> : <div className="cursor-pointer" onClick={() => {
            exportOrderFile(row.uuid, "csv"); // or "excel", "csv" etc.

        }}><Icon icon="material-symbols:download" /></div>)
    }





    const salesColumns: configType["columns"] = [
        { key: "invoice_code", label: "Invoice Code" , render: (row: TableDataType) => <div className="cursor-pointer hover:text-red-500" onClick={() => {
               setSelectedRow(row);
               setShowDrawer(true);
           }}>{row.invoice_code || "-"}</div> 
        },
        { key: "invoice_date", label: "Date", render: (row: TableDataType) => formatDate(row.invoice_date) },
        { key: "invoice_time", label: "Time" },
       
        {
            key: "salesman_name",
            label: "Sales Team"
        },
        {
            key: "warehouse_name",
            label: "Distributor"
        },
        {
            key: "route_name",
            label: "Route"
        },
        { key: "total_amount", label: "Invoice Total", render: (row: TableDataType) => toInternationalNumber(row.total_amount) },
        // {
        //     key: "action", label: "Action", sticky: "right", render: (row: TableDataType) => {
        //         return (<ExportDownloadButton row={row} />)
        //     }
        // },
        // rowActions: [
        //         {
        //             icon: threeDotLoading.pdf ? "eos-icons:three-dots-loading" : "material-symbols:download",
        //             onClick: (data: TableDataType) => {
        //                 exportFile(data.uuid, "pdf");
        //             },
        //         }
        //     ],
    ];

    const returnColumns: configType["columns"] = [
        { key: "osa_code", label: "Code", showByDefault: true, render: (row: TableDataType) => (
            <span className="cursor-pointer hover:text-red-500" onClick={e => {
                e.stopPropagation();
                setSelectedReturnRow(row);
                setShowReturnDrawer(true);
            }}>{row.osa_code || "-"}</span>
        ) },
        // { key: "osa_code", label: "Code", showByDefault: true },
        { key: "order_code", label: "Order Code", showByDefault: true },
        { key: "delivery_code", label: "Delivery Code", showByDefault: true },
        {
            key: "warehouse_code", label: "Distributor", showByDefault: true, render: (row: TableDataType) => {
                const code = row.warehouse_code || "";
                const name = row.warehouse_name || "";
                return `${code}${code && name ? " - " : ""}${name}`;
            }
        },
        {
            key: "route_code", label: "Route", showByDefault: true, render: (row: TableDataType) => {
                const code = row.route_code || "";
                const name = row.route_name || "";
                return `${code}${code && name ? " - " : ""}${name}`;
            }
        },
        // {
        //     key: "customer_code", label: "Customer", showByDefault: true, render: (row: TableDataType) => {
        //         const code = row.customer_code || "";
        //         const name = row.customer_name || "";
        //         return `${code}${code && name ? " - " : ""}${name}`;
        //     }
        // },
        {
            key: "salesman_code", label: "Sales Team", showByDefault: true, render: (row: TableDataType) => {
                const code = row.salesman_code || "";
                const name = row.salesman_name || "";
                return `${code}${code && name ? " - " : "-"}${name}`;
            }
        },
        { key: "total", label: "Amount", showByDefault: true },


    ];

    const returnByAgentCustomer = useCallback(
        async (
            pageNo: number = 1,
            pageSize: number = 50
        ): Promise<searchReturnType> => {

            const result = await getAgentCustomerByReturnId(uuid, { from_date: "", to_date: "" });
            if (result.error) {
                throw new Error(result.data?.message || "Search failed");
            }
            setReturnData(result.data || []);
            return {
                data: result.data || [],
                currentPage: result?.pagination?.page || 1,
                pageSize: result?.pagination?.limit || pageSize,
                total: result?.pagination?.totalPages || 1,
            };
        },
        []
    );

    const filterBy = useCallback(
        async (
            payload: Record<string, string | number | null>,
            pageSize: number
        ): Promise<listReturnType> => {
            let result;
            setLoading(true);
            try {
                const params: Record<string, string> = {};
                Object.keys(payload || {}).forEach((k) => {
                    const v = payload[k as keyof typeof payload];
                    if (v !== null && typeof v !== "undefined" && String(v) !== "") {
                        params[k] = String(v);
                    }
                });
                result = await getAgentCustomerByReturnId(uuid, { from_date: "", to_date: "" });
            } finally {
                setLoading(false);
            }

            if (result?.error) throw new Error(result.data?.message || "Filter failed");
            else {
                const pagination = result.pagination?.pagination || result.pagination || {};
                return {
                    data: result.data || [],
                    total: pagination.totalPages || result.pagination?.totalPages || 0,
                    totalRecords: pagination.totalRecords || result.pagination?.totalRecords || 0,
                    currentPage: pagination.current_page || result.pagination?.currentPage || 0,
                    pageSize: pagination.limit || pageSize,
                };
            }
        },
        [setLoading]
    );

    const searchInvoices = useCallback(async (): Promise<searchReturnType> => {
        try {
            setLoading(true);
            return {
                data: [],
                currentPage: 1,
                pageSize: 10,
                total: 0,
            };
        } finally {
            setLoading(false);
        }
    }, [setLoading]);

    const salesByAgentCustomer = useCallback(
        async (
            pageNo: number = 1,
            pageSize: number = 50
        ): Promise<searchReturnType> => {
            const result = await getAgentCustomerBySalesId(uuid, { from_date: "", to_date: "" });
            if (result.error) {
                throw new Error(result.data?.message || "Search failed");
            }
            setSalesData(result.data || []);
            return {
                data: result.data || [],
                currentPage: result?.pagination?.page || 1,
                pageSize: result?.pagination?.limit || pageSize,
                total: result?.pagination?.totalPages || 1,
            };
        },
        []
    );

    const exportReturnFile = async (uuid: string, format: string) => {
        try {
            setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
            const response = await agentCustomerReturnExport({ uuid, format, from_date: params?.start_date, to_date: params?.end_date }); // send proper body object
            if (response && typeof response === "object" && response.download_url) {
                await downloadFile(response.download_url);
                showSnackbar("File downloaded successfully", "success");
            } else {
                showSnackbar("Failed to get download URL", "error");
            }
        } catch (error) {
            console.error(error);
            showSnackbar("Failed to download data", "error");
        } finally {
            setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
        }
    };
    const allInvoices = async (uuid: string, format: string) => {
        try {
            setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
            const response = await exportAllInvoices(uuid, { from_date: params?.start_date, to_date: params?.end_date }); // send proper body object
            if (response && typeof response === "object" && response.download_url) {
                await downloadFile(response.download_url);
                showSnackbar("File downloaded successfully", "success");
            } else {
                showSnackbar("Failed to get download URL", "error");
            }
        } catch (error) {
            console.error(error);
            showSnackbar("Failed to download data", "error");
        } finally {
            setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
        }
    };

    const exportFile = async (uuid: string, format: string,invoiceCode : string) => {
        try {
            // setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
            const response = await exportInvoice({ uuid, format }); // send proper body object
            if (response && typeof response === "object" && response.download_url) {
                await downloadPDFGlobal(response.download_url, `Invoice - ${invoiceCode}` );
                // await downloadFile(response.download_url);
                showSnackbar("File downloaded successfully", "success");
            } else {
                showSnackbar("Failed to get download URL", "error");
            }
        } catch (error) {
            console.error(error);
            showSnackbar("Failed to download data", "error");
        } finally {
            // setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
        }
    };

    const filterBySales = useCallback(
        async (
            payload: Record<string, string | number | null>,
            pageSize: number
        ): Promise<listReturnType> => {
            let result;
            setLoading(true);
            try {
                const params: Record<string, string> = { per_page: pageSize.toString() };
                Object.keys(payload || {}).forEach((k) => {
                    const v = payload[k as keyof typeof payload];
                    if (v !== null && typeof v !== "undefined" && String(v) !== "") {
                        params[k] = String(v);
                    }
                });
                result = await getAgentCustomerBySalesId(uuid, { to_date: params?.from_date, from_date: params?.to_date });
            } finally {
                setLoading(false);
            }

            if (result?.error) throw new Error(result.data?.message || "Filter failed");
            else {
                const pagination = result.pagination?.pagination || result.pagination || {};
                return {
                    data: result.data || [],
                    total: pagination.totalPages || result.pagination?.totalPages || 0,
                    totalRecords: pagination.totalRecords || result.pagination?.totalRecords || 0,
                    currentPage: pagination.page || result.pagination?.currentPage || 0,
                    pageSize: pagination.limit || pageSize,
                };
            }
        },
        [setLoading]
    );

    const filterByReturn = useCallback(
        async (
            payload: Record<string, string | number | null>,
            pageSize: number
        ): Promise<listReturnType> => {
            let result;
            setLoading(true);
            try {
                const params: Record<string, string> = { per_page: pageSize.toString() };
                Object.keys(payload || {}).forEach((k) => {
                    const v = payload[k as keyof typeof payload];
                    if (v !== null && typeof v !== "undefined" && String(v) !== "") {
                        params[k] = String(v);
                    }
                });
                result = await getAgentCustomerByReturnId(uuid, { to_date: params?.from_date, from_date: params?.to_date });
            } finally {
                setLoading(false);
            }

            if (result?.error) throw new Error(result.data?.message || "Filter failed");
            else {
                const pagination = result.pagination?.pagination || result.pagination || {};
                return {
                    data: result.data || [],
                    total: pagination.totalPages || result.pagination?.totalPages || 0,
                    totalRecords: pagination.totalRecords || result.pagination?.totalRecords || 0,
                    currentPage: pagination.page || result.pagination?.currentPage || 0,
                    pageSize: pagination.limit || pageSize,
                };
            }
        },
        [setLoading]
    );

    const exportReturn = async (uuid: string, return_code: string) => {
        try {
            // setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
            const response = await exportSpecificCustomerReturn({ uuid, format:"pdf" });
            if (response && typeof response === 'object' && response.download_url) {
                await downloadPDFGlobal(response.download_url, `Return - ${return_code}`);
                // await downloadFile(response.download_url);
                showSnackbar("File downloaded successfully", "success");
            } else {
                showSnackbar("Failed to get download URL", "error");
            }
        } catch (error) {
            showSnackbar("Failed to download vehicle data", "error");
        } finally {
            // setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
        }
    };

    return (
        <>
            {/* header */}
            <div className="flex items-center gap-4 mb-6">
                    <Link href="/fieldCustomer" back className="flex items-center gap-[16px] cursor-pointer">
                      <Icon icon="lucide:arrow-left" width={24} />
                    </Link>
                    <h1 className="text-xl font-semibold mb-1">Field Customer Details</h1>
                  </div>
            {/* <div className="flex justify-between items-center mb-[20px]">
                <Link href="/fieldCustomer" back className="flex items-center gap-[16px] cursor-pointer">
                    <Icon
                        icon="lucide:arrow-left"
                        width={24}
                    />
                </Link>
                    <h1 className="text-[20px] font-semibold text-[#181D27] flex items-center leading-[30px]">
                        Field Customer Details
                    </h1>
            </div> */}

            <ContainerCard className="w-full flex flex-col sm:flex-row items-center justify-between gap-[10px] md:gap-0">
                {/* profile details */}
                <div className="flex flex-col sm:flex-row items-center gap-[20px]">
                    <div className="w-[80px] h-[80px] flex justify-center items-center rounded-full bg-[#E9EAEB]">
                        <Icon
                            icon="gridicons:user"
                            width={40}
                            className="text-[#535862] scale-[1.5]"
                        />
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className="text-[20px] font-semibold text-[#181D27] mb-[10px]">
                            {item?.osa_code || ""} - {item?.name || "Customer Name"}
                        </h2>
                        <span className="flex items-center text-[#414651] text-[16px]">
                            <Icon
                                icon="mdi:location"
                                width={16}
                                className="text-[#EA0A2A] mr-[5px]"
                            />
                            <span>
                                {item?.district}
                            </span>
                            {/* <span className="flex justify-center p-[10px] sm:p-0 sm:inline-block mt-[10px] sm:mt-0 sm:ml-[10px]">
                                    <StatusBtn status="active" />
                                </span> */}
                        </span>
                    </div>
                </div>
                {/* action buttons */}
                <div className="flex items-center gap-[10px]">
                    <StatusBtn
                        isActive={item?.status ? true : false}
                    />
                </div>
            </ContainerCard>

            {/* tabs */}
            <ContainerCard
                className="w-full flex gap-[4px] overflow-x-auto"
                padding="5px"
            >
                {tabs.map((tab, index) => (
                    <div key={index}>
                        <TabBtn
                            label={tab}
                            isActive={activeTab === tab}
                            onClick={() => {
                                onTabClick(tab);
                            }}
                        />
                    </div>
                ))}
            </ContainerCard>
            {activeTab === "Overview" ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px]">
                    <Overview data={item} />
                    <Financial data={item} />
                    <Additional data={item} />
                    <Location data={item} />
                </div>
            ) : activeTab === "Location" ? (
                <Location data={item} />
            ) : activeTab === "Financial" ? (
                <Financial data={item} />
            ) : activeTab === "Additional" ? (
                <Additional data={item} />
            ) : activeTab === "Sales" ? (
                <ContainerCard >

                    <div className="flex flex-col h-full">
                        <Table
                            config={{
                                api: {

                                    list: salesByAgentCustomer,
                                    filterBy: filterBySales
                                },
                                header: {

                                    actions: [
                                        <ExportDropdownButton
                                            disabled={salesData?.length === 0}
                                            keyType="excel"
                                            threeDotLoading={threeDotLoading}
                                            exportReturnFile={allInvoices}
                                            uuid={uuid}
                                        />
                                    ],
                                    filterRenderer: (props) => (
                                        <FilterComponent
                                            currentMonth={true}
                                            {...props}
                                            onlyFilters={['from_date', 'to_date']}
                                        />
                                    ),

                                },
                                showNestedLoading: true,
                                footer: { nextPrevBtn: true, pagination: true },
                                columns: salesColumns,
                                table: {
                                    height: 500,
                                },
                                rowSelection: false,
                                rowActions: [
                                    {
                                        icon: "lucide:download",
                                        showLoading: true,
                                        onClick: (data: TableDataType) => 
                                            exportFile(data.uuid, "pdf",data.osa_code)
                                        
                                    }
                                ],
                                pageSize: 50,
                            }}
                        />
                    </div>

                </ContainerCard>

            ) : ""}


            {activeTab === "Market Return" ? (<ContainerCard >

                <div className="flex flex-col h-full w-full overflow-x-auto">
                    <Table
                        config={{
                            api: {

                                list: returnByAgentCustomer,
                                filterBy: filterByReturn

                            },
                            header: {
                                filterRenderer: (props) => (
                                    <FilterComponent
                                        currentMonth={true}
                                        {...props}
                                        onlyFilters={['from_date', 'to_date']}
                                    />
                                ),

                                actions: [
                                    <ExportDropdownButton
                                        disabled={returnData?.length === 0}
                                        keyType="excel"
                                        threeDotLoading={threeDotLoading}
                                        exportReturnFile={exportReturnFile}
                                        uuid={uuid}
                                    />
                                ],
                            },
                            footer: { nextPrevBtn: true, pagination: true },
                             rowActions: [
                                {
                                    icon:  "lucide:download",
                                    showLoading: true,
                                    onClick: (data: TableDataType) => 
                                        exportReturn(data.uuid,data.osa_code)
                                    
                                }
                            ],
                            columns: returnColumns,
                            table: {
                                height: 500,
                            },
                            rowSelection: false,
                           
                            pageSize: 50,
                        }}
                    />
                </div>

            </ContainerCard>) : ""}
             <Drawer anchor="right" open={showDrawer} onClose={() => { setShowDrawer(false) }} className="p-2" >
                      {selectedRow && <SideBarDetailPage title="Invoice" data={selectedRow} onClose={() => setShowDrawer(false)} />}
                    </Drawer>
                    {selectedReturnRow && (
             <Drawer anchor="right" open={showReturnDrawer} onClose={() => { setShowReturnDrawer(false) }} className="p-2" >
                      {selectedReturnRow && <SideBarDetailPage title="Return" data={selectedReturnRow} onClose={() => setShowReturnDrawer(false)} />}
                    </Drawer>
                    )}
        </>
    );
}
