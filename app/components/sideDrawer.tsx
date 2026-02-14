
"use client";

import BorderIconButton from "@/app/components/borderIconButton";
import ContainerCard from "@/app/components/containerCard";
import CustomDropdown from "@/app/components/customDropdown";
import Table, { TableDataType } from "@/app/components/customTable";
import Logo from "@/app/components/logo";
import { Icon } from "@iconify-icon/react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, RefObject, Fragment } from "react";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import PrintButton from "@/app/components/printButton";
import KeyValueData from "@/app/components/keyValueData";
import { formatWithPattern } from "@/app/(private)/utils/date";
import { isValidDate } from "@/app/utils/formatDate";
import { downloadFile } from "@/app/services/allApi";
import WorkflowApprovalActions from "@/app/components/workflowApprovalActions";

const columns = [
  { key: "id", label: "#", width: 60 },
  // { key: "itemCode", label: "Item Code" },
  { key: "itemName", label: "Item", render: (value: TableDataType) => <> {value?.erp_code || ""} - {value?.itemName || ""}
  {/* {(value.erp_code ? value.erp_code : '') + (value.erp_code && value.itemName ? "" : "") + (value.itemName ? value.itemName : "") || '-'} */}
  </> },
  { key: "UOM", label: "UOM" },
  { key: "Quantity", label: "Quantity" },
  { key: "Price", label: "Price", render: (value: TableDataType) => <>{toInternationalNumber(value.Price) || '0.00'}</> },
  { key: "Net", label: "Net", render: (value: TableDataType) => <>{toInternationalNumber(value.Net) || '0.00'}</> },
  { key: "vat", label: "VAT", render: (value: TableDataType) => <>{toInternationalNumber(value.Vat) || '0.00'}</> },
  // { key: "preVat", label: "Pre VAT", render: (value: TableDataType) => <>{toInternationalNumber(Number(value.preVat)) || '0.00'}</> },
  // { key: "discount", label: "Discount", render: (value: TableDataType) => <>{toInternationalNumber(value.discount) || '0.00'}</> },
  // { key: "total_gross", label: "Gross", render: (value: TableDataType) => <>{toInternationalNumber(value.total_gross) || '0.00'}</> },
  { key: "Total", label: "Total", render: (value: TableDataType) => <>{toInternationalNumber(value.Total) || '0.00'}</> },
];
export default function Page(){
//   const params = useParams();
  return <SideBarDetailPage  />;
}

