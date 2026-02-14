"use client";

import { useState, useEffect, useCallback } from "react";
import Table, { TableDataType, listReturnType } from "@/app/components/customTable";
import { useSnackbar } from "@/app/services/snackbarContext";
import StatusBtn from "@/app/components/statusBtn2";
import { downloadFile } from "@/app/services/allApi";
import { formatWithPattern } from "@/app/(private)/utils/date";
import { useLoading } from "@/app/services/loadingContext";
import { compensationReportExport, compensationReportList } from "@/app/services/companyTransaction";
import { toInternationalNumber } from "@/app/(private)/utils/formatNumber";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import FilterComponent from "@/app/components/filterComponent";



export default function CustomerInvoicePage() {
  const { can, permissions } = usePagePermissions();
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [reportData, setReportData] = useState<{
    data: TableDataType[];
    currentPage: number;
    pageSize: number;
    total: number;
    totalRecords: number;
  }>({
    data: [],
    currentPage: 1,
    pageSize: 50,
    total: 0,
    totalRecords: 0,
  });
 
  const [threeDotLoading, setThreeDotLoading] = useState({ csv: false, xlsx: false });
  const [hasData, setHasData] = useState(false);
  const [date,setDate] = useState<any>();
  // Refresh table when permissions load
  useEffect(() => {
    if (permissions.length > 0) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [permissions]);

  const exportFile = async (format: "csv" | "xlsx" = "csv") => {
    try {
      setThreeDotLoading((prev) => ({ ...prev, [format]: true }));
      const payload: Record<string, any> = { format, from_date: date?.from_date, to_date: date?.to_date };
      const response = await compensationReportExport(payload);
      if (response && typeof response === "object" && response.download_url) {
        await downloadFile(response.download_url);
        showSnackbar("File downloaded successfully ", "success");
      } else {
        showSnackbar("Failed to get download URL", "error");
      }
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    } catch (error) {
      showSnackbar("Failed to download Distributor data", "error");
      setThreeDotLoading((prev) => ({ ...prev, [format]: false }));
    }
  };

  const filterBy = useCallback(
    async (
      payload: Record<string, string | number | null>,
      pageSize: number = 50,
      pageNo?: number
    ): Promise<listReturnType> => {
      let result;
      setLoading(true);
      try {
        const params: Record<string, string> = { 
          per_page: pageSize.toString(),
          current_page: String(pageNo || 1)
        };
        
        Object.keys(payload || {}).forEach((k) => {
          const v = payload[k as keyof typeof payload];
          if (v !== null && typeof v !== "undefined" && String(v) !== "") {
            params[k] = String(v);
          }
        });
        
        setDate({from_date: params.from_date, to_date: params.to_date});
        result = await compensationReportList(params);
        const pagination = result.pagination?.pagination || result.pagination || {};
        
        setReportData({
          data: result.data || [],
          currentPage: pagination?.current_page || 1,
          pageSize: pagination?.per_page || pageSize,
          total: pagination?.last_page || 0,
          totalRecords: pagination?.total || 0,
        });
        setHasData((result.data && result.data.length > 0) || false);
      } finally {
        setLoading(false);
      }

      if (result?.error) throw new Error(result.data?.message || "Filter failed");
      
      const pagination = result.pagination?.pagination || result.pagination || {};
      return {
        data: result.data || [],
        total: pagination?.last_page || result.pagination?.last_page || 0,
        totalRecords: pagination?.total || result.pagination?.total || 0,
        currentPage: pagination?.current_page || result.pagination?.current_page || 1,
        pageSize: pagination?.per_page || pageSize,
      };
    },
    [setLoading]
  );



  const columns = [
  { key: "sap_id", label: "SAP Code", showByDefault: true },
  {
    key: "invoice_date",
    label: "Date",
    showByDefault: true,
    render: (row: TableDataType) => {
      if (!row.invoice_date) return "-";
      return (
        formatWithPattern(
          new Date(row.invoice_date),
          "DD MMM YYYY",
          "en-GB",
        ).toLowerCase() || "-"
      );
    },
  },
  { key: "invoice_code", label: "Invoice Code", showByDefault: true },
  {
    key: "warehouse_code", label: "Distributor", showByDefault: true,
    render: (row: TableDataType) => {
      const code = row.warehouse_code || "";
      const name = row.warehouse_name || "";
      return `${code}${code && name ? " - " : "-"}${name}`;
    }
  },
  { key: "item_category_dll", label: "Compensation Code", showByDefault: true },
  {
    key: "erp_code", label: "Item", showByDefault: true,
    render: (row: TableDataType) => {
      const code = row.erp_code || "";
      const name = row.item_name || "";
      return `${code}${code && name ? " - " : "-"}${name}`;
    }
  },
  { key: "base_uom_vol_calc", label: "Facotry Price", showByDefault: true, render: (row: TableDataType) => (row.base_uom_vol_calc) ?? "-" },
  { key: "alter_base_uom_vol_calc", label: "Purchase Price", showByDefault: true, render: (row: TableDataType) => (row.alter_base_uom_vol_calc) ?? "-" },
  { key: "quantity", label: "Free Quantity", showByDefault: true, render: (row: TableDataType) => toInternationalNumber(row.quantity) ?? "-" },
  { key: "total_amount", label: "Amount", showByDefault: true, render: (row: TableDataType) => <>{toInternationalNumber(row.total_amount) || '0.00'}</> },
  {
    key: "status",
    label: "Status",
    render: (row: TableDataType) => {
      const isActive =
        String(row.status) === "1" ||
        (typeof row.status === "string" &&
          row.status.toLowerCase() === "active");
      return <StatusBtn isActive={isActive} />;
    },
  },
];

  return (
    <div className="flex flex-col h-full">

      <Table
        refreshKey={refreshKey}
        config={{
          api: { 
            filterBy: filterBy,
            list: async () => {
              return []
            }
          },
          showNestedLoading: true,
          
          header: {
            title: "Compensation Report",
            columnFilter: true,
            searchBar: false,
            threeDot: hasData
              ? [
                {
                  icon: threeDotLoading.csv
                    ? "eos-icons:three-dots-loading"
                    : "gala:file-document",
                  label: "Export CSV",
                  labelTw: "text-[12px] hidden sm:block",
                  onClick: () => !threeDotLoading.csv && exportFile("csv"),
                },
                {
                  icon: threeDotLoading.xlsx
                    ? "eos-icons:three-dots-loading"
                    : "gala:file-document",
                  label: "Export Excel",
                  labelTw: "text-[12px] hidden sm:block",
                  onClick: () => !threeDotLoading.xlsx && exportFile("xlsx"),
                },
              ]
              : undefined,
            filterRenderer: (props) => (
              <FilterComponent
                {...props}
                currentDate={true}
                onlyFilters={["from_date", "to_date"]}
              />
            ),
          },
          footer: { nextPrevBtn: true, pagination: true },
          columns,
          pageSize: 50,
        }}
      />

    </div>
  );
}
