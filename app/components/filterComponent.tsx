import { useEffect, useState } from "react";
import { useAllDropdownListData } from "./contexts/allDropdownListData";
import { FilterRendererProps } from "./customTable";

// Extend props to allow specifying which filters to show
type FilterComponentProps = FilterRendererProps & {
  onlyFilters?: string[]; // e.g. ['warehouse_id', 'company_id']
  currentDate?: boolean;
  currentMonth?: boolean; // New prop to select current month range
  api?: (payload: any) => Promise<any>; // Optional API function to call on filter submit
  disabled?: boolean;
};
import SidebarBtn from "./dashboardSidebarBtn";
import InputFields from "./inputFields";
import { regionList, subRegionList, warehouseList, routeList, salesmanList } from "@/app/services/allApi";
import { assetsStatusList } from "@/app/services/assetsApi";

type DropdownOption = {
  value: string;
  label: string;
};

type Region = {
  id: number;
  region_name?: string;
  name?: string;
};

type Area = {
  id: number;
  area_name?: string;
  name?: string;
};

type Warehouse = {
  id: number;
  warehouse_name?: string;
  warehouse_code?: string;
  name?: string;
  code?: string;
};

type Route = {
  id: number;
  route_name?: string;
  route_code?: string;
  name?: string;
  code?: string;
  osa_code?: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: boolean;
  message?: string;
};

