"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ContainerCard from "@/app/components/containerCard";
import TabBtn from "@/app/components/tabBtn";
import { useSnackbar } from "@/app/services/snackbarContext";
import { itemById, itemPurchase, itemSales, downloadFile, itemAllReturnExport, allItemInvoiceExport, downloadPDFGlobal, exportAllPO } from "@/app/services/allApi";
import { exportOrderInvoice, exportReturneWithDetails } from "@/app/services/agentTransaction";
import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import Link from "@/app/components/smartLink";
import KeyValueData from "@/app/components/keyValueData";
import StatusBtn from "@/app/components/statusBtn2";
import { useLoading } from "@/app/services/loadingContext";
import Table, { TableDataType, listReturnType } from "@/app/components/customTable";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import Image from "next/image";
import { tabList } from "./tablelist";
import FilterComponent from "@/app/components/filterComponent";
import ExportDropdownButton from "@/app/components/ExportDropdownButton";
import { formatDate } from "../../../salesTeam/details/[uuid]/page";
import { exportPurposeOrderViewPdf } from "@/app/services/companyTransaction";
import Drawer from "@mui/material/Drawer";
import { SideBarDetailPage } from "@/app/components/sideDrawer";
import { PageNotFoundError } from "next/dist/shared/lib/utils";
interface Item {
  id?: number;
  erp_code?: string;
  item_code?: string;
  name?: string;
  description?: string;
  brand?: { name: string };
  image?: string;
  shelf_life?: string;
  commodity_goods_code?: string;
  excise_duty_code?: string;
  status?: number;
  is_taxable?: boolean;
  has_excies?: boolean;
  item_weight?: string;
  volume?: number;
  item_category?: {
    id?: number;
    category_name?: string;
    code?: string;
  };
  item_sub_category?: {
    id?: number;
    name?: string;
    code?: string;
  };
  item_uoms: {
    id: number,
    item_id: number,
    name: string,
    uom_type: string,
    upc: string,
    uom_price: string,
    is_stock_keeping: boolean,
    enable_for: string,
    status: string,

    keeping_quantity: number,
    uom_id: number
  }[]
}

interface UOM {
  id: number;
  name: string;
  price: string;
  uom_type: string;
  upc: string | null;
  is_stock_keeping_unit: boolean;
  enable_for: string;
}

// export const tabList = [
//   { name: "Overview", key: "overview" },
//   { name: "UOM", key: "uom" },
//   { name: "Sales", key: "sales" },
//   { name: "Market Return", key: "return" }
// ];

