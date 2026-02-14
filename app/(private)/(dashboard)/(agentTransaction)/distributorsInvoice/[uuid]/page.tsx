"use client";

import ContainerCard from "@/app/components/containerCard";
import Table from "@/app/components/customTable";
import Logo from "@/app/components/logo";
import { Icon } from "@iconify-icon/react";
import { useRouter, useParams } from "next/navigation";
import { ChangeEvent, useState, useEffect, Fragment, useCallback, useRef } from "react";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import KeyValueData from "@/app/components/keyValueData";
import InputFields from "@/app/components/inputFields";
import AutoSuggestion from "@/app/components/autoSuggestion";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import { createInvoice, updateInvoice, invoiceByUuid, deliveryList } from "@/app/services/agentTransaction";
import { warehouseStockTopOrders, routeList, getCompanyCustomers, agentCustomerList, itemGlobalSearch, genearateCode, saveFinalCode, getAllActiveWarehouse, applyPromotion } from "@/app/services/allApi";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useLoading } from "@/app/services/loadingContext";
import * as yup from "yup";
import { FormikValues } from "formik";
import toInternationalNumber from "@/app/(private)/utils/formatNumber";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import StepperForm, { StepperStep, useStepperForm } from "@/app/components/stepperForm";
import Link from "@/app/components/smartLink";

// Local types to avoid any
type Option = { value: string; label: string; code?: string; name?: string };

interface ItemUom {
    id: string;
    name: string;
    price?: string | number;
}
interface WarehouseStock {
    item_id: number;
    warehouse_id: number;
    qty: string;
}

interface FullItem {
    id: string;
    // Some APIs/key usages call this `code` and some `item_code` – keep both optional to be defensive
    code?: string;
    erp_code?: string;
    item_code?: string;
    name?: string;
    uom: ItemUom[];
}

interface Warehouse {
    id: number | string;
    warehouse_code?: string;
    warehouse_name?: string;
}

interface RouteItem {
    id: number | string;
    route_code?: string;
    route_name?: string;
}

interface CustomerLike {
    id: number | string;
    outlet_name?: string;
    customer_name?: string;
    name?: string;
    osa_code?: string;
    business_name?: string;
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

interface DeliveryDetail {
    // Some APIs provide nested item object, some provide flat item_id/code/name fields — accept both
    item?: { id?: number | string; code?: string; name?: string };
    item_id?: number | string;
    code?: string;
    item_name?: string;
    uom_id?: number | string;
    uom_name?: string;
    item_price?: number | string;
    itemvalue?: number | string;
    excise?: number | string;
    net?: number | string;
    vat?: number | string;
    total?: number | string;
    quantity?: number | string;
    discount?: number | string;
    is_promotional?: boolean;
}

interface Delivery {
    id?: number | string;
    delivery_code?: string;
    customer?: { id?: number | string; outlet_name?: string; name?: string };
    route?: { id?: number | string; code?: string; name?: string };
    salesman?: { id?: number | string; code?: string; name?: string };
    comment?: string;
    details?: DeliveryDetail[];
    route_id?: number | string;
    salesman_id?: number | string;
    customer_id?: number | string; // sometimes explicit
}

interface InvoiceItemRow {
    item_id: string;
    itemName: string;
    itemLabel: string; // Store the display label separately
    UOM: string;
    uom_id: string;
    Quantity: string;
    Price: string;
    isPrmotion:boolean;
    Excise: string;
    Discount: string;
    Net: string;
    Vat: string;
    Total: string;
    is_promotional?: boolean;
}

// Helper to safely extract UOMs from unknown API shapes (item_uoms or uom)
const extractUoms = (source: unknown): ItemUom[] => {
    if (!Array.isArray(source)) return [];
    return source.map((u) => {
        const uu = u as Record<string, unknown>;
        return {
            id: String(uu.id ?? ''),
            name: String(uu.name ?? ''),
            price: (uu.price as string | number | undefined) ?? undefined,
        } as ItemUom;
    });
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
      item_uom_id: detail.uom,
      item_qty: detail.quantity,
    })),
  };
}


const dropdownDataList = [
    { icon: "humbleicons:radio", label: "Inactive", iconWidth: 20 },
    { icon: "hugeicons:delete-02", label: "Delete", iconWidth: 20 },
];