export default function FilterComponent(filterProps: FilterComponentProps) {
  const { disabled = false } = filterProps;
  const {
    customerSubCategoryOptions,
    companyOptions,

    // fetchSalesmanByRouteOptions,
    assetsModelOptions,
    ensureCompanyLoaded,

    ensureSalesmanLoaded,
    channelOptions,
    ensureAssetsModelLoaded
  } = useAllDropdownListData();

  useEffect(() => {
    ensureCompanyLoaded();
    // ensureSalesmanLoaded();
    if (showFilter("model")) {
      ensureAssetsModelLoaded();

    };
  }, [ensureCompanyLoaded, ensureAssetsModelLoaded]);
  const { onlyFilters, currentDate, currentMonth, api } = filterProps;

  // Set default date for from_date and to_date based on currentDate or currentMonth
  // Set default date for from_date and to_date based on currentDate or currentMonth
  useEffect(() => {
    if (currentMonth) {
      // Set to first and last day of current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // First day
      const firstDay = new Date(year, month, 2);
      // Last day
      const lastDay = new Date(year, month + 1, 1);
      const firstDayStr = firstDay.toISOString().slice(0, 10);
      const lastDayStr = lastDay.toISOString().slice(0, 10);
      filterProps.setPayload((prev: any) => ({ ...prev, from_date: firstDayStr, to_date: lastDayStr }));
    } else if (currentDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (!filterProps.payload.from_date) {
        filterProps.setPayload((prev: any) => ({ ...prev, from_date: today }));
      }
      if (!filterProps.payload.to_date) {
        filterProps.setPayload((prev: any) => ({ ...prev, to_date: today }));
      }
    } else {
      // If neither, clear the dates
      filterProps.setPayload((prev: any) => ({ ...prev, from_date: "", to_date: "" }));
    }
    // Only run on mount or when currentDate/currentMonth changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, currentMonth]);

  const [skeleton, setSkeleton] = useState({
    company: false,
    region: false,
    area: false,
    warehouse: false,
    route: false,
    salesteam: false,
  });
  const [regionOptions, setRegionOptions] = useState<DropdownOption[]>([]);
  const [areaOptions, setAreaOptions] = useState<DropdownOption[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<DropdownOption[]>([]);
  const [routeOptions, setRouteOptions] = useState<DropdownOption[]>([]);
  const [salesmanOptions, setSalesmanOptions] = useState<DropdownOption[]>([]);
  const [assetsStatusOptions, setAssetsStatusOptions] = useState<DropdownOption[]>([]);

  const {
    payload,
    setPayload,
    submit,
    clear,
    activeFilterCount,
    isApplying,
    isClearing,
  } = filterProps;


  // Always store these keys as arrays in the payload
  const keysToArray = [
    "area_id",
    "region_id",
    "warehouse_id",
    "route_id",
    "company_id",
    "salesman_id",
    "model",
    "status",
    "request_status",
  ];

  const toArray = (v: any) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.includes(",")) return v.split(",").filter(Boolean);
    if (typeof v === "string" && v !== "") return [v];
    if (typeof v === "number") return [String(v)];
    return [];
  };

  const onChangeArray = (key: string, value: any) => {
    if (keysToArray.includes(key)) {
      setPayload((prev: any) => ({ ...prev, [key]: toArray(value) }));
    } else {
      setPayload((prev: any) => ({ ...prev, [key]: value }));
    }
  }

  const companyVal = toArray(payload.company_id);
  const regionVal = toArray(payload.region_id);
  const areaVal = toArray(payload.area_id);
  const warehouseVal = toArray(payload.warehouse_id);
  const routeVal = toArray(payload.route_id);
  const salesVal = toArray(payload.salesman_id);
  const modelNumberVal = toArray(payload.model);
  const statusVal = toArray(payload.status);
  const requestStatusVal = toArray(payload.request_status);

  // Fetch Assets Status List




  // ✅ When Company changes → Fetch Regions
  useEffect(() => {
    if (!companyVal.length) {
      setRegionOptions([]);
      return;
    }

    const fetchRegions = async () => {
      setSkeleton((prev) => ({ ...prev, region: true }));
      try {
        const regions: ApiResponse<Region[]> = await regionList({
          company_id: companyVal.join(","),
          dropdown: "true",
        });
        setRegionOptions(
          regions?.data?.map((r: Region) => ({
            value: String(r.id),
            label: r.region_name || r.name || "",
          })) || []
        );
      } catch (err) {
        console.error("Failed to fetch region list:", err);
        setRegionOptions([]);
      }
      setSkeleton((prev) => ({ ...prev, region: false }));
    };

    fetchRegions();
  }, [companyVal.join(",")]);

  useEffect(() => {
    (!(payload.from_date && payload.to_date) && !currentMonth) && filterProps.setPayload((prev: any) => ({ ...prev, from_date: new Date().toISOString().split("T")[0], to_date: new Date().toISOString().split("T")[0] }));
  }, [payload.from_date, payload.to_date]);

  // ✅ When Region changes → Fetch Areas
  useEffect(() => {
    if (!regionVal.length) {
      setAreaOptions([]);
      return;
    }

    const fetchAreas = async () => {
      setSkeleton((prev) => ({ ...prev, area: true }));

      try {
        const res: ApiResponse<{ data: Area[] } | Area[]> = await subRegionList(
          { region_id: regionVal.join(","), dropdown: "true" }
        );
        const areaList =
          (res as { data: Area[] })?.data || (res as Area[]) || [];

        setAreaOptions(
          areaList.map((a: Area) => ({
            value: String(a.id),
            label: a.area_name || a.name || "",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch area list:", err);
        setAreaOptions([]);
      }
      setSkeleton((prev) => ({ ...prev, area: false }));
    };

    fetchAreas();
  }, [regionVal.join(",")]);

  useEffect(() => {
    if (!areaVal.length) {
      setWarehouseOptions([]);
      return;
    }

    const fetchWarehouses = async () => {
      setSkeleton((prev) => ({ ...prev, warehouse: true }));

      try {
        const res: ApiResponse<{ data: Warehouse[] } | Warehouse[]> =
          await warehouseList({ area_id: areaVal.join(","), dropdown: "true",allData : "true" });
        const warehousesList =
          (res as { data: Warehouse[] })?.data || (res as Warehouse[]) || [];

        setWarehouseOptions(
          warehousesList.map((w: Warehouse) => ({
            value: String(w.id),
            label: `${w.warehouse_code || w.code || "-"} - ${w.warehouse_name || w.name || ""}`,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch warehouse list:", err);
        setWarehouseOptions([]);
      }
      setSkeleton((prev) => ({ ...prev, warehouse: false }));

    };

    fetchWarehouses();
  }, [areaVal.join(",")]);

  // ✅ When Warehouse changes → Fetch Routes
  useEffect(() => {
    if (!warehouseVal.length) {
      setRouteOptions([]);
      return;
    }


    const fetchRoutes = async () => {
      setSkeleton((prev) => ({ ...prev, route: true }));
      try {
        const res: ApiResponse<{ data: Route[] } | Route[]> = await routeList({
          warehouse_id: warehouseVal.join(","),
          dropdown: "true",
        });
        const routeListData =
          (res as { data: Route[] })?.data || (res as Route[]) || [];

        setRouteOptions(
          routeListData.map((r: Route) => ({
            value: String(r.id),
            label: `${r.route_code || r.code || ""} - ${r.route_name || r.name || ""}`,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch route list:", err);
        setRouteOptions([]);
      }
      setSkeleton((prev) => ({ ...prev, route: false }));
    };
    fetchRoutes();
  }, [warehouseVal.join(",")]);

  useEffect(() => {
    if (!areaVal.length) {
      setSalesmanOptions([]);
      return;
    }
    const fetchSalesman = async () => {
      setSkeleton((prev) => ({ ...prev, salesteam: true }));
      try {
        const res: ApiResponse<{ data: Route[] } | Route[]> = await salesmanList({
          route_id: routeVal.join(","),
          dropdown: "true",
        });
        const routeListData =
          (res as { data: Route[] })?.data || (res as Route[]) || [];

        setSalesmanOptions(
          routeListData.map((r: Route) => ({
            value: String(r.id),
            label: `${r.osa_code || r.code || ""} - ${r.route_name || r.name || ""}`,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch salesman list:", err);
        setSalesmanOptions([]);
      }
      setSkeleton((prev) => ({ ...prev, salesteam: false }));
    };

    fetchSalesman();
  }, [routeVal.join(",")]);


  // Helper to check if a filter should be shown
  const showFilter = (key: string) => {
    // Only show day_filter if onlyFilters is provided and includes it
    if (key === 'day_filter') {
      return Array.isArray(onlyFilters) && onlyFilters.includes('day_filter');
    }
    if (key === 'model') {
      return Array.isArray(onlyFilters) && onlyFilters.includes('model');
    }
    if (key === 'request_status') {
      return Array.isArray(onlyFilters) && onlyFilters.includes('request_status');
    }
    if (key === 'status') {
      return Array.isArray(onlyFilters) && onlyFilters.includes('status');
    }
    if (!onlyFilters) return true;
    return onlyFilters.includes(key);
  };

    if(showFilter("status")){
  useEffect(() => {
    (async () => {
      try {
        const res = await assetsStatusList({});
        const data = Array.isArray(res) ? res : res?.data;

        if (Array.isArray(data)) {
          const options = data.map((item: any) => ({
            value: String(item.id),
            label: `${item.name}`,
          }));
          setAssetsStatusOptions(options);
        }
      } catch (err) {
        console.error("Failed to fetch asset status list:", err);
      }
    })();
  }, []);
};

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Day Filter Dropdown */}
      {showFilter("day_filter") && (
        <InputFields
          label="Day Filter"
          name="day_filter"
          placeholder="Select Filter"
          type="select"
          options={[
            { value: "yesterday", label: "Yesterday" },
            { value: "today", label: "Today" },
            { value: "3days", label: "Last 3 Days" },
            { value: "7days", label: "Last 7 Days" },
            { value: "lastmonth", label: "Last Month" },
          ]}
          value={
            Array.isArray(payload.day_filter)
              ? payload.day_filter.map((v: any) => (typeof v === "number" ? String(v) : v))
              : typeof payload.day_filter === "number"
                ? String(payload.day_filter)
                : payload.day_filter || ""
          }
          // disabled={disabled || !!payload.from_date || !!payload.to_date}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            setPayload((prev: any) => ({ ...prev, day_filter: raw }));
          }}
        />
      )}
      {/* Start Date */}
      {showFilter("from_date") && (
        <InputFields
          label="Start Date"
          name="from_date"
          type="date"
          value={
            typeof payload.from_date === "number"
              ? String(payload.from_date)
              : (payload.from_date as string | undefined) ?? ""
          }
          disabled={disabled || !!payload.day_filter}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            setPayload((prev: any) => ({ ...prev, from_date: raw }));
          }}
        />
      )}
      {/* End Date */}
      {showFilter("to_date") && (
        <InputFields
          label="End Date"
          name="to_date"
          type="date"
          min={typeof payload.from_date === "number" ? String(payload.from_date) : (payload.from_date as string | undefined) ?? ""}
          value={
            typeof payload.to_date === "number"
              ? String(payload.to_date)
              : (payload.to_date as string | undefined) ?? ""
          }
          disabled={disabled || !!payload.day_filter || !payload.from_date}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            setPayload((prev: any) => ({ ...prev, to_date: raw }));
          }}
        />
      )}
      {/* Company */}
      {showFilter("company_id") && (
        <InputFields
          label="Company"
          name="company_id"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          showSkeleton={skeleton.company}
          options={Array.isArray(companyOptions) ? companyOptions : []}
          value={companyVal as any}
          disabled={disabled}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("company_id", val);
            // reset downstream when parent changes
            onChangeArray("region_id", []);
            onChangeArray("area_id", []);
            onChangeArray("warehouse_id", []);
            onChangeArray("route_id", []);
            onChangeArray("salesman_id", []);
          }}
        />
      )}
      {/* Region */}
      {showFilter("region_id") && (
        <InputFields
          label="Region"
          name="region_id"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          showSkeleton={skeleton.region}
          disabled={disabled || companyVal.length === 0}
          options={Array.isArray(regionOptions) ? regionOptions : []}
          value={regionVal as any}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("region_id", val);
            onChangeArray("area_id", []);
            onChangeArray("warehouse_id", []);
            onChangeArray("route_id", []);
            onChangeArray("salesman_id", []);
          }}
        />
      )}
      {/* Area */}
      {showFilter("area_id") && (
        <InputFields
          label="Area"
          name="area_id"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          showSkeleton={skeleton.area}
          disabled={disabled || regionVal.length === 0}
          options={Array.isArray(areaOptions) ? areaOptions : []}
          value={areaVal as any}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("area_id", val);
            onChangeArray("warehouse_id", []);
            onChangeArray("route_id", []);
            onChangeArray("salesman_id", []);
          }}
        />
      )}
      {/* Distributor */}
      {showFilter("warehouse_id") && (
        <InputFields
          label="Distributor"
          name="warehouse_id"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          showSkeleton={skeleton.warehouse}
          disabled={disabled || areaVal.length === 0 || areaOptions.length === 0}
          options={Array.isArray(warehouseOptions) ? warehouseOptions : []}
          value={warehouseVal as any}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("warehouse_id", val);
            onChangeArray("route_id", []);
            onChangeArray("salesman_id", []);
          }}
        />
      )}
      {/* Route */}
      {showFilter("route_id") && (
        <InputFields
          label="Route"
          name="route_id"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          showSkeleton={skeleton.route}
          disabled={disabled || warehouseVal.length === 0}
          options={Array.isArray(routeOptions) ? routeOptions : []}
          value={routeVal as any}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            // fetchSalesmanByRouteOptions(raw)
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("route_id", val);
            onChangeArray("salesman_id", []);
          }}
        />
      )}
      {/* Sales Team */}
      {showFilter("salesman_id") && (
        <InputFields
          label="Sales Team"
          name="salesman_id"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          showSkeleton={skeleton.salesteam}
          disabled={disabled || routeVal.length === 0}
          options={Array.isArray(salesmanOptions) ? salesmanOptions : []}
          value={salesVal as any}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("salesman_id", val);
          }}
        />
      )}
      {showFilter("model") && (
        <InputFields
          label="Model Number"
          name="model"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          // showSkeleton={skeleton.salesteam}
          // disabled={disabled || routeVal.length === 0}
          options={Array.isArray(assetsModelOptions) ? assetsModelOptions : []}
          value={modelNumberVal as any}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("model", val);
          }}
        />
      )}
      {/* Status */}
      {showFilter("status") && (
        <InputFields
          label="Status"
          name="status"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          disabled={disabled}
          options={Array.isArray(assetsStatusOptions) ? assetsStatusOptions : []}
          value={statusVal as any}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("status", val);
          }}
        />
      )}
      {showFilter("request_status") && (
        <InputFields
          label="Request Status"
          name="request_status"
          type="select"
          searchable={true}
          isSingle={false}
          multiSelectChips
          disabled={disabled}
          options={[
            { value: "1", label: "Sales Team Requested" },
            { value: "2", label: "Area Sales Manager Accepted" },
            { value: "3", label: "Area Sales Manager Rejected" },
            { value: "4", label: "Chiller Officer Accepted" },
            { value: "5", label: "Chiller Officer Rejected" },
            { value: "6", label: "Completed" },
            { value: "7", label: "Chiller Manager Rejected" },
            { value: "8", label: "Sales/Key Manager Rejected" },
            { value: "9", label: "Refused by Customer" },
            { value: "10", label: "Fridge Manager Accepted" },
            { value: "11", label: "Fridge Manager Rejected" },
          ]}
          value={requestStatusVal as any}
          onChange={(e) => {
            const raw = (e as any)?.target?.value ?? e;
            const val = Array.isArray(raw)
              ? raw
              : typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : [];
            onChangeArray("request_status", val);
          }}
        />
      )}
      {/* Buttons */}
      <div className="col-span-2 flex justify-end gap-2 mt-2">
        <SidebarBtn
          isActive={false}
          type="button"
          onClick={() => clear()}
          label="Clear All"
          buttonTw="px-3 py-2 h-9"
          disabled={disabled || isClearing || activeFilterCount === 0}
        />
        <SidebarBtn
          isActive={true}
          type="button"
          onClick={async () => {
            if (api) {
              await api(payload);
            }
            submit(payload);
          }}
          label="Apply Filter"
          buttonTw="px-4 py-2 h-9"
          disabled={disabled || isApplying || activeFilterCount === 0}
        />
      </div>
    </div>
  );
}