export function SideBarDetailPage({ data, onClose, title }: { data?: any; onClose?: () => void; title?: string }) {
  // Use the passed data prop directly
  const deliveryData = data || {};
  const CURRENCY = typeof window !== 'undefined' ? (localStorage.getItem("country") || "") : "";
  const targetRef = useRef<HTMLDivElement | null>(null);

  // Map details to table data
  const tableData = Array.isArray(deliveryData?.details)
    ? deliveryData?.details.map((detail: any, index: number) => ({
        id: String(index + 1),
        itemCode: String(detail.item_code ?? ""),
        erp_code: String(detail.erp_code || detail?.item?.erp_code || ""),
        itemName: String(detail.item_name || detail?.item?.name || ""),
        UOM: String(detail.uom_name || detail?.uoms?.name || ""),
        Quantity: String(detail.quantity || detail.item_quantity || 0),
        Price: String(detail.item_price ?? detail.itemvalue ?? "0"),
        Excise: String(detail.excise ?? "0"),
        Discount: String(detail.discount ?? "0"),
        Net: String(detail.net ?? detail.net_total ?? "0"),
        Vat: String(detail.vat ?? "0"),
        preVat: String(detail.pre_vat ?? "0"),
        Total: String(detail.total || detail.item_total || deliveryData?.total || deliveryData?.item_total || "0"),
      }))
    : [];

  const keyValueData = [
    { key: "Net Total", value: `${CURRENCY} ${toInternationalNumber(Number(deliveryData?.net_amount || deliveryData?.net_total || deliveryData?.gross_total || 0)) || "0.00"}` },
    { key: "VAT", value: `${CURRENCY} ${toInternationalNumber(Number(deliveryData?.vat || 0)) || "0.00"}` },
  ];

  return (
    <>
      {/* ---------- Header ---------- */}
      <div className="flex justify-between items-center mb-[20px] ">
        <div className="flex items-center gap-[16px] mt-2 ml-2">
          
          <h1 className="text-[20px] font-semibold flex items-center leading-[30px]" style={{ color: 'var(--drawer-title, #181D27)' }}>
            {title} Details
          </h1>
          {/* <BorderIconButton disabled={!deliveryData?.previous_uuid} onClick={deliveryData?.previous_uuid ? () => router.push(`${PATH}${deliveryData?.previous_uuid}`) : undefined} icon="lucide:chevron-left" label={"Prev"} labelTw="font-medium text-[12px]" className="!h-[30px] !gap-[3px] !px-[5px] !pr-[10px]" />
          <BorderIconButton disabled={!deliveryData?.next_uuid} onClick={deliveryData?.next_uuid ? () => router.push(`${PATH}${deliveryData?.next_uuid}`) : undefined} trailingIcon="lucide:chevron-right" label={"Next"} labelTw="font-medium text-[12px]" className="!h-[30px] !gap-[3px] !px-[5px] !pl-[10px]" /> */}
        
        
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[12px] relative">
            <Icon
            icon="famicons:close"
            width={24}
            onClick={onClose}
            className="cursor-pointer mr-2 mt-3 hover:text-red-500"
            style={{ color: 'var(--icon-color, #535862)' }}
          />
          {/* <div className="gap-[12px] hidden sm:flex">
            <BorderIconButton 
              icon="lucide:edit-2" 
              onClick={() => router.push(`/agentCustomerDelivery/${uuid}`)}
            />
            <BorderIconButton icon="lucide:printer" />
            <BorderIconButton icon="lucide:mail" />
            <BorderIconButton icon="mdi:message-outline" />
            <DismissibleDropdown
              isOpen={showDropdown}
              setIsOpen={setShowDropdown}
              button={
                <BorderIconButton
                  icon="ic:sharp-more-vert"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              }
              dropdown={
                <div className="w-[160px] absolute top-[40px] right-0 z-30">
                  <CustomDropdown data={dropdownDataList} />
                </div>
              }
            />
          </div> */}
        </div>
      </div>
      {/* <WorkflowApprovalActions
        requestStepId={deliveryData?.request_step_id}
        redirectPath="/distributorsInvoice"
        model="Invoice_Header"
        uuid={uuid}
      /> */}
      {/* ---------- Order Info Card ---------- */}
      <div ref={targetRef} className="flex flex-col h-full">
        <ContainerCard className="rounded-[10px] space-y-[40px]">
          <div className="flex justify-between flex-wrap gap-[20px]">
            <div className="flex flex-col gap-[10px]">
              <Logo type="full" />
              {/* <span className="text-primary font-normal text-[16px]">
              Hariss Trading Co., Dubai - UAE
            </span> */}
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[42px] uppercase text-[#A4A7AE] mb-[10px]">
                {title}
              </span>
              <span className="text-primary text-[14px] tracking-[10px] mb-3">
                #{deliveryData?.invoice_code || deliveryData?.order_code || deliveryData?.osa_code || ""}
              </span>
            </div>
          </div>

          <hr className="text-[#D5D7DA]" />

          {/* ---------- Order Details Section (three equal columns) ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-8 items-start">
            {/* From (Seller) */}
              {(deliveryData?.warehouse_code || deliveryData?.warehouse?.warehouse_code || deliveryData?.warehouse_name || deliveryData?.warehouse?.warehouse_name) &&
            <div>
              <div className="flex flex-col space-y-[12px] text-primary-bold text-[14px] border-b md:border-b-0 pb-4 md:pb-0">
                <span>Seller</span>
                <div className="flex flex-col space-y-[10px]">
                  {/* <span className="font-semibold">{deliveryData?.warehouse_code } - {deliveryData?.warehouse_name}</span> */}
                  <span className="font-semibold">
                    {deliveryData?.warehouse_code || deliveryData?.warehouse?.warehouse_code || ""} - {deliveryData?.warehouse_name || deliveryData?.warehouse?.warehouse_name || ""}
                    {/* {deliveryData?.warehouse_code && deliveryData?.warehouse_name ? " - " : ""} */}
                    {/* {deliveryData?.warehouse_name ? deliveryData?.warehouse_name : ""} */}
                  </span>
                  <span>
                    {/* {deliveryData?.warehouse_contact && <>Phone: {deliveryData?.warehouse_contact}</>} <br /> {data?.warehouse_email && <>Email: {data?.warehouse_email}</>} */}
                  </span>
                </div>
              </div>
            </div>
}

            {/* To (Customer) */}
            <div>
             {(deliveryData?.customer_code  || deliveryData?.customer?.osa_code || deliveryData?.customer?.customer_code || deliveryData?.customer_name || deliveryData?.customer?.name || deliveryData?.customer?.customer_name)  &&
              <div className="flex flex-col space-y-[12px] text-primary-bold text-[14px]">
                <span>Buyer</span>
                <div className="flex flex-col space-y-[10px]">
                  <span className="font-semibold">{deliveryData?.customer_code || deliveryData?.customer?.customer_code || deliveryData?.customer?.osa_code || ""} - {deliveryData?.customer_name || deliveryData?.customer?.customer_name || deliveryData?.customer?.name || ""}</span>
                 
                  <span>
                    {/* {deliveryData?.customer_phone && <>Phone: {deliveryData?.customer_phone || "-"}</>} <br /> */}
                    {/* {deliveryData?.customer_email && <>Email: {deliveryData?.customer_email || "-"}</>} <br /> */}
                  </span>
                </div>
              </div>
}
            </div>
            {/* Dates / meta - right column */}
            <div className="flex md:justify-end">
              <div className="text-primary-bold text-[14px] md:text-right">
                {deliveryData?.invoice_date && isValidDate(new Date(deliveryData?.invoice_date)) && <div>
                  Invoice Date: <span className="font-bold">{formatWithPattern(new Date(deliveryData?.invoice_date) || "", 'DD MMM YYYY', 'en-GB').toLowerCase()}</span>
                </div>}
                {(deliveryData?.route_code || deliveryData?.route?.route_code || deliveryData?.route?.route_name || deliveryData?.route_name) && <div className="mt-2">
                  Route: <span className="font-bold">
                    {/* {deliveryData?.route_code ? deliveryData?.route_code : ""} {deliveryData?.route_code && deliveryData?.route_name ? " - " : ""} {deliveryData?.route_name ? deliveryData?.route_name : ""} */}
                    {deliveryData?.route_code || deliveryData?.route?.route_code || ""} - {deliveryData?.route_name || deliveryData?.route?.route_name || ""}
                    </span>
                </div>}
                {deliveryData?.salesman_name && <div className="mt-2">
                  Sales Team: <span className="font-bold">{deliveryData?.salesman_code} - {deliveryData?.salesman_name}</span>
                </div>}
              </div>
            </div>
          </div>

          {/* ---------- Order Table ---------- */}
          <Table
            data={tableData as TableDataType[]}
            config={{
              columns: columns,
            }}
          />

          {/* ---------- Order Summary ---------- */}
          <div className="flex justify-between text-primary">
            <div className="flex justify-between flex-wrap w-full">
              {/* Notes Section */}
              <div className="hidden flex-col justify-end gap-[20px] w-full lg:flex lg:w-[400px]">
                {/* <div className="flex flex-col space-y-[10px]">
                  <div className="font-semibold text-[#181D27]">Customer Note</div>
                  <div>
                    Please deliver between 10 AM to 1 PM. Contact before delivery.
                  </div>
                </div> */}
                <div className="flex flex-col space-y-[10px]">
                  <div className="font-semibold text-[#181D27]">
                    Payment Method
                  </div>
                  <div>Cash on Delivery</div>
                </div>
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-[10px] w-full lg:w-[350px] pb-[20px] lg:pb-0 mb-[20px] lg:mb-0">
                {keyValueData.map((kv) => (
                  <Fragment key={kv.key}>
                    <KeyValueData data={[kv]} />
                    <hr className="text-[#D5D7DA]" />
                  </Fragment>
                ))}
                {/* <hr className="text-[#D5D7DA]" /> */}
                <div className="font-semibold text-[#181D27] py-2 text-[18px] flex justify-between">
                  <span>Total</span>
                  <span>{CURRENCY} {toInternationalNumber(deliveryData?.total_amount || deliveryData?.total) || "0.00"}</span>
                </div>
              </div>

              {/* Notes (Mobile) */}
              <div className="flex flex-col justify-end gap-[20px] w-full lg:hidden lg:w-[400px] mt-[20px]">
                {/* <div className="flex flex-col space-y-[10px]">
                  {deliveryData?.comment && <><div className="font-semibold text-[#181D27]">Customer Note</div>
                    <div>
                      {deliveryData?.comment}
                    </div></>}
                </div> */}
                <div className="flex flex-col space-y-[10px]">
                  <div className="font-semibold text-[#181D27]">
                    Payment Method
                  </div>
                  <div>Cash on Delivery</div>
                </div>
              </div>
            </div>
          </div>

          {/* <hr className="text-[#D5D7DA] print:hidden" /> */}

          {/* ---------- Footer Buttons ---------- */}
          {/* <div className="flex flex-wrap justify-end gap-[20px] print:hidden"> */}
            {/* <SidebarBtn
              leadingIcon={loading ? "eos-icons:three-dots-loading" : "lucide:download"}
              leadingIconSize={20}
              label="Download"
            //   onClick={exportFile}
            /> */}
            {/* <PrintButton targetRef={targetRef as unknown as RefObject<HTMLElement>} /> */}
          {/* </div> */}
        </ContainerCard>
      </div>
    </>
  );
}  