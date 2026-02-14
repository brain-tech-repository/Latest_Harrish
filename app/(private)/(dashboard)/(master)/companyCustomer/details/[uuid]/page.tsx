
"use client";
import ContainerCard from "@/app/components/containerCard";
import Table, { configType, listReturnType, TableDataType } from "@/app/components/customTable";
import KeyValueData from "@/app/components/keyValueData";
import StatusBtn from "@/app/components/statusBtn2";
import TabBtn from "@/app/components/tabBtn";
import { downloadFileGlobal, getCompanyCustomerById, getCompanyCustomers, getCompanyCustomersPurchase } from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState ,useCallback} from "react";
import { downloadFile } from "@/app/services/allApi";
import Skeleton from "@mui/material/Skeleton";
import { formatDate } from "../../../salesTeam/details/[uuid]/page";
import FilterComponent from "@/app/components/filterComponent";
import { exportCustomerPurchaseOrder, exportPurposeOrderViewPdf } from "@/app/services/companyTransaction";
import ExportDropdownButton from "@/app/components/ExportDropdownButton";
import ItemCellWithPopup from "@/app/components/multipleDataPopUp";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import Drawer from "@mui/material/Drawer";
import { SideBarDetailPage } from "@/app/components/sideDrawer";
// Component to show first item and popup for remaining items

interface CustomerItem {
  id: number;
  sap_code: string;
  osa_code: string;
  business_name: string;
  company_type: { name: string };
  language: string;
  contact_number?: string;
  business_type: string;
  town: string;
  landmark: string;
  district: string;
  get_region: { id: number; region_code: string; region_name: string; }
  get_area: { id: number; area_code: string; area_name: string; }
  payment_type: string;
  creditday: string;
  tin_no: string;
  creditlimit: number;
  totalcreditlimit: number;
  credit_limit_validity?: string;
  bank_guarantee_name: string;
  bank_guarantee_amount: number;
  bank_guarantee_from: string;
  bank_guarantee_to: string;
  distribution_channel_id: string;
  merchendiser_ids: string;
  status: string;
}

