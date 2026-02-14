"use client";

import React, { Fragment, useState, useEffect, useRef, useCallback } from "react";
import ContainerCard from "@/app/components/containerCard";
import Table from "@/app/components/customTable";
import Logo from "@/app/components/logo";
import { Icon } from "@iconify-icon/react";
import { useRouter } from "next/navigation";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import KeyValueData from "@/app/components/keyValueData";
import InputFields from "@/app/components/inputFields";
import AutoSuggestion from "@/app/components/autoSuggestion";
import { agentCustomerGlobalSearch, warehouseStockTopOrders, agentCustomerList, genearateCode, getAllActiveWarehouse, itemGlobalSearch, itemList, itemWarehouseStock, pricingHeaderGetItemPrice, saveFinalCode, warehouseList, warehouseListGlobalSearch, applyPromotion } from "@/app/services/allApi";
import { addAgentOrder } from "@/app/services/agentTransaction";
import { Formik, FormikHelpers, FormikProps, FormikValues } from "formik";
import * as Yup from "yup";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useLoading } from "@/app/services/loadingContext";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import StepperForm, {
  StepperStep,
  useStepperForm,
} from "@/app/components/stepperForm";

import Link from "@/app/components/smartLink";
import { AnyARecord } from "dns";



interface FormData {
  id: number,
  erp_code: string,
  item_code: string,
  name: string,
  description: string,
  item_uoms: {
    id: number,
    item_id: number,
    uom_type: string,
    name: string,
    price: string,
    is_stock_keeping: boolean,
    upc: string,
    enable_for: string
  }[],
  pricing: {
    buom_ctn_price: string,
    auom_pc_price: string
  },
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
  shelf_life: string,
  commodity_goods_code: string,
  excise_duty_code: string,
  status: number,
  is_taxable: boolean,
  has_excies: boolean,
  item_weight: string,
  volume: number
}

interface WarehouseStock {
  item_id: number;
  warehouse_id: number;
  qty: string;
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

interface ItemData {
  item_id: string;
  item_name: string;
  // stored human-readable label for a selected item (used when server results don't include it)
  item_label?: string;
  UOM: { label: string; value: string; price?: string }[];
  uom_id?: string;
  Quantity: string;
  Price: string;
  Excise: string;
  Discount: string;
  Net: string;
  Vat: string;
  Total: string;
  available_stock?: string; // Store available warehouse stock for validation
  [key: string]: string | { label: string; value: string; price?: string; isPrmotion?: boolean; }[] | undefined | any;
}

type OrderInput = {
  customer_id: number;
  warehouse_id: number;
  details: {
    item_id: number;
    quantity: number;
    uom_id: number;
  }[];
};

type ConvertedOrder = {
  customer_id: number;
  warehouse_id: number;
  items: {
    item_id: number;
    item_uom_id: number;
    item_qty: number;
  }[];
};

export function convertOrderPayload(order: any): ConvertedOrder {
  return {
    customer_id: order.customer_id,
    warehouse_id: order.warehouse_id,
    items: order.details.map((detail:any) => ({
      item_id: detail.item_id,
      item_uom_id: detail.uom_id,
      item_qty: detail.quantity,
    })),
  };
}

type PromotionItems = {
  id: number;
  item_code: string;
  item_name: string;
  item_uom_id: string;
  name: string;
};

type Promotion = {
  id: number;
  name: string;
  bundle_combination: string;
  promotion_type: string;
  FocQty: number;
  promotion_items: PromotionItems[];
};

type ResultItem = PromotionItems & {
  focQty: number;
};

function getPromotionItemsByIndex(
  promotions: Promotion[],
  itemIds: number[]
): ResultItem[] {
  const result: ResultItem[] = [];

  itemIds.forEach((itemId, index) => {
    const promotion = promotions[index];
    if (!promotion) return;

    const matchedItem = promotion.promotion_items.find(
      (item) => item.id === itemId
    );

    if (matchedItem) {
      result.push({
        ...matchedItem,
        focQty: promotion.FocQty,
      });
    }
  });

  return result;
}


export default function OrderAddEditPage() {
  const itemRowSchema = Yup.object({
    item_id: Yup.string().required("Please select an item"),
    uom_id: Yup.string().required("Please select a UOM"),
    Quantity: Yup.number()
      .typeError("Quantity must be a number")
      .min(1, "Quantity must be at least 1")
      .required("Quantity is required"),
  });

  const validationSchema = Yup.object({
    warehouse: Yup.string().required("Warehouse is required"),
    customer: Yup.string().required("Customer is required"),
    delivery_date: Yup.string()
      .required("Delivery date is required")
      .test("is-date", "Delivery date must be a valid date", (val) => {
        return Boolean(val && !Number.isNaN(new Date(val).getTime()));
      }),
    note: Yup.string().max(1000, "Note is too long"),
    items: Yup.array().of(itemRowSchema),
  });

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();
  const { warehouseAllOptions, warehouseOptions, ensureWarehouseAllLoaded, ensureWarehouseLoaded } = useAllDropdownListData();
  const [skeleton, setSkeleton] = useState({
    route: false,
    customer: false,
    item: false,
  });

  // Load warehouse dropdown data
  useEffect(() => {
    ensureWarehouseAllLoaded();
    ensureWarehouseLoaded();
  }, [ensureWarehouseAllLoaded, ensureWarehouseLoaded]);
  const CURRENCY = localStorage.getItem("country") || "";
  const [filteredCustomerOptions, setFilteredCustomerOptions] = useState<{ label: string; value: string }[]>([]);
  const [filteredWarehouseOptions, setFilteredWarehouseOptions] = useState<{ label: string; value: string }[]>([]);
  const form = {
    warehouse: "",
    route: "",
    customer: "",
    note: "",
    delivery_date: new Date().toISOString().slice(0, 10),
  };
  const [openPromotion, setOpenPromotion] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotionsItems, setSelectedPromotionsItems] = useState([]);
  const [checkout,setCheckout]=useState(1);

