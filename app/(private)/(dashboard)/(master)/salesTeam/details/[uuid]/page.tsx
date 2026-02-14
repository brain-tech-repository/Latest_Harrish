"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import FilterComponent from "@/app/components/filterComponent";
import ContainerCard from "@/app/components/containerCard";
import TabBtn from "@/app/components/tabBtn";
import { useSnackbar } from "@/app/services/snackbarContext";
import Image from "next/image";
import {  downloadPDFGlobal } from '@/app/services/allApi';
import { iframeDownload } from "@/app/utils/iframeDownload";
import { downloadFile, getOrderOfSalesmen, getSalesmanById, getSalesmanBySalesId, salesmanAttendence, salesmanAllInvoiceExport} from "@/app/services/allApi";
import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import Link from "@/app/components/smartLink";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import Table, { configType, listReturnType, searchReturnType, TableDataType } from "@/app/components/customTable";
import KeyValueData from "@/app/components/keyValueData";
import StatusBtn from "@/app/components/statusBtn2";
import { exportInvoice, exportOrderInvoice } from "@/app/services/agentTransaction";
import { useLoading } from "@/app/services/loadingContext";
import Skeleton from "@mui/material/Skeleton";
import ExportDropdownButton from "@/app/components/ExportDropdownButton";
import ImageThumbnail from "@/app/components/ImageThumbnail";
import Map from "@/app/components/map";
import {SideBarDetailPage} from "@/app/components/sideDrawer";
import Drawer from "@mui/material/Drawer";
interface Salesman {
  id?: string | number;
  uuid?: string;
  osa_code?: string;
  name?: string;
  vehicle_chesis_no?: string;

  salesman_type?: {
    id?: number;
    salesman_type_code?: string;
    salesman_type_name?: string;
  };
  project_type?: {
    "id": number,
    "code": string,
    "name": string
  };
  designation?: string;
  route?: {
    id?: number;
    route_code?: string;
    route_name?: string;
  };
  warehouse?: {
    id?: number;
    warehouse_code?: string;
    warehouse_name?: string;
  };
  warehouses?: {
    warehouse_code?: string;
    warehouse_name?: string;
  }[];
  device_no?: string;
  username?: string;
  contact_no?: string;
  status?: string | number;
  image_url?: string | null;
  description?: string | null;
  is_block?: string | number;
  block_date_from?: string;
  block_date_to?: string;
  cashier_description_block?: string;
  invoice_block?: string | number;
  reason?: string;
  forceful_login?: string | number;
}

const IconComponentData = ({ row , code }: { row: TableDataType, code: string }) => {
  const [smallLoading, setSmallLoading] = useState(false)
  const { showSnackbar } = useSnackbar();
  
  const [salesData, setSalesData] = useState<any[]>([]);
  const exportFile = async (uuid: string, format: string) => {
    try {
      setSmallLoading(true)

      const response = await exportInvoice({ uuid, format }); // send proper body object

      if (response && typeof response === "object" && response.download_url) {
        await downloadPDFGlobal(response.download_url, `Invoice - ${code}.pdf`);
        iframeDownload(
          response.download_url
        )
        // await downloadFile(response.download_url);
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
    exportFile(row.uuid, "pdf"); // or "excel", "csv" etc.

  }}><Icon icon="material-symbols:download" /></div>)
}

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
    exportOrderFile(row.uuid, "pdf"); // or "excel", "csv" etc.

  }}><Icon icon="material-symbols:download" /></div>)
}


export function formatDate(dateString: string) {
  const date = new Date(dateString);

  const day = date.getUTCDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
}

