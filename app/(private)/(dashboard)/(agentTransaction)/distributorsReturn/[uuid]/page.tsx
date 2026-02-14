"use client";

import AutoSuggestion from "@/app/components/autoSuggestion";
import ContainerCard from "@/app/components/containerCard";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Table from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import InputFields from "@/app/components/inputFields";
import Logo from "@/app/components/logo";
import {
  createReturn,
  deliveryByUuid,
  reasonList,
  returnType,
  updateDelivery,
  getInvoices
} from "@/app/services/agentTransaction";
import {
  agentCustomerList,
  genearateCode,
  itemGlobalSearch,
  itemList,
  routeList,
  saveFinalCode,
  warehouseListGlobalSearch,
  warehouseStockTopOrders,
} from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import { useParams, useRouter } from "next/navigation";
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import * as yup from "yup";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import Link from "@/app/components/smartLink";
// ---- Types ----
interface Uom {
  id: string;
  uom_id?: string;
  name?: string;
  price?: string | number;
  uom_price?: string | number;
  uom_type?: string | number;
}

interface Pricing {
  buom_ctn_price?: string | number;
  auom_pc_price?: string | number;
}

interface Reason {
  id?: number | string;
  reson?: string;
  return_reason?: string;
  return_type?: string;
  reason?: string;
}

interface DeliveryDetail {
  item?: {
    id?: number;
    code?: string;
    name?: string;
  };
  uom_id?: number | string;
  uom_name?: string;
  quantity?: number;
  item_price?: number | string;
  item_uoms?: Uom[];
  return_type?: string;
  return_reason?: string;
}

interface DeliveryResponse {
  warehouse?: { id?: number; code?: string; name?: string };
  customer?: { id?: number; name?: string; outlet_name?: string };
  route?: { id?: number; name?: string; route_name?: string };
  details?: DeliveryDetail[];
  // possibly code fields
  return_code?: string;
  invoice_date?: string;
  invoice?: string;
  delivery_code?: string;
  code?: string;
}

interface ItemOption {
  value: string;
  label: string;
  name?: string;
  uoms?: Uom[];
  pricing?: Pricing;
}

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

interface WarehouseStock {
  item_id: number;
  warehouse_id: number;
  qty: string;
}

type ItemRow = {
  idx?: string;
  item_id: string;
  itemName: string;
  itemLabel: string;
  UOM: string;
  uom_id: string;
  Price: string;
  Total: string;
  Quantity: string;
  return_type: string;
  return_reason: string;
};

