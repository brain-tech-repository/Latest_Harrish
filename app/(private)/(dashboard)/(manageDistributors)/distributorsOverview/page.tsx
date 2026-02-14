"use client";
import ContainerCard from "@/app/components/containerCard";
import InputFields from "@/app/components/inputFields";
import React, { useEffect, useState } from "react";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table from "@/app/components/customTable";
import { Icon } from "@iconify-icon/react";
import { warehouseStocksKpi, distributorStockOverview } from "@/app/services/allApi";
import { CustomTableSkelton } from "@/app/components/customSkeleton";
import Skeleton from "@mui/material/Skeleton";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import FilterComponent from "@/app/components/filterComponent";
import { toInternationalQty } from "@/app/(private)/utils/formatNumber";

type CardItem = {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  percentage: number;
  isUp: boolean;
};


const itemColumns = [
  {
    key: "item_code",
    label: "Item",
    showByDefault: true,
    render: (row: any) => {
      const code = row.item_code ?? "";
      const name = row.item_name ?? "";
      if (!code && !name) return "-";
      return `${code}${code && name ? " - " : ""}${name}`;
    },
  },
  {
    key: "stock_qty",
    label: "Stock Qty",
    showByDefault: true,
    render: (row: any) => (typeof row.stock_qty === 'number' || (typeof row.stock_qty === 'string' && row.stock_qty !== '')) ? toInternationalQty(Number(row.stock_qty)) : '0',
    isSortable: true,
  },
  {
    key: "total_sold_qty",
    label: "Sold Qty",
    showByDefault: true,
    render: (row: any) => (typeof row.total_sold_qty === 'number' || (typeof row.total_sold_qty === 'string' && row.total_sold_qty !== '')) ? toInternationalQty(Number(row.total_sold_qty)) : '0',
    isSortable: true,
  },
  {
    key: "purchase",
    label: "Purchase Qty",
    showByDefault: true,
    render: (row: any) => (typeof row.purchase === 'number' || (typeof row.purchase === 'string' && row.purchase !== '')) ? toInternationalQty(Number(row.purchase)) : '0',
    isSortable: true,
  },
];