export default function Page() {
    const [selectedRow, setSelectedRow] = useState<TableDataType | null>(null);
    const [showDrawer, setShowDrawer] = useState(false);
  const { id, tabName }: any = useParams();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [threeDotLoading, setThreeDotLoading] = useState<{ csv: boolean; xlsx: boolean }>({ csv: false, xlsx: false });
  const { setLoading: setGlobalLoading } = useLoading();
  const [openPopup, setOpenPopup] = useState(false);
  const [smallLoading, setSmallLoading] = useState(false)

  const { showSnackbar } = useSnackbar();
  // const onTabClick = (index: number) => {
  //   setActiveTab(index);
  // };
  const params = useParams();
  const uuid = Array.isArray(params?.uuid)
    ? params?.uuid[0] || ""
    : (params?.uuid as string) || "";
  const [salesman, setSalesman] = useState<Salesman | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any[]>([]);


  const title = "Sales Team Details";
  const backBtnUrl = "/salesTeam";


  const columns: configType["columns"] = [
     { key: "invoice_code", label: "Code", render: (row: TableDataType) => (
            <span className="cursor-pointer hover:text-red-500" onClick={e => {
                e.stopPropagation();
                setSelectedRow(row);
                setShowDrawer(true);
            }}>{row.invoice_code || "-"}</span>
        ) },
    { key: "invoice_date", label: "Date", render: (row: TableDataType) => row.invoice_date ? formatDate(row.invoice_date) : "-" },
    { key: "invoice_time", label: "Time" },
    {
      key: "customer_id",
      label: "Customer",

      render: (row: TableDataType | any) => {
        const customerObj = typeof row.customer_id === "object" &&
          row.customer_id !== null &&
          "warehouse_name" in row.customer_id
          ? row.customer_id
          : row.customer;

        if (customerObj?.osa_code && customerObj?.name) {
          return `${customerObj.osa_code} - ${customerObj.name}`;
        }
        return customerObj?.name || "-";
      },

      // API provides numeric customer_id plus nested customer object { id, osa_code, name }
      // render: (row: TableDataType | any) => row.customer?.osa_code || row.customer?.name || "-",
    },
    {
      key: "warehouse_id",
      label: "Distributor",
      // API provides numeric warehouse_id plus nested warehouse object { id, warehouse_code, warehouse_name }
      render: (row: TableDataType | any) => {
        const warehouseObj = typeof row.warehouse_id === "object" &&
          row.warehouse_id !== null &&
          "osa_code" in row.warehouse_id
          ? row.warehouse_id
          : row.warehouse;

        if (warehouseObj?.warehouse_code && warehouseObj?.warehouse_name) {
          return `${warehouseObj.warehouse_code} - ${warehouseObj.warehouse_name}`;
        }
        return warehouseObj?.warehouse_name || "-";
      },
    },
    {
      key: "route_id",
      label: "Route",
      // API provides numeric route_id plus nested route object { id, route_code, route_name }
      render: (row: TableDataType | any) => {
        const routeObj = typeof row.route_id === "object" &&
          row.route_id !== null &&
          "warehouse_name" in row.route_id
          ? row.route_id
          : row.route;

        if (routeObj?.route_code && routeObj?.route_name) {
          return `${routeObj.route_code} - ${routeObj.route_name}`;
        }
        return routeObj?.route_name || "-";
      },
    },
    { key: "total_amount", label: "Invoice Total", render: (row: TableDataType) => toInternationalNumber(row.total_amount) },
    // {
    //   key: "action", label: "Action", sticky: "right", render: (row: TableDataType) => {


    //     return (<IconComponentData row={row} code={row.invoice_code} />)
    //   }
    // },


  ];
  const attendenceColumns: configType["columns"] = [
    { key: "attendance_date", label: "Date", render: (row: TableDataType) => row.attendance_date ? formatDate(row.attendance_date) : "-" },
    {
      key: "salesman_type",
      label: "Sales Team Type",
      // render: (row: TableDataType) => (row as any).invoice_number || (row as any).invoice_code || "-"
    },

    {
      key: "warehouse_code,warehouse_name",
      label: "Distributor",
      // API provides numeric warehouse_id plus nested warehouse object { id, warehouse_code, warehouse_name }
      render: (row: TableDataType | any) => {
        return `${row.warehouse_code} - ${row.warehouse_name}` || "-";
      },
    },
    {
      key: "route_code,route_name",
      label: "Route",
      // API provides numeric warehouse_id plus nested warehouse object { id, warehouse_code, warehouse_name }
      render: (row: TableDataType | any) => {
        return `${row.route_code} - ${row.route_name}` || "-";
      },
    },

    {
      key: "time_in", label: "Time In", render: (row: TableDataType) => {
        if (!row.time_in) return "-";
        // If value is like '2025-10-25 09:00:00', extract time part
        const match = String(row.time_in).match(/\b(\d{2}:\d{2}:\d{2})\b/);
        return match ? match[1] : row.time_in;
      }
    },
    {
      key: "in_img", label: "Time In Image", render: (row: TableDataType) => {
        const file = `https://api.coreexl.com/osa_developmentV2/public/storage/${row.in_img}`;
        if (!file) return "-";
        return (
          <ImageThumbnail
            src={file as any}
            alt={(file as any)?.name || "Time In Image"}
            height={60}
            width={120}
            className="rounded-md"
          // baseUrl could be provided here if required in your environment
          />
        );
      },
    },
    {
      key: "attendance_latitude_in,attendance_longitude_in", label: "Attendence In Location", render: (row: TableDataType) => {
        return (
          <Map
            latitude={row.attendance_latitude_in}
            longitude={row.attendance_longitude_in}
            height={70}
            width={125}
            onClick={true}
          />
        );
      },
    },
    {
      key: "time_out", label: "Time Out", render: (row: TableDataType) => {
        if (!row.time_out) return "-";
        // If value is like '2025-10-25 09:00:00', extract time part
        const match = String(row.time_out).match(/\b(\d{2}:\d{2}:\d{2})\b/);
        return match ? match[1] : row.time_out;
      }
    },
    {
      key: "out_img", label: "Time Out Image", render: (row: TableDataType) => {
        const file = `https://api.coreexl.com/osa_developmentV2/public/storage/${row.out_img}`;
        if (!file) return "-";
        return (
          <ImageThumbnail
            src={file as any}
            alt={(file as any)?.name || "Time Out Image"}
            height={60}
            width={120}
            className="rounded-md"
          // baseUrl could be provided here if required in your environment
          />
        );
      },
    },

    {
      key: "attendance_latitude_out,attendance_longitude_out", label: "Attendence Out Location", render: (row: TableDataType) => {
        return (
          <Map
            latitude={row.attendance_latitude_out}
            longitude={row.attendance_longitude_out}
            height={70}
            width={125}
            onClick={true}
          />
        );
      },
    },



  ];
  const warehouseColumns: configType["columns"] = [
    {
      key: "warehouse_code",
      label: "Distributors",
      render: (row: TableDataType) => `${row.warehouse_code}-${row.warehouse_name}` || "-",
    }]

  const orderColumns: configType["columns"] = [
    {
      key: "delivery_date",
      label: "Delivery Date",
      render: (row: TableDataType) => row.delivery_date ? formatDate(row.delivery_date) : "-",
    },
    {
      key: "order_code",
      label: "Order Code",
      render: (row: TableDataType) => row.order_code || "-",
    },
    {
      key: "warehouse_id",
      label: "Distributor",
      render: (row: TableDataType | any) =>
        typeof row.warehouse_id === "object" &&
          row.warehouse_id !== null &&
          "warehouse_name" in row.warehouse_id
          ? (row.warehouse_id as { warehouse_name?: string }).warehouse_name || "-"
          : row.warehouse?.warehouse_name || "-",
    },
    {
      key: "customer_id",
      label: "Customer",
      render: (row: TableDataType | any) =>
        typeof row.customer_id === "object" &&
          row.customer_id !== null &&
          "name" in row.customer_id
          ? (row.customer_id as { name?: string }).name || "-"
          : row.customer?.name || "-",
    },
    {
      key: "salesman_id",
      label: "Sales Team",
      render: (row: TableDataType | any) =>
        typeof row.salesman_id === "object" &&
          row.salesman_id !== null &&
          "name" in row.salesman_id
          ? (row.salesman_id as { name?: string }).name || "-"
          : row.salesman?.name || "-",
    },
    {
      key: "route_id",
      label: "Route",
      render: (row: TableDataType) => {
        if (
          typeof row.route_id === "object" &&
          row.route_id !== null &&
          "route_name" in row.route_id
        ) {
          return (row.route_id as { route_name?: string }).route_name || "-";
        }
        return typeof row.route_id === "string" ? row.route_id : "-";
      },
    },
    {
      key: "gross_total",
      label: "Gross Total",
      render: (row: TableDataType) =>
        toInternationalNumber ? toInternationalNumber(row.gross_total) : row.gross_total,
    },
    {
      key: "net_amount",
      label: "Net Amount",
      render: (row: TableDataType) =>
        toInternationalNumber ? toInternationalNumber(row.net_amount) : row.net_amount,
    },
    {
      key: "status",
      label: "Status",
      render: (row: TableDataType) =>
        row.status === "1" ? (
          <span className="text-green-600 font-semibold">Active</span>
        ) : (
          <span className="text-red-600 font-semibold">Inactive</span>
        ),
    },
    {
      key: "action", label: "Action", sticky: "right", render: (row: TableDataType) => {


        return (<IconComponentData2 row={row} />)
      }
    }

    // Optional: download icon column
    // {
    //   key: "download",
    //   label: "Download",
    //   render: (row: TableDataType) => (
    //     <Icon
    //       icon="material-symbols:download"
    //       width={24}
    //       onClick={() => exportFile(row.uuid, "csv")}
    //       className="cursor-pointer text-blue-600 hover:text-blue-800"
    //     />
    //   ),
    // },
  ];



  const salesBySalesman = useCallback(
    async (
      pageNo: number = 1,
      pageSize: number = 50
    ): Promise<searchReturnType> => {

      const result = await getSalesmanBySalesId(uuid);
      if (result.error) {
        throw new Error(result.data?.message || "Search failed");
      }
      setSalesData(result.data);
      return {
        data: result.data || [],
        currentPage: result?.pagination?.page || 1,
        pageSize: result?.pagination?.limit || pageSize,
        total: result?.pagination?.totalPages || 1,
      };
    },
    []
  );

  const orderBySalesman = useCallback(
    async (
      pageNo: number = 1,
      pageSize: number = 50
    ): Promise<searchReturnType> => {
      const result = await getOrderOfSalesmen(uuid);
      if (result.error) {
        throw new Error(result.data?.message || "Search failed");
      }
      setOrderData(result.data || []);
      return {
        data: result.data || [],
        currentPage: result?.pagination?.page || 1,
        pageSize: result?.pagination?.limit || pageSize,
        total: result?.pagination?.totalPages || 1,
      };
    },
    []
  );





  useEffect(() => {
    if (!uuid) return;

    const fetchSalesmanDetails = async () => {
      setGlobalLoading(true);
      setLoading(true);
      try {
        const res = await getSalesmanById(uuid);
        if (res.error) {
          showSnackbar(
            res.data?.message || "Unable to fetch Sales Team Details",
            "error"
          );
          return;
        }
        setSalesman(res.data);
        setGlobalLoading(false);
      } catch (error) {
        showSnackbar("Unable to fetch Sales Team Details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchSalesmanDetails();
  }, [uuid, setLoading, showSnackbar]);

  const onTabClick = (idx: number) => {
    // ensure index is within range and set the corresponding tab key
    if (typeof idx !== "number") return;
    if (typeof tabList === "undefined" || idx < 0 || idx >= tabList.length) return;
    setActiveTab(tabList[idx].key);
  };


  const [activeTab, setActiveTab] = useState("overview");
  const tabList = [
    { key: "overview", label: "Overview" },
    { key: "attendence", label: "Attendance" },
    { key: "sales", label: "Sales" },
    // { key: "order", label: "Purchase Order" },
  ];

  const filterBy = useCallback(
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
        result = await getOrderOfSalesmen(uuid, { from_date: params?.from_date, to_date: params?.to_date });
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
          currentPage: pagination.page || result.pagination?.page || 0,
          pageSize: pagination.limit || pageSize,
        };
      }
    },
    [setLoading]
  );

  const filterBySalesmen = useCallback(
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
        result = await getSalesmanBySalesId(uuid, { from_date: params?.from_date, to_date: params?.to_date });
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
  const filterByAttendence = useCallback(
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
        result = await salesmanAttendence({ salesman_uuid: uuid, from_date: params?.from_date, to_date: params?.to_date });
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

  const salesmanAttendenceById = useCallback(
    async (
      pageNo: number = 1,
      pageSize: number = 50
    ): Promise<searchReturnType> => {
      const result = await salesmanAttendence({ salesman_uuid: uuid, from_date: params?.start_date, to_date: params?.end_date, page: pageNo.toString() });
      if (result.error) {
        throw new Error(result.data?.message || "Search failed");
      }

      return {
        data: result.data || [],
        currentPage: result?.pagination?.page || 1,
        pageSize: result?.pagination?.limit || pageSize,
        total: result?.pagination?.totalPages || 1,
      };
    },
    []
  );
  // useEffect(() => {
  //   if (!tabName) {
  //     setActiveTab(0); // default tab
  //   } else {
  //     const foundIndex = tabs.findIndex((tab) => tab.url === tabName);
  //     setActiveTab(foundIndex !== -1 ? foundIndex : 0);
  //   }
  // }, [tabName]);
  const viewPopuop = () => {
    setOpenPopup(true);
  }

  const exportReturnFile = async (uuid: string, format: string) => {
    try {
        setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
        const response = await salesmanAllInvoiceExport(uuid, { format }); // send proper body object
        if (response && typeof response === "object" && response.data.download_url) {
            await downloadFile(response.data.download_url);
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

    const exportFile = async (uuid: string, format: string,code:string) => {
    try {
      setSmallLoading(true)

      const response = await exportInvoice({ uuid, format }); // send proper body object

      if (response && typeof response === "object" && response.download_url) {
        await downloadPDFGlobal(response.download_url, `Invoice - ${code}`);
        iframeDownload(
          response.download_url
        )
        // await downloadFile(response.download_url);
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

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link href={backBtnUrl} back>
          <Icon icon="lucide:arrow-left" width={24} />
        </Link>
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
      </div>
      {/* Image */}
      <ContainerCard className="w-full flex flex-col sm:flex-row items-center justify-between gap-[10px] md:gap-0">
        {/* profile details */}
        <div className="flex flex-col sm:flex-row items-center gap-[20px]">
          <div className=" flex justify-center items-center rounded-full bg-[#E9EAEB]">
            <Image
              src={"/dummyuser.webp"}
              alt="salesman Logo"
              width={150}
              height={150}
              className="h-[100px] w-[100px] object-cover rounded-full]"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-[20px] font-semibold text-[#181D27] mb-[10px]">
              {salesman?.osa_code || "-"} - {salesman?.name}
            </h2>
            <span className="flex items-center">
              <span className="text-[#414651] text-[16px]">
                <span className="flex justify-center p-[10px] sm:p-0 sm:inline-block mt-[10px] sm:mt-0 sm:ml-[10px]"></span>
              </span>
            </span>
          </div>
        </div>


        <StatusBtn
          isActive={
            salesman?.status == 1 || salesman?.status === "1" ? true : false
          }
        />
      </ContainerCard>

      {/* Tabs */}
      <ContainerCard
        className="w-full flex gap-[4px] overflow-x-auto"
        padding="5px"
      >
        {tabList.map((tab, index) => (
          <div key={index}>
            <TabBtn
              label={tab.label}
              isActive={activeTab === tab.key} // active state color logic
              onClick={() => onTabClick(index)}
            />
          </div>
        ))}
      </ContainerCard>

      {activeTab === "overview" && (
        <ContainerCard className="w-full h-fit">
          <KeyValueData
            title="Sales Team Information"
            data={salesman?.invoice_block === 1 ? salesman?.is_block === 1 ? [
              {
                key: "Sales Team Type",
                value: salesman?.salesman_type?.salesman_type_name || "-",
              },
              {
                key: "Project Type",
                value: salesman?.project_type
                  ? `${salesman.project_type.code ?? "-"} - ${salesman.project_type.name ?? "-"}`
                  : "-"
              },
              { key: "Designation", value: salesman?.designation || "-" },
              { key: "Contact No", value: salesman?.contact_no == '0' ? "-" : salesman?.contact_no || "-" },
              {
                key: "Distributor",
                value: <span className="hover:text-red-500 cursor-pointer">View Distributors</span>,
                onClick: viewPopuop
              },
              {
                key: "Route",
                value: salesman?.route?.route_name || "-",
              },
              { key: "User Name", value: salesman?.osa_code || "-" },
              {
                key: "Forcefull Login",
                value:

                  salesman?.forceful_login === "1"
                    ? "Yes"
                    : "No",
              },
              {
                key: "Is Block",
                value:
                  salesman?.is_block === 1
                    ? "Yes"
                    : "No",
              },
              { key: "Block Date From", value: salesman?.block_date_from ? formatDate(salesman?.block_date_from) : "-" },
              { key: "Block Date To", value: salesman?.block_date_to ? formatDate(salesman?.block_date_to) : "-" },
              { key: "cashier Description Block", value: salesman?.cashier_description_block == "1" ? "Yes" : "No" },
              {
                key: "Invoice Block",
                value:

                  salesman?.invoice_block === 1
                    ? "Yes"
                    : "No",
              },

              {
                key: "Reason",
                value: salesman?.reason || "-",
              },
            ] : [
              {
                key: "Sales Team Type",
                value: salesman?.salesman_type?.salesman_type_name || "-",
              },
              {
                key: "Project Type",
                value: salesman?.project_type
                  ? `${salesman.project_type.code ?? "-"} - ${salesman.project_type.name ?? "-"}`
                  : "-"
              },
              { key: "Designation", value: salesman?.designation || "-" },
              { key: "Contact No", value: salesman?.contact_no || "-" },
              {
                key: "Distributor",
                value: <span className="hover:text-red-500 cursor-pointer">View Distributors</span>,
                onClick: viewPopuop
              },
              {
                key: "Route",
                value: salesman?.route?.route_name || "-",
              },
              { key: "User Name", value: salesman?.osa_code || "-" },
              {
                key: "Forcefull Login",
                value:

                  salesman?.forceful_login === "1"
                    ? "Yes"
                    : "No",
              },
              {
                key: "Is Block",
                value:
                  salesman?.is_block === 1
                    ? "Yes"
                    : "No",
              },
              { key: "cashier Description Block", value: salesman?.cashier_description_block == "1" ? "Yes" : "No" },
              {
                key: "Invoice Block",
                value:

                  salesman?.invoice_block === 1
                    ? "Yes"
                    : "No",
              },

              {
                key: "Reason",
                value: salesman?.reason || "-",
              },
            ] : salesman?.is_block === 1 ? [
              {
                key: "Sales Team Type",
                value: salesman?.salesman_type?.salesman_type_name || "-",
              },
              {
                key: "Project Type",
                value: salesman?.project_type
                  ? `${salesman.project_type.code ?? "-"} - ${salesman.project_type.name ?? "-"}`
                  : "-"
              },
              { key: "Designation", value: salesman?.designation || "-" },
              { key: "Contact No", value: salesman?.contact_no || "-" },
              {
                key: "Distributor",
                value: <span className="hover:text-red-500 cursor-pointer">View Distributors</span>,
                onClick: viewPopuop
              },
              {
                key: "Route",
                value: salesman?.route?.route_name || "-",
              },
              { key: "User Name", value: salesman?.osa_code || "-" },
              {
                key: "Forcefull Login",
                value:

                  salesman?.forceful_login === "1"
                    ? "Yes"
                    : "No",
              },
              {
                key: "Is Block",
                value:
                  salesman?.is_block === 1
                    ? "Yes"
                    : "No",
              },
              { key: "Block Date From", value: salesman?.block_date_from ? formatDate(salesman?.block_date_from) : "-" },
              { key: "Block Date To", value: salesman?.block_date_to ? formatDate(salesman?.block_date_to) : "-" },
              { key: "cashier Description Block", value: salesman?.cashier_description_block == "1" ? "Yes" : "No" },
              {
                key: "Invoice Block",
                value:

                  salesman?.invoice_block === 1
                    ? "Yes"
                    : "No",
              }
            ] : [
              {
                key: "Sales Team Type",
                value: salesman?.salesman_type?.salesman_type_name || "-",
              },
              {
                key: "Project Type",
                value: salesman?.project_type
                  ? `${salesman.project_type.code ?? "-"} - ${salesman.project_type.name ?? "-"}`
                  : "-"
              },
              { key: "Designation", value: salesman?.designation || "-" },
              { key: "Contact No", value: salesman?.contact_no || "-" },
              {
                key: "Distributor",
                value: <span className="hover:text-red-500 cursor-pointer">View Distributors</span>,
                onClick: viewPopuop
              },
              {
                key: "Route",
                value: salesman?.route?.route_name || "-",
              },
              { key: "User Name", value: salesman?.osa_code || "-" },
              {
                key: "Forcefull Login",
                value:

                  salesman?.forceful_login === "1"
                    ? "Yes"
                    : "No",
              },
              {
                key: "Is Block",
                value:
                  salesman?.is_block === 1
                    ? "Yes"
                    : "No",
              },
              { key: "cashier Description Block", value: salesman?.cashier_description_block == "1" ? "Yes" : "No" },
              {
                key: "Invoice Block",
                value:

                  salesman?.invoice_block === 1
                    ? "Yes"
                    : "No",
              }
            ]}
          />
        </ContainerCard>
      )}

      {activeTab === "attendence" && (
        <ContainerCard >

          <div className="flex flex-col h-full">
            <Table
              config={{
                api: {
                  // search: searchCustomerById,
                  list: salesmanAttendenceById,
                  filterBy: filterByAttendence
                },
                header: {
                  searchBar: false,
                  filterRenderer: (props) => (
                    <FilterComponent
                      currentMonth={true}
                      {...props}
                      onlyFilters={['from_date', 'to_date']}
                    />
                  ),
                  actions: [
                    <ExportDropdownButton
                      // disabled={returnData?.length === 0}
                      keyType="excel"
                      threeDotLoading={threeDotLoading}
                      exportReturnFile={exportReturnFile}
                      uuid={uuid}
                    />
                  ],
                  // filterByFields: [
                  //   {
                  //     key: "start_date",
                  //     label: "Start Date",
                  //     type: "date"
                  //   },
                  //   {
                  //     key: "end_date",
                  //     label: "End Date",
                  //     type: "date"
                  //   }
                  // ]
                },
                showNestedLoading: true,
                footer: { nextPrevBtn: true, pagination: true },
                columns: attendenceColumns,
                table: {
                  height: 500,
                },
                rowSelection: false,

                pageSize: 50,
              }}

            />
          </div>

        </ContainerCard>
      )}

      {activeTab === "sales" && (
        <ContainerCard >

          <div className="flex flex-col h-full">
            <Table
              config={{
                api: {
                  // search: searchCustomerById,
                  list: salesBySalesman,
                  filterBy: filterBySalesmen
                },
                header: {
                  searchBar: false,
                  filterRenderer: (props) => (
                    <FilterComponent
                      currentMonth={true}
                      {...props}
                      onlyFilters={['from_date', 'to_date']}
                    />
                  ),
                  actions: [
                    <ExportDropdownButton
                      disabled={salesData?.length === 0}
                      keyType="excel"
                      threeDotLoading={threeDotLoading}
                      exportReturnFile={exportReturnFile}
                      uuid={uuid}
                    />
                  ],
                },
                showNestedLoading: true,
                footer: { nextPrevBtn: true, pagination: true },
                columns: columns,
                table: {
                  height: 500,
                },
                rowActions: [
                  {
                    icon: 'material-symbols:download',
                    showLoading: true,
                    onClick: (row: TableDataType) => exportFile(row.uuid, 'pdf',row.invoice_code),
                    
                  },
                ],
                rowSelection: false,

                pageSize: 50,
              }}

            />
          </div>

        </ContainerCard>
      )}

      {activeTab === "order" && (
        <ContainerCard >

          <div className="flex flex-col h-full">
            <Table
              config={{
                api: {
                  // search: searchCustomerById,
                  list: orderBySalesman,
                  filterBy: filterBy
                },
                header: {
                  searchBar: false,
                  filterRenderer: (props) => (
                    <FilterComponent
                      currentMonth={true}
                      {...props}
                      onlyFilters={['from_date', 'to_date']}
                    />
                  ),
                  actions: [
                    <ExportDropdownButton
                      disabled={orderData?.length === 0}
                      keyType="excel"
                      threeDotLoading={threeDotLoading}
                      exportReturnFile={exportReturnFile}
                      uuid={uuid}
                    />
                  ],
                },
                showNestedLoading: true,
                footer: { nextPrevBtn: true, pagination: true },
                columns: orderColumns,
                table: {
                  height: 500,
                },
                rowSelection: false,

                pageSize: 50,
              }}
              data={[]}
            />
          </div>

        </ContainerCard>
      )}

      <Drawer open={openPopup} anchor="right" onClose={() => { setOpenPopup(false); }} >
        <div className="flex flex-col h-full">
          <Table

            data={salesman?.warehouses || []}

            config={{
              table: { height: "100vh" },
              showNestedLoading: true,
              footer: { nextPrevBtn: true, pagination: true },
              columns: warehouseColumns,

              rowSelection: false,

              pageSize: 50,
            }}
          />
        </div>
      </Drawer>


      <br />

       <Drawer anchor="right" open={showDrawer} onClose={() => { setShowDrawer(false) }} className="p-2" >
                            {selectedRow && <SideBarDetailPage title="Invoice" data={selectedRow} onClose={() => setShowDrawer(false)} />}
                          </Drawer>
    </>
  );
}
