"use client";

import ContainerCard from "@/app/components/containerCard";
import InputFields from "@/app/components/inputFields";
import { useState, useEffect, useMemo } from "react";
import {
    addRouteTransfer,
    companyList,
    regionList,
    subRegionList,
    warehouseList,
    routeList,
    getRouteTransferList
} from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { usePagePermissions } from "@/app/(private)/utils/usePagePermissions";
import Drawer from "@mui/material/Drawer";
import { Icon } from "@iconify-icon/react";
import { formatDateFlexible } from "@/app/utils/formatDate";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
export default function StockTransfer() {
    const { can } = usePagePermissions();
    const { setLoading } = useLoading();
    const { showSnackbar } = useSnackbar();

    // Source State
    const [source, setSource] = useState({
        company: "",
        region: "",
        area: "",
        warehouse: "",
        route: ""
    });

    const [sourceOptions, setSourceOptions] = useState({
        companies: [] as any[],
        regions: [] as any[],
        areas: [] as any[],
        warehouses: [] as any[],
        routes: [] as any[]
    });

    // Destination State
    const [dest, setDest] = useState({
        company: "",
        region: "",
        area: "",
        warehouse: "",
        route: ""
    });

    const [destOptions, setDestOptions] = useState({
        companies: [] as any[],
        regions: [] as any[],
        areas: [] as any[],
        warehouses: [] as any[],
        routes: [] as any[]
    });

    const [skeletons, setSkeletons] = useState({
        sourceCompany: false,
        sourceRegion: false,
        sourceArea: false,
        sourceWarehouse: false,
        sourceRoute: false,
        destCompany: false,
        destRegion: false,
        destArea: false,
        destWarehouse: false,
        destRoute: false,
    });

    // History State
    const [submitting, setSubmitting] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

    // Initial Load - Companies
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setSkeletons(prev => ({ ...prev, sourceCompany: true, destCompany: true }));
                const res = await companyList({ dropdown: "true" });
                const options = (res?.data || []).map((c: any) => ({
                    value: String(c.id),
                    label: (c.company_code || c.code) ? `${c.company_code || c.code} - ${c.company_name || c.name}` : (c.company_name || c.name)
                }));
                setSourceOptions(prev => ({ ...prev, companies: options }));
                setDestOptions(prev => ({ ...prev, companies: options }));
            } catch (err) {
                console.error("Failed to fetch companies", err);
            } finally {
                setSkeletons(prev => ({ ...prev, sourceCompany: false, destCompany: false }));
            }
        };
        fetchCompanies();
    }, []);

    // Fetch History
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await getRouteTransferList();
            setHistoryData(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch history", err);
            // showSnackbar("Failed to load history", "error");
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (isHistoryOpen) {
            fetchHistory();
        } else {
            setSelectedHistoryItem(null);
        }
    }, [isHistoryOpen]);

    // Helper to extract warehouse name safely (handles array or object)
    const getWarehouseName = (warehouseData: any) => {
        if (!warehouseData) return "-";
        if (Array.isArray(warehouseData)) {
            return warehouseData.length > 0 ? (warehouseData[0].name || "-") : "-";
        }
        return `${warehouseData.warehouse_code} - ${warehouseData.warehouse_name}` || "-";
    };

    // --- Source Cascading Logic ---

    // Fetch Source Regions when Source Company changes
    useEffect(() => {
        if (!source.company) {
            setSourceOptions(prev => ({ ...prev, regions: [], areas: [], warehouses: [], routes: [] }));
            setSource(prev => ({ ...prev, region: "", area: "", warehouse: "", route: "" }));
            return;
        }
        const fetchRegions = async () => {
            try {
                setSkeletons(prev => ({ ...prev, sourceRegion: true }));
                const res = await regionList({ company_id: source.company, dropdown: "true" });
                setSourceOptions(prev => ({
                    ...prev,
                    regions: (res?.data || []).map((r: any) => ({ value: String(r.id), label: (r.region_code || r.code) ? `${r.region_code || r.code} - ${r.region_name || r.name}` : (r.region_name || r.name) })),
                    areas: [], warehouses: [], routes: []
                }));
                setSource(prev => ({ ...prev, region: "", area: "", warehouse: "", route: "" }));
            } catch (err) { console.error(err); }
            finally { setSkeletons(prev => ({ ...prev, sourceRegion: false })); }
        };
        fetchRegions();
    }, [source.company]);

    // Fetch Source Areas when Source Region changes
    useEffect(() => {
        if (!source.region) {
            setSourceOptions(prev => ({ ...prev, areas: [], warehouses: [], routes: [] }));
            setSource(prev => ({ ...prev, area: "", warehouse: "", route: "" }));
            return;
        }
        const fetchAreas = async () => {
            try {
                setSkeletons(prev => ({ ...prev, sourceArea: true }));
                const res = await subRegionList({ region_id: source.region, dropdown: "true" });
                setSourceOptions(prev => ({
                    ...prev,
                    areas: (res?.data || []).map((a: any) => ({ value: String(a.id), label: (a.area_code || a.code) ? `${a.area_code || a.code} - ${a.area_name || a.name}` : (a.area_name || a.name) })),
                    warehouses: [], routes: []
                }));
                setSource(prev => ({ ...prev, area: "", warehouse: "", route: "" }));
            } catch (err) { console.error(err); }
            finally { setSkeletons(prev => ({ ...prev, sourceArea: false })); }
        };
        fetchAreas();
    }, [source.region]);

    // Fetch Source Warehouses when Source Area changes
    useEffect(() => {
        if (!source.area) {
            setSourceOptions(prev => ({ ...prev, warehouses: [], routes: [] }));
            setSource(prev => ({ ...prev, warehouse: "", route: "" }));
            return;
        }
        const fetchWarehouses = async () => {
            try {
                setSkeletons(prev => ({ ...prev, sourceWarehouse: true }));
                const res = await warehouseList({ area_id: source.area, dropdown: "true" });
                setSourceOptions(prev => ({
                    ...prev,
                    warehouses: (res?.data || []).map((w: any) => ({ value: String(w.id), label: (w.warehouse_code || w.code) ? `${w.warehouse_code || w.code} - ${w.warehouse_name || w.name}` : (w.warehouse_name || w.name) })),
                    routes: []
                }));
                setSource(prev => ({ ...prev, warehouse: "", route: "" }));
            } catch (err) { console.error(err); }
            finally { setSkeletons(prev => ({ ...prev, sourceWarehouse: false })); }
        };
        fetchWarehouses();
    }, [source.area]);

    // Fetch Source Routes when Source Warehouse changes
    useEffect(() => {
        if (!source.warehouse) {
            setSourceOptions(prev => ({ ...prev, routes: [] }));
            setSource(prev => ({ ...prev, route: "" }));
            return;
        }
        const fetchRoutes = async () => {
            try {
                setSkeletons(prev => ({ ...prev, sourceRoute: true }));
                const res = await routeList({ warehouse_id: source.warehouse, dropdown: "true" });
                setSourceOptions(prev => ({
                    ...prev,
                    routes: (res?.data || []).map((r: any) => ({ value: String(r.id), label: (r.route_code || r.code) ? `${r.route_code || r.code} - ${r.route_name || r.name}` : (r.route_name || r.name) }))
                }));
            } catch (err) { console.error(err); }
            finally { setSkeletons(prev => ({ ...prev, sourceRoute: false })); }
        };
        fetchRoutes();
    }, [source.warehouse]);


    // --- Destination Cascading Logic ---

    // Fetch Dest Regions when Dest Company changes
    useEffect(() => {
        if (!dest.company) {
            setDestOptions(prev => ({ ...prev, regions: [], areas: [], warehouses: [], routes: [] }));
            setDest(prev => ({ ...prev, region: "", area: "", warehouse: "", route: "" }));
            return;
        }
        const fetchRegions = async () => {
            try {
                setSkeletons(prev => ({ ...prev, destRegion: true }));
                const res = await regionList({ company_id: dest.company, dropdown: "true" });
                setDestOptions(prev => ({
                    ...prev,
                    regions: (res?.data || []).map((r: any) => ({ value: String(r.id), label: (r.region_code || r.code) ? `${r.region_code || r.code} - ${r.region_name || r.name}` : (r.region_name || r.name) })),
                    areas: [], warehouses: [], routes: []
                }));
                setDest(prev => ({ ...prev, region: "", area: "", warehouse: "", route: "" }));
            } catch (err) { console.error(err); }
            finally { setSkeletons(prev => ({ ...prev, destRegion: false })); }
        };
        fetchRegions();
    }, [dest.company]);

    // Fetch Dest Areas when Dest Region changes
    useEffect(() => {
        if (!dest.region) {
            setDestOptions(prev => ({ ...prev, areas: [], warehouses: [], routes: [] }));
            setDest(prev => ({ ...prev, area: "", warehouse: "", route: "" }));
            return;
        }
        const fetchAreas = async () => {
            try {
                setSkeletons(prev => ({ ...prev, destArea: true }));
                const res = await subRegionList({ region_id: dest.region, dropdown: "true" });
                setDestOptions(prev => ({
                    ...prev,
                    areas: (res?.data || []).map((a: any) => ({ value: String(a.id), label: (a.area_code || a.code) ? `${a.area_code || a.code} - ${a.area_name || a.name}` : (a.area_name || a.name) })),
                    warehouses: [], routes: []
                }));
                setDest(prev => ({ ...prev, area: "", warehouse: "", route: "" }));
            } catch (err) { console.error(err); }
            finally { setSkeletons(prev => ({ ...prev, destArea: false })); }
        };
        fetchAreas();
    }, [dest.region]);

    // Fetch Dest Warehouses when Dest Area changes
    useEffect(() => {
        if (!dest.area) {
            setDestOptions(prev => ({ ...prev, warehouses: [], routes: [] }));
            setDest(prev => ({ ...prev, warehouse: "", route: "" }));
            return;
        }
        const fetchWarehouses = async () => {
            try {
                setSkeletons(prev => ({ ...prev, destWarehouse: true }));
                const res = await warehouseList({ area_id: dest.area, dropdown: "true" });
                setDestOptions(prev => ({
                    ...prev,
                    warehouses: (res?.data || []).map((w: any) => ({ value: String(w.id), label: (w.warehouse_code || w.code) ? `${w.warehouse_code || w.code} - ${w.warehouse_name || w.name}` : (w.warehouse_name || w.name) })),
                    routes: []
                }));
                setDest(prev => ({ ...prev, warehouse: "", route: "" }));
            } catch (err) { console.error(err); }
            finally { setSkeletons(prev => ({ ...prev, destWarehouse: false })); }
        };
        fetchWarehouses();
    }, [dest.area]);

    // Fetch Dest Routes when Dest Warehouse changes
    useEffect(() => {
        if (!dest.warehouse) {
            setDestOptions(prev => ({ ...prev, routes: [] }));
            setDest(prev => ({ ...prev, route: "" }));
            return;
        }
        const fetchRoutes = async () => {
            try {
                setSkeletons(prev => ({ ...prev, destRoute: true }));
                const res = await routeList({ warehouse_id: dest.warehouse, dropdown: "true" });
                setDestOptions(prev => ({
                    ...prev,
                    routes: (res?.data || []).map((r: any) => ({ value: String(r.id), label: (r.route_code || r.code) ? `${r.route_code || r.code} - ${r.route_name || r.name}` : (r.route_name || r.name) }))
                }));
            } catch (err) { console.error(err); }
            finally { setSkeletons(prev => ({ ...prev, destRoute: false })); }
        };
        fetchRoutes();
    }, [dest.warehouse]);

    // Filter Destination Routes (exclude source route if same hierarchy selected)
    const filteredDestRoutes = useMemo(() => {
        if (source.route && source.route === dest.route) {
            // In case user selected same route, maybe warn?
            // But primarily we filter options
        }
        return destOptions.routes.filter(r => r.value !== source.route);
    }, [destOptions.routes, source.route]);


    const handleSubmit = async () => {
        if (!source.route || !dest.route) {
            showSnackbar("Please select both origin and destination routes", "warning");
            return;
        }

        const payload = {
            old_route_id: Number(source.route),
            new_route_id: Number(dest.route),
        };

        try {
            setLoading(true);
            setSubmitting(true);
            const res = await addRouteTransfer(payload);
            if (res?.error) {
                if (res?.errors) {
                    const errorMsg = Object.values(res.errors).flat().join(", ");
                    showSnackbar(errorMsg || "Validation failed", "error");
                } else {
                    showSnackbar(res?.message || "Route Transfer Failed", "error");
                }
            } else {
                showSnackbar("Route Transfer Successful ✅", "success");
                // Reset Forms
                setSource({ company: "", region: "", area: "", warehouse: "", route: "" });
                setDest({ company: "", region: "", area: "", warehouse: "", route: "" });
                if (isHistoryOpen) fetchHistory(); // Refresh history if open
            }
        } catch (error) {
            console.error("Route transfer error:", error);
            showSnackbar("Something went wrong", "error");
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    return (
        <ContainerCard>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[20px] font-semibold text-[#181D27] uppercase">
                    Route Transfer
                </h1>
                <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                    title="View Transfer History"
                >
                    <Icon icon="lucide:clock" width="24" height="24" />
                </button>
            </div>

            {/* TRANSFER FROM SECTION */}
            <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Transfer From</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InputFields
                        label="Company"
                        value={source.company}
                        options={sourceOptions.companies}
                        onChange={(e) => setSource({ ...source, company: e.target.value })}
                        searchable
                        placeholder="Select Company"
                        showSkeleton={skeletons.sourceCompany}
                    />
                    <InputFields
                        label="Region"
                        value={source.region}
                        options={sourceOptions.regions}
                        onChange={(e) => setSource({ ...source, region: e.target.value })}
                        disabled={!source.company}
                        searchable
                        placeholder="Select Region"
                        showSkeleton={skeletons.sourceRegion}
                    />
                    <InputFields
                        label="Area"
                        value={source.area}
                        options={sourceOptions.areas}
                        onChange={(e) => setSource({ ...source, area: e.target.value })}
                        disabled={!source.region}
                        searchable
                        placeholder="Select Area"
                        showSkeleton={skeletons.sourceArea}
                    />
                    <InputFields
                        label="Distributor"
                        value={source.warehouse}
                        options={sourceOptions.warehouses}
                        onChange={(e) => setSource({ ...source, warehouse: e.target.value })}
                        disabled={!source.area}
                        searchable
                        placeholder="Select Distributor"
                        showSkeleton={skeletons.sourceWarehouse}
                    />
                    <InputFields
                        label="Route (Origin)"
                        value={source.route}
                        options={sourceOptions.routes}
                        onChange={(e) => setSource({ ...source, route: e.target.value })}
                        disabled={!source.warehouse}
                        searchable
                        placeholder="Select Origin Route"
                        showSkeleton={skeletons.sourceRoute}
                    />
                </div>
            </div>

            {/* TRANSFER TO SECTION */}
            <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Transfer To</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InputFields
                        label="Company"
                        value={dest.company}
                        options={destOptions.companies}
                        onChange={(e) => setDest({ ...dest, company: e.target.value })}
                        searchable
                        placeholder="Select Company"
                        showSkeleton={skeletons.destCompany}
                    />
                    <InputFields
                        label="Region"
                        value={dest.region}
                        options={destOptions.regions}
                        onChange={(e) => setDest({ ...dest, region: e.target.value })}
                        disabled={!dest.company}
                        searchable
                        placeholder="Select Region"
                        showSkeleton={skeletons.destRegion}
                    />
                    <InputFields
                        label="Area"
                        value={dest.area}
                        options={destOptions.areas}
                        onChange={(e) => setDest({ ...dest, area: e.target.value })}
                        disabled={!dest.region}
                        searchable
                        placeholder="Select Area"
                        showSkeleton={skeletons.destArea}
                    />
                    <InputFields
                        label="Distributor"
                        value={dest.warehouse}
                        options={destOptions.warehouses}
                        onChange={(e) => setDest({ ...dest, warehouse: e.target.value })}
                        disabled={!dest.area}
                        searchable
                        placeholder="Select Distributor"
                        showSkeleton={skeletons.destWarehouse}
                    />
                    <InputFields
                        label="Route (Destination)"
                        value={dest.route}
                        options={filteredDestRoutes}
                        onChange={(e) => setDest({ ...dest, route: e.target.value })}
                        disabled={!dest.warehouse}
                        searchable
                        placeholder="Select Destination Route"
                        showSkeleton={skeletons.destRoute}
                    />
                </div>
            </div>


            {/* ACTION */}
            {can("create") && (
                <div className="flex justify-end mt-6 gap-4">
                     <SidebarBtn
                              label={
                                submitting ? "Submitting..." : "Submit Transfer"
                              }
                              isActive={!submitting}
                              
                              leadingIcon="mdi:check"
                              onClick={handleSubmit}
                              disabled={submitting || !source.route && !dest.route}
                            />
                    {/* <button
                        onClick={handleSubmit}
                        disabled={!source.route || !dest.route}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                    >
                        Submit Transfer
                    </button> */}
                </div>

            )}

            {/* HISTORY DRAWER */}
            <Drawer anchor="right" open={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}>
                <div className="w-[500px] h-full bg-white flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b shrink-0 bg-gray-50">
                        <div className="flex items-center gap-3">
                            {selectedHistoryItem && (
                                <button
                                    onClick={() => setSelectedHistoryItem(null)}
                                    className="p-1 -ml-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                                >
                                    <Icon icon="lucide:arrow-left" width="20" />
                                </button>
                            )}
                            <h3 className="text-xl font-bold text-gray-800">
                                {selectedHistoryItem ? "Transfer Details" : "Transfer History"}
                            </h3>
                        </div>
                        <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-200">
                            <Icon icon="lucide:x" width="24" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedHistoryItem ? (
                            // DETAIL VIEW
                            <div className="space-y-6 pb-6">
                                <div className="bg-gray-50 border-x border-y rounded-lg p-3">
                                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-1">Transfer Date & Time</div>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Icon icon="lucide:calendar-clock" width="20" className="text-gray-400" />
                                        <span className="font-semibold text-sm">
                                            {formatDateFlexible(selectedHistoryItem.transferred_at, { pattern: "DD MMM YYYY, hh:mm A" }) || "-"}
                                        </span>
                                    </div>
                                </div>

                                {/* Route Info */}
                                <div className="grid grid-cols-1 gap-4">
                                    {/* From Section */}
                                    <div className="p-4 border border-red-100 bg-red-50/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-3 text-red-700 font-bold text-sm uppercase">
                                            <Icon icon="lucide:arrow-up-right" width="18" />
                                            <span>Route (Origin)</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-[11px] text-gray-500 uppercase">Route</div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedHistoryItem.old_route?.route_code} - {selectedHistoryItem.old_route?.route_name || "-"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] text-gray-500 uppercase">Distributor</div>
                                                <div className="font-medium text-gray-800">
                                                    {getWarehouseName(selectedHistoryItem?.old_warehouse)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* To Section */}
                                    <div className="p-4 border border-green-100 bg-green-50/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-3 text-green-700 font-bold text-sm uppercase">
                                            <Icon icon="lucide:arrow-down-right" width="18" />
                                            <span>Route (Destination)</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-[11px] text-gray-500 uppercase">Route</div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedHistoryItem.new_route?.route_code} - {selectedHistoryItem.new_route?.route_name || "-"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] text-gray-500 uppercase">Distributor</div>
                                                <div className="font-medium text-gray-800">
                                                    {getWarehouseName(selectedHistoryItem?.new_warehouse)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Customers List */}
                                {selectedHistoryItem.customers?.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Icon icon="lucide:users" width="18" />
                                            Transferred Customers ({selectedHistoryItem.customers.length})
                                        </h4>
                                        <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                                            <table className="w-full text-xs text-left text-gray-500">
                                                <thead className="text-gray-700 uppercase bg-gray-50 border-b sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 font-semibold">Code</th>
                                                        <th className="px-4 py-2 font-semibold">Customer Name</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {selectedHistoryItem.customers.map((cust: any, cidx: number) => (
                                                        <tr key={cidx} className="bg-white hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-gray-600">
                                                                {cust.osa_code || "-"}
                                                            </td>
                                                            <td className="px-4 py-2 font-medium text-gray-900">
                                                                {cust.name || "-"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // LIST VIEW
                            <>
                                {historyLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <Icon icon="eos-icons:loading" width="32" className="mb-2" />
                                        <span>Loading history...</span>
                                    </div>
                                ) : historyData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <Icon icon="lucide:history" width="48" className="mb-2 opacity-20" />
                                        <span>No transfer history found.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {historyData.map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedHistoryItem(item)
                                                }}
                                                className="group p-4 border rounded-lg hover:border-red-300 hover:shadow-sm cursor-pointer transition-all bg-white"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                                        <Icon icon="lucide:calendar-clock" width="12" />
                                                        {formatDateFlexible(item.transferred_at, { pattern: "DD MMM YYYY, hh:mm A" }) || "-"}
                                                    </span>
                                                    <Icon icon="lucide:chevron-right" className="text-gray-300 group-hover:text-red-500 transition-colors" />
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <div className="text-xs text-gray-500 mb-0.5">From</div>
                                                        <div className="font-semibold text-gray-800 text-sm line-clamp-1">
                                                            {item.old_route?.route_name || item.old_route_id || "Unknown"}
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-400">
                                                        <Icon icon="lucide:arrow-right" />
                                                    </div>
                                                    <div className="flex-1 text-right">
                                                        <div className="text-xs text-gray-500 mb-0.5">To</div>
                                                        <div className="font-semibold text-gray-800 text-sm line-clamp-1">
                                                            {item.new_route?.route_name || item.new_route_id || "Unknown"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Drawer>
        </ContainerCard>
    );
}