const OverallPerformance: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [stockData, setStockData] = useState<any>({
    "total_warehouse_valuation": "0.00",
    "today_loaded_qty": "0.00",
    "sales_total_valuation": "0.00",
  });
  const [stockLowQty, setStockLowQty] = useState({
    "count": 0.00,
    "items": []
  })
  const [topOrders, setTopOrders] = useState({
    "stocks": []
  })

  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("")
  const { warehouseOptions, ensureWarehouseLoaded } = useAllDropdownListData();


  const cards: CardItem[] = [
    {
      title: "Total Valuation",
      value: stockData?.total_warehouse_valuation?.total_valuation ? toInternationalNumber(stockData?.total_warehouse_valuation?.total_valuation) : 0.00,
      percentage: -12,
      icon: "carbon:currency",
      color: "#fceaef",
      isUp: false,
    },
    {
      title: "Distributor Stock",
      value: stockData?.total_warehouse_valuation?.total_qty ? toInternationalNumber(stockData?.total_warehouse_valuation?.total_qty, { maximumFractionDigits: 0 }) : 0.00,
      percentage: -10,
      icon: "maki:warehouse",
      color: "#fff0f2",
      isUp: false,
    }, {
      title: "Low Stock",
      value: stockLowQty.count,
      percentage: +16,
      icon: "fluent-emoji-high-contrast:money-bag",
      color: "#e0edeb",
      isUp: true,
    },
    {
      title: "Awaiting Delivery",
      value: stockData?.today_loaded_qty,
      percentage: +10,
      icon: "tabler:truck-loading",
      color: "#d8e6ff",
      isUp: true,
    },
  ];
  useEffect(() => {
    ensureWarehouseLoaded();
  }, [ensureWarehouseLoaded])
  async function callAllKpisData(id: string, filter?: string) {
    try {
      setLoading(true);

      const res = await warehouseStocksKpi(id);
      let topOrderRes;
      if (filter) {
        topOrderRes = await distributorStockOverview(id, { date_filter: filter });
      } else {
        topOrderRes = await distributorStockOverview(id);
      }

      setStockData(res);

      let lowCount = 0;
      if (topOrderRes && typeof topOrderRes.low_count !== 'undefined') {
        if (typeof topOrderRes.low_count === 'number') {
          lowCount = topOrderRes.low_count;
        } else if (!isNaN(Number(topOrderRes.low_count))) {
          lowCount = Number(topOrderRes.low_count);
        }
      }
      setStockLowQty({
        count: lowCount,
        items: []
      });
      const stocksRaw = Array.isArray(topOrderRes?.stocks)
        ? topOrderRes.stocks
        : Array.isArray(topOrderRes?.data?.items)
          ? topOrderRes.data.items
          : Array.isArray(topOrderRes?.data)
            ? topOrderRes.data
            : [];

      const stocksFromTopOrders = stocksRaw.map((it: any) => ({
        id: it.item_id ?? it.id ?? undefined,
        item_code: it.item_code ?? it.item?.item_code ?? it.erp_code ?? "",
        item_name: it.item_name ?? it.item?.name ?? it.item?.item_name ?? "",
        stock_qty: it.available_stock_qty !== undefined && it.available_stock_qty !== null && it.available_stock_qty !== '' ? Number(it.available_stock_qty) : 0,
        total_sold_qty: it.total_sales !== undefined && it.total_sales !== null && it.total_sales !== '' ? Number(it.total_sales) : 0,
        purchase: it.purchase_qty !== undefined && it.purchase_qty !== null && it.purchase_qty !== '' ? Number(it.purchase_qty) : 0,
        uoms: it.uoms ?? it.item?.uoms ?? [],
        health_flag: typeof it.health_flag === "number" ? it.health_flag : it.health_flag ? Number(it.health_flag) : 1,
        _raw: it,
      }));

      setTopOrders({ stocks: stocksFromTopOrders });
      setLoading(false);
    } catch (err) {
    }
  }
  return (
    <>

      <ContainerCard className="flex flex-col h-full w-full">

        <div className="flex justify-between md:items-center">
          <div>
            <p className="text-base font-bold">Distributors Overview</p>
          </div>

          <InputFields
            searchable={true}
            placeholder="Select Distributers"
            name="Distributers"
            value={selectedWarehouse}
            options={warehouseOptions}
            onChange={(e) => {
              setSelectedWarehouse(e.target.value);
              callAllKpisData(e.target.value, selectedFilter);
            }}
          />

        </div>

        <div className="mt-6 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 items-center md:gap-2.5 gap-4">

          {cards.map((card, index) => {
            return (
              !loading ? (
                <div key={index} className="flex items-center rounded-lg bg-white text-gray-700 shadow-md border border-gray-200 p-2 min-w-0" >
                  <div style={{ background: card.color }} className="p-2 rounded-lg min-w-[56px] flex-shrink-0"> <Icon icon={card.icon} width="48" height="48" /> </div>
                  <div key={index} className="relative flex flex-col w-full min-w-0">
                    <div className="p-4 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-600 font-medium">{card.title}</p>
                      </div>
                      <p className="mt-1 text-blue-gray-900 font-bold text-2xl break-words truncate max-w-full" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                        {card.value}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex items-center rounded-lg bg-white text-gray-700 shadow-md border border-gray-200 p-2 gap-[5px]" >
                  <Skeleton width={20} /><Skeleton width={20} /><Skeleton width={20} /><Skeleton width={20} />
                </div>
              )
            );
          })}

        </div>
        <br />
        <div className="flex flex-col h-full">

          {loading ? <CustomTableSkelton /> :
            <Table
              data={topOrders?.stocks ? topOrders?.stocks : []}
              config={{
                header: {
                  searchBar: false,
                  columnFilter: false,
                  filterRenderer: (props) => (
                    <FilterComponent
                      {...props}
                      onlyFilters={['from_date', 'to_date', 'day_filter']}
                      disabled={!selectedWarehouse}
                      api={async (payload: any) => {
                        if (!selectedWarehouse) return;
                        try {
                          setLoading(true);
                          let topOrderRes;
                          const params: any = {};
                          // If day_filter is selected, ignore from_date and to_date
                          if (payload.day_filter) {
                            params.range = payload.day_filter;
                          } else {
                            // Only send from_date and to_date if day_filter is not selected
                            if (payload.from_date) {
                              params.from_date = payload.from_date;
                            }
                            if (payload.to_date) {
                              params.to_date = payload.to_date;
                            }
                          }
                          topOrderRes = await distributorStockOverview(selectedWarehouse, params);
                          setTopOrders({ stocks: topOrderRes?.data?.items });
                          setStockLowQty({
                            count: topOrderRes?.data?.low_count,
                            items: []
                          });
                          setSelectedFilter(payload.day_filter || `${payload.from_date || ''}|${payload.to_date || ''}`);
                        } catch (err) {
                          console.error("Filter API error", err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                  ),
                },
                columns: itemColumns,
                pageSize: 1000000,
                rowColor: (row: any) => {
                  const healthFlag = row.health_flag ?? 1;
                  if (healthFlag === 2) return "#FEF9C3";
                  if (healthFlag === 3) return "#FECACA";
                  return "";
                },
              }}

            />}
        </div>

      </ContainerCard>
    </>
  );
};

export default OverallPerformance;