const title = "Company Customer Details";
const backBtnUrl = "/companyCustomer";
export function getPaymentType(value: string): string {
  switch (value) {
    case "1":
      return "Cash";
    case "2":
      return "Cheque";
    case "3":
      return "Transfer";
    default:
      return "UNKNOWN";
  }
}
export default function ViewPage() {
  const params = useParams();
  const uuid = Array.isArray(params?.uuid)
    ? params?.uuid[0] || ""
    : (params?.uuid as string) || "";
    const [purchaseData, setPurchaseData] = useState<any>(null);
  const [purchaseList, setPurchaseList] = useState<any>("");
  const [threeDotLoading, setThreeDotLoading] = useState<{ pdf: boolean; xlsx: boolean; csv: boolean }>({ pdf: false, xlsx: false, csv: false });
   const [selectedRow, setSelectedRow] = useState<TableDataType | null>(null);
    const [showDrawer, setShowDrawer] = useState(false);
  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();

  const onTabClick = (idx: number) => {
    // ensure index is within range and set the corresponding tab key
    if (typeof idx !== "number") return;
    if (typeof tabList === "undefined" || idx < 0 || idx >= tabList.length) return;
    setActiveTab(tabList[idx].key);
  };

  useEffect(() => {
    if (!uuid) return;

    const fetchCompanyCustomerDetails = async () => {
      setLoading(true);
      try {
        const res = await getCompanyCustomerById(uuid);
        if (res.error) {
          showSnackbar(
            res.data?.message || "Unable to fetch company customer details",
            "error"
          );

          return;
        }
        setCustomer(res.data);
        setPurchaseList(res.data.id);
      } catch {
        showSnackbar("Unable to fetch company customer details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyCustomerDetails();
  }, [uuid, setLoading, showSnackbar]);

  const Columns: configType["columns"] = [
    // { key: "osa_code", label: "Code", showByDefault: true },
    { key: "order_code", label: "Order Code", showByDefault: true , render: (row: TableDataType) => <div className="cursor-pointer hover:text-red-500" onClick={() => {
                setSelectedRow(row);
                setShowDrawer(true);
            }}>{row.order_code || "-"}</div> },
    { key: "delivery_date", label: "Delivery Date", showByDefault: true,render: (row: TableDataType) => {
      return  formatDate((row.delivery_date))
                 
    },
  },
    // { key: "delivery_code", label: "Delivery Code", showByDefault: true },
    // {
    //   key: "warehouse_code", label: "Distributor", showByDefault: true, render: (row: TableDataType) => {
    //     const code = row.warehouse_code || "";
    //     const name = row.warehouse_name || "";
    //     return `${code}${code && name ? " - " : "-"}${name}`;
    //   }
    // },
    {
      key: "item",
      label: "Item",
      showByDefault: true,
      render: (row: TableDataType) => <ItemCellWithPopup title="Items List" title1="Items" details={row.details} />
    },

    {
      key: "salesman_code", label: "Sales Team", showByDefault: true, render: (row: TableDataType) => {
        const code = row.salesman_code || "";
        const name = row.salesman_name || "";
        return `${code}${code && name ? " - " : "-"}${name}`;
      }
    },
    {
      key: "comment", label: "Comment", showByDefault: true
    },
    {
      key: "sap_msg", label: "SAP Status", showByDefault: true
    },
    {
      key: "total", label: "Total", showByDefault: true,render: (row: TableDataType) => {
        return toInternationalNumber(row.total);
      }
    },
    //  { key: "action", label: "Action",sticky:"right", render: (row: TableDataType) => {


    //       return(<IconComponentData2 row={row} />)
    //     } }
  ];

  // Tab logic
  const [activeTab, setActiveTab] = useState("overview");
  const tabList = [
    { key: "overview", label: "Overview" },
    { key: "address", label: "Location Info" },
    { key: "financial", label: "Financial Info" },
    { key: "guarantee", label: "Guarantee Info" },
    { key: "purchase", label: "Purchase" },
    { key: "creditNote", label: "Credit Note" },
  ];

  const fetchCompanyCustomersPurchase = async (pageNo: number = 1, pageSize: number = 50): Promise<listReturnType> => {
    // setLoading(true);

    // Build params with all filters
    const params: any = {
      page: pageNo.toString(),
      pageSize: pageSize.toString()
    };

    const res = await getCompanyCustomersPurchase({
      customer_id: purchaseList,
      ...params
    });
    setPurchaseData(res.data);
    // setLoading(false);
    if (res.error) {
      showSnackbar(res.data.message || "Failed to fetch Purchase order", "error");
      throw new Error(res.data.message);
    }
    return {
      data: res.data || [],
      pageSize: res?.pagination?.per_page || pageSize,
      total: res?.pagination?.last_page || 1,
      currentPage: res?.pagination?.current_page || 1,
    }
  };

      const filterByPO = useCallback(
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
                  result = await getCompanyCustomersPurchase({uuid:uuid,to_date: params?.from_date, from_date: params?.to_date });
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

  const exportFile = async (uuid: string, format: string,orderCode:string) => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await exportPurposeOrderViewPdf({ uuid, format }); // send proper body object
      if (response && typeof response === "object" && response.download_url) {
        await downloadFileGlobal(response.download_url, `Purchase Order - ${orderCode}`);
        // await downloadFile(response.download_url);
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

  const allInvoices = async (format: string) => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const response = await exportCustomerPurchaseOrder({ customer_id: purchaseList, format }); // send proper body object
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={backBtnUrl} back>
          <Icon icon="lucide:arrow-left" width={24} />
        </Link>
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
      </div>
      <ContainerCard className="w-full flex flex-col sm:flex-row items-center justify-between gap-[10px] md:gap-0">
        {/* profile details */}
        <div className="flex flex-col sm:flex-row items-center gap-[20px]">
          <div className="w-[80px] h-[80px] flex justify-center items-center rounded-full bg-[#E9EAEB]">
            <Icon
              icon="lucide:user"
              width={40}
              className="text-[#535862] scale-[1.5]"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-[20px] font-semibold text-[#181D27] mb-[10px]">
              {customer?.osa_code} - {customer?.business_name}
            </h2>

          </div>
        </div>
        <span className="flex justify-center p-[10px] sm:p-0 sm:inline-block mt-[10px] sm:mt-0 sm:ml-[10px]">
          <StatusBtn isActive={customer?.status == "1"} />
        </span>

      </ContainerCard>
      <div className="flex gap-x-[20px] flex-wrap md:flex-nowrap">



        <div className="w-full flex flex-col">
          <div className="flex ">

            <ContainerCard className="w-full flex gap-[4px] overflow-x-auto" padding="5px">
              {tabList.map((tab, index) => (
                <div key={index}>
                  <TabBtn
                    label={tab.label}
                    isActive={activeTab === tab.key}
                    onClick={() => onTabClick(index)}
                  />
                </div>
              ))}
            </ContainerCard>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <ContainerCard className="w-full h-fit">
              <KeyValueData
                title="Customer Information"
                data={[
                  { key: "SAP Code", value: customer?.sap_code || "-" },
                  { key: "Language", value: customer?.language || "-" },
                  { key: "Contact No.", value: customer?.contact_number || "-" },
                  { key: "Company Type", value: customer?.company_type?.name || "-" },
                  {
                    key: "Business Type",
                    value:
                      Number(customer?.business_type) === 0
                        ? "Buyer"
                        : "Seller",
                  }


                ]}
              />
            </ContainerCard>
          )}
          {activeTab === "address" && (
            <ContainerCard className="w-full h-fit">
              <KeyValueData
                title="Location Information"
                data={[
                  { key: "Region", value: `${customer?.get_region?.region_code} - ${customer?.get_region?.region_name}` || "-" },

                  { key: "Area", value: `${customer?.get_area?.area_code} - ${customer?.get_area?.area_name}` || "-" },


                  { key: "Town", value: customer?.town || "-" },
                  { key: "Landmark", value: customer?.landmark || "-" },
                  { key: "District", value: customer?.district || "-" },
                ]}
              />

            </ContainerCard>
          )}
          {activeTab === "financial" && (
            <ContainerCard className="w-full h-fit">
              <KeyValueData
                title="Financial Information"
                data={[
                  { key: "Payment Type", value: getPaymentType(customer ? customer.payment_type : "") || "-" },
                  { key: "Credit Days", value: customer?.creditday || "-" },
                  { key: "Credit Limit", value: customer?.creditlimit?.toString() || "-" },
                  { key: "Total Credit Limit", value: customer?.totalcreditlimit?.toString() || "-" },
                  { key: "Credit Limit Validity", value: customer?.credit_limit_validity || "-" },
                  { key: "TIN No", value: customer?.tin_no || "-" },
                  {
                    key: "Distribution Channel ID",
                    value: customer?.distribution_channel_id?.toString() || "-",
                  },
                ]}
              />
            </ContainerCard>
          )}
          {activeTab === "guarantee" && (
            <ContainerCard className="w-full h-fit">
              <KeyValueData
                title="Guarantee Details"
                data={[
                  { key: "Guarantee Name", value: customer?.bank_guarantee_name || "-" },
                  { key: "Guarantee Amount", value: customer?.bank_guarantee_amount?.toString() || "-" },
                  {
                    key: "Guarantee From",
                    value: customer?.bank_guarantee_from
                      ? formatDate(customer.bank_guarantee_from)
                      : "-"
                  },
                  {
                    key: "Guarantee To",
                    value: customer?.bank_guarantee_to
                      ? formatDate(customer.bank_guarantee_to)
                      : "-"
                  },

                ]}
              />
            </ContainerCard>
          )}
          {activeTab === "purchase" && (
            <ContainerCard >

              <div className="flex flex-col h-full">
                <Table
                  config={{
                    api: {
                      list: fetchCompanyCustomersPurchase,
                      filterBy : filterByPO,
                    },
                    header: {

                      filterRenderer: (props) => (
                        <FilterComponent
                          currentMonth={true}
                          {...props}
                          onlyFilters={['from_date', 'to_date']}
                        />
                      ),
                      searchBar: false,
                      actions: [
                        <ExportDropdownButton
                          disabled={purchaseList?.length === 0}
                          keyType="excel"
                          threeDotLoading={threeDotLoading}
                          exportReturnFile={allInvoices}
                          uuid={uuid}
                        />
                      ],
                    },
                    showNestedLoading: true,
                    footer: { nextPrevBtn: true, pagination: true },
                    table: {
                      height: 500,
                    },
                    columns: Columns,
                    rowSelection: false,
                    rowActions: [
                      {
                        icon: "material-symbols:download",
                        showLoading: true,
                        onClick: (data: TableDataType) => 
                          exportFile(data.uuid, "pdf",data.order_code)
                        
                      }
                    ],
                    pageSize: 50,
                  }}
                />
              </div>

            </ContainerCard>
          )}
          {activeTab === "creditNote" && (
            <ContainerCard >

              <div className="flex flex-col h-full">
                <Table
                  config={{
                    header: {
                      filterRenderer: (props) => (
                        <FilterComponent
                          currentMonth={true}
                          {...props}
                          onlyFilters={['from_date', 'to_date']}
                        />
                      ),
                      searchBar: false,
                    },
                    showNestedLoading: true,
                    footer: { nextPrevBtn: true, pagination: true },
                    table: {
                      height: 500,
                    },
                    columns: Columns,
                    rowSelection: false,
                    rowActions: [
                      // {
                      //     icon: "material-symbols:download",
                      //     onClick: (data: TableDataType) => {
                      //         exportFile(data.uuid, "csv"); // or "excel", "csv" etc.
                      //     },
                      // }
                    ],
                    pageSize: 50,
                  }}
                />
              </div>

            </ContainerCard>
          )}
        </div>
        <Drawer anchor="right" open={showDrawer} onClose={() => { setShowDrawer(false) }} className="p-2" >
          {selectedRow && <SideBarDetailPage title="Purchase Order" data={selectedRow} onClose={() => setShowDrawer(false)} />}
        </Drawer>
      </div>
    </>
  );
}



