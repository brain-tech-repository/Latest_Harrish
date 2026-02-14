"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import Table, { configType } from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import Logo from "@/app/components/logo";
import TabBtn from "@/app/components/tabBtn";
import { downloadPDFGlobal } from "@/app/services/allApi";
import { salesmanUnloadHeaderById,unloadPdfDownload } from "@/app/services/agentTransaction";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import WorkflowApprovalActions from "@/app/components/workflowApprovalActions";
import { formatWithPattern } from "@/app/utils/formatDate";

interface CustomerItem {
  id: number;
  uuid: string;
  osa_code: string;
  unload_no: string;
  unload_date: any;
  request_step_id: number;
  unload_time: string;
  sync_date: string;
  sync_time: string;
  unload_from: string;
  salesman_type: {
    name: string;
  };
  latitude: string;
  longtitude: string;
  load_date: string;
  warehouse: {
    code: string;
    name: string;
  };
  route: {
    code: string;
    name: string;
  };
  salesman: {
    code: string;
    name: string;
  };
  projecttype?: {
    code: string;
    name: string;
  } | null;
  details: Array<{
    id: number;
    uuid: string;
    osa_code: string;
    item: {
      id: number;
      erp_code: string;
      code: string;
      name: string;
    };
    uom_name: string;
    qty: number;
    price: string;
    status: number;
  }>;
}



export default function ViewPage() {
  const params = useParams();
  const uuid = Array.isArray(params?.uuid)
    ? params?.uuid[0] || ""
    : (params?.uuid as string) || "";
  const [loading, setLoadingState] = useState<boolean>(false);
  const [customer, setCustomer] = useState<CustomerItem>({} as CustomerItem);
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();

  const title = `Sales Team Unload Details`;
  const backBtnUrl = "/salesTeamUnload";

  // Tab logic
  const [activeTab, setActiveTab] = useState("overview");
  const tabList = [
    { key: "overview", label: "Overview" },
    { key: "unload", label: "Unload Items" },
  ];

  const onTabClick = (idx: number) => {
    if (idx < 0 || idx >= tabList.length) return;
    setActiveTab(tabList[idx].key);
  };

  const columns: configType["columns"] = [
    { key: "item", label: "Item" },
    { key: "uom", label: "UOM" },
    { key: "qty", label: "Quantity" },
  ];

  const tableData =
    customer?.details?.map((detail) => ({
      item: detail.item
        ? `${detail.item.erp_code} - ${detail.item.name}`
        : "-",
      uom: detail.uom_name !== undefined && detail.uom_name !== null ? String(detail.uom_name) : "-",
      qty: detail.qty !== undefined && detail.qty !== null ? String(detail.qty) : "-",
      price: detail.price !== undefined && detail.price !== null ? String(detail.price) : "-",
    })) || [];

  useEffect(() => {
    if (!uuid) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await salesmanUnloadHeaderById(uuid);
        if (res.error) {
          showSnackbar(
            res.data?.message || "Unable to fetch Salesman Unload Details",
            "error"
          );
          return;
        }
        setCustomer(res.data);
      } catch {
        showSnackbar("Unable to fetch Salesman Unload Details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [uuid, setLoading, showSnackbar]);
  const targetRef = useRef<HTMLDivElement | null>(null);


      const downloadPdf = async () => {
        try {
          setLoadingState(true);
          const response = await unloadPdfDownload({ uuid: uuid, format: "pdf" });
          if (response && typeof response === 'object' && response.download_url) {
            const fileName = `Unload - ${customer?.osa_code}`;
            await downloadPDFGlobal(response.download_url, fileName);
            showSnackbar("File downloaded successfully ", "success");
          } else {
            showSnackbar("Failed to get download URL", "error");
          }
        } catch (error) {
          showSnackbar("Failed to download file", "error");
        } finally {
         setLoadingState(false);
        }
      };


  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={backBtnUrl} back>
          <Icon
            icon="lucide:arrow-left"
            width={24}
            className="cursor-pointer"
          />
        </Link>
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
      </div>

      <WorkflowApprovalActions
        requestStepId={customer?.request_step_id}
        redirectPath={backBtnUrl}
        model="Unload_Header"
      />

      {/* ---------- Main Card ---------- */}
      <div ref={targetRef}>
        <ContainerCard className="rounded-xl shadow-sm space-y-8 bg-white p-6">
          {/* Top Section */}
          <div className="flex justify-between flex-wrap gap-6 items-start">
            <Logo type="full" />

            <div className="text-right">
              <div className="flex flex-col items-end">
              <span className="text-[42px] uppercase text-[#A4A7AE] mb-[10px]">Unload</span>
              <span className="text-primary text-[14px] tracking-[8px]">#{customer?.osa_code || "-"}</span>
            </div>
            </div>
          </div>

          <hr className="border-gray-200" />
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
          {/* ---------- Info Section ---------- */}
          {activeTab === "overview" && (
            <>
            {/* Left side - details */}
            <ContainerCard>
              <KeyValueData
                data={[
                  {
                    key: "Distributor",
                    value:
                      customer?.warehouse?.code && customer?.warehouse?.name
                        ? `${customer.warehouse.code} - ${customer.warehouse.name}`
                        : "-",
                  },
                  {
                    key: "Route",
                    value: customer?.route
                      ? `${customer.route.code} - ${customer.route.name}`
                      : "-",
                  },
                  {
                    key: "Sales Team Type",
                    value: customer?.salesman_type?.name || "-",
                  },
                  {
                    key: "Sales Team",
                    value: customer?.salesman
                      ? `${customer.salesman.code} - ${customer.salesman.name}`
                      : "-",
                  },
                  {
                    key: "Unload Date",
                    value: formatWithPattern(new Date(customer.unload_date),
                "DD MMM YYYY",
                "en-GB",
              ) || "-",

                  },
                ]}
              />
            </ContainerCard>
            </>
          )}


          {/* ---------- Table ---------- */}
          {activeTab === "unload" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Unload Items
            </h3>
            <Table
              data={tableData}
              config={{ columns }}
            />
          </div>
          )}
  <div className="flex flex-wrap justify-end mt-4 print:hidden">
                         <SidebarBtn
                         isActive
                           leadingIcon={
                             loading ? "eos-icons:three-dots-loading" : "lucide:download"
                           }
                           leadingIconSize={20}
                           label="Download"
                           onClick={downloadPdf}
                         />
                         {/* <PrintButton
                           targetRef={targetRef as unknown as RefObject<HTMLElement>}
                         /> */}
                       </div>
 
        </ContainerCard>
      </div>

    </>
  );
}