  const [orderData, setOrderData] = useState<FormData[]>([]);
  const [itemsOptions, setItemsOptions] = useState<{ label: string; value: string }[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<Record<string, WarehouseStock[]>>({});
  const [itemsWithUOM, setItemsWithUOM] = useState<Record<string, { uoms: ItemUOM[], stock_qty: string, uomDetails: Record<string, { upc: string }> }>>({});
  const [itemData, setItemData] = useState<ItemData[]>([
    {
      item_id: "",
      item_name: "",
      item_label: "",
      UOM: [],
      Quantity: "1",
      Price: "",
      Excise: "",
      Discount: "",
      Net: "",
      Vat: "",
      Total: "",
      available_stock: "",
    },
  ]);
     const formikRef = useRef<any>(null);
 

  // per-row validation errors for item rows (keyed by row index)
  const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});

  // per-row loading (for UOM / price) so UI can show skeletons while fetching
  const [itemLoading, setItemLoading] = useState<Record<number, { uom?: boolean; price?: boolean }>>({});
 
  // Debounce timeout ref for warehouse selection
  const warehouseDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const validateRow = async (index: number, row?: ItemData, options?: { skipUom?: boolean }) => {
    const rowData = row ?? itemData[index];
    if (!rowData) return;
    // prepare data for Yup: convert numeric strings to numbers
    const toValidate = {
      item_id: String(rowData.item_id ?? ""),
      uom_id: String(rowData.uom_id ?? ""),
      Quantity: Number(rowData.Quantity) || 0,
      Price: Number(rowData.Price) || 0,
    };

    try {
      const validationErrors: Record<string, string> = {};
     
      if (options?.skipUom) {
        // validate only item_id and Quantity to avoid showing UOM required immediately after selecting item
        try {
          await itemRowSchema.validateAt("item_id", toValidate);
        } catch (e: any) {
          if (e?.message) validationErrors["item_id"] = e.message;
        }
        try {
          await itemRowSchema.validateAt("Quantity", toValidate);
        } catch (e: any) {
          if (e?.message) validationErrors["Quantity"] = e.message;
        }
      } else {
        await itemRowSchema.validate(toValidate, { abortEarly: false });
      }

      // Additional stock validation - check total quantity in base units across all rows with same item
      if (rowData.item_id && rowData.uom_id && rowData.Quantity) {
        const itemUOMData = itemsWithUOM[rowData.item_id];
        if (itemUOMData) {
          const totalStockQty = Number(itemUOMData.stock_qty);
          const currentUomInfo = itemUOMData.uoms.find(u => String(u.id) === String(rowData.uom_id));
         
          if (currentUomInfo) {
            const currentUpc = Number(itemUOMData.uomDetails[String(rowData.uom_id)]?.upc || "1");
            const requestedQuantity = Number(rowData.Quantity);
            const requestedInBaseUnits = requestedQuantity * currentUpc;
           
            // Calculate total used in base units for this item in other rows
            let totalUsedInBaseUnits = 0;
            itemData.forEach((item, i) => {
              if (i !== index && item.item_id === rowData.item_id && item.uom_id) {
                const itemUomInfo = itemUOMData.uoms.find(u => String(u.id) === String(item.uom_id));
                if (itemUomInfo) {
                  const itemUpc = Number(itemUOMData.uomDetails[String(item.uom_id)]?.upc || "1");
                  totalUsedInBaseUnits += (Number(item.Quantity) || 0) * itemUpc;
                }
              }
            });
           
            const totalRequestedInBaseUnits = requestedInBaseUnits + totalUsedInBaseUnits;
           
            if (totalRequestedInBaseUnits > totalStockQty) {
              const availableInCurrentUom = Math.floor((totalStockQty - totalUsedInBaseUnits) / currentUpc);
              if (totalUsedInBaseUnits > 0) {
                validationErrors["Quantity"] = `Quantity exceeds available stock. Available: ${availableInCurrentUom} ${currentUomInfo.name}`;
              } else {
                validationErrors["Quantity"] = `Quantity cannot exceed available stock (${availableInCurrentUom} ${currentUomInfo.name})`;
              }
            }
          }
        }
      }

      if (Object.keys(validationErrors).length === 0) {
        // clear errors for this row
        setItemErrors((prev) => {
          const copy = { ...prev };
          delete copy[index];
          return copy;
        });
      } else {
        setItemErrors((prev) => ({ ...prev, [index]: validationErrors }));
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

      // Additional stock validation even when other validations fail
      if (rowData.item_id && rowData.uom_id && rowData.Quantity) {
        const itemUOMData = itemsWithUOM[rowData.item_id];
        if (itemUOMData) {
          const totalStockQty = Number(itemUOMData.stock_qty);
          const currentUomInfo = itemUOMData.uoms.find(u => String(u.id) === String(rowData.uom_id));
         
          if (currentUomInfo) {
            const currentUpc = Number(itemUOMData.uomDetails[String(rowData.uom_id)]?.upc || "1");
            const requestedQuantity = Number(rowData.Quantity);
            const requestedInBaseUnits = requestedQuantity * currentUpc;
           
            // Calculate total used in base units for this item in other rows
            let totalUsedInBaseUnits = 0;
            itemData.forEach((item, i) => {
              if (i !== index && item.item_id === rowData.item_id && item.uom_id) {
                const itemUomInfo = itemUOMData.uoms.find(u => String(u.id) === String(item.uom_id));
                if (itemUomInfo) {
                  const itemUpc = Number(itemUOMData.uomDetails[String(item.uom_id)]?.upc || "1");
                  totalUsedInBaseUnits += (Number(item.Quantity) || 0) * itemUpc;
                }
              }
            });
           
            const totalRequestedInBaseUnits = requestedInBaseUnits + totalUsedInBaseUnits;
           
            if (totalRequestedInBaseUnits > totalStockQty) {
              const availableInCurrentUom = Math.floor((totalStockQty - totalUsedInBaseUnits) / currentUpc);
              if (totalUsedInBaseUnits > 0) {
                validationErrors["Quantity"] = `Quantity exceeds available stock. Available: ${availableInCurrentUom} ${currentUomInfo.name}`;
              } else {
                validationErrors["Quantity"] = `Quantity cannot exceed available stock (${availableInCurrentUom} ${currentUomInfo.name})`;
              }
            }
          }
        }
      }

      setItemErrors((prev) => ({ ...prev, [index]: validationErrors }));
    }
  };

  // Debounced function to fetch items when warehouse changes
  const fetchWarehouseItems = useCallback(async (warehouseId: string, searchTerm: string = "") => {
    if (!warehouseId) {
      setItemsOptions([]);
      setItemsWithUOM({});
      setWarehouseStocks({});
      return;
    }

    try {
      setSkeleton(prev => ({ ...prev, item: true }));
     
      // Fetch warehouse stocks - this API returns all needed data including pricing and UOMs
      const stockRes = await warehouseStockTopOrders(warehouseId);
      const stocksArray = stockRes.data?.stocks || stockRes.data?.items || stockRes.stocks || [];

      // Store warehouse stocks for validation
      setWarehouseStocks(prev => ({
        ...prev,
        [warehouseId]: stocksArray
      }));

      // Filter items based on search term and stock availability
      const filteredStocks = stocksArray.filter((stock: any) => {
        if (Number(stock.stock_qty) <= 0) return false;
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return stock.item_name?.toLowerCase().includes(searchLower) ||
               stock.item_code?.toLowerCase().includes(searchLower);
      });

      // Create items with UOM data map for easy access
      const itemsUOMMap: Record<string, { uoms: ItemUOM[], stock_qty: string, uomDetails: Record<string, { upc: string }> }> = {};
     
      const processedItems = filteredStocks.map((stockItem: any) => {
        const uomDetailsMap: Record<string, { upc: string }> = {};
       
        const item_uoms = stockItem?.uoms ? stockItem.uoms.map((uom: any) => {
          let price = uom.price;
          // Override with specific pricing from the API response
          if (uom?.uom_type === "primary") {
            price = stockItem.auom_pc_price || "-";
          } else if (uom?.uom_type === "secondary") {
            price = stockItem.buom_ctn_price || "-";
          }
         
          // Store UPC for each UOM
          const uomId = uom.uom_id;
          uomDetailsMap[String(uomId)] = { upc: String(uom.upc || "1") };
         
          return {
            ...uom,
            price,
            id: uomId,
            item_id: stockItem.item_id
          };
        }) : [];

        // Store UOM data for this item
        itemsUOMMap[stockItem.item_id] = {
          uoms: item_uoms,
          stock_qty: stockItem.stock_qty,
          uomDetails: uomDetailsMap
        };

        return {
          id: stockItem.item_id,
          name: stockItem.item_name,
          item_code: stockItem.item_code,
          erp_code: stockItem.erp_code,
          item_uoms,
          warehouse_stock: stockItem.stock_qty,
          pricing: {
            buom_ctn_price: stockItem.buom_ctn_price,
            auom_pc_price: stockItem.auom_pc_price
          }
        };
      });

      setItemsWithUOM(itemsUOMMap);
      setOrderData(processedItems);

      // Create dropdown options
      const options = processedItems.map((item: any) => ({
        value: String(item.id),
        label: `${item.erp_code || item.item_code || ''} - ${item.name || ''} (Stock: ${item.warehouse_stock})`
      }));

      setItemsOptions(options);
      setSkeleton(prev => ({ ...prev, item: false }));
     
      return options;
    } catch (error) {
      console.error("Error fetching warehouse items:", error);
      setSkeleton(prev => ({ ...prev, item: false }));
      return [];
    }
  }, []);

  // Debounced warehouse change handler
  const handleWarehouseChange = useCallback((warehouseId: string) => {
    // Clear existing timeout
    if (warehouseDebounceRef.current) {
      clearTimeout(warehouseDebounceRef.current);
    }

    // Set new timeout for debounced API call
    warehouseDebounceRef.current = setTimeout(() => {
      fetchWarehouseItems(warehouseId);
    }, 500); // 500ms debounce delay
  }, [fetchWarehouseItems]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (warehouseDebounceRef.current) {
        clearTimeout(warehouseDebounceRef.current);
      }
    };
  }, []);

  // Helper function to calculate available stock for an item based on UOM
  // Pass currentData to use the latest state during calculations
  const calculateAvailableStock = (itemId: string, uomId: string, currentRowIndex: number, currentData?: ItemData[]): string => {
    const itemUOMData = itemsWithUOM[itemId];
    if (!itemUOMData) return "";

    const totalStockQty = Number(itemUOMData.stock_qty);
    const uomInfo = itemUOMData.uoms.find(u => String(u.id) === String(uomId));
    if (!uomInfo) return "";

    const upc = Number(itemUOMData.uomDetails[String(uomId)]?.upc || "1");
   
    // Use provided data or fall back to state
    const dataToUse = currentData || itemData;
   
    // Calculate total consumed stock in base units (primary UOM) across all rows except current
    let totalConsumedInBaseUnits = 0;
   
    dataToUse.forEach((row, idx) => {
      if (idx === currentRowIndex || row.item_id !== itemId) return;
     
      const rowUomId = row.uom_id;
      if (!rowUomId) return;
     
      const rowUomInfo = itemUOMData.uoms.find(u => String(u.id) === String(rowUomId));
      if (!rowUomInfo) return;
     
      const rowUpc = Number(itemUOMData.uomDetails[String(rowUomId)]?.upc || "1");
      const rowQty = Number(row.Quantity) || 0;
     
      // Convert to base units
      totalConsumedInBaseUnits += rowQty * rowUpc;
    });

    // Calculate remaining stock in base units
    const remainingBaseUnits = totalStockQty - totalConsumedInBaseUnits;
   
    // Convert to the current UOM
    if (uomInfo.uom_type === "secondary") {
      // Secondary UOM (e.g., CSE): divide by UPC and floor
      const availableInSecondary = Math.floor(remainingBaseUnits / upc);
      return String(availableInSecondary);
    } else {
      // Primary UOM (e.g., PCS): show remaining base units
      return String(Math.floor(remainingBaseUnits));
    }
  };

  // Function for fetching Item based on warehouse stock
  const fetchItem = async (searchTerm: string, values?: FormikValues) => {
    // If warehouse is selected, use warehouseStockTopOrders
    if (values?.warehouse) {
      try {
        const stockRes = await warehouseStockTopOrders(values.warehouse);
        const stocksArray = stockRes.data?.stocks || stockRes.stocks || [];

        // Filter items based on search term and stock availability
        const filteredStocks = stocksArray.filter((stock: any) => {
          if (Number(stock.stock_qty) <= 0) return false;
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          return stock.item_name?.toLowerCase().includes(searchLower) ||
            stock.item_code?.toLowerCase().includes(searchLower);
        });

        // Process items to include pricing logic from warehouseStockTopOrders
        const data = filteredStocks.map((stockItem: any) => {
          // Process UOMs with pricing from the API response
          const item_uoms = stockItem?.uoms ? stockItem.uoms.map((uom: any) => {
            let price = uom.price;
            if (uom?.uom_type === "primary") {
              price = stockItem.auom_pc_price || uom.price;
            } else if (uom?.uom_type === "secondary") {
              price = stockItem.buom_ctn_price || uom.price;
            }
            return {
              ...uom,
              price,
              id: uom.id || `${stockItem.item_id}_${uom.uom_type}`,
              item_id: stockItem.item_id
            };
          }) : [];

          return {
            id: stockItem.item_id,
            name: stockItem.item_name,
            item_code: stockItem.item_code,
            erp_code: stockItem.erp_code,
            item_uoms,
            pricing: {
              buom_ctn_price: stockItem.buom_ctn_price,
              auom_pc_price: stockItem.auom_pc_price
            }
          };
        });

        setOrderData(data);
        const options = data.map((item: any) => ({
          value: String(item.id),
          label: (item.erp_code ?? item.item_code ?? item.code ?? "") + " - " + (item.name ?? "")
        }));

        setItemsOptions((prev: { label: string; value: string }[] = []) => {
          const map = new Map<string, { label: string; value: string }>();
          prev.forEach((o) => map.set(o.value, o));
          options.forEach((o: { label: string; value: string }) => map.set(o.value, o));
          return Array.from(map.values());
        });
        setSkeleton({ ...skeleton, item: false });
        return options;
      } catch (error) {
        console.error("Error fetching warehouse items:", error);
        setSkeleton({ ...skeleton, item: false });
        return [];
      }
    } else {
      // Fallback to global search if no warehouse selected
      const res = await itemGlobalSearch({ per_page: "10", query: searchTerm, warehouse: "" });
      if (res.error) {
        setSkeleton({ ...skeleton, item: false });
        return;
      }
      const data = res?.data || [];

      const updatedData = data.map((item: any) => {
        const item_uoms = item?.item_uoms ? item?.item_uoms?.map((uom: any) => {
          if (uom?.uom_type === "primary") {
            return { ...uom, price: item.pricing?.auom_pc_price }
          } else if (uom?.uom_type === "secondary") {
            return { ...uom, price: item.pricing?.buom_ctn_price }
          }
        }) : item?.item_uoms;
        return { ...item, item_uoms }
      })

      setOrderData(updatedData);
      const options = data.map((item: { id: number; name: string; code?: string; item_code?: string; erp_code?: string }) => ({
        value: String(item.id),
        label: (item.erp_code ?? item.item_code ?? item.code ?? "") + " - " + (item.name ?? "")
      }));

      setItemsOptions((prev: { label: string; value: string }[] = []) => {
        const map = new Map<string, { label: string; value: string }>();
        prev.forEach((o) => map.set(o.value, o));
        options.forEach((o: { label: string; value: string }) => map.set(o.value, o));
        return Array.from(map.values());
      });
      setSkeleton({ ...skeleton, item: false });
      return options;
    }
  };

  const codeGeneratedRef = useRef(false);
  const [code, setCode] = useState("");
  useEffect(() => {
    // generate code
    if (!codeGeneratedRef.current) {
      codeGeneratedRef.current = true;
      (async () => {
        const res = await genearateCode({
          model_name: "order",
        });
        if (res?.code) {
          setCode(res.code);
        }
        setLoading(false);
      })();
    }
  }, []);

  const recalculateItem = async (index: number, field: string, value: string, values?: FormikValues) => {
    const newData = [...itemData];
    const item: ItemData = newData[index] as ItemData;
    (item as any)[field] = value;

    // If user selects an item, update UI immediately and persist a label so selection survives searches
    if (field === "item_id") {
      // set item_id to the chosen value
      item.item_id = value;
      if (!value) {
        // cleared selection
        item.item_name = "";
        item.UOM = [];
        item.uom_id = "";
        item.Price = "";
        item.Quantity = "1";
        item.item_label = "";
        item.available_stock = "";
      } else {
        const selectedOrder = orderData.find((order: FormData) => order.id.toString() === value);
        const itemUOMData = itemsWithUOM[value];
       
        item.item_id = selectedOrder ? String(selectedOrder.id || value) : value;
        item.item_name = selectedOrder?.name ?? "";
       
        if (itemUOMData?.uoms) {
          item.UOM = itemUOMData.uoms.map(uom => ({
            label: uom.name,
            value: String(uom.id || ''),
            price: uom.price
          }));
          item.uom_id = itemUOMData.uoms[0]?.id ? String(itemUOMData.uoms[0].id) : "";
          item.Price = itemUOMData.uoms[0]?.price ? String(itemUOMData.uoms[0].price) : "";
         
          // Calculate available stock for the first UOM
          const firstUomId = String(itemUOMData.uoms[0]?.id || "");
          if (firstUomId) {
            item.available_stock = calculateAvailableStock(value, firstUomId, index);
          } else {
            item.available_stock = itemUOMData.stock_qty || "";
          }
        } else if (selectedOrder?.item_uoms) {
          // Fallback to selectedOrder UOMs with pricing from selectedOrder.pricing
          item.UOM = selectedOrder.item_uoms.map(uom => {
            let price = uom.price;
            if (uom.uom_type === "primary") {
              price = selectedOrder.pricing?.auom_pc_price || uom.price;
            } else if (uom.uom_type === "secondary") {
              price = selectedOrder.pricing?.buom_ctn_price || uom.price;
            }
            return {
              label: uom.name,
              value: String(uom.id || ''),
              price: price
            };
          });
         
          // Set price based on UOM type
          const firstUom = selectedOrder.item_uoms[0];
          if (firstUom) {
            item.uom_id = String(firstUom.id || "");
            if (firstUom.uom_type === "primary") {
              item.Price = selectedOrder.pricing?.auom_pc_price || firstUom.price || "";
            } else if (firstUom.uom_type === "secondary") {
              item.Price = selectedOrder.pricing?.buom_ctn_price || firstUom.price || "";
            } else {
              item.Price = firstUom.price || "";
            }
          } else {
            item.uom_id = "";
            item.Price = "";
          }
          item.available_stock = "";
        } else {
          // No data available
          item.UOM = [];
          item.uom_id = "";
          item.Price = "";
          item.available_stock = "";
        }
       
        item.Quantity = "1";
        // persist a readable label
        const computedLabel = selectedOrder ? `${selectedOrder.item_code ?? selectedOrder.erp_code ?? ''}${selectedOrder.item_code || selectedOrder.erp_code ? ' - ' : ''}${selectedOrder.name ?? ''}` : "";
        item.item_label = computedLabel;
        // ensure the selected item is available in itemsOptions
        if (item.item_label) {
          setItemsOptions((prev: { label: string; value: string }[] = []) => {
            if (prev.some(o => o.value === item.item_id)) return prev;
            return [...prev, { value: item.item_id, label: item.item_label as string }];
          });
        }
      }
    }

    // If user changes UOM, update price accordingly
    if (field === "uom_id" && value) {
      item.uom_id = value;
      const selectedUOM = item.UOM.find(uom => uom.value === value);
      if (selectedUOM?.price) {
        item.Price = selectedUOM.price;
      }
     
      // Recalculate available stock based on new UOM
      if (item.item_id) {
        const newAvailableStock = calculateAvailableStock(item.item_id, value, index);
        item.available_stock = newAvailableStock;
      }
    }
    const qty = Number(item.Quantity) || 0;
    const price = Number(item.Price) || 0;
    const total = qty * price;
    const vat = total - total / 1.18;
    const preVat = total - vat;
    const net = total - vat;
    // const excise = 0;
    // const discount = 0;
    // const gross = total;

    item.Total = total.toFixed(2);
    item.Vat = vat.toFixed(2);
    item.Net = net.toFixed(2);
    item.preVat = preVat.toFixed(2);
    // item.Excise = excise.toFixed(2);
    // item.Discount = discount.toFixed(2);
    // item.gross = gross.toFixed(2);

    if (field !== "item_id") {
      // Only recalculate available stock when UOM changes (not when quantity changes)
      if (field === "uom_id" && item.item_id) {
        // Recalculate available stock only for the current row when UOM changes
        newData[index] = item;
        setItemData(newData);
        validateRow(index, newData[index]);
      } else if (field === "Quantity" && item.item_id) {
        // When quantity changes, just update and validate - don't recalculate available stock
        newData[index] = item;
        setItemData(newData);
        validateRow(index, newData[index]);
       
        // Revalidate all other rows with the same item (for validation errors only)
        newData.forEach((otherItem, otherIndex) => {
          if (otherIndex !== index && otherItem.item_id === item.item_id) {
            validateRow(otherIndex, newData[otherIndex]);
          }
        });
      } else {
        setItemData(newData);
        validateRow(index, newData[index]);
      }
    } else {
      setItemData(newData);
    }
  };

  const handleAddNewItem = () => {
    setItemData([
      ...itemData,
      {
        item_id: "",
        item_name: "",
        item_label: "",
        UOM: [],
        uom_id: "",
        Quantity: "1",
        Price: "",
        Excise: "0.00",
        Discount: "0.00",
        Net: "0.00",
        Vat: "0.00",
        Total: "0.00",
        available_stock: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (itemData.length <= 1) {
      setItemData([
        {
          item_id: "",
          item_name: "",
          item_label: "",
          UOM: [],
          uom_id: "",
          Quantity: "1",
          Price: "",
          Excise: "",
          Discount: "",
          Net: "",
          Vat: "",
          Total: "",
          available_stock: "",
        },
      ]);
      return;
    }
    setItemData(itemData.filter((_, i) => i !== index));
  };

  // --- Compute totals for summary
  const grossTotal = itemData.reduce(
    (sum, item) => sum + Number(item.Total || 0),
    0
  );
  const totalVat = itemData.reduce(
    (sum, item) => sum + Number(item.Vat || 0),
    0
  );
  const netAmount = itemData.reduce(
    (sum, item) => sum + Number(item.Net || 0),
    0
  );
  const preVat = totalVat ? grossTotal - totalVat : grossTotal;
  const discount = itemData.reduce(
    (sum, item) => sum + Number(item.Discount || 0),
    0
  );
  const finalTotal = netAmount + totalVat;

  const generatePayload = (values?: FormikValues) => {
    return {
      order_code: code,
      warehouse_id: Number(values?.warehouse) || null,
      customer_id: Number(values?.customer) || null,
      delivery_date: values?.delivery_date || form.delivery_date,
      gross_total: Number(grossTotal.toFixed(2)),
      vat: Number(totalVat.toFixed(2)),
      net_amount: Number(netAmount.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      comment: values?.note || "",
      status: 1,
      details: itemData.map((item, i) => ({
        item_id: Number(item.item_id) || null,
        item_price: Number(item.Price) || null,
        quantity: Number(item.Quantity) || null,
        vat: Number(item.Vat) || null,
        uom_id: Number(item.uom_id) || null,
        // discount: Number(item.Discount) || null,
        // discount_id: 0,
        // gross_total: Number(item.Total) || null,
        net_total: Number(item.Net) || null,
        total: Number(item.Total) || null,
        isPrmotion: item.isPrmotion  == true ? true : false,
      })),
    };
  };

  const handleSubmit = async (values: FormikValues, formikHelpers: FormikHelpers<FormikValues>) => {
    try {
      // validate item rows separately (they live in local state)
      const itemsSchema = Yup.array().of(itemRowSchema);
      try {
        await itemsSchema.validate(itemData, { abortEarly: false });
      } catch (itemErr: any) {
        // log detailed item validation errors and surface a friendly message
        console.error("Item validation errors:", itemErr.inner || itemErr);
        showSnackbar(itemErr.inner.map((err: any) => err.message).join(", "), "error");
        // set a top-level form error to prevent submission
        formikHelpers.setErrors({ items: "Item rows validation failed" } as any);
        return;
      }

      // Additional validation: Check for stock availability violations
      const stockViolations: string[] = [];
      const itemStockMap = new Map<string, number>();

      itemData.forEach((item, index) => {
        if (!item.item_id || !item.uom_id || !item.Quantity) return;

        const itemUOMData = itemsWithUOM[item.item_id];
        if (!itemUOMData) return;

        const totalStockQty = Number(itemUOMData.stock_qty);
        const uomInfo = itemUOMData.uoms.find(u => String(u.id) === String(item.uom_id));
       
        if (!uomInfo) return;

        const upc = Number(itemUOMData.uomDetails[String(item.uom_id)]?.upc || "1");
        const qtyInBaseUnits = Number(item.Quantity) * upc;

        // Accumulate quantities in base units for the same item
        const itemKey = item.item_id;
        const totalQtyInBaseUnits = (itemStockMap.get(itemKey) || 0) + qtyInBaseUnits;
        itemStockMap.set(itemKey, totalQtyInBaseUnits);

        // Check if total quantity exceeds available stock
        if (totalQtyInBaseUnits > totalStockQty) {
          const itemName = item.item_name || item.item_label || `Item ${index + 1}`;
          stockViolations.push(
            `${itemName}: Total quantity exceeds available stock (${totalStockQty} base units requested: ${totalQtyInBaseUnits})`
          );
        }
      });

      if (stockViolations.length > 0) {
        showSnackbar(
          `Cannot submit order: ${stockViolations.join("; ")}`,
          "error"
        );
        return;
      }

      formikHelpers.setSubmitting(true);
      const payload = generatePayload(values);
      let promotionPayload = convertOrderPayload(payload)
      const promotionRes = await applyPromotion(promotionPayload);
      if(checkout == 1)
      {
      if (promotionRes?.data?.itemPromotionInfo.length > 0) {
       
        // setPromotions(data);
        setPromotions(promotionRes?.data?.itemPromotionInfo);
         setOpenPromotion(true);

      }
      else{


        setCheckout(2);
        callForClick();
      }
    }
      else{
      const res = await addAgentOrder(payload);
      if (res.error) {
        showSnackbar(res.data.message || "Failed to create order", "error");
        console.error("Create order error:", res);
      } else {
        try {
          await saveFinalCode({
            reserved_code: code,
            model_name: "order",
          });
        } catch (e) {
          // Optionally handle error, but don't block success
        }
        showSnackbar("Order created successfully", "success");
        router.push("/distributorsOrder");
      }
    }
   
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to submit order", "error");
    } finally {
      if (formikHelpers && typeof formikHelpers.setSubmitting === "function") {
        formikHelpers.setSubmitting(false);
      }
    }
  };
 const callForClick = () => {  
   
    formikRef.current?.submitForm();
   }
  const keyValueData = [
    // { key: "Gross Total", value: `AED ${toInternationalNumber(grossTotal)}` },
    // { key: "Discount", value: `AED ${toInternationalNumber(discount)}` },
    { key: "Net Total", value: `${CURRENCY} ${toInternationalNumber(netAmount,{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { key: "VAT", value: `${CURRENCY} ${toInternationalNumber(totalVat,{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    // { key: "Pre VAT", value: `AED ${toInternationalNumber(preVat)}` },
    // { key: "Delivery Charges", value: `AED ${toInternationalNumber(0.00)}` },
  ];

  const fetchAgentCustomers = async (values: FormikValues, search: string) => {
    const res = await agentCustomerGlobalSearch({
      warehouse_id: values.warehouse,
      query: search || "",
      per_page: "10"
    });
    if (res.error) {
      showSnackbar(res.data?.message || "Failed to fetch customers", "error");
      setSkeleton({ ...skeleton, customer: false });
      return;
    }
    const data = res?.data || [];
    const options = data.map((customer: { id: number; osa_code: string; name: string }) => ({
      value: String(customer.id),
      label: customer.osa_code + " - " + customer.name
    }));
    setFilteredCustomerOptions(options);
    setSkeleton({ ...skeleton, customer: false });
    return options;
  }

  const fetchWarehouse = async (searchQuery?: string) => {
    const res = await getAllActiveWarehouse({
      search: searchQuery || "",
      dropdown: "1",
      status: "1",
      per_page: "50"
    });

    if (res.error) {
      showSnackbar(res.data?.message || "Failed to fetch customers", "error");
      return;
    }
    const data = res?.data || [];
    const options = data.map((warehouse: { id: number; warehouse_code: string; warehouse_name: string }) => ({
      value: String(warehouse.id),
      label: warehouse.warehouse_code + " - " + warehouse.warehouse_name
    }));
    setFilteredWarehouseOptions(options);
    return options;
  }

  // const fetchPrice = async (item_id: string, customer_id: string, warehouse_id?: string, route_id?: string) => {
  //   const res = await pricingHeaderGetItemPrice({ customer_id, item_id });
  //   if (res.error) {
  //     showSnackbar(res.data?.message || "Failed to fetch items", "error");
  //     setSkeleton({ ...skeleton, item: false });
  //     return;
  //   }
  //   const data = res?.data || [];
  //   return data;
  // };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-[20px]">
        <Link href={"distributorsOrder"} back className="flex items-center gap-[16px]">
          <Icon
            icon="lucide:arrow-left"
            width={24}
          />
          <h1 className="text-[20px] font-semibold text-[#181D27] flex items-center leading-[30px]">
            Add Distributor&apos;s Orders
          </h1>
        </Link>
      </div>

      <ContainerCard className="rounded-[10px] scrollbar-none">
        {/* --- Header Section --- */}
        <div className="flex justify-between mb-10 flex-wrap gap-[20px]">
          <div className="flex flex-col gap-[10px]">
            <Logo type="full" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[42px] uppercase text-[#A4A7AE] mb-[10px]">Order</span>
            <span className="text-primary text-[14px] tracking-[8px]">#{code}</span>
          </div>
        </div>
        <hr className="w-full text-[#D5D7DA]" />

        <Formik<FormikValues>

         innerRef={formikRef}
          initialValues={form}
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          enableReinitialize={true}
        >
          {({ values, touched, errors, setFieldValue, handleChange, submitForm, isSubmitting }: FormikProps<FormikValues>) => {
            // // Log Formik validation errors to console for easier debugging
            // useEffect(() => {
            //   if (errors && Object.keys(errors).length > 0) {
            //     console.warn("Formik validation errors:", errors);
            //   }
           
            // }, [errors]);

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-10">
                  <div>
                    <InputFields
                      required
                      label="Distributor"
                      name="warehouse"
                      placeholder="Select Distributor"
                      value={values.warehouse}
                      options={warehouseOptions}
                      searchable={true}
                      showSkeleton={warehouseOptions.length === 0}
                      onChange={(e) => {
                        if (values.warehouse !== e.target.value) {
                          setFieldValue("warehouse", e.target.value);
                          setSkeleton((prev) => ({ ...prev, customer: true }));
                          setFieldValue("customer", "");
                         
                          // Reset items when warehouse changes
                          setItemData([{
                            item_id: "",
                            item_name: "",
                            item_label: "",
                            UOM: [],
                            Quantity: "1",
                            Price: "",
                            Excise: "",
                            Discount: "",
                            Net: "",
                            Vat: "",
                            Total: "",
                            available_stock: "",
                          }]);
                         
                          // Trigger debounced warehouse items fetch
                          handleWarehouseChange(e.target.value);
                        } else {
                          setFieldValue("warehouse", e.target.value);
                        }
                      }}
                      error={touched.warehouse && (errors.warehouse as string)}
                    />
                  </div>
                  <div>
                    <AutoSuggestion
                      required
                      label="Customer"
                      name="customer"
                      placeholder="Search customer"
                      onSearch={(q) => { return fetchAgentCustomers(values, q) }}
                      initialValue={filteredCustomerOptions.find(o => o.value === String(values?.customer))?.label || ""}
                      onSelect={(opt) => {
                        if (values.customer !== opt.value) {
                          setFieldValue("customer", opt.value);
                        } else {
                          setFieldValue("customer", opt.value);
                        }
                      }}
                      onClear={() => {
                        setFieldValue("customer", "");
                        setItemData([{
                          item_id: "",
                          item_name: "",
                          item_label: "",
                          UOM: [],
                          Quantity: "1",
                          Price: "",
                          Excise: "",
                          Discount: "",
                          Net: "",
                          Vat: "",
                          Total: "",
                          available_stock: ""
                        }]);
                      }}
                      disabled={values.warehouse === ""}
                      error={touched.customer && (errors.customer as string)}
                      className="w-full"
                    />
                  </div>
                  {/* <div>
                    <InputFields
                      required
                      label="Delivery Date"
                      type="date"
                      name="delivery_date"
                      value={values.delivery_date}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                      onChange={handleChange}
                    />
                  </div> */}
                  <div>
                    <InputFields
                      required
                      label="Delivery Date"
                      type="date"
                      name="delivery_date"
                      value={
                        values.delivery_date ||
                        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                      }
                      min={new Date().toISOString().slice(0, 10)} // today
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Table
                  data={itemData.map((row, idx) => ({
                    ...row,
                    idx: idx.toString(),
                    UOM: Array.isArray(row.UOM) ? JSON.stringify(row.UOM) : "[]",
                    item_id: String(row.item_id ?? ""),
                    Quantity: String(row.Quantity ?? ""),
                    Price: String(row.Price ?? ""),
                    Excise: String(row.Excise ?? ""),
                    Discount: String(row.Discount ?? ""),
                    Net: String(row.Net ?? ""),
                    Vat: String(row.Vat ?? ""),
                    Total: String(row.Total ?? ""),
                    PreVat: String(row.PreVat ?? ""),
                    isPrmotion: row.isPrmotion ? true : false,
                    available_stock: String(row.available_stock ?? ""),
                  }))}
                  config={{
                    columns: [
                      {
                        key: "item_id",
                        label: "Item Name",
                        width: 300,
                        render: (row) => {
                          const idx = Number(row.idx);
                          const err = itemErrors[idx]?.item_id;
                          return (
                            <div>
                              <InputFields
                                label=""
                                name={`item_id_${row.idx}`}
                                value={row.item_id}
                                searchable={true}
                                onChange={(e) => {
                                  recalculateItem(Number(row.idx), "item_id", e.target.value)
                                }}
                                options={itemsOptions}
                                placeholder="Select item"
                                disabled={!values.customer}
                                error={err && err}
                              />
                            </div>
                          );
                        },
                      },
                      {
                        key: "uom_id",
                        label: "UOM",
                        width: 150,
                        render: (row) => {
                          const idx = Number(row.idx);
                          const err = itemErrors[idx]?.uom_id;
                          const options = JSON.parse(row.UOM ?? "[]");
                          return (
                            <div>
                              <InputFields
                                label=""
                                value={row.uom_id}
                                placeholder="Select UOM"
                                width="max-w-[150px]"
                                options={options}
                                searchable={true}
                                disabled={options.length === 0 || !values.customer}
                                showSkeleton={Boolean(itemLoading[idx]?.uom)}
                                onChange={(e) => {
                                  recalculateItem(Number(row.idx), "uom_id", e.target.value)
                                  const price = options.find((uom: { value: string }) => String(uom.value) === e.target.value)?.price || "0.00";
                                  recalculateItem(Number(row.idx), "Price", price);
                                }}
                                error={err && err}
                              />
                            </div>
                          );
                        },
                      },
                      {
                        key: "Quantity",
                        label: "Qty",
                        width: 120,
                        render: (row) => {
                          const idx = Number(row.idx);
                          const err = itemErrors[idx]?.Quantity;
                          const currentItem = itemData[idx];
                          const availableStock = currentItem?.available_stock;
                          const itemId = currentItem?.item_id;
                          const uomId = currentItem?.uom_id;
                         
                          // Get UOM name for display
                          let uomName = "";
                          if (itemId && uomId) {
                            const itemUOMData = itemsWithUOM[itemId];
                            const uomInfo = itemUOMData?.uoms.find(u => String(u.id) === String(uomId));
                            uomName = uomInfo?.name || "";
                          }
                         
                          return (
                            <div className={`${ availableStock ? "pt-5" : ""}`}>
                              <InputFields
                                label=""
                                type="number"
                                name="Quantity"
                                placeholder="Enter Qty"
                         
                                value={row.Quantity}
                                disabled={!row.uom_id || !values.customer || row.isPrmotion}
                                onChange={(e) => {
                                  const raw = (e.target as HTMLInputElement).value;
                                  const intPart = raw.split('.')[0];
                                  const sanitized = intPart === '' ? '' : String(Math.max(0, parseInt(intPart, 10) || 0));
                                  recalculateItem(Number(row.idx), "Quantity", sanitized);
                                }}
                                min={1}
                                max={availableStock ? Number(availableStock) : undefined}
                                integerOnly={true}
                                // error={err && err}
                              />
                              {availableStock && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Available Stock: {availableStock}
                                </div>
                              )}
                            </div>
                          );
                        },
                      },
                      {
                        key: "Price",
                        label: "Price",
                        render: (row) => {
                          const idx = Number(row.idx);
                          const loading = Boolean(itemLoading[idx]?.price);
                          const price = String(row.Price ?? "");
                          if (loading) {
                            return <span className="text-gray-400 animate-pulse">Loading...</span>;
                          }
                          if (!price || price === "" || price === "0" || price === "-") {
                            return <span className="text-gray-400">-</span>;
                          }
                          return <span>{price}</span>;
                        }
                      },
                      // { key: "excise", label: "Excise", render: (row) => <span>{toInternationalNumber(row.Excise) || "0.00"}</span> },
                      // { key: "discount", label: "Discount", render: (row) => <span>{toInternationalNumber(row.Discount) || "0.00"}</span> },
                      // { key: "preVat", label: "Pre VAT", render: (row) => <span>{toInternationalNumber(row.preVat) || "0.00"}</span> },
                      { key: "Net", label: "Net", render: (row) => <span>{toInternationalNumber(row.Net,{ minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span> },
                      { key: "Vat", label: "VAT", render: (row) => <span>{toInternationalNumber(row.Vat,{ minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span> },
                      // { key: "gross", label: "Gross", render: (row) => <span>{toInternationalNumber(row.gross) || "0.00"}</span> },
                      { key: "Total", label: "Total", render: (row) => <span>{toInternationalNumber(Number(row.Total),{ minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span> },
                      {
                        key: "action",
                        label: "Action",
                        render: (row) => (
                          <button
                            type="button"
                            className={`${itemData.length <= 1
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                              } text-red-500 flex items-center`}
                            onClick={() =>
                              itemData.length > 1 && handleRemoveItem(Number(row.idx))
                            }
                          >
                            <Icon icon="hugeicons:delete-02" width={20} />
                          </button>
                        ),
                      },
                    ],
                    showNestedLoading: false,
                  }}
                />

                {/* --- Summary --- */}
                <div className="flex justify-between text-primary gap-0 mb-10">
                  <div className="flex justify-between flex-wrap w-full mt-[20px]">
                    <div className="flex flex-col justify-between gap-[20px] w-full lg:w-auto">
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
                      </div>
                      <div className="flex flex-col justify-end gap-[20px] w-full lg:w-[400px]">
                        <InputFields
                          label="Note"
                          type="textarea"
                          name="note"
                          placeholder="Enter Note"
                          value={values.note}
                          onChange={handleChange}
                          error={touched.note && (errors.note as string)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-[10px] w-full lg:w-[350px]">
                      {keyValueData.map((item) => (
                        <Fragment key={item.key}>
                          <KeyValueData data={[item]} />
                          <hr className="text-[#D5D7DA]" />
                        </Fragment>
                      ))}
                      <div className="font-semibold text-[#181D27] text-[18px] flex justify-between">
                        <span>Total</span>
                        <span>{CURRENCY} {toInternationalNumber(Number(finalTotal),{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Buttons --- */}
                <hr className="text-[#D5D7DA]" />
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    onClick={() => router.push("/distributorsOrder")}
                  >
                    Cancel
                  </button>
                  <SidebarBtn  type="submit" isActive={true} label={isSubmitting ? "Creating Order..." : checkout==1?"Checkout":"Create Order"} disabled={isSubmitting || !values.warehouse || !values.customer || !itemData || (itemData.length === 1 && !itemData[0].item_name)} onClick={() => submitForm()} />
                </div>
              </>
            );
          }}
        </Formik>
      </ContainerCard>

        <Dialog
        open={openPromotion}
        onClose={()=>setOpenPromotion(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
       
      >
        <DialogContent>
          {/* <DialogContentText id="alert-dialog-description"> */}
           <PromotionStepper callForClick={callForClick} setCheckout={setCheckout} setOpenPromotion={setOpenPromotion} promotions={promotions} selectedPromotionsItems={selectedPromotionsItems} recalculateItem={recalculateItem} setSelectedPromotionsItems={setSelectedPromotionsItems} itemData={itemData}  setItemData={setItemData} />
          {/* </DialogContentText> */}
        </DialogContent>
       
      </Dialog>
    </div>
  );
}







// const promotions = [
//   {
//     id: 77,
//     name: "CSD (10+1) Special",
//     bundle_combination: "range",
//     promotion_type: "quantity",
//     FocQty: 1,
//     promotion_items: [],
//   },
//   {
//     id: 78,
//     name: "New Year Offer",
//     bundle_combination: "single",
//     promotion_type: "amount",
//     FocQty: 2,
//     promotion_items: [],
//   },
// ];



 function PromotionStepper({setCheckout,callForClick, promotions,setOpenPromotion, selectedPromotionsItems,setPromotions, setSelectedPromotionsItems,itemData,setItemData,recalculateItem }: any) {
  const { showSnackbar } = useSnackbar();

  /** 🔹 Convert promotions → steps */
  const steps: StepperStep[] = promotions.map((promo:any, index:any) => ({
    id: index + 1,
    label: promo.name,
  }));

  const {
    currentStep,
    nextStep,
    prevStep,
    isLastStep,
    markStepCompleted,
    isStepCompleted,
  } = useStepperForm(steps.length);

  const handleNext = () => {
    markStepCompleted(currentStep);
    nextStep();
  };

  const handleSubmit = () => {

    let result = getPromotionItemsByIndex(promotions,selectedPromotionsItems)

    result.map((item:any)=>{
      itemData.push({
      item_id: item.id,
      item_name: `${item.item_code}-${item.item_name}`,
      item_label: `${item.item_code}-${item.item_name}`,
      UOM: [{
        value: item.item_uom_id,
        label: item.name,
      }],
      uom_id: item.item_uom_id,
      Quantity: item.focQty,
      Price: "0.00",
      Excise: "0",
      Discount: "0",
      Net: "0",
      Vat: "0",
      Total: "0.00",
      available_stock: "",
      isPrmotion: true,
    })
    })
      //  itemData.pop()
       setItemData([...itemData]);

   
    // recalculateItem(Number(itemData.length), "item_id", selectedPromotionsItems[0])
setOpenPromotion(false);
setCheckout(2)

callForClick();
    // showSnackbar("All promotions processed successfully", "success");
  };



  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        {/* <Link href="/promotion">
          <Icon icon="lucide:arrow-left" width={22} />
        </Link> */}
        <h1 className="text-xl font-semibold">
          Promotion Setup
        </h1>
      </div>

      <StepperForm
        steps={steps.map((step) => ({
          ...step,
          isCompleted: isStepCompleted(step.id),
        }))}
        currentStep={currentStep}
        onStepClick={() => {}}
        close={true}
        closeFunction={() => setOpenPromotion(false)}
        onBack={() => prevStep()}
        onNext={handleNext}
        onSubmit={handleSubmit}
        showSubmitButton={isLastStep}
        showNextButton={!isLastStep}
        nextButtonText="Save & Next"
        submitButtonText="Finish"
      >
        <RenderStepContent promotions={promotions} selectedPromotionsItems={selectedPromotionsItems} setSelectedPromotionsItems={setSelectedPromotionsItems} setPromotions={setPromotions} currentStep={currentStep} promotionItems={promotions.promotion_items}/>
      </StepperForm>
    </>
  );
}



interface PromotionItem {
  id: number;
  item_code: string;
  item_name: string;
  item_uom_id: string;
  name: any;
}

interface Props {
  promotionItems: PromotionItem[];
  qtyData: Record<number, string>;
 
  setQtyData: (idx: number, value: string) => void;
}

 function PromotionItemsQtyTable({
  selectedItems, setSelectedItems, promotions, setPromotions, currentStep, selectedPromotionsItems, setSelectedPromotionsItems,
  promotionItems,
}: any) {
  const [qtyData, setQtyData] = useState<any>(0);
  const [selects, setSelects] = useState<any>("");

  useEffect(() => {
    const selectedItemId = selectedPromotionsItems[currentStep - 1] || "";
    setSelects(selectedItemId);
  }, [currentStep, selectedPromotionsItems]);
                          // const options = JSON.parse(row.UOM ?? "[]");


  return (
    <div style={{height:"300px"}}>
       <InputFields
                                label=""
                                name={`item_id`}
                                value={selects}
                                searchable={true}
                                onChange={(e) => {
                                  setSelects(e.target.value);    
                                  selectedPromotionsItems[currentStep - 1] = e.target.value;
                                  setSelectedPromotionsItems([...selectedPromotionsItems]);  

                                }}
                                options={promotionItems.map((row:any, idx:any) => ({
                                  value: row.id,
                                  label: row.item_name,
      }))}
                                placeholder="Select item"
                                // disabled={!values.customer}
                                // error={err && err}
                              />
                              <div className="mt-4">
                              <InputFields
                                label="Quantity"
                                type="number"
                                name="Quantity"
                                placeholder="Enter Qty"
                                value={promotions[currentStep - 1]?.FocQty}
                                onChange={(e) => {
                                   
                                }}
                               disabled={true}
                              />
                             
                              </div>
                               <div>
                              <InputFields
                                label="Uom"
                                value={promotionItems[0]?.name}
                                placeholder="Select UOM"
                                width="max-w-[150px]"
                                onChange={()=>{}}
                                disabled={true}
                              />
                            </div>

    </div>
  );
}

    const RenderStepContent = ({promotions,selectedPromotionsItems,setSelectedPromotionsItems,setPromotions,currentStep,promotionItems}:any) => {
    const promotion = promotions[currentStep - 1];
  const [selectedItems, setSelectedItems] = useState<any>(selectedPromotionsItems[currentStep - 1]);
   

    return (
      <ContainerCard>

        <PromotionItemsQtyTable selectedItems={selectedItems} setSelectedItems={setSelectedItems} promotions={promotions} selectedPromotionsItems={selectedPromotionsItems} setSelectedPromotionsItems={setSelectedPromotionsItems} setPromotions={setPromotions} currentStep={currentStep} promotionItems={promotion.promotion_items}/>
       
         
        {/* <h2 className="mb-4 text-lg font-semibold">
          {promotion?.name}
        </h2> */}

     
      </ContainerCard>
    );
  };