export default function Page() {
  const [activeTab, setActiveTab] = useState("overview");
  const [returnData, setRetrunData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [itemId, setItemId] = useState<any>("");
  const [stDate,setStDate] = useState<string>("");
  const [endDate,setEndDate] = useState<string>("");
  // const { id, tabName } = useParams();
  const [selectedRow, setSelectedRow] = useState<TableDataType | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedPORow, setSelectedPORow] = useState<TableDataType | null>(null);
  const [showPODrawer, setShowPODrawer] = useState(false);
  const [threeDotLoading, setThreeDotLoading] = useState<{ csv: boolean; xlsx: boolean; pdf: boolean }>({ csv: false, xlsx: false, pdf: false });
  const params = useParams<{ uuid: string }>();
  const id = params?.uuid;

  const { setLoading } = useLoading();
  const [showNest,setShowNest]=useState(false);
  const [showNestReturn,setShowNestReturn]=useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const { showSnackbar } = useSnackbar();
  const [imageSrc, setImageSrc] = useState<string>("/no-image.png");

  useEffect(() => {
    if (!item || !item.image) return;

    try {
      const url = new URL(item.image || "");
      setImageSrc(url.href);
      return;
    } catch {
      setImageSrc("/no-image.png");
      return;
    }
  }, [item?.image]);

  const onTabClick = (idx: number) => {
    if (typeof idx !== "number") return;
    if (typeof tabList === "undefined" || idx < 0 || idx >= tabList.length) return;
    setActiveTab(tabList[idx].key);
  };

  const title = "Item Details";
  const backBtnUrl = "/item";

  useEffect(() => {
    if (!id) return;

    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        setLoading(true);
        const res = await itemById(id.toString());

        setLoading(false);

        if (res.error) {
          showSnackbar(res.data?.message || "Unable to fetch item details", "error");
          return;
        }
        setItem(res.data);
        setItemId(String(res.data.id));
      } catch {
        showSnackbar("Unable to fetch item details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id, showSnackbar]);

  const filterBySales = useCallback(
    async (
      payload: Record<string, string | number | null>,
      pageSize: number,
      PageNo?: number
    ): Promise<listReturnType> => {
      let result;
      setShowNest(true);
      try {

        const params: Record<string, string> = { per_page: pageSize.toString() };
        Object.keys(payload || {}).forEach((k) => {
          const v = payload[k as keyof typeof payload];
          if (v !== null && typeof v !== "undefined" && String(v) !== "") {
            params[k] = String(v);
          }
        });
        setStDate(params?.from_date || "");
        setEndDate(params?.to_date || "");
        result = await itemSales(String(itemId), { from_date: params?.from_date, to_date: params?.to_date,page: PageNo?.toString(), limit: pageSize.toString() });
      } finally {
        setShowNest(false);
      }

      if (result?.error) throw new Error(result.data?.message || "Filter failed");
      else {
        const pagination = result.pagination?.pagination || result.meta || {};
        return {
          data: result.data || [],
          total: pagination.totalPages || result.pagination?.totalPages || 0,
          totalRecords: pagination.totalRecords || result.pagination?.totalRecords || 0,
          currentPage: pagination.page || result.pagination?.currentPage || 0,
          pageSize: pagination.limit || pageSize,
        };
      }
    },
    [setShowNest,itemId]
  );
  const filterByReturn = useCallback(
    async (
      payload: Record<string, string | number | null>,
      pageSize: number,
      PageNo?: number
    ): Promise<listReturnType> => {
      let result;
      setShowNestReturn(true);
      try {

        const params: Record<string, string> = { per_page: pageSize.toString() };
        Object.keys(payload || {}).forEach((k) => {
          const v = payload[k as keyof typeof payload];
          if (v !== null && typeof v !== "undefined" && String(v) !== "") {
            params[k] = String(v);
          }
        });
        result = await itemPurchase({ item_id: String(itemId), from_date: params?.from_date, to_date: params?.to_date,page: PageNo?.toString(), limit: pageSize.toString() });
      } finally {
        setShowNestReturn(false);
      }

      if (result?.error) throw new Error(result.data?.message || "Filter failed");
      else {
        const pagination = result.pagination?.pagination || result.meta || {};
        return {
          data: result.data || [],
          total: pagination.totalPages || result.pagination?.totalPages || 0,
          totalRecords: pagination.totalRecords || result.pagination?.totalRecords || 0,
          currentPage: pagination.page || result.pagination?.currentPage || 0,
          pageSize: pagination.limit || pageSize,
        };
      }
    },
    [setShowNestReturn,itemId]
  );

  const downloadSalesPdf = async (uuid: string, code: string) => {
    try {
      // setLoading(true);
      const response = await exportOrderInvoice({ uuid: uuid, format: "pdf" });
      if (response && typeof response === 'object' && response.download_url) {
        const fileName = `Invoice - ${code}.pdf`;
        await downloadPDFGlobal(response.download_url, fileName);
        // await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
      }
    } catch (error) {
      showSnackbar("Failed to download file", "error");
    } finally {
      // setLoading(false);
    }
  };
  const downloadPdf = async (uuid: string,code:string) => {
    try {
      // setLoading(true);
      const response = await exportPurposeOrderViewPdf({ uuid: uuid, format: "pdf" });
      if (response && typeof response === 'object' && response.download_url) {
        await downloadPDFGlobal(response.download_url, `Purchase Order - ${code}`);
        // await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
      }
    } catch (error) {
      showSnackbar("Failed to download file", "error");
    } finally {
      // setLoading(false);
    }
  };

  const exportReturnFile = async (id: string, format: string) => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await exportAllPO({ item_id: itemId, format }); // send proper body object
      if (response && typeof response === "object" && response.download_url) {
        // await downloadPDFGlobal(response.download_url, `item-return-${id}`);
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

  const exportSalesFile = async (uuid: string, format: string) => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      
      const response = await allItemInvoiceExport({ item_id: uuid, format, from_date: stDate, to_date: endDate }); // send proper body object
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


  return (
    <>
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={backBtnUrl} back>
          <Icon icon="lucide:arrow-left" width={24}  />
        </Link>
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
      </div>

      {/* Main Layout */}
      <ContainerCard className="w-full flex flex-col sm:flex-row items-center justify-between gap-[10px] md:gap-0">
        <div className="flex flex-col sm:flex-row items-center gap-[20px]">
          <div className="w-[80px] h-[80px] flex justify-center items-center rounded-full bg-[#E9EAEB] overflow-hidden">
            <Image
              src={imageSrc}
              alt={item?.name || "item"}
              width={50}
              height={50}
              className="w-full object-cover rounded-full border border-[#E4E4E4] bg-[#E9EAEB] scale-[1.5]"
              onError={() => {
                setImageSrc("/no-image.png");
              }}
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-[20px] font-semibold text-[#181D27] mb-[10px]">
              {item?.erp_code || "-"} - {item?.name || "-"}
            </h2>
            <span className="flex items-center text-[#414651] text-[16px]">
            </span>
          </div>
        </div>
        <span className="flex justify-center p-[10px] sm:p-0 sm:inline-block mt-[10px] sm:mt-0 sm:ml-[10px]">
          <StatusBtn isActive={String(item?.status) > "0"} />
        </span>
      </ContainerCard>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side - Image Section */}
        {/* <div className="md:w-[350px] flex-shrink-0">
            <ContainerCard className="p-[20px] flex flex-col gap-y-[20px]">
            <img
              src={item?.image ? item.image : "/no-image.png"}
              alt={item?.name || "item"}
              className="w-full h-[200px] object-cover rounded-md border border-[#E4E4E4] bg-[#E9EAEB]"
              onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/no-image.png";
              }}
            />
            <span className="text-[#181D27] text-[20px] font-semibold text-center">
              {item?.item_code || "-"} - {item?.name}
            </span>
            <div className="flex justify-center">
              <StatusBtn isActive={item?.status === 1} />
            </div>
            </ContainerCard>
        </div> */}
      </div>

      {/* Right Side - Description, Tabs, and Tab Content */}
      {/* <div className="flex-1 flex flex-col gap-y-[5px]"> */}
      {/* {item?.description && (
            <ContainerCard className="w-full">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {item.description}
              </p>
            </ContainerCard>
          )} */}

      {/* Tabs */}
      <ContainerCard
        className="w-full flex gap-[4px] overflow-x-auto"
        padding="5px"
      >
        {tabList.map((tab, index) => (
          <div key={index}>
            <TabBtn
              label={tab.name}
              isActive={activeTab === tab.key}
              onClick={() => onTabClick(index)}
            />
          </div>
        ))}
      </ContainerCard>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="flex gap-x-[20px] flex-wrap md:flex-nowrap">

          {/* Right Section */}
          <div className="w-full flex flex-col gap-y-[15px]">

            <ContainerCard className="w-full h-fit">
              <KeyValueData
                title="Item Information"
                data={[
                  { key: "ERP Code", value: item?.erp_code || "-" },
                  { key: "Brand", value: item?.brand?.name || "-" },
                  {
                    key: "Category",
                    value: item?.item_category?.category_name
                      ? `${item.item_category.category_name}`
                      : "-",
                  },
                  {
                    key: "Sub Category",
                    value: item?.item_sub_category?.name
                      ? `${item.item_sub_category.name}`
                      : "-",
                  },
                  { key: "Shelf Life", value: item?.shelf_life || "-" },
                  { key: "Commodity Goods Code", value: item?.commodity_goods_code || "-" },
                  { key: "Excise Duty Code", value: item?.excise_duty_code || "-" },
                  { key: "Item Weight", value: item?.item_weight || "-" },
                  { key: "Volume", value: item?.volume?.toString() || "-" },
                  {
                    key: "Taxable",
                    value: item?.is_taxable ? "Yes" : "No",
                  },
                  {
                    key: "Has Excise",
                    value: item?.has_excies ? "Yes" : "No",
                  },
                ]}
              />
            </ContainerCard>
          </div>
        </div>
      )}
      {activeTab === "uom" && (
        item?.item_uoms.map((singleItem, index) => {

          return (<ContainerCard key={index} className="w-full p-5">

            <h3 className="text-md font-semibold text-gray-800 mb-2">
              {singleItem?.uom_type || "UOM"}
            </h3>

            <div className="space-y-1 text-gray-700 text-sm">
              <p>
                <strong>Name:</strong> {singleItem?.name || "-"}
              </p>
              <p>
                <strong>Price:</strong> {toInternationalNumber(singleItem?.uom_price) || "0.00"}
              </p>
              <p>
                <strong>UPC:</strong> {singleItem?.upc || "N/A"}
              </p>
              <p>
                <strong>Enable For:</strong> {singleItem?.enable_for || "-"}
              </p>
              <p>
                <strong>Stock Keeping Unit:</strong>{" "}
                {singleItem?.is_stock_keeping ? "Yes" : "No"}
              </p>
            </div>
          </ContainerCard>)

        })
      )}
      {activeTab === "sales" && (
        <ContainerCard >
          <div className="flex flex-col h-full w-full overflow-x-auto">
            <Table
              config={{
                showNestedLoading:showNest,
                api: {
                  list: async (page: number = 1, pageSize: number = 50) => {
                    const res = await itemSales(String(itemId), { page: page.toString(), per_page: pageSize.toString() });
                    if (res.error) {
                      // showSnackbar(res.data?.message || "Unable to fetch sales data", "error");
                      throw new Error(res.data?.message || "Unable to fetch sales data");
                    }
                    setSalesData(res.data);
                    return {
                      data: res.data || [],
                      total: res.pagination?.totalPages || 1,
                      currentPage: res.pagination?.page || 1,
                      pageSize: res.pagination?.pageSize || pageSize,
                    };

                  },
                  filterBy: filterBySales
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
                      key={0}
                      disabled={salesData?.length === 0}
                      keyType="excel"
                      threeDotLoading={threeDotLoading}
                      exportReturnFile={exportSalesFile}
                      uuid={itemId}
                    />
                  ],
                },
                footer: { nextPrevBtn: true, pagination: true },
                rowActions: [
                  {
                    icon: "lucide:download",
                    showLoading: true,
                    onClick: (row: TableDataType) => downloadSalesPdf(row.uuid,row.invoice_code),
                  },
                ],
                table: {
                  height: 400,
                },
                columns: [
                  {
                    key: "invoice_code", label: "Code", render: (row: TableDataType) => (
                      <span className="cursor-pointer hover:text-red-500" onClick={e => {
                        e.stopPropagation();
                        setSelectedRow(row);
                        setShowDrawer(true);
                      }}>{row.invoice_code || "-"}</span>
                    )
                  },
                  { key: "invoice_date", label: "Invoice Date", render: (row: TableDataType) => <>{formatDate(row.invoice_date)}</> },
                  { key: "warehouse_code,warehouse_name", label: "Distributor", render: (row: TableDataType) => <>{row?.warehouse_code} - {row?.warehouse_name}</> },
                  { key: "route_code,route_name", label: "Route", render: (row: TableDataType) => <>{row?.route_code} - {row?.route_name}</> },
                  { key: "salesman_code,salesman_name", label: "Sales Team", render: (row: TableDataType) => <>{row?.salesman_code} - {row?.salesman_name}</> },
                  { key: "total", label: "Total", render: (row: TableDataType) => <>{toInternationalNumber(row?.total_amount)}</> },
                ],
                pageSize: 50
              }}
            />
          </div>
        </ContainerCard>
      )}
      {activeTab === "return" && (
        <ContainerCard >

          <div className="flex flex-col h-full w-full overflow-x-auto">
            <Table
              config={{
                showNestedLoading:showNestReturn,
                api: {
                  list: async (page: number = 1, pageSize: number = 50) => {
                    const res = await itemPurchase({ item_id: String(id), page: page.toString(), limit: pageSize.toString() });
                    if (res.error) {
                      // showSnackbar(res.data?.message || "Unable to fetch Return data", "error");
                      throw new Error(res.data?.message || "Unable to fetch Return data");
                    }
                    setRetrunData(res.data);
                    return {
                      data: res.data || [],
                      total: res.meta?.totalPages || 1,
                      currentPage: res.meta?.page || 1,
                      pageSize: res.meta?.limit || pageSize,
                    };

                  },
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
                      uuid={id}
                    />
                  ],
                },
                rowActions: [

                  {
                    icon: "lucide:download",
                    showLoading: true,
                    onClick: (row: TableDataType) => downloadPdf(row.uuid,row.order_code),
                  },
                ],
                footer: { nextPrevBtn: true, pagination: true },
                table: {
                  height: "400px",
                },
                columns: [
                  {
                    key: "order_code", label: "Code", render: (row: TableDataType) => (
                      <span className="cursor-pointer hover:text-red-500" onClick={e => {
                        e.stopPropagation();
                        setSelectedPORow(row);
                        setShowPODrawer(true);
                      }}>{row.order_code || "-"}</span>
                    )
                  },
                  { key: "delivery_date", label: "Delivery Date", render: (row: TableDataType) => <>{formatDate(row.delivery_date)}</> },
                  { key: "customer_code,customer_name", label: "Customer", render: (row: TableDataType) => <>{row?.customer_code} - {row?.customer_name}</> },
                  { key: "salesman_code,salesman_name", label: "Sales Team", render: (row: TableDataType) => <>{row?.salesman_code} - {row?.salesman_name}</> },
                  { key: "total", label: "Total", render: (row: TableDataType) => <>{toInternationalNumber(row.total)}</> },
                  // { key: "sap_msg", label: "SAP Status" }
                ],
                pageSize: 50
              }}
            />
          </div>
        </ContainerCard>
      )}
      {/* </div> */}
      <Drawer anchor="right" open={showDrawer} onClose={() => { setShowDrawer(false) }} className="p-2" >
        {selectedRow && <SideBarDetailPage title="Invoice" data={selectedRow} onClose={() => setShowDrawer(false)} />}
      </Drawer>

      <Drawer anchor="right" open={showPODrawer} onClose={() => { setShowPODrawer(false) }} className="p-2" >
        {selectedPORow && <SideBarDetailPage title="Purchase Order" data={selectedPORow} onClose={() => setShowPODrawer(false)} />}
      </Drawer>


    </>
  );
}
