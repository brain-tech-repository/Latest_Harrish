"use client";

import ContainerCard from "@/app/components/containerCard";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table, {
  TableDataType
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import InputFields from "@/app/components/inputFields";
import Logo from "@/app/components/logo";
import Link from "@/app/components/smartLink";
import {
  getSalesmanByWarehouse,
  getSalesmanByWarehouseId,
  salesmanLoadHeaderAdd,
  salesmanLoadHeaderById,
  salesmanLoadHeaderUpdate
} from "@/app/services/agentTransaction";
import { genearateCode, itemList, warehouseStockTopOrders } from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState,useCallback } from "react";
import * as yup from "yup";
interface ItemUOM {
  id: number;
  item_id: number;
  uom_type: string;
  name: string;
  price: string;
  is_stock_keeping: boolean;
  upc: string;
  enable_for: string;
  uom_id: number;
}

export default function AddEditSalesmanLoad() {
  const {
    salesmanTypeOptions,
    routeOptions,
    salesmanOptions,
    warehouseOptions,
    fetchRouteOptions,
    fetchSalesmanByRouteOptions,
    projectOptions,
    ensureProjectLoaded, ensureRouteLoaded, ensureSalesmanLoaded, ensureSalesmanTypeLoaded, ensureWarehouseLoaded } = useAllDropdownListData();

  // Load dropdown data
  useEffect(() => {
    ensureProjectLoaded();
    ensureRouteLoaded();
    ensureSalesmanLoaded();
    ensureSalesmanTypeLoaded();
    ensureWarehouseLoaded();
  }, [ensureProjectLoaded, ensureRouteLoaded, ensureSalesmanLoaded, ensureSalesmanTypeLoaded, ensureWarehouseLoaded]);

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();
  const params = useParams();
  const [nestedLoading, setNestedLoading] = useState(false);
  const loadUUID = params?.uuid as string | undefined;
  const isEditMode = loadUUID !== undefined && loadUUID !== "add";

  interface FormData {
    id: number,
    erp_code: string,
    item_code: string,
    name: string,
    description: string,
    uom: {
      id: number,
      item_id: number,
      uom_type: string,
      name: string,
      price: string,
      is_stock_keeping: boolean,
      upc: string,
      enable_for: string
    }[],
    brand: string,
    image: string,
    category: {
      id: number,
      name: string,
      code: string
    },
    itemSubCategory: {
      id: number,
      name: string,
      code: string
    },
    warehouse_stocks: {
      id: number,
      qty: number,
    }[],
    shelf_life: string,
    commodity_goods_code: string,
    excise_duty_code: string,
    status: number,
    is_taxable: boolean,
    has_excies: boolean,
    item_weight: string,
    volume: number
  }


  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    salesman_type: "",
    warehouse: "",
    warehouse_id: "",
    route: "",
    salesman: "",
    project_type: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Track per-row errors for PCS and CSE
  const [rowQtyErrors, setRowQtyErrors] = useState<{ [key: string]: { pcs?: string; cse?: string } }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [itemData, setItemData] = useState<TableDataType[]>([]);
  const [isItemsLoaded, setIsItemsLoaded] = useState(false);
  const [itemOptions, setItemsOptions] = useState();
  const [projectSalesmanOptions, setProjectSalesmanOptions] = useState<any[]>([]);
  const [salesmanWarehouseRouteOptions, setSalesmanWarehouseRouteOptions] = useState<any[]>([]);
  const [itemId, setItemId] = useState<string[]>([]);
  // Store last API data for mapping salesman_id to route_id
  const [lastProjectSalesmanData, setLastProjectSalesmanData] = useState<any[]>([]);
  const [salesmanWarehouseOptions, setSalesmanWarehouseOptions] = useState<any[]>([]);

  // Fetch salesmen for project type (salesman_type === '6')
  useEffect(() => {
    const fetchProjectSalesmen = async () => {
      if (form.salesman_type === "6" && form.warehouse) {
        setSkeleton((prev) => ({ ...prev, salesman: true }));
        try {
          const res = await getSalesmanByWarehouse({ warehouse_id: form.warehouse });
          const data = res?.data || [];
          setLastProjectSalesmanData(data);
          const options = data.map((item: any) => ({
            value: String(item.salesman_id),
            label: `${item.salesman_code ? item.salesman_code + ' - ' : ''}${item.salesman_name}`
          }));
          setProjectSalesmanOptions(options);
        } catch (e) {
          setProjectSalesmanOptions([]);
          setLastProjectSalesmanData([]);
        } finally {
          setSkeleton((prev) => ({ ...prev, salesman: false }));
        }
      } else {
        setProjectSalesmanOptions([]);
        setLastProjectSalesmanData([]);
      }
    };
    fetchProjectSalesmen();
  }, [form.salesman_type, form.warehouse]);
  const [orderData, setOrderData] = useState<FormData[]>([]);
  const [skeleton, setSkeleton] = useState({
    route: false,
    salesman: false,
    item: false
  });
  const codeGeneratedRef = useRef(false);


  useEffect(() => {
    const fetchSalesmanByWarehouseId = async () => {
      if (form.salesman_type === "2" && form.warehouse) {
        setSkeleton((prev) => ({ ...prev, salesman: true }));
        try {
          const res = await getSalesmanByWarehouseId({ warehouse_id: form.warehouse, type: form.salesman_type });
          const data = res?.data.salesmen || [];
          setSalesmanWarehouseOptions(data);
          const options = data.map((item: any) => ({
            value: String(item.id),
            label: `${item.osa_code ? item.osa_code + ' - ' : ''}${item.name}`
          }));
          setSalesmanWarehouseRouteOptions(options);
        } catch (e) {
          setSalesmanWarehouseRouteOptions([]);
          setSalesmanWarehouseOptions([]);
        } finally {
          setSkeleton((prev) => ({ ...prev, salesman: false }));
        }
      } else {
        setSalesmanWarehouseRouteOptions([]);
        setSalesmanWarehouseOptions([]);
      }
    };
    fetchSalesmanByWarehouseId();
  }, [form.salesman_type, form.warehouse]);

  // ✅ Load items based on selected warehouse
  useEffect(() => {
    if (form.warehouse) {
      (async () => {
        try {
          setNestedLoading(true);

          // Fetch warehouse stock details
          const stockRes = await warehouseStockTopOrders(form.warehouse);
          const stocksArray = stockRes.data?.stocks || stockRes.stocks || [];

          // Fetch full item details to get proper UOM IDs
          const itemsRes = await itemList({ allData: "true", warehouse_id: form.warehouse });
          const fullItems = itemsRes.data || [];
          const label = fullItems.map((item: any) => ({
            value: String(item.id),
            label: `${item.erp_code ? item.erp_code + ' - ' : ''}${item.name}`
          }));
          setItemsOptions(label);

          // Merge stock data with full item data
          const data = stocksArray
            .map((stockItem: any) => {
              // Find the full item details
              const fullItem = fullItems.find((item: any) => item.id === stockItem.item_id);

              if (!fullItem) {
                console.warn(`Item ${stockItem.item_id} not found in full items list`);
                return null;
              }



              const stockUoms = Array.isArray(stockItem.uoms) ? stockItem.uoms : [];
              const fallbackUoms = Array.isArray(fullItem.item_uoms) ? fullItem.item_uoms : [];
              const sourceUoms = stockUoms.length ? stockUoms : fallbackUoms;

              const normalizedUoms = sourceUoms.map((u: any) => ({
                ...u,
                name: u.name ?? u.uom_name ?? u.uom?.name ?? "",
                uom_type: u.uom_type ?? u.type ?? u.uom?.uom_type ?? "",
                uom_id: u.uom_id ?? u.uom?.id ?? u.id,
              }));

              return {
                id: stockItem.item_id,
                erp_code: stockItem.erp_code,
                name: stockItem.item_name,
                cse_qty: "",
                pcs_qty: "",
                status: 1,
                uom: normalizedUoms,
                warehouse_stocks: [{
                  warehouse_id: Number(form.warehouse),
                  qty: Number(stockItem.stock_qty) || 0
                }],
              };
            })
            .filter((item: any) => {
              if (!item) return false;
              // Only show items with stock > 0
              const warehouseStock = item.warehouse_stocks.find(
                (stock: any) => stock.warehouse_id?.toString() === form.warehouse
              );
              return warehouseStock && warehouseStock.qty > 0;
            });
          setItemData(data);
          setIsItemsLoaded(true);
        } catch (error) {
          // console.error("❌ Error fetching warehouse stock:", error);
          showSnackbar("Failed to fetch items for the selected warehouse", "error");
        } finally {
          setNestedLoading(false);
        }
      })();
    }
  }, [form.warehouse, setNestedLoading, showSnackbar]);


  // Helper to get UPC for a given UOM type
  const getUpc = (uoms: any[], type: 'primary' | 'secondary') => {
    const uom = uoms?.find((u) => u.uom_type === type);
    return uom ? Number(uom.upc) || 1 : 1;
  };

  // Helper to get available stock for an item
  const getAvailableStock = (row: any) => {
    const warehouseStock = row?.warehouse_stocks?.find(
      (stock: any) => stock.warehouse_id?.toString() === form.warehouse
    );
    return warehouseStock?.qty ?? 0;
  };

  // OnChange: update value as-is (string), OnBlur: clamp/validate
  const handleQtyInput = (
    index: number,
    field: 'pcs_qty' | 'cse_qty',
    value: string
  ) => {
    const updated = [...itemData];
  
    // allow only numbers
    const cleanValue = value.replace(/[^0-9]/g, '');
  
    updated[index] = {
      ...updated[index],
      [field]: cleanValue,
    };
  
    setItemData(updated);
  
    const row = updated[index];
  
    const secondary_upc = getUpc(row.uom, 'secondary');
    const availableStock = getAvailableStock(row);
  
    const pcs_qty = Number(
      field === 'pcs_qty' ? cleanValue : row.pcs_qty || 0
    );
    const cse_qty = Number(
      field === 'cse_qty' ? cleanValue : row.cse_qty || 0
    );
  
    const usedByCse = cse_qty * secondary_upc;
    const remainingPcs = Math.max(0, availableStock - usedByCse);
    const maxCseQty =
      secondary_upc > 0 ? Math.floor(availableStock / secondary_upc) : 0;
  
    const newErrors: { pcs?: string; cse?: string } = {};
  
    // ✅ Validate CSE
    if (cse_qty > maxCseQty) {
      newErrors.cse = 'Entered qty is greater than stock';
    }
  
    // ✅ Validate PCS against remaining stock
    if (pcs_qty > remainingPcs) {
      newErrors.pcs = 'Entered qty is greater than stock';
    }
  
    // ✅ Update error state correctly
    if (!newErrors.pcs && !newErrors.cse) {
      setRowQtyErrors((prev) => {
        const { [index]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setRowQtyErrors((prev) => ({
        ...prev,
        [index]: newErrors,
      }));
    }
  };

  const handleQtyBlur = (index: number, field: 'pcs_qty' | 'cse_qty') => {
    const updated = [...itemData];
    const row = updated[index];

    const secondary_upc = getUpc(row.uom, 'secondary');
    const availableStock = getAvailableStock(row);

    let pcs_qty = Number(row.pcs_qty || 0);
    let cse_qty = Number(row.cse_qty || 0);

    // Clamp CSE to its own max
    const maxCseQty = secondary_upc > 0 ? Math.floor(availableStock / secondary_upc) : 0;
    if (cse_qty > maxCseQty) cse_qty = maxCseQty;

    if (field === 'pcs_qty') {
      // Only clamp PCS to allowed max, do NOT change CSE
      const remainingPcs = Math.max(0, availableStock - cse_qty * secondary_upc);
      if (pcs_qty > remainingPcs) pcs_qty = remainingPcs;
      // Do NOT change cse_qty
    } else if (field === 'cse_qty') {
      // Clamp CSE to max, and clamp PCS to remaining
      const remainingPcs = Math.max(0, availableStock - cse_qty * secondary_upc);
      if (pcs_qty > remainingPcs) pcs_qty = remainingPcs;
    }

    updated[index] = {
      ...row,
      cse_qty: cse_qty ? cse_qty.toString() : '',
      pcs_qty: pcs_qty ? pcs_qty.toString() : '',
    };

    setItemData(updated);
  };

  const [code, setCode] = useState("");
  useEffect(() => {
    setSkeleton({ ...skeleton, item: true });
    // fetchItem("");

    // generate code
    if (!codeGeneratedRef.current) {
      codeGeneratedRef.current = true;
      (async () => {
        const res = await genearateCode({
          model_name: "salesman_load",
        });
        if (res?.code) {
          setCode(res.code);
        }
        setLoading(false);
      })();
    }
  }, []);

  // ✅ Fetch existing data in edit mode
  useEffect(() => {
    if (isEditMode && loadUUID && isItemsLoaded) {
      setLoading(true);
      (async () => {
        try {
          const res = await salesmanLoadHeaderById(String(loadUUID), {});
          const data = res?.data ?? res;

          const warehouseId = data?.warehouse?.id?.toString() || "";
          const salesmanId = data?.salesman?.id?.toString() || "";

          setForm({
            salesman_type: data?.salesman_type || "",
            warehouse: data?.warehouse?.id?.toString() || "",
            warehouse_id: data?.warehouse_id?.id?.toString() || "",
            route: data?.route?.id?.toString() || "",
            salesman: data?.salesman?.id?.toString(),
            project_type:
              data?.projecttype?.id?.toString() || data?.project_type || "",
          });

          // Populate CSE / PCS values from details array using item IDs and UOM
          if (data?.details && Array.isArray(data.details)) {
            setItemData((prevItems) =>
              prevItems.map((item) => {
                const existingDetail = data.details.find(
                  (detail: any) => detail.item?.id === item.id
                );
                if (!existingDetail) return item;

                const uomName = existingDetail.uom?.name?.toUpperCase?.() || existingDetail.uom_type?.toUpperCase?.() || "";
                const uomType = existingDetail.uom?.uom_type?.toUpperCase?.() || existingDetail.uom_type?.toUpperCase?.() || "";
                const isPcs = uomName.includes("PAC") || uomName.includes("PCS") || uomType.includes("SECONDARY");
                return {
                  ...item,
                  cse_qty: isPcs ? item.cse_qty ?? "" : existingDetail.qty?.toString() || "",
                  pcs_qty: isPcs ? existingDetail.qty?.toString() || "" : item.pcs_qty ?? "",
                };
              })
            );
          }
        } catch (err) {
          showSnackbar("Failed to fetch details", "error");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isEditMode, loadUUID, isItemsLoaded, setLoading, showSnackbar]);

  // Validation Schema: Route is required unless salesman_type is '6' (project)
  const validationSchema = yup.object().shape({
    salesman_type: yup.string().required("Sales Team Type is required"),
    warehouse: yup.string().required("Distributor is required"),
    route: yup.string().when('salesman_type', {
      is: (val: string) => val !== '6',
      then: (schema) => schema.required('Route is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    salesman: yup.string().required("Sales Team is required"),
  });

  const handleChange = (field: string, value: string) => {
    // If selecting salesman in project mode, also set route from selected salesman option
    if (field === "salesman" && form.salesman_type === "6") {
      const match = lastProjectSalesmanData.find((item: any) => String(item.salesman_id) === value);
      setForm((prev) => ({ ...prev, salesman: value, route: match ? String(match.route_id) : "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ✅ Handle Qty Change
  const handleQtyChange = (itemId: string | number, value: string) => {
    setItemData((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, qty: value } : item))
    );
  };

  // ✅ Handle Submit
  const handleSubmit = async () => {
    try {
      await validationSchema.validate(form, { abortEarly: false });
      setErrors({});
      setSubmitting(true);


      // Always generate details for items with any qty entered in BOX (cse_qty) or OUT (pcs_qty)
      const validItems = itemData.filter((i) => {
        const cseQty = Number(i.cse_qty || 0);
        const pcsQty = Number(i.pcs_qty || 0);
        return cseQty > 0 || pcsQty > 0;
      });

      if (validItems.length === 0) {
        showSnackbar("Please add at least one item with quantity", "error");
        setSubmitting(false);
        return;
      }

      // Only generate details for the correct UOM type: if OUT (pcs_qty) is filled, only include the UOM with type 'primary' or name containing 'OUT' or 'PCS'.
      // If BOX (cse_qty) is filled, only include the UOM with type 'secondary' or name containing 'BOX' or 'CSE'.
      const details = validItems.flatMap((singleItems: any) => {
        if (!Array.isArray(singleItems.uom)) return [];
        const cseQty = Number(singleItems.cse_qty || 0);
        const pcsQty = Number(singleItems.pcs_qty || 0);
        const detailsArr: any[] = [];
        if (cseQty > 0) {
          // Find the UOM for cse_qty (BOX)
          const cseUom = singleItems.uom.find((u: any) => {
            const name = (u.name || '').toUpperCase();
            const type = (u.uom_type || '').toUpperCase();
            return type === 'SECONDARY' || name.includes('BOX') || name.includes('CSE');
          });
          if (cseUom) {
            detailsArr.push({
              item_id: Number(singleItems.id),
              qty: cseQty,
              uom: cseUom.uom_id ?? cseUom.id ?? cseUom.uom?.id,
              type: 'cse_qty',
            });
          }
        }
        if (pcsQty > 0) {
          // Find the UOM for pcs_qty (OUT)
          const pcsUom = singleItems.uom.find((u: any) => {
            const name = (u.name || '').toUpperCase();
            const type = (u.uom_type || '').toUpperCase();
            return type === 'PRIMARY' || name.includes('OUT') || name.includes('PCS');
          });
          if (pcsUom) {
            detailsArr.push({
              item_id: Number(singleItems.id),
              qty: pcsQty,
              uom: pcsUom.uom_id ?? pcsUom.id ?? pcsUom.uom?.id,
              type: 'pcs_qty',
            });
          }
        }
        return detailsArr;
      });

      const payload: any = {
        osa_code: code,
        salesman_type: Number(form.salesman_type),
        warehouse_id: Number(form.warehouse),
        route_id: Number(form.route),
        salesman_id: Number(form.salesman),
        status: 1,
        details: details,
      };
      if (form.project_type) {
        payload.project_type = Number(form.project_type);
      }

      let res;
      if (isEditMode && loadUUID) {
        res = await salesmanLoadHeaderUpdate(loadUUID, payload);
      } else {
        res = await salesmanLoadHeaderAdd(payload);
      }

      if (res?.error) {
        showSnackbar(res.data?.message || "Failed to submit form", "error");
      } else {
        router.push("/salesTeamLoad");
        showSnackbar(
          isEditMode
            ? "Sales Team Load updated successfully"
            : "Sales Team Load added successfully",
          "success"
        );
      }
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) formErrors[e.path] = e.message;
        });
        setErrors(formErrors);
      } else {
        console.error(err);
        showSnackbar("Failed to submit form", "error");
        console.error(err);
        showSnackbar("Failed to submit form", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (itemData.length <= 1) {
      setItemData([
        {
          item_id: "",
          itemName: "",
          Quantity: "1",

        },
      ]);
      return;
    }
    setItemData(itemData.filter((_, i) => i !== index));
  };

  const handleAddNewItem = () => {
    setItemData([
      ...itemData,
      {
        item_id: "",
        itemName: "",
        Quantity: "1",
      },
    ]);
  };

  return (
    <>
      
    <div className="flex flex-col">
     <div className="flex justify-between items-center mb-[20px]">
            <Link href="/salesTeamLoad" back className="flex items-center gap-[16px]">
              <Icon
                icon="lucide:arrow-left"
                width={24}
              />
              <h1 className="text-[20px] font-semibold text-[#181D27] flex items-center leading-[30px]">
                Add Sales Team Load
              </h1>
            </Link>
          </div>
      <ContainerCard className="rounded-[10px] scrollbar-none">
        {/* --- Header Section --- */}
        <div className="flex justify-between mb-10 flex-wrap gap-[20px]">
          <div className="flex flex-col gap-[10px]">
            <Logo type="full" />
            {/* <span className="text-primary font-normal text-[16px]">
              Emma-Köhler-Allee 4c, Germering - 13907
            </span> */}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[42px] uppercase text-[#A4A7AE] mb-[10px]">
              Load
            </span>
            <span className="text-primary text-[14px] tracking-[10px]">
              #{code}
            </span>
          </div>
        </div>
        <hr className="w-full text-[#D5D7DA]" />

        {/* --- Form Fields --- */}
        <div className="grid grid-cols-1 mt-6 mb-10 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <InputFields
            required
            label="Sales Team Type"
            name="salesman_type"
            value={form.salesman_type}
            options={salesmanTypeOptions}
            showSkeleton={salesmanTypeOptions.length === 0}
            onChange={(e) => handleChange("salesman_type", e.target.value)}
            error={errors.salesman_type}
            className="w-full"
          />

          {/* Show Project List only when salesman_type id = 36 */}
          {form.salesman_type === "6" && (
            <div>
              <InputFields
                required
                label="Project List"
                value={form.project_type}
                options={projectOptions}
                onChange={(e) => handleChange("project_type", e.target.value)}
                error={errors.project_type}
              />
            </div>
          )}
          <InputFields
            required
            label="Distributor"
            name="warehouse"
            value={form.warehouse}
            searchable={true}
            options={warehouseOptions}
            error={errors.warehouse}
            showSkeleton={warehouseOptions.length === 0}
            onChange={async (e) => {
              const val = e.target.value;
              handleChange("warehouse", val);
              handleChange("route", "");
              if (val) {
                setSkeleton({ ...skeleton, route: true });
                await fetchRouteOptions(val);
                setSkeleton({ ...skeleton, route: false });
              }
            }
            }
          />
          {form.salesman_type !== "6" && (
            <InputFields
              required
              label="Route"
              name="route"
              value={form.route}
              searchable={true}
              options={routeOptions}
              error={errors.route}
              disabled={!form.warehouse}
              showSkeleton={skeleton.route}
              onChange={async (e) => {
                const val = e.target.value;
                handleChange("route", val);
                // Clear customer when warehouse changes
                handleChange("salesman", "");
                // Fetch customers for selected warehouse
                if (val) {
                  setSkeleton({ ...skeleton, salesman: true });
                  await fetchSalesmanByRouteOptions(val);
                  setSkeleton({ ...skeleton, salesman: false });
                }
              }}
            />
          )}
          <InputFields
            required
            label="Sales Team"
            name="salesman"
            value={form.salesman}
            disabled={!form.warehouse || (form.salesman_type !== "6" && !form.route)}
            searchable={true}
            options={
              form.salesman_type === "6"
                ? projectSalesmanOptions
                : form.salesman_type === "2"
                  ? salesmanWarehouseRouteOptions
                  : salesmanOptions
            }
            error={errors.salesman}
            showSkeleton={skeleton.salesman}
            onChange={(e) => handleChange("salesman", e.target.value)}
          />
        </div>
        <div>
        </div>
        <Table
          key={`items-table-${itemData.length}`}
          data={(itemId.length > 0
            ? itemData.filter((row) => itemId.includes(String(row.id)))
            : itemData
          ).map((row, idx) => ({ ...row, idx: idx.toString() }))}
          config={{
            table: { height: 500 },
            showNestedLoading: nestedLoading,
            columns: [
              {
                key: "item",
                label: "Items",
                render: (row: TableDataType) => {
                  return (
                    <span>
                      {row.erp_code && row.name
                        ? `${row.erp_code} - ${row.name}`
                        : row.erp_code
                          ? row.erp_code
                          : row.name
                            ? row.name
                            : "-"}
                    </span>
                  );
                },
                filter: {
                  isFilterable: true,
                  width: 320,
                  options: Array.isArray(itemOptions) ? itemOptions : [],
                  onSelect: (selected) => {
                    if (Array.isArray(selected)) {
                      setItemId(selected.map((id) => String(id)));
                      return;
                    }

                    const selectedId = String(selected);
                    setItemId((prev) =>
                      prev.includes(selectedId)
                        ? prev.filter((id) => id !== selectedId)
                        : [...prev, selectedId]
                    );
                  },
                  isSingle: false,
                  selectedValue: itemId,
                },
              },
              {
                key: "warehouse_stocks",
                label: "Available Stocks",
                render: (row: TableDataType) => {
                  // warehouse stock
                  const warehouseStock = (row as any)?.warehouse_stocks?.find(
                    (stock: any) =>
                      stock.warehouse_id?.toString() === form.warehouse
                  );

                  const qty = Number(warehouseStock?.qty ?? 0);

                  // ✅ FIX: use row.uom (already mapped)
                  const cseUom = (row as any)?.uom?.find(
                    (uom: any) => uom.uom_id === 2 || uom.uom_type === 'secondary'
                  );

                  const upc = Number(cseUom?.upc ?? 1);

                  // divide qty ÷ upc
                  const finalStock = upc > 0 ? qty / upc : 0;

                  return <span>{finalStock.toFixed(2)}</span>;
                },
              },
              // {
              //   key: "cse_qty",
              //   label: "Secondary",
              //   render: (row) => {
              //     const pcs_upc = getUpc(row.uom, 'primary');
              //     const cse_upc = getUpc(row.uom, 'secondary');
              //     const availableStock = getAvailableStock(row);
              //     const pcs_qty = Number(row.pcs_qty || 0);
              //     // Clamp cse_qty so total does not exceed available stock
              //     const maxCseQty = cse_upc > 0 ? Math.floor((availableStock - pcs_qty * pcs_upc) / cse_upc) : 0;
              //     const value = Math.max(0, Math.min(Number(row.cse_qty || 0), maxCseQty));
              //     return (
              //       <InputFields
              //         label=""
              //         type="number"
              //         integerOnly
              //         name="cse_qty"
              //         value={String(value)}
              //         min={0}
              //         max={maxCseQty}
              //         disabled={!row.uom || row.uom.length === 0}
              //         trailingElement={
              //           <span className="text-sm text-gray-500">{maxCseQty}  {row.uom?.find((u: { uom_type: string; name: string }) => u.uom_type === 'secondary')?.name}</span>
              //         }
              //         onChange={(e) => {
              //           let val = e.target.value.replace(/[^0-9]/g, '');
              //           let num = Number(val);
              //           if (num > maxCseQty) num = maxCseQty;
              //           handleQtyInput(Number(row.idx), 'cse_qty', num.toString());
              //         }}
              //         onBlur={() => handleQtyBlur(Number(row.idx), 'cse_qty')}
              //       />
              //     );
              //   },
              // },
              {
                key: "cse_qty",
                label: "Secondary",
                render: (row) => {
                  const secondary_upc = getUpc(row.uom, 'secondary');
                  const availableStock = getAvailableStock(row);
                  const maxCseQty = secondary_upc > 0 ? Math.floor(availableStock / secondary_upc) : 0;
                  const idx = row.idx;
                  const errorMsg = rowQtyErrors[idx]?.cse;

                  return (
                    <div>
                      <InputFields
                        type="number"
                        integerOnly
                        value={row.cse_qty || ''}
                        min={0}
                        // max={maxCseQty} // Remove max to allow any value
                        trailingElement={
                          <span className="text-sm text-gray-500">
                            {maxCseQty}{' '}
                            {
                              row.uom?.find(
                                (u: any) => u.uom_type === 'secondary'
                              )?.name
                            }
                          </span>
                        }
                        onChange={(e) =>
                          handleQtyInput(Number(row.idx), 'cse_qty', e.target.value)
                        }
                        error={errorMsg}
                      />

                    </div>
                  );
                },
              },
              {
                key: "pcs_qty",
                label: "Primary",
                render: (row) => {
                  const secondary_upc = getUpc(row.uom, 'secondary');
                  const availableStock = getAvailableStock(row);
                  const secondaryQty = secondary_upc > 0 ? Math.floor(availableStock / secondary_upc) : 0;
                  const primaryQty = availableStock - (secondaryQty * secondary_upc);
                  const idx = row.idx;
                  const errorMsg = rowQtyErrors[idx]?.pcs;

                  return (
                    <div>
                      <InputFields
                        type="number"
                        integerOnly
                        value={row.pcs_qty || ''}
                        min={0}
                        // max={primaryQty} // Remove max to allow any value
                        trailingElement={
                          <span className="text-sm text-gray-500">
                            {primaryQty} {
                              row.uom?.find(
                                (u: any) => u.uom_type === 'primary'
                              )?.name
                            }
                          </span>
                        }
                        onChange={(e) =>
                          handleQtyInput(Number(row.idx), 'pcs_qty', e.target.value)
                        }
                        error={errorMsg}
                      />
                      {/* {errorMsg && (
          <div style={{ color: 'red', fontSize: 12 }}>{errorMsg}</div>
        )} */}
                    </div>
                  );
                },
              }


              // {
              //   key: "pcs_qty",
              //   label: "Primary",
              //   render: (row) => {
              //     const pcs_upc = getUpc(row.uom, 'primary');
              //     const cse_upc = getUpc(row.uom, 'secondary');
              //     const availableStock = getAvailableStock(row);
              //     const cse_qty = Number(row.cse_qty || 0);
              //     // Calculate remaining pcs after cse_qty is filled
              //     const usedByCse = cse_qty * cse_upc;
              //     const remainingPcs = Math.max(0, availableStock - usedByCse);
              //     // Clamp pcs_qty so total does not exceed available stock
              //     const maxPcsQty = pcs_upc > 0 ? Math.floor(remainingPcs / pcs_upc) : 0;
              //     const value = Math.max(0, Math.min(Number(row.pcs_qty || 0), maxPcsQty));
              //     // Show the actual remaining pcs after cse_qty is filled (not maxPcsQty)
              //     const displayPcs = pcs_upc > 0 ? remainingPcs - (maxPcsQty * pcs_upc) : remainingPcs;
              //     return (
              //       <InputFields
              //         label=""
              //         type="number"
              //         integerOnly
              //         name="pcs_qty"
              //         value={String(value)}
              //         min={0}
              //         max={maxPcsQty}
              //         disabled={!row.uom || row.uom.length === 0}
              //         trailingElement={
              //           <span className="text-sm text-gray-500">
              //             {displayPcs} {row.uom?.find((u: { uom_type: string; name: string }) => u.uom_type === 'primary')?.name}
              //           </span>
              //         }
              //         onChange={(e) => {
              //           let val = e.target.value.replace(/[^0-9]/g, '');
              //           let num = Number(val);
              //           if (num > maxPcsQty) num = maxPcsQty;
              //           handleQtyInput(Number(row.idx), 'pcs_qty', num.toString());
              //         }}
              //         onBlur={() => handleQtyBlur(Number(row.idx), 'pcs_qty')}
              //       />
              //     );
              //   },
              // },
            ],
            pageSize: itemData.length > 0 ? itemData.length : 100000
          }}
        />

        <div>
        </div>


        <div className="flex justify-between text-primary gap-0 mb-10">
          <div></div>
          <div className="flex justify-between flex-wrap w-full">
            <div className="flex flex-col justify-end gap-[20px] w-full lg:w-[400px]">

            </div>
          </div>
        </div>

        {/* --- Buttons --- */}
        <hr className="text-[#D5D7DA]" />
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            // onClick={() => router.push("/selesTeamLoad")}
            onClick={() => router.back()}


          >
            Cancel
          </button>
          <SidebarBtn
            isActive={true}
            leadingIcon="mdi:check"
            label={submitting ? "Creating Load..." : "Create Load"}
            onClick={handleSubmit}
            disabled={
              submitting || !form.salesman ||
              Object.values(rowQtyErrors).some(
                (err) => (err && (err.pcs || err.cse))
              )
            }
          />
        </div>
      </ContainerCard>
    </div>
    </>
  );

}