// ---- Component ----
export default function OrderAddEditPage() {
  const itemRowSchema = yup.object({
    item_id: yup.string().required("Please select an item"),
    uom_id: yup.string().required("Please select a UOM"),
    Quantity: yup.number()
      .typeError("Quantity must be a number")
      .min(1, "Quantity must be at least 1")
      .test('max-invoice-qty', function(value) {
        const { item_id } = this.parent;
        if (!item_id || !value) return true;
        const maxQty = invoiceItemQuantities[String(item_id)];
        if (!maxQty) return true;
        if (value > maxQty) {
          return this.createError({
            message: `Quantity cannot exceed invoice quantity (Max: ${maxQty})`
          });
        }
        return true;
      })
      .required("Quantity is required"),
    return_type: yup.string().required("Reason type is required"),
    return_reason: yup.string().required("Return reason is required"),
  });

  const {
    warehouseOptions,
    agentCustomerOptions,
    companyCustomersOptions,
    itemOptions: rawItemOptions,
    fetchAgentCustomerOptions,
    routeOptions,
    ensureAgentCustomerLoaded, ensureCompanyCustomersLoaded, ensureRouteLoaded, ensureWarehouseLoaded } = useAllDropdownListData();

  // Load dropdown data
  useEffect(() => {
    ensureAgentCustomerLoaded();
    ensureCompanyCustomersLoaded();
    ensureRouteLoaded();
    ensureWarehouseLoaded();
  }, [ensureAgentCustomerLoaded, ensureCompanyCustomersLoaded, ensureRouteLoaded, ensureWarehouseLoaded]);

  // cast itemOptions coming from context to our ItemOption[] (defensive)
  const itemOptions = (rawItemOptions as unknown as ItemOption[]) ?? [];

  const [returnTypeOptions, setReturnTypeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [goodReasonOptions, setGoodReasonOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();
  const router = useRouter();
  const params = useParams() as { uuid?: string } | undefined;
  const CURRENCY = typeof window !== "undefined" ? localStorage.getItem("country") || "" : "";
  const uuid = params?.uuid as string | undefined;
  const isEditMode = uuid !== undefined && uuid !== "add";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeGeneratedRef = useRef(false);
  const [code, setCode] = useState("");
  const [form, setForm] = useState({
    warehouse: "",
    invoice_date: "",
    invoice: "",
    warehouse_name: "",
    customer: "",
    customer_name: "",
    route: "",
    route_name: "",
  });

  const [skeleton, setSkeleton] = useState({
      reason: false,
      invoice: false,
    });
  // Add state for warehouse items data
  const [itemsOptions, setItemsOptions] = useState<{ label: string; value: string }[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<Record<string, WarehouseStock[]>>({});
  const [itemsWithUOM, setItemsWithUOM] = useState<Record<string, { uoms: ItemUOM[], stock_qty: string }>>({});
  const [returnData, setReturnData] = useState<any[]>([]);
  const [invoiceItemOptions, setInvoiceItemOptions] = useState<
    { label: string; value: string; uoms?: ItemUOM[] }[]
  >([]);
  // Store original invoice quantities for reference (not for validation)
  const [invoiceItemQuantities, setInvoiceItemQuantities] = useState<Record<string, number>>({});
    const [filteredDeliveryOptions, setFilteredDeliveryOptions] = useState<
        { label: string; value: string; order_code?: string }[]
      >([]);
      const [deliveryData, setDeliveryData] = useState<any>([]);
  // static fallback options
  const goodOptions = [
    { label: "Near By Expiry", value: "0" },
    { label: "Package Issue", value: "1" },
    { label: "Not Saleable", value: "2" },
  ];
  const badOptions = [
    { label: "Damage", value: "0" },
    { label: "Expiry", value: "1" },
  ];

  const [errors, setErrors] = useState<Record<string, string>>({});
  // per-row validation errors for item rows (keyed by row index)
  const [itemErrors, setItemErrors] = useState<
    Record<number, Record<string, string>>
  >({});
  // UOM options per row
  const [rowUomOptions, setRowUomOptions] = useState<
    Record<string, { value: string; label: string; price?: string | number; uom_type?: string | number }[]>
  >({});
  // reason options per row
  const [rowReasonOptions, setRowReasonOptions] = useState<Record<string, { label: string; value: string }[]>>(
    {}
  );

  const [itemData, setItemData] = useState<ItemRow[]>([
    {
      item_id: "",
      itemName: "",
      itemLabel: "",
      UOM: "",
      uom_id: "",
      Price: "",
      Total: "0.00",
      Quantity: "1",
      return_type: "",
      return_reason: "",
    },
  ]);

  // ---------- Fetch returnType list ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await returnType();
        const list = Array.isArray(res?.data) ? (res.data as Reason[]) : [];
        const options = list.map((r) => ({
          label: r.reson || r.return_reason || r.return_type || String(r.id),
          value: String(r.id),
        }));
        setReturnTypeOptions(options);
      } catch (err) {
        console.error("Failed to fetch returnType:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Fetch reason list (good/bad) ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await reasonList();
        const list = Array.isArray(res?.data) ? (res.data as Reason[]) : [];
        const options = list.map((reason: Reason) => ({
          label: reason.reson || reason.return_reason || reason.return_type || String(reason.id),
          value: String(reason.id),
        }));
        setGoodReasonOptions(options);
      } catch (err) {
        console.error("Failed to fetch reason list:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Load delivery for edit mode ----------
  useEffect(() => {
    if (!isEditMode || !uuid || itemOptions.length === 0) return;

    (async () => {
      try {
        setLoading(true);
        const response = await deliveryByUuid(uuid);
        const data = (response?.data ?? response) as DeliveryResponse

        const warehouseObj = data?.warehouse;
        const warehouseCode = warehouseObj?.code ?? "";
        const warehouseName = warehouseObj?.name ?? "";
        const warehouseLabel = `${warehouseCode ? warehouseCode + " - " : ""}${warehouseName}`.trim();

        const customerObj = data?.customer;
        const customerLabel = customerObj?.name ?? customerObj?.outlet_name ?? "";

        const routeObj = data?.route;
        const routeLabel = routeObj?.name ?? routeObj?.route_name ?? "";

        setForm({
          warehouse: data?.warehouse?.id ? String(data.warehouse.id) : "",
          invoice_date: data?.invoice_date? String(data.invoice_date) : "",
          invoice: data?.invoice? String(data.invoice) : "",
          warehouse_name: warehouseLabel,
          customer: data?.customer?.id ? String(data.customer.id) : "",
          customer_name: customerLabel,
          route: data?.route?.id ? String(data.route.id) : "",
          route_name: routeLabel,
        });

        // prefer multiple possible code fields
        const maybeCode = String((data as any)?.return_code ?? (data as any)?.delivery_code ?? (data as any)?.code ?? "");
        if (maybeCode) setCode(maybeCode);

        if (data?.warehouse?.id) {
          await fetchAgentCustomerOptions(String(data.warehouse.id));
        }

        if (Array.isArray(data?.details) && data.details.length > 0) {
          const loadedItemData: ItemRow[] = data.details.map((detail, idx) => {
            const itemId = detail.item?.id ? String(detail.item.id) : "";
            const uomId = detail.uom_id ? String(detail.uom_id) : "";
            const selectedItem = itemOptions.find((it) => it.value === itemId);
            let matchedPrice = "";

            if (selectedItem && Array.isArray(selectedItem.uoms) && selectedItem.uoms.length > 0) {
              const uomOpts = selectedItem.uoms.map((uom) => {
                // determine final price using pricing override if present
                let finalPrice: string | number = uom.price ?? "";
                if (uom.uom_type === "primary") {
                  finalPrice = selectedItem.pricing?.auom_pc_price ?? "-";
                } else if (uom.uom_type === "secondary") {
                  finalPrice = selectedItem.pricing?.buom_ctn_price ?? "-";
                }
                return { value: uom.uom_id ?? "", label: uom.name ?? "", price: finalPrice, uom_type: uom.uom_type };
              });

              // set row UOM options
              setRowUomOptions((prev) => ({ ...prev, [idx.toString()]: uomOpts }));

              const matched = uomOpts.find((u) => u.value === uomId);
              matchedPrice = matched ? String(matched.price ?? "") : String(uomOpts[0]?.price ?? "");
            } else {
              // fallback to item_price from delivery detail (if any)
              matchedPrice = String(detail.item_price ?? "");
            }

            return {
              item_id: itemId,
              itemName: itemId,
              itemLabel: detail.item?.name ?? "",
              UOM: uomId,
              uom_id: uomId,
              Price: matchedPrice,
              Quantity: String(detail.quantity ?? 1),
              Total: ((Number(matchedPrice) || 0) * Number(detail.quantity ?? 0)).toFixed(2),
              return_type: detail.return_type ?? "",
              return_reason: detail.return_reason ?? "",
            };
          });

          setItemData(loadedItemData);

          // Preload reason lists for rows that already have return_type
          const reasonPromises = loadedItemData.map(async (d, idx) => {
            if (!d.return_type) return { idx: idx.toString(), options: [] as { label: string; value: string }[] };
            try {
              const res = await reasonList({ return_id: d.return_type });
              const list = Array.isArray(res?.data) ? (res.data as Reason[]) : (Array.isArray(res) ? (res as Reason[]) : []);
              const options = list.map((r) => ({ label: r.reson || r.return_reason || r.return_type || String(r.id), value: String(r.id) }));
              return { idx: idx.toString(), options };
            } catch {
              return { idx: idx.toString(), options: [] as { label: string; value: string }[] };
            }
          });

          const results = await Promise.all(reasonPromises);
          const map: Record<string, { label: string; value: string }[]> = {};
          results.forEach((r) => {
            if (r) map[r.idx] = r.options;
          });
          if (Object.keys(map).length > 0) setRowReasonOptions((prev) => ({ ...prev, ...map }));
        }
      } catch (error: any) {
        console.error("Error fetching delivery data:", error);
        let errorMessage = "Failed to fetch delivery details";
        if (error?.response?.data?.message) errorMessage = error.response.data.message;
        else if (error?.data?.message) errorMessage = error.data.message;
        else if (typeof error?.message === "string") errorMessage = error.message;
        showSnackbar(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    })();
    // we want to re-run when itemOptions becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, uuid, itemOptions.length]);

  // Auto-generate code in add mode only
  useEffect(() => {
    if (isEditMode || codeGeneratedRef.current) return;
    codeGeneratedRef.current = true;

    (async () => {
      try {
        setLoading(true);
        const res = await genearateCode({ model_name: "agent_returns" });
        if (res?.code) setCode(res.code);
      } catch (err) {
        console.error("Failed to generate return code:", err);
        showSnackbar("Failed to generate return code", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // Fetch warehouse items function (same as order page)
  // const fetchWarehouseItems = useCallback(async (warehouseId: string, searchTerm: string = "") => {
  //   if (!warehouseId) {
  //     setItemsOptions([]);
  //     setItemsWithUOM({});
  //     setWarehouseStocks({});
  //     return;
  //   }

  //   try {
  //     // Fetch warehouse stocks - this API returns all needed data including pricing and UOMs
  //     const stockRes = await warehouseStockTopOrders(warehouseId);
  //     const stocksArray = stockRes.data?.stocks || stockRes.stocks || [];

  //     // Store warehouse stocks for validation
  //     setWarehouseStocks(prev => ({
  //       ...prev,
  //       [warehouseId]: stocksArray
  //     }));

  //     // Filter items based on search term and stock availability
  //     const filteredStocks = stocksArray.filter((stock: any) => {
  //       if (Number(stock.stock_qty) <= 0) return false;
  //       if (!searchTerm) return true;
  //       const searchLower = searchTerm.toLowerCase();
  //       return stock.item_name?.toLowerCase().includes(searchLower) ||
  //         stock.item_code?.toLowerCase().includes(searchLower);
  //     });

  //     // Create items with UOM data map for easy access
  //     const itemsUOMMap: Record<string, { uoms: ItemUOM[], stock_qty: string }> = {};

  //     const processedItems = filteredStocks.map((stockItem: any) => {
  //       const item_uoms = stockItem?.uoms ? stockItem.uoms.map((uom: any) => {
  //         let price = uom.price;
  //         // Override with specific pricing from the API response
  //         if (uom?.uom_type === "primary") {
  //           price = stockItem.auom_pc_price || uom.price;
  //         } else if (uom?.uom_type === "secondary") {
  //           price = stockItem.buom_ctn_price || uom.price;
  //         }
  //         return {
  //           ...uom,
  //           price,
  //           id: uom.uom_id || `${stockItem.item_id}_${uom.uom_type}`,
  //           item_id: stockItem.item_id
  //         };
  //       }) : [];

  //       // Store UOM data for this item
  //       itemsUOMMap[stockItem.item_id] = {
  //         uoms: item_uoms,
  //         stock_qty: stockItem.stock_qty
  //       };

  //       return {
  //         id: stockItem.item_id,
  //         name: stockItem.item_name,
  //         item_code: stockItem.item_code,
  //         erp_code: stockItem.erp_code,
  //         item_uoms,
  //         warehouse_stock: stockItem.stock_qty,
  //         pricing: {
  //           buom_ctn_price: stockItem.buom_ctn_price,
  //           auom_pc_price: stockItem.auom_pc_price
  //         }
  //       };
  //     });

  //     setItemsWithUOM(itemsUOMMap);
  //     setReturnData(processedItems);

  //     // Create dropdown options
  //     const options = processedItems.map((item: any) => ({
  //       value: String(item.id),
  //       label: `${item.erp_code || item.item_code || ''} - ${item.name || ''} (Stock: ${item.warehouse_stock})`
  //     }));

  //     setItemsOptions(options);
  //     setLoading(false);

  //     return options;
  //   } catch (error) {
  //     console.error("Error fetching warehouse items:", error);
  //     setLoading(false);
  //     return [];
  //   }
  // }, [setLoading]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const fetchAgentDeliveries = async (values: any, search: string) => {
    if (!values?.warehouse || !values?.invoice_date) return [];
    setSkeleton({ ...skeleton, invoice: true });
    const res = await getInvoices({
      warehouse_id: values.warehouse,
      invoice_date: values.invoice_date,
      query: search,
    });
    if (res.error) {
      showSnackbar(res.data?.message || "Failed to fetch Deliveries", "error");
      setSkeleton({ ...skeleton, invoice: false });
      return [];
    }
    const data = res?.data || [];
    const options = data.map(
      (delivery: {
        id: number;
        header_id?: number;
        invoice_code: string;
        customer_name: string;
        customer_code: string;
        order_code: string;
      }) => {
        const capitalizedCustomerName = (
          String(delivery.customer_name || "")
        );
        return {
          value: String(delivery.header_id ?? delivery.id),
          label: `${delivery.invoice_code ? delivery.invoice_code : ""} (${
            delivery.customer_code ? delivery.customer_code : ""
          } - ${capitalizedCustomerName})`,
          order_code: delivery.order_code,
        };
      }
    );
    setFilteredDeliveryOptions(options);
    setDeliveryData(data);
    setSkeleton({ ...skeleton, invoice: false });
    return options;
  };

  const validationSchema = yup.object().shape({
    warehouse: yup.string().required("Distributor is required"),
    invoice_date: yup.string().required("Invoice Date is required"),
    invoice: yup.string().required("Invoice is required"),
    customer: yup.string().required("Customer is required"),
    route: yup.string().required("Route is required"),
  });

  // Validate individual item row
  const validateRow = async (
    index: number,
    row?: ItemRow,
    options?: { skipUom?: boolean }
  ) => {
    const rowData = row ?? itemData[index];
    if (!rowData) return;
    // prepare data for Yup: convert numeric strings to numbers
    const toValidate = {
      item_id: String(rowData.item_id ?? ""),
      uom_id: String(rowData.uom_id ?? ""),
      Quantity: Number(rowData.Quantity) || 0,
      return_type: String(rowData.return_type ?? ""),
      return_reason: String(rowData.return_reason ?? ""),
    };
    try {
      if (options?.skipUom) {
        // validate only item_id and Quantity to avoid showing UOM required immediately after selecting item
        const partialErrors: Record<string, string> = {};
        try {
          await itemRowSchema.validateAt("item_id", toValidate);
        } catch (e: any) {
          if (e?.message) partialErrors["item_id"] = e.message;
        }
        try {
          await itemRowSchema.validateAt("Quantity", toValidate);
        } catch (e: any) {
          if (e?.message) partialErrors["Quantity"] = e.message;
        }
        if (Object.keys(partialErrors).length === 0) {
          // clear errors for this row
          setItemErrors((prev) => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
          });
        } else {
          setItemErrors((prev) => ({ ...prev, [index]: partialErrors }));
        }
      } else {
        await itemRowSchema.validate(toValidate, { abortEarly: false });
        // clear errors for this row
        setItemErrors((prev) => {
          const copy = { ...prev };
          delete copy[index];
          return copy;
        });
      }
    } catch (err: any) {
      const validationErrors: Record<string, string> = {};
      if (err && err.inner && Array.isArray(err.inner)) {
        err.inner.forEach((e: any) => {
          if (e.path) validationErrors[e.path] = e.message;
        });
      } else if (err && err.path) {
        validationErrors[err.path] = err.message;
      }
      setItemErrors((prev) => ({ ...prev, [index]: validationErrors }));
    }
  };

  const recalculateItem = (index: number, field: keyof ItemRow, value: string) => {
    const newData = [...itemData];
    const item = { ...newData[index], [field]: value } as ItemRow;
    
    // Recompute total
    const priceNum = Number(item.Price) || 0;
    const qtyNum = Number(item.Quantity) || 0;
    item.Total = (priceNum * qtyNum).toFixed(2);
    newData[index] = item;
    setItemData(newData);

    // Validate row after update
    if (field !== "item_id") {
      validateRow(index, newData[index]);
    }
  };

  const handleAddNewItem = () => {
    setItemData((prev) => [
      ...prev,
      {
        item_id: "",
        itemName: "",
        itemLabel: "",
        UOM: "",
        uom_id: "",
        Price: "",
        Total: "0.00",
        Quantity: "1",
        return_type: "",
        return_reason: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (itemData.length <= 1) {
      setItemData([
        {
          item_id: "",
          itemName: "",
          itemLabel: "",
          UOM: "",
          uom_id: "",
          Price: "",
          Total: "0.00",
          Quantity: "1",
          return_type: "",
          return_reason: "",
        },
      ]);
      return;
    }
    setItemData((prev) => prev.filter((_, i) => i !== index));
  };

  // Create payload
  const generatePayload = () => ({
    warehouse_id: Number(form.warehouse),
    // invoice_date: (form.invoice_date),
    invoice_id: (form.invoice),
    customer_id: Number(form.customer),
    osa_code: code,
    route_id: Number(form.route),
    // invoice_id: Number(form.route),
    total: itemData
      .filter((item) => item.item_id && item.uom_id)
      .reduce((sum, item) => sum + (Number(item.Total) || 0), 0),
    details: itemData
      .filter((item) => item.item_id && item.uom_id)
      .map((item) => ({
        item_id: Number(item.item_id),
        uom_id: Number(item.uom_id),
        item_price: Number(item.Price) || 0,
        item_quantity: Number(item.Quantity) || 0,
        total: Number(parseFloat(String(item.Total)) || 0),
        return_type: item.return_type,
        return_reason: item.return_reason,
      })),
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;
    try {
      await validationSchema.validate(form, { abortEarly: false });
      setErrors({});

      const validItems = itemData.filter((item) => item.item_id && item.uom_id);
      if (validItems.length === 0) {
        showSnackbar("Please add at least one item with UOM selected", "error");
        return;
      }

      // Validate all item rows using the same pattern as delivery page
      const itemsSchema = yup.array().of(itemRowSchema);
      try {
        await itemsSchema.validate(itemData, { abortEarly: false });
      } catch (itemErr: any) {
        // log detailed item validation errors and surface a friendly message
        console.error("Item validation errors:", itemErr.inner || itemErr);
        showSnackbar(
          itemErr.inner?.map((err: any) => err.message).join(", ") || "Item validation failed",
          "error"
        );
        return;
      }

      setIsSubmitting(true);
      const payload = generatePayload();

      let res: any;
      if (isEditMode && uuid) {
        res = await updateDelivery(uuid, payload);
      } else {
        res = await createReturn(payload);
      }

      if (res?.error) {
        showSnackbar(res?.data?.message || (isEditMode ? "Failed to update delivery" : "Failed to create delivery"), "error");
        setIsSubmitting(false);
        return;
      }

      // Save final code if add mode
      if (!isEditMode && code) {
        try {
          await saveFinalCode({ reserved_code: code, model_name: "agent_returns" });
        } catch (e) {
          console.error("Failed to save final code:", e);
        }
      }

      showSnackbar(isEditMode ? "Return updated successfully!" : "Return created successfully!", "success");
      router.push("/distributorsReturn");
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {};
        error.inner.forEach((err) => {
          if (err.path) formErrors[err.path] = err.message;
        });
        setErrors(formErrors);
      } else {
        console.error("Error saving delivery:", error);
        let errorMessage = isEditMode ? "Failed to update delivery. Please try again." : "Failed to create delivery. Please try again.";
        if ((error as any)?.response?.data?.message) errorMessage = (error as any).response.data.message;
        else if ((error as any)?.data?.message) errorMessage = (error as any).data.message;
        else if (typeof (error as any)?.message === "string") errorMessage = (error as any).message;
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Search helpers ---
  const handleWarehouseSearch = async (searchText: string) => {
    try {
      const response = await warehouseListGlobalSearch({ query: searchText });
      const data = Array.isArray(response?.data) ? response.data : [];
      return data.map((w: any) => ({
        value: String(w.id),
        label: `${w.code || w.warehouse_code || ""} - ${w.name || w.warehouse_name || ""}`,
        code: w.code || w.warehouse_code,
        name: w.name || w.warehouse_name,
      }));
    } catch {
      return [];
    }
  };

  const handleRouteSearch = async (searchText: string) => {
    if (!form.warehouse) return [];
    try {
      const response = await routeList({ warehouse_id: form.warehouse, search: searchText, per_page: "50" });
      const data = Array.isArray(response?.data) ? response.data : [];
      return data.map((route: any) => ({
        value: String(route.id),
        label: `${route.route_code || route.code || ""} - ${route.route_name || route.name || ""}`,
        code: route.route_code || route.code,
        name: route.route_name || route.name,
      }));
    } catch {
      return [];
    }
  };

  const handleCustomerSearch = async (searchText: string) => {
    if (!form.route) return [];
    try {
      const response = await agentCustomerList({ route_id: form.route, search: searchText });
      const data = Array.isArray(response?.data) ? response.data : [];
      return data.map((customer: any) => ({
        value: String(customer.id),
        label: `${customer.osa_code || ""} - ${customer.name || customer.outlet_name || customer.customer_name || ""}`,
        name: customer.outlet_name || customer.customer_name || customer.name || "",
      }));
    } catch {
      return [];
    }
  };

  const handleItemSearch = async (searchText: string) => {
    if (!form.warehouse) return [];

    // For warehouse items, filter from already loaded itemsOptions
    if (itemsOptions.length > 0) {
      const searchLower = searchText.toLowerCase();
      return itemsOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchLower)
      );
    }

    // If no items loaded yet, trigger warehouse items fetch
    // if (form.warehouse) {
    //   return await fetchWarehouseItems(form.warehouse, searchText) || [];
    // }

    return [];
  };

  const hasValidItems = itemData.some((item) => item && item.item_id && item.uom_id);

  // --- Render ---
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-[20px]">
        <Link href="/distributorsReturn" back className="flex items-center gap-[16px]">
          <Icon icon="lucide:arrow-left" width={24}  />
          <h1 className="text-[20px] font-semibold text-[#181D27] flex items-center leading-[30px] mb-[4px]">
            {isEditMode ? "Update Return" : "Add Return"}
          </h1 >
        </Link >
      </div >

      <ContainerCard className="rounded-[10px] scrollbar-none">
        <div className="flex justify-between mb-10 flex-wrap gap-[20px]">
          <div className="flex flex-col gap-[10px]">
            <Logo type="full" />
          </div >
          <div className="flex flex-col">
            <span className="flex justify-end text-[42px] uppercase text-[#A4A7AE] mb-[10px]">Return</span>
            <span className="text-primary text-[14px] tracking-[10px]">#{code}</span>
          </div>
        </div >
        <hr className="w-full text-[#D5D7DA]" />

        <div className="grid gird-cols-1 md:grid-cols-3 sm:flex-row gap-4 mt-10 mb-10 flex-wrap">
          <InputFields
            required
            label="Distributor"
            name="warehouse"
            searchable={true}
            value={form.warehouse}
            options={warehouseOptions}
            onChange={(e) => {
              const selectedWarehouse = e.target.value;
              setForm((prev) => ({
                ...prev,
                warehouse: selectedWarehouse,
                route: "",
                route_name: "",
                customer: "",
                customer_name: "",
              }));
               
              if (errors.warehouse) setErrors((prev) => ({ ...prev, warehouse: "" }));
              if (selectedWarehouse) {
                try {
                  // fetchAgentCustomerOptions(selectedWarehouse);
                  // Fetch warehouse items with stock, UOMs and pricing
                  // fetchWarehouseItems(selectedWarehouse);
                } catch {
                  //
                }
              }
            }}
            error={errors.warehouse}
          />
          <InputFields
            required
            type="date"
            label="Invoice Date"
            name="invoice_date"
            value={form.invoice_date}
            // options={agentCustomerOptions}
            onChange={(e) => {
              // Reset Route, Customer, and items when Invoice Date changes
              setForm((prev) => ({
                ...prev,
                invoice_date: e.target.value,
                route: "",
                route_name: "",
                customer: "",
                customer_name: "",
                invoice: ""
              }));
              setItemData([
                {
                  item_id: "",
                  itemName: "",
                  itemLabel: "",
                  UOM: "",
                  uom_id: "",
                  Price: "",
                  Total: "0.00",
                  Quantity: "1",
                  return_type: "",
                  return_reason: "",
                },
              ]);
              setInvoiceItemOptions([]);
              setInvoiceItemQuantities({});
              setRowUomOptions({});
              setRowReasonOptions({});
              setItemErrors({});
              (async () => {
                await fetchAgentDeliveries(
                  { ...form, invoice_date: e.target.value },
                  ""
                );
              })();
            }}
            error={errors.invoice_date}
            disabled={!form.warehouse}
          />
          <InputFields
            required
            label="Invoice"
            name="invoice"
            showSkeleton={skeleton.invoice}
            value={form.invoice}
            options={filteredDeliveryOptions}
            onChange={(e) => {
              const selectedInvoiceId = e.target.value;
              const selectedInvoice = Array.isArray(deliveryData)
                ? deliveryData.find((inv: any) => String(inv.header_id ?? inv.id) === String(selectedInvoiceId))
                : null;

              const detailItems = Array.isArray(selectedInvoice?.details)
                ? selectedInvoice.details
                : [];
              
              // Store original invoice quantities for reference (not for validation)
              const quantities: Record<string, number> = {};
              detailItems.forEach((detail: any) => {
                if (detail.item_id) {
                  quantities[String(detail.item_id)] = Number(detail.quantity || 0);
                }
              });
              setInvoiceItemQuantities(quantities);
              
              const mappedInvoiceItems = detailItems.map((detail: any) => {
                const uomsArray = Array.isArray(detail.item_uoms)
                  ? detail.item_uoms
                  : detail.item_uoms
                    ? [detail.item_uoms]
                    : [];
                const normalizedUoms: ItemUOM[] = uomsArray.map((u: any) => ({
                  id: Number(u.uom_id ?? u.id ?? 0),
                  item_id: Number(detail.item_id ?? 0),
                  uom_type: String(u.uom_type ?? ""),
                  name: String(u.name ?? ""),
                  price: String(u.price ?? ""),
                  is_stock_keeping: Boolean(u.is_stock_keeping ?? false),
                  upc: String(u.upc ?? ""),
                  enable_for: String(u.enable_for ?? ""),
                  uom_id: Number(u.uom_id ?? u.id ?? 0),
                }));
                return {
                  value: String(detail.item_id ?? ""),
                  label: `${detail.item_code ?? ""}${detail.item_code ? " - " : ""}${detail.item_name ?? ""}`,
                  uoms: normalizedUoms,
                  maxQuantity: Number(detail.quantity || 0),
                };
              });
              setInvoiceItemOptions(mappedInvoiceItems);

              setForm((prev) => ({
                ...prev,
                invoice: selectedInvoiceId,
                route: selectedInvoice?.route_id ? String(selectedInvoice.route_id) : "",
                route_name: selectedInvoice?.route_name
                  ? `${selectedInvoice.route_code ? selectedInvoice.route_code + " - " : ""}${selectedInvoice.route_name}`
                  : "",
                customer: selectedInvoice?.customer_id ? String(selectedInvoice.customer_id) : "",
                customer_name: selectedInvoice?.customer_name
                  ? `${selectedInvoice.customer_code ? selectedInvoice.customer_code + " - " : ""}${selectedInvoice.customer_name}`
                  : "",
              }));

              if (errors.invoice || errors.route || errors.customer) {
                setErrors((prev) => ({
                  ...prev,
                  invoice: "",
                  route: "",
                  customer: "",
                }));
              }
            }}
            error={errors.invoice}
            disabled={!form.invoice_date}
          />

          <InputFields
            required
            label="Route"
            name="route"
            value={form.route_name}
            // options={routeOptions}
            onChange={(e) => {}}
            error={errors.route}
            disabled={true}
          />
          <InputFields
            required
            label="Customer"
            name="customer"
            value={form.customer_name}
            // options={routeOptions}
            onChange={(e) => {}}
            error={errors.customer}
            disabled={true}
          />

        </div>

        <Table
          data={itemData.map((row, idx) => ({ ...row, idx: idx.toString() }))}
          config={{
            columns: [
              {
                key: "itemName",
                label: "Item Name",
                width: 390,
                render: (row) => {
                  const selectedOpt = (() => {
                    const selectedItemId = row.item_id;
                    if (!selectedItemId) return null;
                    // Try to find in global itemOptions first
                    const typedItemOptions = itemOptions;
                    const found = typedItemOptions?.find?.((it) => it.value === String(selectedItemId));
                    if (found) return found;
                    // Fallback to building a minimal option from the row label
                    return { value: String(selectedItemId), label: row.itemLabel || String(selectedItemId) };
                  })();
                  const rowIndex = Number(row.idx);
                  const error = itemErrors[rowIndex]?.item_id;
                  return (
                    <div style={{ minWidth: '390px', maxWidth: '390px' }}>
                      <InputFields
                        label=""
                        name="item_id"
                        searchable
                        value={row.item_id}
                        options={invoiceItemOptions}
                        disabled={!form.customer_name && !row.item_id}
                        error={error}
                        onChange={(e) => {
                          const selectedItemId = e.target.value;
                          const newData = [...itemData];
                          const index = Number(row.idx);
                          const selectedOption = invoiceItemOptions.find(
                            (opt) => String(opt.value) === String(selectedItemId)
                          );

                          newData[index].item_id = selectedItemId;
                          newData[index].itemName = selectedItemId;
                          newData[index].itemLabel = selectedOption?.label ?? "";

                          // Prefer UOMs from invoice details, fallback to warehouse data
                          const itemData_fromWarehouse = returnData.find(
                            (it: any) => String(it.id) === String(selectedItemId)
                          );
                          const uomInfo = itemsWithUOM[selectedItemId];
                          const uoms: ItemUOM[] =
                            selectedOption?.uoms?.length
                              ? selectedOption.uoms
                              : uomInfo?.uoms || itemData_fromWarehouse?.item_uoms || [];

                          if (uoms && uoms.length > 0) {
                            const uomOpts = uoms.map((uom: ItemUOM) => ({
                              value: String(uom.uom_id || ""),
                              label: uom.name || "",
                              price: String(uom.price ?? "0")
                            }));
                            setRowUomOptions((prev) => ({ ...prev, [row.idx]: uomOpts }));

                            const firstUom = uomOpts[0];
                            if (firstUom) {
                              newData[index].uom_id = firstUom.value;
                              newData[index].UOM = firstUom.label;
                              newData[index].Price = String(firstUom.price ?? "");
                              newData[index].Total = ((Number(firstUom.price) || 0) * (Number(newData[index].Quantity) || 0)).toFixed(2);
                            }
                          } else {
                            setRowUomOptions((prev) => {
                              const newOpts = { ...prev };
                              delete newOpts[row.idx];
                              return newOpts;
                            });
                            newData[index].uom_id = "";
                            newData[index].UOM = "";
                            newData[index].Price = "";
                            newData[index].Total = "0.00";
                          }

                          setItemData(newData);
                          validateRow(index, newData[index], { skipUom: true });
                        }}
                      />
                    </div>
                  );
                },
              },
              {
                key: "UOM",
                label: "UOM",
                width: 120,
                render: (row: any) => {
                  const uomOptions = rowUomOptions[row.idx] || [];
                  const rowIndex = Number(row.idx);
                  const error = itemErrors[rowIndex]?.uom_id;
                  return (
                    <div style={{ minWidth: "120px", maxWidth: "120px" }}>
                      <InputFields
                        label=""
                        name="UOM"
                        options={uomOptions}
                        value={row.uom_id}
                        disabled={uomOptions.length === 0}
                        error={error}
                        onChange={(e) => {
                          const selectedUomId = e.target.value;
                          const selectedUom = uomOptions.find((u) => u.value === selectedUomId);
                          const newData = [...itemData];
                          const index = Number(row.idx);
                          newData[index].uom_id = selectedUomId;
                          newData[index].UOM = selectedUom?.label ?? selectedUomId;
                          newData[index].Price = String(selectedUom?.price ?? "");
                          newData[index].Total = ((Number(newData[index].Price) || 0) * (Number(newData[index].Quantity) || 0)).toFixed(2);
                          setItemData(newData);
                          validateRow(index, newData[index]);
                        }}
                      />
                    </div>
                  );
                },
              },
              {
                key: "Quantity",
                label: "Qty",
                width: 100,
                render: (row: any) => {
                  const rowIndex = Number(row.idx);
                  const error = itemErrors[rowIndex]?.Quantity;
                  // Get max quantity from invoice
                  const maxQty = invoiceItemQuantities[row.item_id] || 999999;
                  const invoiceQty = invoiceItemQuantities[row.item_id];
                  return (
                    <div style={{ minWidth: "100px", maxWidth: "100px" }}>
                      <InputFields
                        label=""
                        type="number"
                        name="Quantity"
                        value={row.Quantity}
                        integerOnly={true}
                        min={1}
                        max={maxQty}
                        error={error}
                        onChange={(e) => recalculateItem(Number(row.idx), "Quantity", e.target.value)}
                      />
                      {invoiceQty && (
                        <div className="text-xs text-gray-500 mt-1">
                          Invoice Qty: {invoiceQty}
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                key: "Price",
                label: "Price",
                render: (row) => <span>{Number(row.Price || 0).toFixed(2)}</span>
              },


              {
                key: "return_type",
                label: "Reason Type",
                width: 100,
                render: (row: any) => {
                  const rowIndex = Number(row.idx);
                  const error = itemErrors[rowIndex]?.return_type;
                  return (
                    <div style={{ minWidth: "100px", maxWidth: "100px" }}>
                      <InputFields
                        label=""
                        name="return_type"
                        value={row.return_type}
                        options={returnTypeOptions}
                        disabled={!row.item_id}
                        error={error}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newData = [...itemData];
                          const index = Number(row.idx);
                          newData[index].return_type = value;
                          newData[index].return_reason = "";
                          setItemData(newData);

                          (async () => {
                            try {
                              setSkeleton({ ...skeleton, reason: true });

                              const res = await reasonList({ return_id: value });
                              const list = Array.isArray(res?.data) ? (res.data as Reason[]) : (Array.isArray(res) ? (res as Reason[]) : []);
                              const options = list.map((reason) => ({ label: reason.reson || reason.return_reason || reason.reason || reason.return_type || String(reason.id), value: String(reason.id) }));
                              setRowReasonOptions((prev) => ({ ...prev, [row.idx]: options }));
                              // Validate after setting return type
                              validateRow(index, newData[index]);
                            } catch (err) {
                              console.error("Failed to fetch reasons for return type", value, err);
                              setRowReasonOptions((prev) => ({ ...prev, [row.idx]: [] }));
                              validateRow(index, newData[index]);
                            }
                            finally { setSkeleton({ ...skeleton, reason: false }); }
                          })();
                        }}
                      />
                    </div>
                  );
                },
              },
              {
                key: "return_reason",
                label: "Reason",
                width: 200,
                render: (row: any) => {
                  const fetched = rowReasonOptions[row.idx] || [];
                  const fallback = row.return_type === "1" ? goodOptions : row.return_type === "2" ? badOptions : [];
                  const options = fetched.length > 0 ? fetched : fallback;
                  const rowIndex = Number(row.idx);
                  const error = itemErrors[rowIndex]?.return_reason;
                  return (
                    <div style={{ minWidth: "200px", maxWidth: "200px" }}>
                      <InputFields
                        label=""
                        name="return_reason"
                        value={row.return_reason}
                        options={options}
                        showSkeleton={skeleton.reason}
                        disabled={!row.return_type}
                        error={error}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newData = [...itemData];
                          const index = Number(row.idx);
                          newData[index].return_reason = value;
                          setItemData(newData);
                          validateRow(index, newData[index]);
                        }}
                      />
                    </div>
                  );
                },
              },
              {
                key: "Total",
                label: "Total",
                render: (row: any) => <span>{toInternationalNumber(Number(row.Total || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
              },
              {
                key: "action",
                label: "Action",
                render: (row: any) => (
                  <button
                    type="button"
                    className={`${itemData.length <= 1 ? "opacity-50 cursor-not-allowed" : ""} text-red-500 flex items-center`}
                    onClick={() => itemData.length > 1 && handleRemoveItem(Number(row.idx))}
                  >
                    <Icon icon="hugeicons:delete-02" width={20} />
                  </button>
                ),
              },
            ],
            showNestedLoading: false,
          }}
        />

        <div className="mt-4">
          {(() => {
            // disable add when there's already an empty/new item row
            const hasEmptyRow = itemData.some(it => (String(it.item_id ?? '').trim() === '' && String(it.uom_id ?? '').trim() === ''));
            return (
              <button
                type="button"
                disabled={hasEmptyRow}
                className={`text-[#E53935] font-medium text-[16px] flex items-center gap-2 ${hasEmptyRow ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => { if (!hasEmptyRow) handleAddNewItem(); }}
              >
                <Icon icon="material-symbols:add-circle-outline" width={20} />
                Add New Item
              </button>
            );
          })()}
          {/* <button
            type="button"
            className="text-[#E53935] font-medium text-[16px] flex items-center gap-2"
            onClick={handleAddNewItem}
          >
            <Icon icon="material-symbols:add-circle-outline" width={20} />
            Add New Item
          </button> */}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={() => router.push("/distributorsReturn")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <SidebarBtn
            disabled={!hasValidItems || isSubmitting}
            leadingIcon="mdi:check"
            isActive={!isSubmitting}
            label={isSubmitting ? (isEditMode ? "Updating Return..." : "Creating Return...") : (isEditMode ? "Update Return" : "Create Return")}
            onClick={handleSubmit}
          />
        </div>
      </ContainerCard >
    </div >
  );
}