export default function InvoiceddEditPage() {
    // Define validation schema for item rows
    const itemRowSchema = yup.object({
        item_id: yup.string().required("Please select an item"),
        uom_id: yup.string().required("Please select a UOM"),
        Quantity: yup.number()
            .typeError("Quantity must be a number")
            .min(1, "Quantity must be at least 1")
            .required("Quantity is required"),
    });

    const { warehouseOptions, agentCustomerOptions, routeOptions, itemOptions, fetchAgentCustomerOptions, ensureAgentCustomerLoaded, ensureItemLoaded, ensureRouteLoaded, ensureWarehouseLoaded } = useAllDropdownListData();

    // Load dropdown data
    useEffect(() => {
        ensureAgentCustomerLoaded();
        ensureItemLoaded();
        ensureRouteLoaded();
        ensureWarehouseLoaded();
    }, [ensureAgentCustomerLoaded, ensureItemLoaded, ensureRouteLoaded, ensureWarehouseLoaded]);
    const [itemsWithUOM, setItemsWithUOM] = useState<Record<string, { uoms: ItemUOM[], stock_qty: string }>>({});
    const [invoiceData, setInvoiceData] = useState<FormData[]>([]);
    const [warehouseStocks, setWarehouseStocks] = useState<Record<string, WarehouseStock[]>>({});
    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const router = useRouter();
    const params = useParams();
    const CURRENCY = localStorage.getItem("country") || "";
    const [rowAvailableStock, setRowAvailableStock] = useState<Record<number, string>>({});
    const uuid = params?.uuid as string | undefined;
    const isEditMode = uuid !== undefined && uuid !== "add";
    const [isSubmitting, setIsSubmitting] = useState(false);
      const [checkout,setCheckout]=useState(1);
      const [selectedPromotionsItems, setSelectedPromotionsItems] = useState([]);
      const [openPromotion, setOpenPromotion] = useState(false);
      const [promotions, setPromotions] = useState([]);
    const [deliveryOptions, setDeliveryOptions] = useState<Option[]>([]);
    const [skeleton, setSkeleton] = useState({
        route: false,
        customer: false,
        item: false,
    });

    // per-row validation errors for item rows (keyed by row index)
    const [warehouseIdForCus,setWarehouseIdForCus] = useState("");
    const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});
    const [form, setForm] = useState({
        customerType: "2",
        warehouse: "",
        warehouse_name: "",
        // route: "",
        // route_name: "",
        customer: "",
        customer_name: "",
        invoice_type: "",
        invoice_date: new Date().toISOString().slice(0, 10),
        note: "",
        transactionType: "1",
        paymentTerms: "1",
        paymentTermsUnit: "1",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [itemData, setItemData] = useState<InvoiceItemRow[]>([{
        item_id: "",
        itemName: "",
        itemLabel: "",
        UOM: "",
        uom_id: "",
        Quantity: "1",
        isPrmotion:false,
        Price: "",
        Excise: "",
        Discount: "",
        Net: "",
        Vat: "",
        Total: "",
        is_promotional: false,
    }]);

    // Store UOM options for each row
    const [rowUomOptions, setRowUomOptions] = useState<Record<string, { value: string; label: string; price?: string }[]>>({});

    // Store full item data for UOM lookup
    const [fullItemsData, setFullItemsData] = useState<Record<string, FullItem>>({});
    // Maintain a list of item options like the order page so selections persist
    const [itemsOptions, setItemsOptions] = useState<Option[]>([]);

    // Store full delivery data for auto-population
    const [deliveriesById, setDeliveriesById] = useState<Record<string, Delivery>>({});
    // Control and optimize item search calls
    const itemSearchCacheRef = useRef<Record<string, { ts: number; options: (Option & { uoms?: ItemUom[] })[] }>>({});
    const lastItemSearchRef = useRef<string>("");
    const [suppressItemSearch, setSuppressItemSearch] = useState(false);
    const codeGeneratedRef = useRef(false);
    const [code, setCode] = useState("");

    // Validation function for item rows with available stock check
    const validateRow = async (index: number, row?: InvoiceItemRow, options?: { skipUom?: boolean }) => {
        const rowData = row ?? itemData[index];
        if (!rowData) return;

        // prepare data for Yup: convert numeric strings to numbers
        const toValidate = {
            item_id: String(rowData.item_id ?? ""),
            uom_id: String(rowData.uom_id ?? ""),
            Quantity: Number(rowData.Quantity) || 0,
        };

        try {
            const validationErrors: Record<string, string> = {};

            // Standard Yup validation
            if (options?.skipUom) {
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
                    const uomInfo = itemUOMData.uoms.find(u => String(u.id) === String(rowData.uom_id));
                    const upc = Number(uomInfo?.upc || "1");

                    // Calculate total consumed stock in base units across all rows except current
                    let totalConsumedInBaseUnits = 0;
                    itemData.forEach((row, idx) => {
                        if (idx === index || row.item_id !== rowData.item_id) return;
                        const rowUomId = row.uom_id;
                        if (!rowUomId) return;
                        const rowUomInfo = itemUOMData.uoms.find(u => String(u.id) === String(rowUomId));
                        if (!rowUomInfo) return;
                        const rowUpc = Number(rowUomInfo.upc || "1");
                        const rowQty = Number(row.Quantity) || 0;
                        totalConsumedInBaseUnits += rowQty * rowUpc;
                    });

                    // Calculate remaining stock in base units
                    const remainingBaseUnits = totalStockQty - totalConsumedInBaseUnits;
                    const requestedQtyInBaseUnits = Number(rowData.Quantity) * upc;
                    if (requestedQtyInBaseUnits > remainingBaseUnits) {
                        validationErrors.Quantity = `Quantity exceeds available stock (${Math.floor(remainingBaseUnits / upc)} available)`;
                    }
                }
            }

            if (Object.keys(validationErrors).length === 0) {
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
                    const uomInfo = itemUOMData.uoms.find(u => String(u.id) === String(rowData.uom_id));
                    const upc = Number(uomInfo?.upc || "1");

                    let totalConsumedInBaseUnits = 0;
                    itemData.forEach((row, idx) => {
                        if (idx === index || row.item_id !== rowData.item_id) return;
                        const rowUomId = row.uom_id;
                        if (!rowUomId) return;
                        const rowUomInfo = itemUOMData.uoms.find(u => String(u.id) === String(rowUomId));
                        if (!rowUomInfo) return;
                        const rowUpc = Number(rowUomInfo.upc || "1");
                        const rowQty = Number(row.Quantity) || 0;
                        totalConsumedInBaseUnits += rowQty * rowUpc;
                    });

                    const remainingBaseUnits = totalStockQty - totalConsumedInBaseUnits;
                    const requestedQtyInBaseUnits = Number(rowData.Quantity) * upc;
                    if (requestedQtyInBaseUnits > remainingBaseUnits) {
                        validationErrors.Quantity = `Quantity exceeds available stock (${Math.floor(remainingBaseUnits / upc)} available)`;
                    }
                }
            }

            setItemErrors((prev) => ({ ...prev, [index]: validationErrors }));
        }
    };

    // Delivery-style available stock calculation for invoice
    function calculateAvailableStock(itemId: string, uomType: string, upc: number, currentRowIndex: number) {
        const itemInfo = itemsWithUOM[itemId];
        if (!itemInfo) return 0;
        const totalStock = Number(itemInfo.stock_qty || 0);
        let usedSecondaryQty = 0;
        let usedPrimaryQty = 0;
        itemData.forEach((row, idx) => {
            if (idx !== currentRowIndex && row.item_id === itemId && row.uom_id) {
                const rowUOM = itemInfo.uoms.find((u: any) => String(u.uom_id) === String(row.uom_id));
                if (rowUOM) {
                    const qty = Number(row.Quantity || 0);
                    if (rowUOM.uom_type === 'secondary') {
                        usedSecondaryQty += qty;
                    } else if (rowUOM.uom_type === 'primary') {
                        usedPrimaryQty += qty;
                    }
                }
            }
        });
        if (uomType === 'secondary') {
            const remainingStock = totalStock - usedPrimaryQty;
            const availableInSecondary = Math.floor(remainingStock / upc);
            return Math.max(0, availableInSecondary - usedSecondaryQty);
        } else if (uomType === 'primary') {
            const secondaryUOM = itemInfo.uoms.find((u: any) => u.uom_type === 'secondary');
            const secondaryUpc = secondaryUOM ? Number(secondaryUOM.upc || 1) : 1;
            const stockUsedBySecondary = usedSecondaryQty * secondaryUpc;
            return Math.max(0, totalStock - stockUsedBySecondary - usedPrimaryQty);
        }
        return 0;
    }
    useEffect(() => {
        setLoading(true);

        if (isEditMode && uuid) {
            (async () => {
                try {
                    const res = await invoiceByUuid(uuid);
                    const data = res?.data ?? res;

                    if (res && !res.error && data) {
                        // set form fields
                        setForm({
                            customerType: data.customer_type ? String(data.customer_type) : "",
                            warehouse: data.warehouse_id ? String(data.warehouse_id) : "",
                            warehouse_name: data.warehouse_code && data.warehouse_name
                                ? `${data.warehouse_code} - ${data.warehouse_name}`
                                : (data.warehouse_name || ""),
                            // route: data.route_id ? String(data.route_id) : "",
                            // route_name: data.route_code && data.route_name
                            //     ? `${data.route_code} - ${data.route_name}`
                            //     : (data.route_name || ""),
                            customer: data.customer_id ? String(data.customer_id) : "",
                            customer_name: data.customer_name || "",
                            invoice_type: data.invoice_type !== undefined ? String(data.invoice_type) : "",
                            invoice_date: data.invoice_date || new Date().toISOString().slice(0, 10),
                            note: data.comment || "",
                            transactionType: data.transaction_type ? String(data.transaction_type) : "1",
                            paymentTerms: data.payment_terms ? String(data.payment_terms) : "1",
                            paymentTermsUnit: data.payment_terms_unit ? String(data.payment_terms_unit) : "1",
                        });

                        if (data.invoice_code) {
                            setCode(data.invoice_code);
                        }

                        // populate item rows and UOMs from invoice details
                        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
                            const newRowUomOptions: Record<string, { value: string; label: string; price?: string }[]> = {};
                            const newFullItemsData: Record<string, FullItem> = { ...fullItemsData };

                            const loadedItems: InvoiceItemRow[] = data.details.map((detail: DeliveryDetail, index: number) => {
                                const itemId = String(detail.item_id ?? "");
                                const uomId = String(detail.uom_id ?? "");

                                const itemCode = detail.code || "";
                                const itemName = detail.item_name || "";
                                const itemLabel = itemCode && itemName ? `${itemCode} - ${itemName}` : (itemName || "");
                                const uomName = detail.uom_name || "";

                                if (uomId && uomName) {
                                    newRowUomOptions[String(index)] = [{
                                        value: uomId,
                                        label: uomName,
                                        price: String(detail.item_price ?? detail.itemvalue ?? "0"),
                                    }];
                                }

                                if (itemId) {
                                    newFullItemsData[itemId] = {
                                        id: itemId,
                                        code: itemCode || undefined,
                                        name: itemName || undefined,
                                        uom: uomId ? [{ id: uomId, name: uomName, price: String(detail.item_price ?? detail.itemvalue ?? "0") }] : [],
                                    };
                                }

                                return {
                                    item_id: itemId,
                                    itemName: itemName,
                                    itemLabel: itemLabel,
                                    UOM: uomName,
                                    uom_id: uomId,
                                    isPrmotion: false,
                                    Quantity: String(detail.quantity ?? "1"),
                                    Price: String(detail.item_price ?? detail.itemvalue ?? ""),
                                    Excise: String(detail.excise ?? ""),
                                    Discount: String(detail.discount ?? ""),
                                    Net: String(detail.net ?? ""),
                                    Vat: String(detail.vat ?? ""),
                                    Total: String(detail.total ?? ""),
                                    is_promotional: detail.is_promotional ?? false,
                                };
                            });

                            setFullItemsData(prev => ({ ...prev, ...newFullItemsData }));
                            setRowUomOptions(prev => ({ ...prev, ...newRowUomOptions }));
                            setItemData(loadedItems);
                        }
                    }
                } catch (error) {
                    console.error(error);
                    showSnackbar('Failed to load invoice', 'error');
                } finally {
                    setLoading(false);
                }
            })();
        } else {
            setLoading(false);
        }
    }, [isEditMode, uuid, setLoading, showSnackbar]);
    // Auto-generate invoice code in add mode only (prevent on edit)

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
            const stocksArray = stockRes.data?.stocks || stockRes.stocks || [];

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
            const itemsUOMMap: Record<string, { uoms: ItemUOM[], stock_qty: string }> = {};

            const processedItems = filteredStocks.map((stockItem: any) => {
                const item_uoms = stockItem?.uoms ? stockItem.uoms.map((uom: any) => {
                    let price = uom.price;
                    // Override with specific pricing from the API response
                    if (uom?.uom_type === "primary") {
                        price = stockItem.auom_pc_price || uom.price;
                    } else if (uom?.uom_type === "secondary") {
                        price = stockItem.buom_ctn_price || uom.price;
                    }
                    return {
                        ...uom,
                        price,
                        id: uom.id || `${stockItem.item_id}_${uom.uom_type}`,
                        item_id: stockItem.item_id,
                        uom_id: uom.uom_id // Ensure uom_id is preserved
                    };
                }) : [];

                // Store UOM data for this item
                itemsUOMMap[stockItem.item_id] = {
                    uoms: item_uoms,
                    stock_qty: stockItem.stock_qty
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
            setInvoiceData(processedItems);

            // Create dropdown options
            const options = processedItems.map((item: any) => ({
                value: String(item.id),
                label: `${item.erp_code || item.item_code || ''} - ${item.name || ''}`
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

    useEffect(() => {
        if (!isEditMode && !codeGeneratedRef.current) {
            codeGeneratedRef.current = true;
            (async () => {
                try {
                    setLoading(true);
                    const res = await genearateCode({ model_name: "invoice" });
                    if (res?.code) {
                        setCode(res.code);
                    }
                } catch (err) {
                    console.error("Failed to generate invoice code:", err);
                    showSnackbar("Failed to generate invoice code", "error");
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [isEditMode, setLoading, showSnackbar]);
    // Search functions for AutoSuggestion components
    const handleWarehouseSearch = useCallback(async (searchText: string) => {
        try {
            const response = await getAllActiveWarehouse({ search: searchText, status: "active", invoice_date: form.invoice_date });
            const data: Warehouse[] = Array.isArray(response?.data) ? (response.data as Warehouse[]) : [];
            const options: Option[] = data.map((warehouse) => ({
                value: String(warehouse.id),
                label: `${warehouse.warehouse_code || ""} - ${warehouse.warehouse_name || ""}`,
                code: warehouse.warehouse_code,
                name: warehouse.warehouse_name,
            }));
            return options;
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            showSnackbar('Failed to search warehouses', 'error');
            return [];
        }
    }, [showSnackbar]);

    // const handleRouteSearch = useCallback(async (searchText: string) => {
    //     if (!form.warehouse) {
    //         return [];
    //     }
    //     try {
    //         const response = await routeList({
    //             warehouse_id: form.warehouse,
    //             search: searchText,
    //             per_page: "50"
    //         });
    //         const data: RouteItem[] = Array.isArray(response?.data) ? (response.data as RouteItem[]) : [];
    //         const options: Option[] = data.map((route) => ({
    //             value: String(route.id),
    //             label: `${route.route_code || ''} - ${route.route_name || ''}`,
    //             code: route.route_code,
    //             name: route.route_name,
    //         }));
    //         return options;
    //     } catch (error) {
    //         console.error('Error fetching routes:', error);
    //         showSnackbar('Failed to search routes', 'error');
    //         return [];
    //     }
    // }, [form.warehouse, showSnackbar]);

    const handleCustomerSearch = useCallback(async (searchText?: string) => {
       
        try {
            let response;
            if (form.customerType === "2") {
                // Company customer
                // response = await getCompanyCustomers({
                //     route_id: form.route,
                //     search: searchText,
                //     per_page: "50"
                // });
            } else {
                // Agent customer (default)
                response = await agentCustomerList({
                    warehouse_id: warehouseIdForCus,
                    search: searchText,
                    per_page: "50"
                });
            }
            const data: CustomerLike[] = Array.isArray(response?.data) ? (response.data as CustomerLike[]) : [];
            const options: Option[] = data.map((customer) => {
                if (form.customerType === "2") {
                    // Show osa_code - business_name for company customer
                    return {
                        value: String(customer.id),
                        label: `${customer.osa_code || ""} - ${customer.business_name || ""}`.trim(),
                        name: customer.business_name || "",
                    };
                } else {
                    // Agent customer
                    return {
                        value: String(customer.id),
                        label: `${customer.osa_code || ""} - ${customer.name || ""}`,
                        name: customer.name || customer.customer_name || customer.name || '',
                    };
                }
            });
            return options;
        } catch (error) {
            console.error('Error fetching customers:', error);
            showSnackbar('Failed to search customers', 'error');
            return [];
        }
    }, [ form.customerType, showSnackbar, warehouseIdForCus]);

    const handleItemSearch = useCallback(async (searchText: string) => {
        // If no warehouse selected, return empty
        if (!form.warehouse) {
            return [];
        }

        // Prevent searches while we're auto-populating items from a delivery selection
        if (suppressItemSearch) {
            // Reset the flag after blocking one search
            setSuppressItemSearch(false);
            return [];
        }

        // For warehouse items, filter from already loaded itemsOptions
        if (itemsOptions.length > 0) {
            const searchLower = searchText.toLowerCase();
            return itemsOptions.filter(opt =>
                opt.label.toLowerCase().includes(searchLower)
            );
        }

        // If no items loaded yet, trigger warehouse items fetch
        if (form.warehouse) {
            return await fetchWarehouseItems(form.warehouse, searchText) || [];
        }

        return [];
    }, [form.warehouse, itemsOptions, suppressItemSearch, fetchWarehouseItems]);

    const handleDeliverySearch = useCallback(async (warehouseId?: string) => {
        if (!warehouseId && !form.warehouse) return;
        try {
            setSkeleton((prev) => ({ ...prev, customer: true }));
            const response = await deliveryList({
                warehouse_id: warehouseId || form.warehouse,
                invoice_date: form.invoice_date,
                // query: searchText,
                per_page: "50"
            });
            const data: Delivery[] = Array.isArray(response?.data) ? (response.data as Delivery[]) : [];

            // Store full delivery data for later use
            const byId: Record<string, Delivery> = {};
            data.forEach((delivery) => {
                if (delivery?.id !== undefined) {
                    byId[String(delivery.id)] = delivery;
                }
            });
            setDeliveriesById(byId);

            const options: Option[] = data.map((delivery) => ({
                value: String(delivery.id ?? ''),
                label: `${delivery.delivery_code || ''} - ${delivery.customer?.outlet_name || delivery.customer?.name || 'No Customer'}`,
                code: delivery.delivery_code,
            }));

            setDeliveryOptions(options);
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            showSnackbar('Failed to search deliveries', 'error');
        } finally {
            setSkeleton((prev) => ({ ...prev, customer: false }));
        }
    }, [form.warehouse, showSnackbar]);

    // Build validation schema based on invoice type:
    // - If invoice_type === '0' (Against Delivery): require invoice_type, invoice_date, warehouse, customer (delivery)
    // - If invoice_type === '1' (Direct Invoice): require invoice_type, invoice_date, warehouse, route, customer, customerType
    const createValidationSchema = (values: typeof form) => {
        const base = {
            invoice_type: yup.string().required("Invoice Type is required"),
            invoice_date: yup.string().required("Invoice Date is required"),
            warehouse: yup.string().required("Warehouse is required"),
        };

        if (String(values.invoice_type) === "0") {
            return yup.object().shape({
                ...base,
                customer: yup.string().required("Delivery is required"),
            });
        }

        // Default / Direct Invoice
        return yup.object().shape({
            ...base,
            customerType: yup.string(),
            customer: yup.string().required("Customer is required"),
        });
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Special handling when invoice type changes
        if (name === "invoice_type") {
            // If switching to Direct Invoice, clear delivery/customer and item rows
            if (value === "1") {
                setForm((prev) => ({
                    ...prev,
                    invoice_type: value,
                    customer: "",
                    customer_name: "",
                }));

                // Clear delivery cache and per-row UOMs
                setDeliveriesById({});
                setRowUomOptions({});

                // Reset items to a single empty row
                setItemData([
                    {
                        item_id: "",
                        itemName: "",
                        itemLabel: "",
                        UOM: "",
                        uom_id: "",
                        Quantity: "1",
                        isPrmotion:false,
                        Price: "",
                        Excise: "",
                        Discount: "",
                        Net: "",
                        Vat: "",
                        Total: "",
                    },
                ]);
            } else {
                // For other invoice types just update the value
                setForm((prev) => ({ ...prev, invoice_type: value }));
            }

            // Clear any existing invoice_type validation error
            if (errors.invoice_type) {
                setErrors((prev) => ({ ...prev, invoice_type: "" }));
            }

            return;
        }

        setForm({ ...form, [name]: value });
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    // Calculate totals and VAT dynamically
    const recalculateItem = (index: number, field: string, value: string) => {
        const newData = [...itemData];
        const item = newData[index];
       
        // Only update string fields (not boolean fields like is_promotional)
        if (field !== 'is_promotional') {
            item[field as keyof typeof item] = value as never;
        }

        const qty = Number(item.Quantity) || 0;
        const price = Number(item.Price) || 0;
        const total = qty * price;
        const vat = total * 0.18; // 18% VAT
        const net = total - vat;

        item.Total = total.toFixed(2);
        item.Vat = vat.toFixed(2);
        item.Net = net.toFixed(2);

        // Validate the row after recalculation (skip UOM validation if we're just selecting an item)
        if (field !== "itemName" && field !== "item_id") {
            validateRow(index, newData[index]);
        }

        setItemData(newData);
    };

    const handleAddNewItem = () => {
        setItemData([
            ...itemData,
            {
                item_id: "",
                itemName: "",
                itemLabel: "",
                UOM: "",
                uom_id: "",
                Quantity: "1",
                isPrmotion:false,
                Price: "",
                Excise: "",
                Discount: "",
                Net: "",
                Vat: "",
                Total: "",
                is_promotional: false,
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
                    Quantity: "1",
                    isPrmotion:false,
                    Price: "",
                    Excise: "",
                    Discount: "",
                    Net: "",
                    Vat: "",
                    Total: "",
                    is_promotional: false,
                },
            ]);
            return;
        }
        setItemData(itemData.filter((_, i) => i !== index));
    };

    // Compute totals for summary
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
    const discount = itemData.reduce(
        (sum, item) => sum + Number(item.Discount || 0),
        0
    );
    // Align with delivery page: final total should be net + VAT (which equals gross total)
    // Previous implementation added grossTotal + totalVat causing VAT to be counted twice.
    const finalTotal = totalVat + netAmount;
     const formikRef = useRef<any>(null);

     const callForClick = () => {  

    setTimeout(() => {
    formikRef.current?.click();

      },100)
   }

    // Create Payload for API
    const generatePayload = () => {
        // If Against Delivery (invoice_type === "0"), enrich from selected delivery
        // let routeId: number | undefined = undefined;
        let salesmanId: number | undefined = undefined;
        let customerId: number | undefined = undefined;
        if (form.invoice_type === "0" && form.customer) {
            const selectedDelivery = deliveriesById[form.customer];
            if (selectedDelivery) {
                // const maybeRouteId = selectedDelivery.route_id ?? selectedDelivery.route?.id;
                const maybeSalesmanId = selectedDelivery.salesman_id ?? selectedDelivery.salesman?.id;
                const maybeCustomerId = selectedDelivery.customer_id ?? selectedDelivery.customer?.id;

                // routeId = maybeRouteId !== undefined ? Number(maybeRouteId) : undefined;
                salesmanId = maybeSalesmanId !== undefined ? Number(maybeSalesmanId) : undefined;
                customerId = maybeCustomerId !== undefined ? Number(maybeCustomerId) : (form.customer ? Number(form.customer) : undefined);
            }
        } else {
            customerId = form.customer ? Number(form.customer) : undefined;
            // routeId = form.route ? Number(form.route) : undefined;
        }

        const now = new Date();
        const invoiceTime = now.toTimeString().split(' ')[0];
        const deliveryId = form.invoice_type === "0" && form.customer ? Number(form.customer) : undefined;

        return {
            invoice_code: code,
            invoice_type: Number(form.invoice_type),
            warehouse_id: Number(form.warehouse),
            customer_id: customerId,
            delivery_id: deliveryId,
            // customer_type: form.customerType ? Number(form.customerType) : undefined,
            customer_type: 1,
            // route_id: routeId,
            salesman_id: salesmanId,
            invoice_date: form.invoice_date,
            invoice_time: invoiceTime,
            gross_total: Number(grossTotal.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            vat: Number(totalVat.toFixed(2)),
            net_total: Number(netAmount.toFixed(2)),
            total_amount: Number(finalTotal.toFixed(2)),
            comment: form.note || "",
            transaction_type: Number(form.transactionType),
            payment_terms: Number(form.paymentTerms),
            payment_terms_unit: Number(form.paymentTermsUnit),
            status: "1",
            details: itemData
                .filter(item => item.item_id && item.uom_id)
                .map((item:any) => ({
                    item_id: Number(item.item_id),
                    uom: Number(item.uom_id),
                    quantity: Number(item.Quantity) || 0,
                    isPromotion: item.isPrmotion,
                    item_price: Number(item.Price) || 0,
                    vat: Number(item.Vat) || 0,
                    discount: Number(item.Discount) || 0,
                    excise: Number(item.Excise) || 0,
                    gross_total: Number(item.Total) || 0,
                    net_total: Number(item.Net) || 0,
                    item_total: Number(item.Total) || 0,
                    is_promotional: item.is_promotional ?? false,
                })),
        };
    };

    const removeAppledPromotionalItems = () => {
        const filteredItems = itemData.filter(item => !item.isPrmotion || item.is_promotional === false);
        setItemData(filteredItems);
    }
    const handleSubmit = async () => {
        if (isSubmitting) return;
        try {
            // Validate form fields
            const schema = createValidationSchema(form);
            await schema.validate(form, { abortEarly: false });
            setErrors({});

            // Validate item rows separately (they live in local state)
            const itemsSchema = yup.array().of(itemRowSchema);
            try {
                await itemsSchema.validate(itemData, { abortEarly: false });
            } catch (itemErr: any) {
                // log detailed item validation errors and surface a friendly message
                console.error("Item validation errors:", itemErr.inner || itemErr);
                showSnackbar(itemErr.inner.map((err: any) => err.message).join(", "), "error");
                return;
            }

            const validItems = itemData.filter(item => item.item_id && item.uom_id);
            if (validItems.length === 0) {
                showSnackbar("Please add at least one item with UOM selected", "error");
                return;
            }

            setIsSubmitting(true);
            const payload = generatePayload();

            let res;
            if(form.customerType == "2" || form.invoice_type == "0")
           {
                          res = await createInvoice(payload);

                             // Check if response contains an error
            if (res?.error) {
                showSnackbar(
                    res.data?.message || (isEditMode ? "Failed to update invoice" : "Failed to create invoice"),
                    "error"
                );
                setIsSubmitting(false);
                return;
            }

            // Save the generated code after successful creation (add mode only)
            if (!isEditMode && code) {
                try {
                    await saveFinalCode({
                        reserved_code: code,
                        model_name: "invoice",
                    });
                } catch (e) {
                    // Optionally handle error, but don't block success
                    console.error("Failed to save final code:", e);
                }
            }

            // Success
            showSnackbar(
                isEditMode
                    ? "Invoice updated successfully!"
                    : "Invoice created successfully!",
                "success"
            );
            router.push("/distributorsInvoice");

                    }
            else{
            if (isEditMode && uuid) {
                // Update existing invoice
                res = await updateInvoice(uuid, payload);
                     // Check if response contains an error
            if (res?.error) {
                showSnackbar(
                    res.data?.message || (isEditMode ? "Failed to update invoice" : "Failed to create invoice"),
                    "error"
                );
                setIsSubmitting(false);
                return;
            }

            // Save the generated code after successful creation (add mode only)
            if (!isEditMode && code) {
                try {
                    await saveFinalCode({
                        reserved_code: code,
                        model_name: "invoice",
                    });
                } catch (e) {
                    // Optionally handle error, but don't block success
                    console.error("Failed to save final code:", e);
                }
            }

            // Success
            showSnackbar(
                isEditMode
                    ? "Invoice updated successfully!"
                    : "Invoice created successfully!",
                "success"
            );
            } else {
                // Create new invoice
               
                      let promotionPayload = convertOrderPayload(payload)
               
                const promotionRes = await applyPromotion(promotionPayload);
                      if(checkout == 1)
                      {
                      if (promotionRes?.data?.itemPromotionInfo.length > 0) {
                       
                           
                        setPromotions(promotionRes?.data?.itemPromotionInfo);
                         setOpenPromotion(true);
                     
                      }
                      else{
               
               
                        setCheckout(2);
                        callForClick();
                       
                      }
                    }

                    if(checkout == 2)
                    {
                          res = await createInvoice(payload);

                             // Check if response contains an error
            if (res?.error) {
                showSnackbar(
                    res.data?.message || (isEditMode ? "Failed to update invoice" : "Failed to create invoice"),
                    "error"
                );
                        setCheckout(1);
removeAppledPromotionalItems();
                setIsSubmitting(false);
                return;
            }

            // Save the generated code after successful creation (add mode only)
            if (!isEditMode && code) {
                try {
                    await saveFinalCode({
                        reserved_code: code,
                        model_name: "invoice",
                    });
                } catch (e) {
                    // Optionally handle error, but don't block success
                    console.error("Failed to save final code:", e);
                        setCheckout(1);
                        removeAppledPromotionalItems();

                }
            }

            // Success
            showSnackbar(
                isEditMode
                    ? "Invoice updated successfully!"
                    : "Invoice created successfully!",
                "success"
            );
            router.push("/distributorsInvoice");

                    }
            }
        }
       
        } catch (error) {
            if (error instanceof yup.ValidationError) {
                // Handle yup validation errors
                const formErrors: Record<string, string> = {};
                error.inner.forEach((err) => {
                    if (err.path) {
                        formErrors[err.path] = err.message;
                    }
                });
                setErrors(formErrors);
            } else {
                console.error("Error saving invoice:", error);

                // Extract error message from API response
                let errorMessage = isEditMode
                    ? "Failed to update invoice. Please try again."
                    : "Failed to create invoice. Please try again.";

                if (error && typeof error === 'object') {
                    // Check for error message in response
                    if ('response' in error && error.response && typeof error.response === 'object') {
                        const response = error.response as { data?: { message?: string } };
                        if (response.data?.message) {
                            errorMessage = response.data.message;
                        }
                    } else if ('data' in error && error.data && typeof error.data === 'object') {
                        const data = error.data as { message?: string };
                        if (data.message) {
                            errorMessage = data.message;
                        }
                    } else if ('message' in error && typeof error.message === 'string') {
                        errorMessage = error.message;
                    }
                }
                setCheckout(1);
                 removeAppledPromotionalItems();
                showSnackbar(errorMessage, "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormReadyForItems = (() => {
        if (String(form.invoice_type) === "0") {
            return [form.warehouse, form.customer, form.invoice_type, form.invoice_date].every(Boolean);
        }
        return [ form.warehouse, form.customer, form.invoice_type, form.invoice_date].every(Boolean);
    })();


    // Check if any item row has quantity greater than available stock
    const isAnyQtyOverStock = itemData.some((row, idx) => {
        if (!row.item_id || !row.uom_id || !itemsWithUOM[row.item_id]) return false;
        const itemUOMData = itemsWithUOM[row.item_id];
        const uomInfo = itemUOMData.uoms.find(u => String(u.uom_id) === String(row.uom_id));
        if (!uomInfo) return false;
        const upc = Number(uomInfo.upc || "1");
        const uomType = uomInfo.uom_type || "primary";
        const availableStockNum = calculateAvailableStock(row.item_id, uomType, upc, idx);
        return Number(row.Quantity) > Number(availableStockNum);
    });
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-[20px]">
                <div className="flex items-center gap-[16px]">
                    <Link href="/distributorsInvoice" back>
                    <Icon
                        icon="lucide:arrow-left"
                        width={24}
                        onClick={() => router.back()}
                        className="cursor-pointer"
                    />
                    </Link>
                    <h1 className="text-[20px] font-semibold text-[#181D27] flex items-center leading-[30px] mb-[4px]">
                        {isEditMode ? "Update Invoice" : "Add Invoice"}
                    </h1>
                </div>
            </div>
            <ContainerCard className="rounded-[10px] space-y-[40px] scrollbar-none">
                <div className="flex justify-between flex-wrap gap-[20px]">
                    <div className="flex flex-col gap-[10px]">
                        <Logo type="full" />
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[42px] uppercase text-[#A4A7AE] mb-[10px]">
                            Invoice
                        </span>
                        <span className="text-primary text-[14px] tracking-[10px]">
                            #{code}
                        </span>
                    </div>
                </div>
                <hr className="text-[#D5D7DA]" />

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-wrap">
                    <InputFields
                        required
                        label="Invoice type"
                        name="invoice_type"
                        value={form.invoice_type}
                        searchable={true}
                        options={[
                            { label: "Against Delivery", value: "0" },
                            { label: "Direct Invoice", value: "1" },
                        ]}
                        onChange={(e) => {
                            setForm(prev => ({ ...prev, customerType: "", warehouse: "", warehouse_name: "", customer: "", customer_name: "", invoice_type: "", invoice_date: new Date().toISOString().slice(0, 10), note: "", transactionType: "1", paymentTerms: "1", paymentTermsUnit: "1" }));
                            handleChange(e);
                        }}
                        error={errors.invoice_type}
                    />
                   
                    {form.invoice_type === "0" && (
                        <>
                            <AutoSuggestion
                                required
                                label="Distributor"
                                name="warehouse"
                                placeholder="Search Distributor..."
                                initialValue={form.warehouse_name}
                                onSearch={(searchText) => handleWarehouseSearch(searchText)}
                                onSelect={(option) => {
                                    setForm(prev => ({
                                        ...prev,
                                        warehouse: option.value,
                                        warehouse_name: option.label,
                                        customer: "",
                                        customer_name: "",
                                    }));
                                    if (errors.warehouse) {
                                        setErrors(prev => ({ ...prev, warehouse: "" }));
                                    }
                                    // Fetch items for the selected warehouse
                                    fetchWarehouseItems(option.value);
                                    handleDeliverySearch(option.value);
                                     setItemData([{item_id: "",
        itemName: "",
        itemLabel: "",
        UOM: "",
        uom_id: "",
        Quantity: "1",
        isPrmotion:false,
        Price: "",
        Excise: "",
        Discount: "",
        Net: "",
        Vat: "",
        Total: "",
        is_promotional: false,}]);
                                }}
                                onClear={() => {
                                    setForm(prev => ({
                                        ...prev,
                                        warehouse: "",
                                        warehouse_name: "",
                                        customer: "",
                                        customer_name: "",
                                       
                                    }
                                ));
                               
                                    // Clear items when warehouse is cleared
                                    setItemsOptions([]);
                                    setItemsWithUOM({});
                                    setWarehouseStocks({});
                                }}
                                error={errors.warehouse}
                            />

                            <InputFields
                                required
                                width="300px"
                                label="Delivery"
                                name="customer"
                                placeholder="Search delivery..."
                                value={form.customer}
                                options={deliveryOptions}
                                showSkeleton={skeleton.customer}
                                onChange={(e) => {
                                    // Temporarily suppress item search calls while we auto-populate rows
                                    setSuppressItemSearch(true);
                                    setForm(prev => ({
                                        ...prev,
                                        customer: e.target.value,
                                    }));
                                    if (errors.customer) {
                                        setErrors(prev => ({ ...prev, customer: "" }));
                                    }

                                    // Auto-populate items from selected delivery
                                    const selectedDelivery = deliveriesById[e.target.value];
                                    if (selectedDelivery && Array.isArray(selectedDelivery.details)) {
                                        const newRowUomOptions: Record<string, { value: string; label: string; price?: string }[]> = {};
                                        const newFullItemsData: Record<string, FullItem> = { ...fullItemsData };

                                        const loadedItemData: any[] = selectedDelivery.details.map((detail: DeliveryDetail, index: number) => {
                                            const itemId = String(detail.item?.id ?? "");
                                            const uomId = String(detail.uom_id ?? "");

                                            // Extract item code and name from delivery detail
                                            const itemCode = detail.item?.code || "";
                                            const itemName = detail.item?.name || "";
                                            const itemLabel = itemCode && itemName ? `${itemCode} - ${itemName}` : itemId;

                                            // Always create UOM option from delivery detail (this is the selected UOM)
                                            const uomName = detail.uom_name || "";
                                            const deliveryUomOption = uomId && uomName ? {
                                                value: String(uomId),
                                                label: uomName,
                                                price: String(detail.item_price || "0"),
                                            } : null;

                                            // Prefer UOMs provided in delivery detail (`item_uoms`) if available
                                            const detailObj = detail as Record<string, unknown>;
                                            const detailUomsRaw = Array.isArray(detailObj['item_uoms'] as unknown) ? detailObj['item_uoms'] : [];
                                            if (Array.isArray(detailUomsRaw) && detailUomsRaw.length > 0) {
                                                const uomOpts = extractUoms(detailUomsRaw).map(u => ({
                                                    value: String(u.id ?? ""),
                                                    label: u.name ?? "",
                                                    price: u.price !== undefined ? String(u.price) : "0",
                                                }));
                                                newRowUomOptions[index.toString()] = uomOpts;

                                                // Store full item data for future reference
                                                newFullItemsData[itemId] = {
                                                    id: itemId,
                                                    code: itemCode,
                                                    name: itemName,
                                                    uom: extractUoms(detailUomsRaw),
                                                };
                                            } else {
                                                // Check if we have more UOM options from itemOptions
                                                const typedItemOptions = itemOptions as Array<Option & { uoms?: ItemUom[] }>;
                                                const selectedItem = typedItemOptions.find((it) => it.value === itemId);
                                                if (selectedItem && Array.isArray(selectedItem.uoms) && selectedItem.uoms.length > 0) {
                                                    const uomOpts = selectedItem.uoms.map((uom: ItemUom) => ({
                                                        value: String(uom.id || ""),
                                                        label: uom.name || "",
                                                        price: (uom.price as string | number | undefined) ? String(uom.price) : "0",
                                                    }));
                                                    newRowUomOptions[index.toString()] = uomOpts;

                                                    // Store full item data for future reference
                                                    newFullItemsData[itemId] = {
                                                        id: itemId,
                                                        code: itemCode,
                                                        name: itemName,
                                                        uom: selectedItem.uoms,
                                                    };
                                                } else if (deliveryUomOption) {
                                                    // If no UOM options from itemOptions, use delivery detail UOM
                                                    newRowUomOptions[index.toString()] = [deliveryUomOption];

                                                    // Store minimal item data
                                                    newFullItemsData[itemId] = {
                                                        id: itemId,
                                                        code: itemCode,
                                                        name: itemName,
                                                        uom: [{
                                                            id: uomId,
                                                            name: uomName,
                                                            price: detail.item_price || "0",
                                                        }],
                                                    };
                                                }
                                            }

                                            const qty = Number(detail.quantity ?? 0);
                                            const price = Number(detail.item_price ?? 0);
                                            const discount = Number(detail.discount ?? 0);
                                            const total = qty * price;
                                            const vat = total - total / 1.18;
                                            const net = total - vat;

                                            return {
                                                item_id: itemId,
                                                itemName: itemLabel,
                                                itemLabel: itemLabel,
                                                UOM: uomId,
                                                uom_id: uomId,
                                                Quantity: String(qty || 1),
                                                Price: (Number(price) || 0).toFixed(2),
                                                Excise: "0.00",
                                                Discount: (Number(discount) || 0).toFixed(2),
                                                Net: net.toFixed(2),
                                                Vat: vat.toFixed(2),
                                                Total: total.toFixed(2),
                                                is_promotional: detail.is_promotional ?? false,
                                            };
                                        });

                                        setFullItemsData(newFullItemsData);
                                        setRowUomOptions(newRowUomOptions);
                                        setItemData(loadedItemData);

                                        // Set note if available
                                        if (selectedDelivery.comment) {
                                            setForm((prev) => ({ ...prev, note: selectedDelivery.comment || prev.note }));
                                        }
                                    } else {
                                        // Reset if no details
                                        setRowUomOptions({});
                                        setItemData([
                                            {
                                                item_id: "",
                                                itemName: "",
                                                itemLabel: "",
                                                UOM: "",
                                                uom_id: "",
                                                Quantity: "1",
                                                Price: "",
                                                isPrmotion:false,
                                                Excise: "",
                                                Discount: "",
                                                Net: "",
                                                Vat: "",
                                                Total: "",
                                                is_promotional: false,
                                            },
                                        ]);
                                    }
                                    // Re-enable item search shortly after rows are set to avoid AutoSuggestion remount spam
                                    setTimeout(() => setSuppressItemSearch(false), 300);
                                }}
                                error={errors.customer}
                                disabled={!form.warehouse}
                            />
                        </>
                    )}
                    {form.invoice_type === "1" && (
                        <>
                            {/* <InputFields
                            {/* <InputFields
                                required
                                label="Customer Type"
                                name="customerType"
                                value={form.customerType}
                                searchable={true}
                                options={[
                                    { label: "Field Customer", value: "1" },
                                    { label: "Company Customer", value: "2" },
                                ]}
                                onChange={handleChange}
                                error={errors.customerType}
                            /> */}
                           
                            <AutoSuggestion
                                required
                                label="Distributor"
                                name="warehouse"
                                placeholder="Search warehouse..."
                                initialValue={form.warehouse_name}
                                onSearch={handleWarehouseSearch}
                                onSelect={(option) => {
                                    setForm(prev => ({
                                        ...prev,
                                        warehouse: option.value,
                                        warehouse_name: option.label,
                                        // route: "",
                                        // route_name: "",
                                        customer: "",
                                        customer_name: "",
                                    }));
                                    if (errors.warehouse) {
                                        setErrors(prev => ({ ...prev, warehouse: "" }));
                                    }
                                    const id = option.value
                                    setWarehouseIdForCus(id);
                                    fetchWarehouseItems(option.value);
                                    setItemData([{item_id: "",
        itemName: "",
        itemLabel: "",
        UOM: "",
        uom_id: "",
        Quantity: "1",
        isPrmotion:false,
        Price: "",
        Excise: "",
        Discount: "",
        Net: "",
        Vat: "",
        Total: "",
        is_promotional: false}]);
                                }}
                                onClear={() => {
                                    setForm(prev => ({
                                        ...prev,
                                        warehouse: "",
                                        warehouse_name: "",
                                        // route: "",
                                        // route_name: "",
                                        customer: "",
                                        customer_name: "",
                                    }));
                                    // Clear items when warehouse is cleared
                                   
                                    setItemsOptions([]);
                                    setItemsWithUOM({});
                                    setWarehouseStocks({});
                                }}
                                error={errors.warehouse}
                            />
                            {/* <AutoSuggestion
                                required
                                label="Route"
                                name="route"
                                placeholder="Search route..."
                                initialValue={form.route_name}
                                onSearch={handleRouteSearch}
                                onSelect={(option) => {
                                    setForm(prev => ({
                                        ...prev,
                                        route: option.value,
                                        route_name: option.label,
                                        customer: "",
                                        customer_name: "",
                                    }));
                                    if (errors.route) {
                                        setErrors(prev => ({ ...prev, route: "" }));
                                    }
                                }}
                                onClear={() => {
                                    setForm(prev => ({
                                        ...prev,
                                        route: "",
                                        route_name: "",
                                        customer: "",
                                        customer_name: "",
                                    }));
                                }}
                                error={errors.route}
                                disabled={!form.warehouse}
                                noOptionsMessage={!form.warehouse ? "Please select a warehouse first" : "No routes found"}
                            /> */}
                            <AutoSuggestion
                                required
                                label="Customer"
                                name="customer"
                                placeholder="Search customer..."
                                initialValue={form.customer_name}
                                onSearch={(searchText) => handleCustomerSearch(searchText)}
                                onSelect={(option) => {
                                    setForm(prev => ({
                                        ...prev,
                                        customer: option.value,
                                        customer_name: option.label,
                                    }));
                                    if (errors.customer) {
                                        setErrors(prev => ({ ...prev, customer: "" }));
                                    }
                                }}
                                onClear={() => {
                                    setForm(prev => ({
                                        ...prev,
                                        customer: "",
                                        customer_name: "",
                                    }));
                                }}
                                error={errors.customer}
                                disabled={!form.warehouse}
                                noOptionsMessage={!form.warehouse ? "Please select a distributor first" : "No customers found"}
                            />

                        </>
                    )}
                     <InputFields
                        required
                        label="Invoice Date"
                        type="date"
                        name="invoice_date"
                        min={new Date().toISOString().split("T")[0]}
                        value={form.invoice_date}
                        onChange={handleChange}
                        error={errors.invoice_date}
                    />
                </div>

                <Table
                    data={itemData.map((row, idx) => ({ ...row, idx: idx.toString() }))}
                    config={{
                        showNestedLoading: false,
                        columns: [
                            {
                                key: "itemName",
                                label: "Item Name",
                                width: 390,
                                render: (row) => {
                                    const idx = Number(row.idx);
                                    const currentItem = itemData[idx];
                                    const selectedItemId = currentItem?.item_id;
                                    const err = itemErrors[idx]?.item_id;

                                    // Build selected option from current item data
                                    const selectedOpt = selectedItemId ? {
                                        value: selectedItemId,
                                        label: currentItem.itemLabel || `Item ${selectedItemId}`
                                    } : null;

                                    return (
                                        <div style={{ minWidth: '390px', maxWidth: '390px' }}>
                                            <AutoSuggestion
                                                key={`item-${row.idx}`}
                                                placeholder="Search item..."
                                                initialValue={currentItem?.itemLabel || ""}
                                                selectedOption={selectedOpt}
                                                onSearch={handleItemSearch}
                                                onSelect={(option: Option) => {
                                                    const selectedItemId = option.value;
                                                    const newData = [...itemData];
                                                    const index = Number(row.idx);

                                                    // Get item data from warehouse stocks
                                                    const itemUOMData = itemsWithUOM[selectedItemId];
                                                    const selectedOrder = invoiceData.find((order: any) => String(order.id) === selectedItemId);

                                                    newData[index].item_id = selectedItemId;
                                                    newData[index].itemName = (selectedOrder as any)?.name || option.label;
                                                    newData[index].itemLabel = option.label;

                                                    if (itemUOMData?.uoms) {
                                                        const uomOpts = itemUOMData.uoms.map(uom => ({
                                                            label: uom.name,
                                                            value: String(uom.uom_id || ''), // Use uom_id instead of id
                                                            price: uom.price
                                                        }));

                                                        setRowUomOptions(prev => ({
                                                            ...prev,
                                                            [row.idx]: uomOpts
                                                        }));

                                                        newData[index].uom_id = uomOpts[0]?.value || "";
                                                        newData[index].UOM = uomOpts[0]?.value || "";
                                                        newData[index].Price = uomOpts[0]?.price || "";
                                                    } else if (selectedOrder && (selectedOrder as any)?.item_uoms) {
                                                        // Fallback to selectedOrder UOMs with pricing
                                                        const uomOpts = (selectedOrder as any).item_uoms.map((uom: any) => {
                                                            let price = uom.price;
                                                            if (uom.uom_type === "primary") {
                                                                price = (selectedOrder as any).pricing?.auom_pc_price || "-";
                                                            } else if (uom.uom_type === "secondary") {
                                                                price = (selectedOrder as any).pricing?.buom_ctn_price || "-";
                                                            }
                                                            return {
                                                                label: uom.name,
                                                                value: String(uom.uom_id || ''), // Use uom_id instead of id
                                                                price: price
                                                            };
                                                        });

                                                        setRowUomOptions(prev => ({
                                                            ...prev,
                                                            [row.idx]: uomOpts
                                                        }));

                                                        const firstUom = (selectedOrder as any).item_uoms[0];
                                                        if (firstUom) {
                                                            newData[index].uom_id = String(firstUom.uom_id || ""); // Use uom_id instead of id
                                                            newData[index].UOM = String(firstUom.uom_id || "");
                                                            if (firstUom.uom_type === "primary") {
                                                                newData[index].Price = (selectedOrder as any).pricing?.auom_pc_price || "";
                                                            } else if (firstUom.uom_type === "secondary") {
                                                                newData[index].Price = (selectedOrder as any).pricing?.buom_ctn_price ||  "";
                                                            } else {
                                                                newData[index].Price = firstUom.price || "";
                                                            }
                                                        }
                                                    } else {
                                                        setRowUomOptions(prev => {
                                                            const newOpts = { ...prev };
                                                            delete newOpts[row.idx];
                                                            return newOpts;
                                                        });
                                                        newData[index].uom_id = "";
                                                        newData[index].UOM = "";
                                                        newData[index].Price = "";
                                                    }

                                                    newData[index].Quantity = "1";

                                                    // Ensure the selected item persists in itemsOptions
                                                    if (option.label) {
                                                        setItemsOptions((prev: Option[] = []) => {
                                                            if (prev.some(o => o.value === selectedItemId)) return prev;
                                                            return [...prev, { value: selectedItemId, label: option.label }];
                                                        });
                                                    }

                                                    setItemData(newData);
                                                    recalculateItem(index, "itemName", selectedItemId);
                                                }}
                                                onClear={() => {
                                                    const newData = [...itemData];
                                                    const index = Number(row.idx);
                                                    newData[index].item_id = "";
                                                    newData[index].itemName = "";
                                                    newData[index].itemLabel = "";
                                                    newData[index].uom_id = "";
                                                    newData[index].UOM = "";
                                                    newData[index].Price = "";
                                                    setRowUomOptions(prev => {
                                                        const newOpts = { ...prev };
                                                        delete newOpts[row.idx];
                                                        return newOpts;
                                                    });
                                                    setItemData(newData);
                                                }}
                                                disabled={form.invoice_type === "0" || !isFormReadyForItems}
                                                error={err}
                                            />
                                        </div>
                                    );
                                }
                            },
                            {
                                key: "UOM",
                                label: "UOM",
                                width: 120,
                                render: (row) => {
                                    const idx = Number(row.idx);
                                    const err = itemErrors[idx]?.uom_id;
                                    const uomOptions = rowUomOptions[row.idx] || [];
                                    return (
                                        <div style={{ minWidth: '120px', maxWidth: '120px' }}>
                                            <InputFields
                                                label=""
                                                name="UOM"
                                                options={row.isPrmotion?row.UOM:uomOptions}
                                                value={row.uom_id}
                                                disabled={form.invoice_type === "0" || !row.item_id || uomOptions.length === 0}
                                                onChange={(e) => {
                                                    const selectedUomId = e.target.value;
                                                    const selectedUom = uomOptions.find(uom => uom.value === selectedUomId);
                                                    const newData = [...itemData];
                                                    const index = Number(row.idx);
                                                    newData[index].uom_id = selectedUomId;
                                                    newData[index].UOM = selectedUomId;
                                                    if (selectedUom?.price) {
                                                        newData[index].Price = selectedUom.price;
                                                    }
                                                    setItemData(newData);
                                                    // Also recalculate stock and validation when UOM changes
                                                    recalculateItem(index, "uom_id", selectedUomId);
                                                }}
                                                error={err}
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
                                    let err = itemErrors[idx]?.Quantity;
                                    const uomOptions = rowUomOptions[row.idx] || [];
                                    const selectedUom = uomOptions.find(uom => uom.value === row.uom_id);
                                    // Calculate available stock for this row (primary/secondary logic)
                                    let availableStock = "";
                                    if (row.item_id && row.uom_id && itemsWithUOM[row.item_id]) {
                                        const itemUOMData = itemsWithUOM[row.item_id];
                                        const uomInfo = itemUOMData.uoms.find(u => String(u.uom_id) === String(row.uom_id));
                                        const upc = Number(uomInfo?.upc || "1");
                                        const uomType = uomInfo?.uom_type || "primary";
                                        const availableStockNum = calculateAvailableStock(row.item_id, uomType, upc, idx);
                                        availableStock = `${availableStockNum}`;
                                    }
                                    // Track if user entered more than available
                                    // let overStock = false;
                                    // let enteredQty = Number(row.Quantity) || 0;
                                    // if (row.item_id && row.uom_id && itemsWithUOM[row.item_id]) {
                                    //     if (isSecondary) {
                                    //         overStock = enteredQty > availableStockNum;
                                    //     } else {
                                    //         overStock = enteredQty > availableStockNum;
                                    //     }
                                    //     // Do not auto-reset, just set error for validation on submit
                                    //     if (overStock) {
                                    //         err = `Cannot exceed available stock (${availableStockNum})`;
                                    //     }
                                    // }
                                    return (
                                        <div style={{ minWidth: '120px', maxWidth: '120px' }}>
                                            <InputFields
                                                label=""
                                                type="number"
                                                name="Quantity"
                                                value={row.Quantity}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    recalculateItem(idx, "Quantity", value);
                                                }}
                                                disabled={form.invoice_type === "0" || row.isPrmotion === true}
                                                // error={err}
                                            />
                                            {/* Show available stock below input */}
                                            {availableStock && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Stock: {Math.floor(Number(availableStock))}
                                                </div>
                                            )}
                                            {/* Show validation error if entered quantity exceeds available stock */}
                                            {row.item_id && row.uom_id && Number(row.Quantity) > Number(availableStock) && (
                                                <div className="text-xs text-red-500 mt-1">
                                                    Entered quantity exceeds available stock ({availableStock})
                                                </div>
                                            )}
                                        </div>
                                    );
                                },
                            },
                            {
                                key: "Price",
                                label: "Price",
                                render: (row) => toInternationalNumber(row.Price) || "0.00"
                            },
                            // {
                            //     key: "preVat",
                            //     label: "Pre VAT",
                            //     render: (row) => toInternationalNumber(Number(row.Total) - Number(row.Vat)) || "0.00"
                            // },
                            {
                                key: "Net",
                                label: "Net",
                                render: (row) => toInternationalNumber(row.Net,{ minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"
                            },
                            {
                                key: "Vat",
                                label: "VAT",
                                render: (row) => toInternationalNumber(row.Vat,{ minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"
                            },
                            {
                                key: "Total",
                                label: "Total",
                                render: (row) => toInternationalNumber(Number(row.Total),{ minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"
                            },
                            {
                                key: "action",
                                label: "Action",
                                render: (row) => {
                                    const isAgainstDelivery = form.invoice_type === "0";
                                    const isDisabled = itemData.length <= 1 || isAgainstDelivery;
                                    return (
                                        <button
                                            type="button"
                                            className={`${isDisabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                                } text-red-500 flex items-center`}
                                            onClick={() =>
                                                !isDisabled && handleRemoveItem(Number(row.idx))
                                            }
                                            disabled={isDisabled}
                                        >
                                            <Icon icon="hugeicons:delete-02" width={20} />
                                        </button>
                                    );
                                }
                            },
                        ],
                    }}
                />

                {/* Add New Item */}
                <div className="mt-4">
                    {(() => {
                        // disable add when there's already an empty/new item row
                        const hasEmptyRow = itemData.some(it => (String(it.item_id ?? '').trim() === '' && String(it.uom_id ?? '').trim() === ''));
                        const isAgainstDelivery = form.invoice_type === "0";
                        return (
                            <button
                                type="button"
                                disabled={hasEmptyRow || isAgainstDelivery}
                                className={`text-[#E53935] font-medium text-[16px] flex items-center gap-2 ${hasEmptyRow || isAgainstDelivery ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => { if (!hasEmptyRow && !isAgainstDelivery) handleAddNewItem(); }}
                            >
                                <Icon icon="material-symbols:add-circle-outline" width={20} />
                                Add New Item
                            </button>
                        );
                    })()}
                </div>

                <div className="flex justify-between text-primary">
                    <div></div>
                    <div className="flex justify-between flex-wrap w-full">
                        <div className="hidden flex-col justify-end gap-[20px] w-full lg:flex lg:w-[400px]">
                            <div className="flex flex-col space-y-[10px]">
                                <InputFields
                                    label="Note"
                                    type="textarea"
                                    name="note"
                                    placeholder="Enter Your Description"
                                    value={form.note}
                                    textareaCols={10}
                                    textareaResize={false}
                                    onChange={handleChange}
                                />
                            </div>
                            {/* <div className="flex space-x-[10px]">
                                <InputFields
                                    label="Payment Terms"
                                    name="paymentTerms"
                                    value={form.paymentTerms}
                                    placeholder=" "
                                    trailingElement={
                                        <select
                                            value={form.paymentTermsUnit}
                                            onChange={handleChange}
                                            className="h-full outline-0 bg-[#FAFAFA]"
                                        >
                                            <option value="1">Days</option>
                                            <option value="2">Months</option>
                                        </select>
                                   
                                    onChange={handleChange}
                                />
                                <InputFields
                                    label="Transaction Type"
                                    name="transactionType"
                                    value={form.transactionType}
                                    options={[
                                        { label: "Cash", value: "1" },
                                        { label: "Online", value: "2" },
                                    ]}
                                    onChange={handleChange}
                                />
                            </div> */}
                        </div>

                        <div className="flex flex-col gap-[10px] w-full lg:w-[350px] border-[#D5D7DA]">
                            {[
                                // { key: "Gross Total", value: `AED ${grossTotal.toFixed(2)}` },
                                // { key: "Discount", value: `AED ${discount.toFixed(2)}` },
                                { key: "Net Total", value: `${CURRENCY} ${toInternationalNumber(Number(netAmount),{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                { key: "VAT", value: `${CURRENCY} ${toInternationalNumber(Number(totalVat),{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                // { key: "preVAT", value: `AED ${toInternationalNumber(netAmount - totalVat)}` },
                                // { key: "Delivery Charges", value: "AED 0.00" },
                            ].map((item) => (
                                <Fragment key={item.key}>
                                    <KeyValueData data={[item]} />
                                    <hr className="text-[#D5D7DA]" />
                                </Fragment>
                            ))}
                            <div className="font-semibold text-[#181D27] text-[18px] flex justify-between mt-2 mb-2">
                                <span>Total</span>
                                <span>{CURRENCY} {toInternationalNumber(Number(finalTotal),{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>


                    </div>
                </div>

                <hr className="text-[#D5D7DA]" />

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                        onClick={() => router.push("/distributorsInvoice")}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <SidebarBtn
                        formikRef={formikRef}
                        isActive={true}
                        disabled={isSubmitting || isAnyQtyOverStock}
                        leadingIcon="mdi:check"
                        label={
                            isSubmitting
                                ? (checkout == 1?"Checkout":isEditMode ? "Updating Invoice..." : "Creating Invoice...")
                                : (isEditMode ? "Update Invoice" : form.customerType == "2"?"Create Invoice":form.invoice_type == "0"?"Create Invoice":checkout == 1?"Checkout":"Create Invoice")
                        }
                        onClick={handleSubmit}
                    />
                </div>
            </ContainerCard>

            <Dialog
        open={openPromotion}
        onClose={()=>setOpenPromotion(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
       
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
           <PromotionStepper callForClick={callForClick} setCheckout={setCheckout} setOpenPromotion={setOpenPromotion} promotions={promotions} selectedPromotionsItems={selectedPromotionsItems} recalculateItem={recalculateItem} setSelectedPromotionsItems={setSelectedPromotionsItems} itemData={itemData}  setItemData={setItemData} />
          </DialogContentText>
        </DialogContent>
       
      </Dialog>
        </div>
    );
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
      itemName: `${item.item_code}-${item.item_name}`,
      itemLabel: `${item.item_code}-${item.item_name}`,
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


// handleSubmit();
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
        onBack={prevStep}
        close={true}
        closeFunction={() => setOpenPromotion(false)}
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
                                placeholder="Search item"
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