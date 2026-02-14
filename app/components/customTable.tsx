"use client";

import SearchBar from "./searchBar";
import { Icon } from "@iconify-icon/react";
import CustomDropdown from "./customDropdown";
import BorderIconButton from "./borderIconButton";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import UploadPopup from "./UploadPopup";
import FilterDropdown from "./filterDropdown";
import InputFields from "./inputFields";
import SidebarBtn from "./dashboardSidebarBtn";
import CustomCheckbox from "./customCheckbox";
import DismissibleDropdown from "./dismissibleDropdown";
import { naturalSort } from "../(private)/utils/naturalSort";
import { CustomTableSkelton } from "./customSkeleton";
import Draggable from "react-draggable";
import Skeleton from "@mui/material/Skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useHiddenHistory } from "../(private)/utils/useHiddenHistory";

export type listReturnType = {
    data: TableDataType[];
    currentPage: number;
    pageSize: number;
    total: number;
    totalRecords?: number;
};

// New type for data prop with pagination
export type TableDataWithPagination = {
    data: TableDataType[];
    currentPage: number;
    pageSize: number;
    total: number;
    totalRecords?: number;
};
export type searchReturnType = listReturnType;
export type FilterField = {
    key: string;
    label?: string;
    type?: "text" | "select" | "date" | "dateChange" | "number";
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    isSingle?: boolean;
    multiSelectChips?: boolean;
    applyWhen?: (filters: Record<string, any>) => boolean;
    inputProps?: Record<string, any>;
    onChange?: (value: any) => void;
    minDate?: string;
};

export type FilterRendererProps = {
    payload: Record<string, string | number | null | (string | number)[]>;
    setPayload: React.Dispatch<React.SetStateAction<Record<string, string | number | null | (string | number)[]>>>;
    submit: (payload?: Record<string, string | number | null | (string | number)[]>) => Promise<void>;
    clear: () => Promise<void>;
    activeFilterCount: number;
    appliedFilters: boolean;
    close: () => void;
    isApplying: boolean;
    isClearing: boolean;
};

export type configType = {
    api?: {
        search?: (
            search: string,
            pageSize: number,
            columnName?: string,
            pageNo?: number,
        ) => Promise<listReturnType> | listReturnType;
        list?: (
            pageNo: number,
            pageSize: number,
        ) => Promise<listReturnType> | listReturnType | any;
        filterBy?: (
            payload: Record<string, string | number | null>,
            pageSize: number,
            pageNo?: number
        ) => Promise<listReturnType> | listReturnType;
    };
    header?: {
        title?: string;
        wholeTableActions?: React.ReactNode[];
        tableActions?: React.ReactNode[];
        searchBar?:
        | boolean
        | {
            placeholder: string;
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        }; // yet to implement
        columnFilter?: boolean;
        filterByFields?: FilterField[];
        filterRenderer?: (props: FilterRendererProps) => React.ReactNode;
        exportButton?: {
            threeDotLoading?: { csv: boolean; xlsx: boolean; xls?: boolean; xslx?: boolean };
            show: boolean;
            onClick: (api: (params?: Record<string, any>) => Promise<any>, data?: TableDataType[]) => void;
        };
        /**
         * Optional upload prop. If provided, shows upload icon next to exportButton.
         * dummyApi: function for dummy upload
         * api: function for real upload
         */
        upload?: {
            dummyApi: (...args: any[]) => Promise<any>;
            api: (...args: any[]) => Promise<any>;
        };
        threeDot?: {
            label: string;
            labelTw?: string;
            icon?: string;
            iconWidth?: string;
            onClick?: (data: TableDataType[], selectedRow?: number[]) => void;
            showOnSelect?: boolean;
            showWhen?: (data: TableDataType[], selectedRow?: number[]) => boolean;
        }[],
        selectedCount?: {

            label?: string | React.ReactNode;
            labelTw?: string;
            onClick?: (data: TableDataType[], selectedRow?: number[]) => void;
        };
        actions?: React.ReactNode[];
        actionsWithData?: (data: TableDataType[], selectedRow?: number[]) => React.ReactNode[];
    };
    rowActions?: {
        icon?: string;
        showLoading?: boolean;
        label?: string;
        onClick?: (data: TableDataType) => void;
    }[];
    table?: {
        width?: number | string;
        maxWidth?: number | string;
        maxHeight?: number | string;
        height?: number | string;
    };
    footer?: {
        nextPrevBtn?: boolean;
        pagination?: boolean;
    };
    localStorageKey?: string;
    showNestedLoading?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[]; // yet to implement
    rowSelection?: boolean;
    onRowSelectionChange?: (selectedRows: number[]) => void;
    rowColor?: (row: TableDataType) => string;
    dragableColumn?: boolean;
    floatingInfoBar?: {
        showByDefault?: boolean;
        showSelectedRow?: boolean;
        rowSelectionOnClick?: (data: TableDataType[], selectedRow?: number[], selectedColumns?: number[]) => void;
        buttons?: {
            label: string;
            labelTw?: string;
            icon?: string;
            iconWidth?: string;
            onClick?: (data: TableDataType[], selectedRow?: number[], selectedColumns?: number[]) => void;
            showOnSelect?: boolean;
            showWhen?: (data: TableDataType[], selectedRow?: number[], selectedColumns?: number[]) => boolean;
        }[];
    };
    columns: {
        key: string;
        label: string | React.ReactNode;
        width?: number;
        render?: (row: TableDataType) => React.ReactNode;
        align?: "left" | "center" | "right";
        sticky?: string;
        isSortable?: boolean;
        showByDefault?: boolean;
        filter?: {
            isFilterable?: boolean;
            filterkey?: string;
            width?: number | string;
            height?: number | string;
            maxHeight?: number | string;
            maxWidth?: number | string;
            options?: Array<{ value: string; label: string }>; // dropdown options
            onSearch?: (search: string) => Promise<Array<{ value: string; label: string }>> | Array<{ value: string; label: string }>; // search handler
            onSelect?: (selected: string | string[]) => void; // selection handler, now supports array for multi-select
            isSingle?: boolean; // new prop, default true
            selectedValue?: string | any; // <-- add this for single-select highlight
            render?: (
                data: TableDataType[],
                search?: (
                    search: string,
                    pageSize: number,
                    columnName?: string,
                    pageNo?: number,
                ) => Promise<listReturnType> | listReturnType
            ) => React.ReactNode;
        };
        filterStatus?: {
            enabled: boolean;
            onFilter: (status: boolean) => Promise<void>;
            currentFilter?: boolean | null;
        };
    }[];
};

type columnFilterConfigType = {
    selectedColumns: number[];
    setSelectedColumns: React.Dispatch<React.SetStateAction<number[]>>;
};

const ColumnFilterConfig = createContext<columnFilterConfigType>({
    selectedColumns: [],
    setSelectedColumns: () => { },
});

type SelectedRowType = {
    selectedRow: number[];
    setSelectedRow: React.Dispatch<React.SetStateAction<number[]>>;
};

const SelectedRow = createContext<SelectedRowType>({
    selectedRow: [],
    setSelectedRow: () => { },
});

type configContextType = {
    config: configType;
    setConfig: React.Dispatch<React.SetStateAction<configType>>;
};

const Config = createContext<configContextType>({
    config: {} as configType,
    setConfig: () => { },
});

export type TableDataType = {
    [key: string]: any;
};

type tableDetailsContextType = {
    tableDetails: listReturnType;
    setTableDetails: React.Dispatch<React.SetStateAction<listReturnType>>;
    nestedLoading: boolean;
    setNestedLoading: React.Dispatch<React.SetStateAction<boolean>>;
    // initial data snapshot so components can restore original list
    initialTableData?: listReturnType | null;
    setInitialTableData: React.Dispatch<React.SetStateAction<listReturnType | null>>;
    // search and filter state to avoid using window globals
    searchState: { applied: boolean; term: string };
    setSearchState: React.Dispatch<React.SetStateAction<{ applied: boolean; term: string }>>;
    filterState: { applied: boolean; payload: Record<string, any> };
    setFilterState: React.Dispatch<React.SetStateAction<{ applied: boolean; payload: Record<string, any> }>>;
    // Hidden History Integration
    params: Record<string, any>;
    setParams: (newParams: Record<string, any>, options?: { replace?: boolean }) => void;
};
const TableDetails = createContext<tableDetailsContextType>(
    {} as tableDetailsContextType
);

interface TableProps {
    refreshKey?: number;
    // Accept either array or object with pagination
    data?: TableDataType[] | TableDataWithPagination;
    config: configType;
    directFilterRenderer?: React.ReactNode;
}

const defaultPageSize = 50;

export default function Table({ refreshKey = 0, data, config, directFilterRenderer }: TableProps) {
    return (
        <ContextProvider config={config}>
            <TableContainer
                refreshKey={refreshKey}
                data={data}
                config={{
                    showNestedLoading: true,
                    dragableColumn: true,
                    ...config
                }}
                directFilterRenderer={directFilterRenderer}
            />
        </ContextProvider>
    );
}

function ContextProvider({ config: initialConfig, children }: { config: configType, children: React.ReactNode }) {
    const [selectedColumns, setSelectedColumns] = useState([] as number[]);
    const [selectedRow, setSelectedRow] = useState([] as number[]);
    const [tableDetails, setTableDetails] = useState({} as listReturnType);
    const [nestedLoading, setNestedLoading] = useState(false);
    const [initialTableData, setInitialTableData] = useState<listReturnType | null>(null);
    const [searchState, setSearchState] = useState<{ applied: boolean; term: string }>({ applied: false, term: "" });
    const [filterState, setFilterState] = useState<{ applied: boolean; payload: Record<string, any> }>({ applied: false, payload: {} });
    const [config, setConfig] = useState<configType>(initialConfig);

    // Initialize Hidden History
    const tableId = initialConfig.localStorageKey || "default-table";
    const { params, setParams } = useHiddenHistory(tableId);

    // Sync Search State with Utils Params (Backwards compatibility + UI sync)
    useEffect(() => {
        if (params.search) {
            setSearchState({ applied: true, term: params.search });
        } else {
            setSearchState({ applied: false, term: "" });
        }
    }, [params.search]);

    return (
        <Config.Provider value={{ config, setConfig }}>
            <ColumnFilterConfig.Provider value={{ selectedColumns, setSelectedColumns }}>
                <SelectedRow.Provider value={{ selectedRow, setSelectedRow }}>
                    <TableDetails.Provider value={{
                        tableDetails, setTableDetails,
                        nestedLoading, setNestedLoading,
                        initialTableData, setInitialTableData,
                        searchState, setSearchState,
                        filterState, setFilterState,
                        params, setParams
                    }}>
                        {children}
                    </TableDetails.Provider>
                </SelectedRow.Provider>
            </ColumnFilterConfig.Provider>
        </Config.Provider>
    );
}

function TableContainer({ refreshKey, data, config, directFilterRenderer }: TableProps) {
    // Ref to track last API call params
    const searchParams = useSearchParams();
    const lastApiCallRef = useRef<{ pageNo: number; pageSize: number } | null>(null);
    const { selectedColumns, setSelectedColumns } = useContext(ColumnFilterConfig);
    const { setConfig } = useContext(Config);
    const { tableDetails, setTableDetails, setNestedLoading, setInitialTableData, params } = useContext(TableDetails);
    const { selectedRow, setSelectedRow } = useContext(SelectedRow);
    const [showDropdown, setShowDropdown] = useState(false);
    const [displayedData, setDisplayedData] = useState<TableDataType[]>([]);
    // ordering of columns (array of original column indices). initialized from config.columns
    const [columnOrder, setColumnOrder] = useState<number[]>(
        () => (config.columns || []).map((_, i) => i)
    );
    const initialUrlSyncRef = useRef(false);
    const columnsSignature = useMemo(() => (config.columns || []).map(c => c.key).join(','), [config.columns]);

    useEffect(() => {
        const newOrder = (config.columns || []).map((_, i) => i);
        setColumnOrder(newOrder);

        const allByDefault = config.columns.map((data, index) => { return data.showByDefault ? index : -1 });
        const filtered = allByDefault.filter((n) => n !== -1);
        if (filtered.length > 0) {
            setSelectedColumns(filtered);
        } else {
            setSelectedColumns(newOrder);
        }
    }, [columnsSignature]);

    async function checkForData() {
        // if data is passed, use default values
        if (data) {
            const date = new Date();
            setNestedLoading(true);
            let tableDataWithPagination: TableDataWithPagination;
            if (Array.isArray(data)) {
                tableDataWithPagination = {
                    data,
                    total: Math.ceil(
                        data.length / (config.pageSize || defaultPageSize)
                    ),
                    currentPage: 0,
                    pageSize: config.pageSize || defaultPageSize,
                };
            } else {
                tableDataWithPagination = data;
            }
            setTableDetails(tableDataWithPagination);
            setDisplayedData(tableDataWithPagination.data);
            try {
                setInitialTableData(tableDataWithPagination);
            } catch (err) {
                /* ignore */
            }
            setTimeout(() => setNestedLoading(false), Math.max(0, 1000 - (new Date().getTime() - date.getTime())));
        }
        // if api is passed, use default values
        else if (config.api?.list) {
            const hasUrlParams = searchParams && Array.from(searchParams.keys()).length > 0;
            const hasHistoryParams = Object.keys(params).length > 0;

            const MIN_LOADING_MS = 1000; // ensure nested loading lasts at least 1s
            const start = Date.now();

            // Derive page and pageSize from params
            // Params usage: { page, pageSize, search, ...filters }
            const pageNo = params.page ? Number(params.page) : 1;
            const pageSize = params.pageSize ? Number(params.pageSize) : (config.pageSize || defaultPageSize);
            const searchTerm = params.search as string;

            // Only call API if params changed OR if it's the first load
            // Note: with useHiddenHistory, we might want to trigger on params change
            // The useEffect below triggers on `data` (which is undefined here) and `refreshKey`
            // But we also need to trigger when `params` changes.
            // Actually, we should check equality with lastApiCallRef including search/filters

            const currentCallSignature = JSON.stringify({ pageNo, pageSize, params });

            // Prevent duplicate calls if signature matches (debouncing/strict mode protection)
            if (
                lastApiCallRef.current &&
                JSON.stringify(lastApiCallRef.current) === currentCallSignature &&
                refreshKey === 0 // Allow force refresh
            ) {
                // return; // Commented out to ensure it runs if refreshKey changes differently
            }
            // lastApiCallRef.current = { pageNo, pageSize, params } as any; 

            try {
                setNestedLoading(true);
                let result;

                // Route API call based on _filterMode
                const filterMode = params._filterMode;

                if (filterMode === 'search' && config.api.search && searchTerm) {
                    result = await config.api.search(searchTerm, pageSize, undefined, pageNo);
                }
                else if (filterMode === 'filterBy' && config.api.filterBy) {
                    const { page, pageSize: ps, search, _filterMode, ...filters } = params;
                    result = await config.api.filterBy(filters, pageSize, pageNo);
                }
                else {
                    // Default to list API (or List Mode)
                    const { page, pageSize: ps, search, _filterMode, _columns, ...filters } = params;
                    const hasFilters = Object.keys(filters).length > 0;

                    if (config.api.list) {
                        // Always pass filters to list API (JS ignores extra args if not used)
                        // @ts-ignore
                        result = await config.api.list(pageNo, pageSize, filters);
                    } else if (hasFilters && config.api.filterBy) {
                        // Fallback: if no list API but filterBy exists and we have filters (legacy behavior)
                        result = await config.api.filterBy(filters, pageSize, pageNo);
                    }
                }

                const resolvedResult = result instanceof Promise ? await result : result;
                const { data, total, currentPage, totalRecords } = resolvedResult || { data: [], total: 0, currentPage: 1 };
                const tableInit = {
                    data,
                    total,
                    totalRecords: totalRecords ?? total,
                    currentPage: currentPage - 1,
                    pageSize,
                };
                setTableDetails(tableInit);
                setDisplayedData(data);
                try {
                    setInitialTableData(tableInit);
                } catch (err) {
                    /* ignore */
                }
            } finally {
                const elapsed = Date.now() - start;
                const wait = Math.max(0, MIN_LOADING_MS - elapsed);
                if (wait > 0) {
                    await new Promise((res) => setTimeout(res, wait + 500));
                }
                setTimeout(() => {
                    setNestedLoading(false);
                }, 0);
            }
        }
        // nothing is passed
        else {
            throw new Error(
                "Either pass data or list API function in Table config prop"
            );
        }
    }

    useEffect(() => {
        setConfig(config);
    }, [config]);

    // EFFECT 1: Trigger API Calls (checkForData) when params change
    useEffect(() => {
        // Initial Sync with Parent State: If we have params from history, update parent via onSelect
        if (!initialUrlSyncRef.current) {
            let synced = false;
            // We can iterate params or columns. Iterating columns is safer for config matching.
            config.columns?.forEach(col => {
                const key = col.filter?.filterkey || col.key;
                const val = params[key];
                // If param exists and handler exists
                if (val !== undefined && val !== null && col.filter?.onSelect) {
                    col.filter.onSelect(val);
                    synced = true;
                }
            });

            initialUrlSyncRef.current = true;

            // If we synced (called parent setters), we should skip this immediate fetch 
            // and wait for the parent to re-render (which might update config/refreshKey)
            // This avoids double API calls.
            if (synced) {
                setNestedLoading(true); // Show loading while waiting for parent re-render
                return;
            }
        }

        // Reset lastApiCallRef when refreshKey changes to force API re-fetch
        // lastApiCallRef.current = null;

        // Debounce API call to prevent double-fetch during rapid state changes (e.g. initial mount -> history restore)
        const timer = setTimeout(() => {
            checkForData();
        }, 100);

        return () => clearTimeout(timer);
    }, [data, refreshKey, params]); // Include 'params' to detect filter changes (dynamic keys)

    // EFFECT 2: Initialize Columns from LocalStorage (Run once or when key changes)
    useEffect(() => {
        // Only initialize "select all" when there is no saved selection in localStorage.
        try {
            const key = config?.localStorageKey;
            const saved = key ? localStorage.getItem(key) : null;
            let parsed: number[] | null = null;

            if (saved) {
                try { parsed = JSON.parse(saved); } catch (e) { }
            }

            // Treat empty array as missing to fix sticky blank table
            if (!parsed || (Array.isArray(parsed) && parsed.length === 0)) {
                // Default handling
                const allByDefault = config.columns.map((data, index) => { return data.showByDefault ? index : -1 });
                const filtered = allByDefault.filter((n) => n !== -1);
                if (filtered.length > 0) {
                    setSelectedColumns(filtered);
                } else {
                    setSelectedColumns(config.columns?.map((_, index) => index));
                }
            } else {
                setSelectedColumns(parsed);
            }
        } catch (err) {
            // Fallback
            setSelectedColumns(config.columns?.map((_, index) => index));
        }
        setSelectedRow([]);
    }, [config?.localStorageKey]); // Only re-run if key changes (on mount)

    // Save selected columns to localStorage
    useEffect(() => {
        if (config?.localStorageKey && selectedColumns.length > 0) {
            localStorage.setItem(config.localStorageKey, JSON.stringify(selectedColumns));
        }
    }, [selectedColumns, config?.localStorageKey]);

    useEffect(() => {
        if (config.onRowSelectionChange) {
            config.onRowSelectionChange(selectedRow);
        }
    }, [selectedRow, config.onRowSelectionChange]);

    const [showUploadPopup, setShowUploadPopup] = useState(false);
    // Listen for open-upload-popup event
    useEffect(() => {
        const handler = () => setShowUploadPopup(true);
        window.addEventListener('open-upload-popup', handler);
        return () => window.removeEventListener('open-upload-popup', handler);
    }, []);

    const orderedColumns = (columnOrder || []).map((i) => config.columns[i]).filter(Boolean);

    return (
        <>
            {(config.header?.title || config.header?.wholeTableActions || config.header?.tableActions) && (
                <div className="flex justify-between items-center mb-[20px] h-[34px]">
                    {config.header?.title && (
                        <h1 className="text-[18px] font-semibold text-[#181D27]">
                            {config.header.title}
                        </h1>
                    )}
                    <div className="flex gap-[8px]">
                        {config.header?.tableActions && config.header?.tableActions?.map((action) => action)}
                        {selectedRow.length > 0 &&
                            config.header?.wholeTableActions?.map(
                                (action) => action
                            )}
                        {config.header?.exportButton && (
                            <div className="flex gap-[12px] relative items-center">
                                <BorderIconButton
                                    icon={(config.header?.exportButton?.threeDotLoading?.xlsx || config.header?.exportButton?.threeDotLoading?.xslx || config.header?.exportButton?.threeDotLoading?.xls) ? "eos-icons:three-dots-loading" : "gala:file-document"}
                                    label="Export Excel"
                                    onClick={async () => {
                                        if (config.header?.exportButton?.threeDotLoading?.xlsx || config.header?.exportButton?.threeDotLoading?.xslx || config.header?.exportButton?.threeDotLoading?.xls) return;
                                        if (!config.header?.exportButton?.onClick) return;
                                        config.header.exportButton.onClick(config.api?.list as any, displayedData);
                                    }}
                                />
                                {/* Upload icon next to exportButton if upload prop is provided */}
                                {config.header?.upload && (
                                    <BorderIconButton
                                        icon="material-symbols:upload-rounded"
                                        // label="Upload"
                                        onClick={() => setShowUploadPopup(true)}
                                    />
                                )}
                            </div>
                        )}
                        {/* If you want to add threeDot dropdown, do it in the correct place in header */}
                        {config.header?.threeDot && (() => {

                            const visibleOptions = config.header.threeDot.filter(option => {
                                const shouldShow = option.showOnSelect ? selectedRow.length > 0 : option.showWhen ? option.showWhen(displayedData, selectedRow) : true;
                                return shouldShow;
                            });
                            if (visibleOptions.length === 0) return null;
                            return (
                                <div className="flex gap-[12px] relative">
                                    <DismissibleDropdown
                                        isOpen={showDropdown}
                                        setIsOpen={setShowDropdown}
                                        button={
                                            <BorderIconButton icon="ic:sharp-more-vert" />
                                        }
                                        dropdown={
                                            <div className="absolute top-[40px] right-0 z-30 w-[226px]">
                                                <CustomDropdown>
                                                    {visibleOptions.map((option, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="px-[14px] py-[10px] flex items-center gap-[8px] hover:bg-[#FAFAFA] cursor-pointer"
                                                            onClick={() => option.onClick && option.onClick(displayedData, selectedRow)}
                                                        >
                                                            {option?.icon && (
                                                                <Icon
                                                                    icon={option.icon}
                                                                    width={option.iconWidth || 20}
                                                                    className="text-[#717680]"
                                                                />
                                                            )}
                                                            <span className={`text-[#181D27] font-[500] text-[16px] ${option?.labelTw}`}>
                                                                {option.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </CustomDropdown>
                                            </div>
                                        }
                                    />
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
            <div className="flex flex-col bg-white w-full border-[1px] border-[#E9EAEB] rounded-[8px] overflow-hidden">
                <TableHeader directFilterRenderer={directFilterRenderer} />
                <TableBody orderedColumns={orderedColumns} setColumnOrder={setColumnOrder} />
                <TableFooter />
            </div>
            {/* Upload Popup */}
            {config.header?.upload && (
                <UploadPopup
                    open={showUploadPopup}
                    onClose={() => setShowUploadPopup(false)}
                    dummyApi={config.header.upload.dummyApi}
                    api={config.header.upload.api}
                />
            )}
        </>
    );
}

function TableHeader({ directFilterRenderer }: { directFilterRenderer?: React.ReactNode }) {
    const { config } = useContext(Config);
    const { tableDetails, setTableDetails, setNestedLoading, setSearchState, searchState, initialTableData, params, setParams } = useContext(TableDetails);
    const [searchBarValue, setSearchBarValue] = useState("");
    const { selectedRow } = useContext(SelectedRow);

    // need search Term only when you want to search using you word instead of the searchBarValue 
    // ---> used for fixing searchBarValue is not updating immediately issue
    async function handleSearch(searchTerm?: string) {
        // Updated to use setParams from useHiddenHistory
        const termToUse = searchTerm !== undefined ? searchTerm : searchBarValue;

        // Always replace history when searching/filtering per user request
        // Exclusive Mode: Search. Clear all other filters.
        setParams({
            search: termToUse,
            page: 1,
            _filterMode: 'search'
        }, { replace: true });
    }

    // Sync input with global search param (e.g. from history back navigation)
    useEffect(() => {
        if (params.search !== undefined) {
            setSearchBarValue(params.search as string);
        } else {
            setSearchBarValue("");
        }
    }, [params.search]);

    return (
        <>
            {config.header && (
                <div className="px-[24px] py-[20px] w-full flex justify-between items-center gap-[8px]">
                    <>
                        <div className="flex items-center gap-2 w-[320px] invisible sm:visible">
                            {config.header?.searchBar && (
                                <div className="w-full">
                                    <SearchBar
                                        value={searchBarValue}
                                        onChange={async (
                                            e: React.ChangeEvent<HTMLInputElement>
                                        ) => setSearchBarValue(e.target.value)}
                                        onClear={async () => {
                                            setSearchBarValue("");
                                            handleSearch("");
                                        }}
                                        onEnterPress={() => handleSearch()}
                                    />
                                </div>
                            )}

                            {/* show results summary for global search (from context) */}
                            {/* {tableDetails?.totalRecords !== undefined && (
                                <div className="ml-3 flex items-center gap-2 text-sm text-gray-600">
                                    {tableDetails?.totalRecords} Results found <span className="cursor-pointer underline" onClick={() => handleSearch("")}>clear search filter</span>
                                </div>
                            )} */}

                            {/* header filter panel button (shows configurable fields or custom renderer) */}
                            {directFilterRenderer ? (
                                <div className="ml-2">
                                    {directFilterRenderer}
                                </div>
                            ) : (config.header?.filterByFields?.length || config.header?.filterRenderer) && (
                                <div className="ml-2">
                                    <FilterBy />
                                </div>
                            )}
                            {config.header?.selectedCount !== undefined && (
                                <div className="w-full ml-2 text-sm text-gray-600">
                                    {config.header?.selectedCount?.label && (
                                        <span className={config.header?.selectedCount?.labelTw} onClick={() => config.header?.selectedCount?.onClick && config.header?.selectedCount?.onClick(tableDetails.data, selectedRow)}>
                                            {typeof config.header?.selectedCount?.label === "string"
                                                ? `${config.header?.selectedCount?.label}${selectedRow.length}`
                                                : <>{config.header?.selectedCount?.label}{selectedRow.length}</>}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* actions */}
                        <div className="flex justify-end w-fit gap-[8px]">
                            {config.header?.actions?.map((action) => action)}
                            {config.header?.actionsWithData && config.header?.actionsWithData(tableDetails?.data || [], selectedRow).map((action) => action)}
                            {config.header?.columnFilter && <ColumnFilter />}
                        </div>
                    </>
                </div>
            )}
        </>
    );
}

// For showing/hiding columns using a dropdown with checkboxes
function ColumnFilter() {
    const { config } = useContext(Config);
    const { columns } = config;
    const { selectedColumns, setSelectedColumns } =
        useContext<columnFilterConfigType>(ColumnFilterConfig);
    const allItemsCount = columns.length;
    const isAllSelected = selectedColumns.length === allItemsCount;
    const isIndeterminate = selectedColumns.length > 0 && !isAllSelected;
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Load saved selected columns from localStorage when component mounts or config/columns change
        if (!config?.localStorageKey) return;
        try {
            const raw = localStorage.getItem(config.localStorageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // Keep only valid numeric indices within columns range
                const valid = (parsed as unknown[]).filter(
                    (n: unknown): n is number =>
                        typeof n === "number" && n >= 0 && n < columns.length
                );
                if (valid.length) {
                    setSelectedColumns(valid);
                }
            }
        } catch (err) {
            // ignore parse errors
            console.warn(
                "Failed to read selected columns from localStorage",
                err
            );
        }
    }, [config?.localStorageKey, columns, setSelectedColumns]);

    useEffect(() => {
        // Persist selected columns to localStorage whenever it changes
        if (!config?.localStorageKey) return;
        try {
            localStorage.setItem(
                config.localStorageKey,
                JSON.stringify(selectedColumns)
            );
        } catch (err) {
            // ignore write errors
            console.warn(
                "Failed to save selected columns to localStorage",
                err
            );
        }
    }, [selectedColumns, config?.localStorageKey]);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedColumns(
                (prevSelected: columnFilterConfigType["selectedColumns"]) => {
                    if (prevSelected.length === allItemsCount) {
                        return [];
                    } else {
                        return columns.map((_, index) => index);
                    }
                }
            );
        } else {
            setSelectedColumns([]);
        }
    };

    const handleSelectItem = (id: number) => {
        setSelectedColumns((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    return (
        <div className="relative">
            <DismissibleDropdown
                isOpen={showDropdown}
                setIsOpen={setShowDropdown}
                button={
                    <BorderIconButton
                        icon="lucide:filter"
                        className="h-[40px]"
                        onClick={() => setShowDropdown(!showDropdown)}
                    />
                }
                dropdown={
                    <div className="min-w-[200px] max-w-[350px] w-fit min-h-[200px] max-h-1/2 h-fit fixed right-[50px] translate-y-[10px] z-50 overflow-auto scrollbar-none">

                        <CustomDropdown>
                            <div className="flex p-[10px]">
                                <CustomCheckbox
                                    id="select-all"
                                    checked={isAllSelected}
                                    indeterminate={isIndeterminate}
                                    label="Select All"
                                    onChange={handleSelectAll}
                                />
                            </div>
                            {columns.map((col, index) => {
                                return (
                                    <div
                                        key={index}
                                        className="flex gap-[8px] p-[10px]"
                                    >
                                        <CustomCheckbox
                                            id={index.toString()}
                                            checked={selectedColumns.includes(
                                                index
                                            )}
                                            label={col.label}
                                            onChange={() =>
                                                handleSelectItem(index)
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </CustomDropdown>
                    </div>
                }
            />
        </div>
    );
}


function TableBody({ orderedColumns, setColumnOrder }: { orderedColumns: configType['columns']; setColumnOrder: React.Dispatch<React.SetStateAction<number[]>> }) {
    const { config } = useContext(Config);
    const { api, rowSelection, rowActions, pageSize = defaultPageSize } = config;
    // columns is derived from orderedColumns passed from TableContainer; fallback to config.columns
    const columns = orderedColumns && orderedColumns.length > 0 ? orderedColumns : config.columns;
    const dragIndex = useRef<number | null>(null);
    const { tableDetails, nestedLoading, setNestedLoading, params, setParams } = useContext(TableDetails);
    const tableData = tableDetails.data || [];

    const [displayedData, setDisplayedData] = useState<TableDataType[]>([]);
    const [tableOrder, setTableOrder] = useState<{
        column: string;
        order: "asc" | "desc";
    }>({ column: "", order: "desc" });

    const startIndex = tableDetails.currentPage * pageSize;
    const endIndex = startIndex + pageSize;

    const { selectedColumns } =
        useContext<columnFilterConfigType>(ColumnFilterConfig);
    const { selectedRow, setSelectedRow } = useContext(SelectedRow);
    if (!Array.isArray(tableData))
        throw new Error("Data must me in Array format");
    const allItemsCount: number = tableData.length || 0;
    const isAllSelected = selectedRow.length === allItemsCount;
    const isIndeterminate = selectedRow.length > 0 && !isAllSelected;

    useEffect(() => {
        // Update displayedData whenever tableDetails changes. Do not
        // toggle nestedLoading here — TableContainer owns nestedLoading for
        // API-driven loads. This prevents premature hiding of the loader.
        if (!api?.list) {
            setDisplayedData(tableData.slice(startIndex, endIndex));
        } else {
            setDisplayedData(tableData);
        }
    }, [tableDetails]);

    // If no sort column is set yet, initialize tableOrder to the first sortable column
    // and apply sorting once data is available.
    useEffect(() => {
        if (displayedData.length === 0) return;
        if (tableOrder && tableOrder.column) return;
        const firstSortable = columns?.find((c: any) => c.isSortable);
        if (firstSortable) {
            const colKey = firstSortable.key;
            const defaultOrder: "asc" | "desc" = tableOrder.order || "desc";
            setTableOrder({ column: colKey, order: defaultOrder });
            setDisplayedData(naturalSort(displayedData, defaultOrder, colKey));
        }
    }, [displayedData, columns]);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRow(tableData.map((_, index) => index));
        } else {
            setSelectedRow([]);
        }
    };

    const handleSelectItem = (id: number) => {
        setSelectedRow((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    const handleSort = (column: string) => {
        // compute next order first (avoid using stale state after setState)
        let nextOrder: "asc" | "desc";
        if (tableOrder.column === column) {
            nextOrder = tableOrder.order === "asc" ? "desc" : "asc";
        } else {
            // default order when switching to a new column
            nextOrder = "desc";
        }
        setTableOrder({ column, order: nextOrder });
        // apply sorting using the computed order immediately
        setDisplayedData(naturalSort(displayedData, nextOrder, column));
    };

    return (
        <>{(config.showNestedLoading && nestedLoading) ? <CustomTableSkelton /> : <>
            <div
                className="overflow-x-auto border-b-[1px] border-[#E9EAEB] scrollbar-thin scrollbar-thumb-[#D5D7DA] scrollbar-track-transparent"
                style={
                    displayedData.length > 0
                        ? {
                            height: config.table?.height,
                            maxHeight: config.table?.maxHeight,
                            width: config.table?.width,
                            maxWidth: config.table?.maxWidth,
                        }
                        : undefined
                }
            >
                <table className="table-auto min-w-max w-full">
                    <thead className="text-[12px] bg-[#FAFAFA] text-[#535862] sticky top-0 z-20">
                        <tr className="relative h-[44px] border-b-[1px] border-[#E9EAEB]">
                            {/* checkbox */}
                            {rowSelection && selectedColumns.length > 0 && (
                                <th className="z-10 sm:sticky left-0 bg-[#FAFAFA] w-fit px-[10px] py-[12px] font-[500]">
                                    <div className="flex items-center gap-[12px] whitespace-nowrap">
                                        <CustomCheckbox
                                            id="selectAll"
                                            label=""
                                            checked={isAllSelected}
                                            indeterminate={isIndeterminate}
                                            onChange={handleSelectAll}
                                        />
                                    </div>
                                </th>
                            )}

                            {/* main data */}
                            {columns &&
                                columns.map((col, orderIdx) => {
                                    // find original index in config.columns to check selectedColumns
                                    const originalIndex = config.columns?.findIndex((c) => c.key === col.key);
                                    if (!selectedColumns.includes(originalIndex)) return null;
                                    return (
                                        <th
                                            // enable native drag only when config.dragableColumn is true
                                            draggable={!!config.dragableColumn}
                                            onDragStart={(e) => {
                                                if (!config.dragableColumn) return;
                                                dragIndex.current = orderIdx;
                                                try {
                                                    e.dataTransfer?.setData('text/plain', String(orderIdx));
                                                    e.dataTransfer!.effectAllowed = 'move';
                                                } catch (err) {
                                                    /* ignore */
                                                }
                                            }}
                                            onDragOver={(e) => {
                                                if (!config.dragableColumn) return;
                                                e.preventDefault();
                                                try { e.dataTransfer!.dropEffect = 'move'; } catch (err) { }
                                            }}
                                            onDrop={(e) => {
                                                if (!config.dragableColumn) return;
                                                e.preventDefault();
                                                const from = dragIndex.current;
                                                const to = orderIdx;
                                                if (from == null) return;
                                                if (from === to) {
                                                    dragIndex.current = null;
                                                    return;
                                                }
                                                setColumnOrder((prev) => {
                                                    const next = [...prev];
                                                    const item = next.splice(from, 1)[0];
                                                    next.splice(to, 0, item);
                                                    return next;
                                                });
                                                dragIndex.current = null;
                                            }}
                                            className={`${col.width ? `w-[${col.width}px]` : ""} ${col.sticky ? "z-20 md:sticky" : ""} ${col.sticky === "left" ? "left-0" : ""} ${col.sticky === "right" ? "right-0" : ""} px-[24px] py-[12px] bg-[#FAFAFA] font-[500] whitespace-nowrap ${config.dragableColumn ? '' : ''}`}
                                            key={col.key}
                                        >
                                            <div className="flex items-center gap-[4px] capitalize">
                                                {col.label}{" "}
                                                {col.filter && (
                                                    <FilterTableHeader
                                                        column={col?.filter?.filterkey || col.key}
                                                        dimensions={col.filter}
                                                        filterConfig={col.filter}
                                                    >
                                                        {col.filter.render
                                                            ? col.filter.render(tableData, api?.search)
                                                            : null}
                                                    </FilterTableHeader>
                                                )}
                                                {col.isSortable && (
                                                    <Icon
                                                        className="cursor-pointer"
                                                        icon={
                                                            tableOrder.order ===
                                                                "asc" &&
                                                                tableOrder.column ===
                                                                col.key
                                                                ? "mdi-light:arrow-up"
                                                                : "mdi-light:arrow-down"
                                                        }
                                                        width={16}
                                                        onClick={() =>
                                                            handleSort(
                                                                col.key
                                                            )
                                                        }
                                                    />
                                                )}
                                                {col.filterStatus?.enabled && (
                                                    <div className="flex flex-col gap-0 ml-1">
                                                        <Icon
                                                            icon="ep:arrow-up"
                                                            width={12}
                                                            height={12}
                                                            className={`cursor-pointer transition-colors ${params[col.key] === true
                                                                ? "text-blue-600"
                                                                : "text-gray-400 hover:text-gray-600"
                                                                }`}
                                                            onClick={() => {
                                                                // Toggle logic: if already true, clear it. Else set true.
                                                                const newVal = params[col.key] === true ? undefined : true;
                                                                // We update params, triggering checkForData.
                                                                // Removing 'page' reset might be needed? Usually filter change resets page.
                                                                // Let's reset page to 1 for safety.
                                                                const newParams = { ...params, [col.key]: newVal };
                                                                if (newVal === undefined) delete newParams[col.key];
                                                                setParams({ ...newParams, page: 1 }, { replace: true });
                                                            }}
                                                        />
                                                        <Icon
                                                            icon="ep:arrow-down"
                                                            width={12}
                                                            height={12}
                                                            className={`cursor-pointer transition-colors ${params[col.key] === false
                                                                ? "text-blue-600"
                                                                : "text-gray-400 hover:text-gray-600"
                                                                }`}
                                                            onClick={() => {
                                                                const newVal = params[col.key] === false ? undefined : false;
                                                                const newParams = { ...params, [col.key]: newVal };
                                                                if (newVal === undefined) delete newParams[col.key];
                                                                setParams({ ...newParams, page: 1 }, { replace: true });
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}

                            {/* actions */}
                            {rowActions && selectedColumns.length > 0 && (
                                <th
                                    className="sm:sticky right-0 z-[10] px-[24px] py-[12px] font-[500] text-left border-[#E9EAEB] bg-[#FAFAFA] whitespace-nowrap before:content-[''] before:absolute before:top-0 before:left-0 before:w-[1px] before:h-full before:bg-[#E9EAEB]"
                                //  className="sticky top-0 sm:right-0 z-10 px-[24px] py-[12px] font-[500] text-left border-l-[1px] border-[#E9EAEB] bg-[#FAFAFA]"
                                >
                                    <div className="flex items-center gap-[4px] whitespace-nowrap">
                                        Actions
                                    </div>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="text-[14px] bg-white text-[#535862]">
                        {displayedData.length > 0 &&
                            // repeat row 10 times
                            displayedData.map((row, index) => {
                                const rowBgColor = config.rowColor ? config.rowColor(row) : undefined;
                                return (
                                    <tr
                                        className="border-b-[1px] border-[#E9EAEB] capitalize"
                                        key={index}
                                        style={{
                                            backgroundColor: rowBgColor
                                        }}
                                    >
                                        {rowSelection &&
                                            selectedColumns.length > 0 && (
                                                <td className="sm:sticky left-0 px-[10px] py-[12px]" style={{ backgroundColor: rowBgColor || 'white' }}>
                                                    <div className="flex items-center gap-[12px] font-[500]">
                                                        <CustomCheckbox
                                                            id={"check" + index}
                                                            label=""
                                                            checked={selectedRow.includes(
                                                                index
                                                            )}
                                                            onChange={() =>
                                                                handleSelectItem(
                                                                    index
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            )}

                                        {columns?.map((col: configType["columns"][0], orderIdx) => {
                                            const originalIndex = config.columns.findIndex((c) => c.key === col.key);
                                            if (!selectedColumns.includes(originalIndex)) return null;
                                            return (
                                                <td
                                                    key={col.key}
                                                    width={col.width}
                                                    className={`px-[24px] py-[12px] ${col.sticky ? "z-10 md:sticky" : ""} ${col.sticky === "left"
                                                        ? "left-0"
                                                        : ""
                                                        } ${col.sticky === "right"
                                                            ? "right-0"
                                                            : ""
                                                        }`}
                                                    style={{ backgroundColor: rowBgColor || 'white' }}
                                                >
                                                    {col.render ? (
                                                        col.render(row)
                                                    ) : (
                                                        <div className="flex items-center">
                                                            {row[col.key] || "-"}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}

                                        {rowActions &&
                                            selectedColumns.length > 0 && (
                                                <td
                                                    className="
                                            sm:sticky right-0 z-[10]
                                            px-[2px] py-[12px]
                                            border-[#E9EAEB]
                                            whitespace-nowrap
                                            before:content-[''] before:absolute before:top-0 before:left-0 before:w-[1px] before:h-full before:bg-[#E9EAEB]
                                            "
                                                    style={{ backgroundColor: rowBgColor || 'white' }}
                                                >
                                                    <div className="flex items-center gap-[10px]">
                                                        {rowActions.map(
                                                            (action, index) => (
                                                                <div key={index}>
                                                                    <IconWithLoading action={action} index={index} row={row} showLoading={action.showLoading} />
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                    </tr>
                                )
                            })}
                    </tbody>
                </table>
            </div>
            {displayedData.length <= 0 && (
                <div className="p-2 content-center text-center py-[12px] text-[24px] max-h-full min-h-[200px] text-primary">
                    No data available
                </div>
            )}
            {displayedData.length > 0 && selectedColumns?.length === 0 && (
                <div className="p-2 content-center text-center py-[12px] text-[24px] max-h-full min-h-[200px] text-primary">
                    No Column Selected
                </div>
            )}
        </>}

        </>
    );
}

function IconWithLoading({ action, index, row, showLoading }: { action: any; index: number; row: any; showLoading?: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    return (<> {isLoading && showLoading ? <div className="flex justify-center items-center"><Skeleton width={30} className="flex justify-center items-center ml-2" /></div> : <div
        key={index}
        onClick={async () => {
            if (action.onClick) {
                setIsLoading(true);
                await action.onClick(row);
                setIsLoading(false);
            }
        }}
        className="flex p-[10px] cursor-pointer text-[#5E5E5E] transition-all duration-200 ease-in-out hover:text-[#EA0A2A] hover:scale-110"
    >
        {action.icon
            ? <Icon
                key={index}
                icon={action.icon}
                width={20}
            />
            : <span>{action.label}</span>
        }
    </div>
    }</>)
}

// Filter Component for column near column name using icon button
function FilterTableHeader({
    column,
    dimensions,
    filterConfig,
    children,
}: {
    column: string;
    dimensions: {
        width?: number | string;
        height?: number | string;
        maxWidth?: number | string;
        maxHeight?: number | string;
    };
    filterConfig?: {
        options?: Array<{ value: string; label: string }>;
        onSearch?: (search: string) => Promise<Array<{ value: string; label: string }>> | Array<{ value: string; label: string }>;
        onSelect?: (selected: string | string[]) => void;
        isSingle?: boolean;
        selectedValue?: string;
    };
    children?: React.ReactNode;
}) {
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const { config } = useContext(Config);
    const { tableDetails, setTableDetails, setNestedLoading, params, setParams } = useContext(TableDetails);
    const { api } = config;
    const [searchBarValue, setSearchBarValue] = useState("");
    const [filteredOptions, setFilteredOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const parentRef = useRef<HTMLDivElement>(null);
    const { filterState, setFilterState } = useContext(TableDetails); // Keep for compatibility if needed, but we rely on params
    const selectedRef = useRef<string | string[] | null>(null);

    useEffect(() => {
        if (filterConfig?.options) {
            setFilteredOptions(filterConfig.options);
        } else {
            setFilteredOptions([]);
        }
    }, [filterConfig?.options]);

    // keep selection in sync with global params (so selection survives table refresh)
    useEffect(() => {
        try {
            const val = params[column];
            if (val == null || (typeof val === 'string' && val === "")) {
                selectedRef.current = null;
                setSelectedValues([]);
            } else if (Array.isArray(val)) {
                selectedRef.current = val;
                setSelectedValues(val);
            } else {
                selectedRef.current = String(val);
                setSelectedValues([String(val)]);
            }
        } catch (err) {
            // ignore
        }
    }, [params, column]);

    useEffect(() => {
        // Local search filtering if no onSearch handler
        if (!filterConfig?.onSearch && filterConfig?.options) {
            if (searchBarValue.trim() === "") {
                setFilteredOptions(filterConfig.options);
            } else {
                const lower = searchBarValue.toLowerCase();
                setFilteredOptions(
                    filterConfig.options.filter(
                        opt => opt.label.toLowerCase().includes(lower)
                    )
                );
            }
        }
    }, [searchBarValue, filterConfig?.options, filterConfig?.onSearch]);

    async function handleSearch() {
        if (filterConfig?.onSearch) {
            const result = await filterConfig.onSearch(searchBarValue);
            setFilteredOptions(result);
        }
        // If no onSearch, local filtering is handled by useEffect above
    }

    async function handleSelect(value: string) {
        const isSingle = filterConfig?.isSingle !== undefined ? filterConfig.isSingle : true;
        if (isSingle) {
            // If already selected, deselect (clear filter)
            const selectedValue = filterConfig?.selectedValue;
            // Note: selectedValue comes from parent prop, usually synced with params? 
            // The parent `TableBody` passes `filterConfig` which comes from `col.filter`.
            // But `col.filter` is static config?
            // Actually `TableBody` passes `selectedValue: warehouseId` in `vehicle/page.tsx`.
            // But here we want to modify the global state.

            // Check if currently selected in our local state (synced with params)
            const isCurrentlySelected = selectedValues.includes(value);

            if (filterConfig?.onSelect) {
                if (isCurrentlySelected) {
                    filterConfig.onSelect(""); // Deselect callback
                    // Update global params
                    setParams({
                        ...params,
                        [column]: undefined,
                        page: 1
                    });
                }
                else {
                    filterConfig.onSelect(value);

                    // Exclusive Mode Logic: List API
                    const isListMode = params._filterMode === 'list';
                    // If switching mode, start fresh (clears FilterBy keys and Search)
                    // If keeping mode, keep existing params (allows multiple column filters)
                    const baseParams = isListMode ? { ...params } : { page: 1, _filterMode: 'list' };

                    // Always replace history
                    setParams({
                        ...baseParams,
                        [column]: value,
                        page: 1
                    }, { replace: true });
                }
            }
            setShowFilterDropdown(false);
        } else {
            let updated: string[];
            if (selectedValues.includes(value)) {
                updated = selectedValues.filter((v) => v !== value);
            } else {
                updated = [...selectedValues, value];
            }
            // For multi-select, we only update local state (buffer)
            // Apply button will commit changes
            setSelectedValues(updated);
        }
    }

    async function applyFilter() {
        if (!filterConfig?.onSelect) return;
        const updated = selectedValues;
        filterConfig.onSelect(updated);

        // Exclusive Mode Logic: List API
        const isListMode = params._filterMode === 'list';
        // If switching mode, start fresh (clears FilterBy keys and Search)
        const baseParams = isListMode ? { ...params } : { page: 1, _filterMode: 'list' };

        // Always replace history
        setParams({
            ...baseParams,
            [column]: updated.length > 0 ? updated : undefined,
            page: 1
        }, { replace: true });
        setShowFilterDropdown(false);
    }

    async function clearFilter() {
        if (!filterConfig?.onSelect) return;
        const updated: string[] = [];
        filterConfig.onSelect(updated);
        setSelectedValues([]);

        // Exclusive Mode Logic: List API
        const isListMode = params._filterMode === 'list';
        // If switching mode, start fresh
        const baseParams = isListMode ? { ...params } : { page: 1, _filterMode: 'list' };

        // Always replace history
        setParams({
            ...baseParams,
            [column]: undefined,
            page: 1
        }, { replace: true });
        setShowFilterDropdown(false);
    }
    // function handleSelect(value: string) {
    //         const isSingle = filterConfig?.isSingle !== undefined ? filterConfig.isSingle : true;
    //         if (isSingle) {
    //             // If already selected, deselect (clear filter)
    //             const selectedValue = filterConfig?.selectedValue;
    //             if (filterConfig?.onSelect) {
    //                 if (selectedValue === value) {
    //                     filterConfig.onSelect(""); // Deselect
    //                 } else {
    //                     filterConfig.onSelect(value);
    //                 }
    //             }
    //             setShowFilterDropdown(false);
    //         } else {
    //             setSelectedValues((prev) => {
    //                 if (prev.includes(value)) {
    //                     // remove
    //                     const updated = prev.filter((v) => v !== value);
    //                     if (filterConfig?.onSelect) filterConfig.onSelect(updated);
    //                     return updated;
    //                 } else {
    //                     // add
    //                     const updated = [...prev, value];
    //                     if (filterConfig?.onSelect) filterConfig.onSelect(updated);
    //                     return updated;
    //                 }
    //             });
    //         }
    //     }

    return (
        <DismissibleDropdown
            isOpen={showFilterDropdown}
            setIsOpen={setShowFilterDropdown}
            button={
                <div ref={parentRef} className="flex item-center">
                    <Icon
                        icon="circum:filter"
                        width={16}
                        className={selectedValues.length > 0 ? "text-red-600" : ""}
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    />
                </div>
            }
            dropdown={
                <FilterDropdown
                    anchorRef={parentRef as React.RefObject<HTMLDivElement>}
                    align="center"
                    dimensions={dimensions}
                    searchBarValue={searchBarValue}
                    setSearchBarValue={setSearchBarValue}
                    onEnterPress={() => handleSearch()}
                >
                    {children ? (
                        <div>{children}</div>
                    ) : filteredOptions.length > 0 ? (
                        <>
                            <div className="mb-2">
                                {filterConfig?.isSingle !== false ? (
                                    <FilterOptionList
                                        options={filteredOptions}
                                        selectedValue={selectedValues[0] || ""}
                                        onSelect={handleSelect}
                                    />) : (
                                    <>
                                        {/* Select All Option */}
                                        {filteredOptions.length > 0 && (
                                            <div
                                                className="font-normal text-[14px] text-[#181D27] flex gap-x-[8px] py-[10px] px-[14px] hover:bg-[#FAFAFA] cursor-pointer border-b border-gray-100 mb-1"
                                            >
                                                <CustomCheckbox
                                                    id="select-all-filter-options"
                                                    checked={filteredOptions.every(o => selectedValues.includes(String(o.value)))}
                                                    label="Select All"
                                                    onChange={() => {
                                                        const allVisibleSelected = filteredOptions.every(o => selectedValues.includes(String(o.value)));
                                                        if (allVisibleSelected) {
                                                            // Deselect all visible
                                                            const visibleValues = new Set(filteredOptions.map(o => String(o.value)));
                                                            setSelectedValues(prev => prev.filter(v => !visibleValues.has(v)));
                                                        } else {
                                                            // Select all visible (keep existing invisible ones)
                                                            const visibleValues = filteredOptions.map(o => String(o.value));
                                                            const newSet = new Set([...selectedValues, ...visibleValues]);
                                                            setSelectedValues(Array.from(newSet));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {filteredOptions.map((option, idx) => (
                                            <div
                                                key={String(option.value) || idx}
                                                className="h-full font-normal text-[14px] text-[#181D27] flex gap-x-[8px] py-[10px] px-[14px] hover:bg-[#FAFAFA] cursor-pointer"
                                            >
                                                <CustomCheckbox
                                                    id={String(option.value)}
                                                    checked={selectedValues.includes(String(option.value))}
                                                    label={option.label}
                                                    onChange={() => handleSelect(String(option.value))}
                                                />
                                            </div>
                                        ))}
                                    </>)}
                            </div>
                            {filterConfig?.isSingle === false && (
                                <div className="flex justify-between items-center p-2 border-t border-gray-200 mt-2 bg-white sticky bottom-0">
                                    <button
                                        onClick={clearFilter}
                                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-200 cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={applyFilter}
                                        className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-gray-600 text-sm">
                            {filterConfig?.isSingle === false && filterConfig?.options && filterConfig.options.length > 0
                                ? filteredOptions.length === 0
                                    ? "No matching options"
                                    : null
                                : "No options available"
                            }
                        </div>
                    )}
                </FilterDropdown>
            }
        />
    );
}

function TableFooter() {
    const { config } = useContext(Config);
    const { api, footer, pageSize = defaultPageSize } = config;
    const { tableDetails, nestedLoading, setTableDetails, setNestedLoading, searchState, filterState, params, setParams } = useContext(TableDetails);
    const { selectedRow } = useContext(SelectedRow);
    const { selectedColumns } = useContext<columnFilterConfigType>(ColumnFilterConfig);
    const cPage = tableDetails.currentPage || 0;
    const totalPages = tableDetails.total || 1;

    async function handlePageChange(pageNo: number) {
        if (pageNo < 0 || pageNo > totalPages - 1) return;

        // Update params with new page number (1-indexed)
        // TableContainer's useEffect will handle the data fetching
        setParams({
            ...params,
            page: pageNo + 1
        });
    }

    // Floating Info Bar State
    const [showFloatingBar, setShowFloatingBar] = useState(
        !!config.floatingInfoBar?.showByDefault
    );

    // Show bar if showSelectedRow and rows are selected
    useEffect(() => {
        if (config.floatingInfoBar?.showSelectedRow && selectedRow.length > 0) {
            setShowFloatingBar(true);
        } else if (!config.floatingInfoBar?.showByDefault) {
            setShowFloatingBar(false);
        }
    }, [selectedRow, config.floatingInfoBar]);

    // Move nodeRef outside to prevent recreation and flickering
    const floatingBarNodeRef = useRef(null);

    // Memoize visible buttons to avoid recalculation
    const visibleButtons = useMemo(() => {
        if (!config.floatingInfoBar?.buttons) return [];

        return config.floatingInfoBar.buttons.filter(button => {
            // Check showOnSelect condition
            if (button.showOnSelect && selectedRow.length === 0) return false;

            // Check showWhen condition
            if (button.showWhen && !button.showWhen(tableDetails?.data || [], selectedRow, selectedColumns)) return false;

            return true;
        });
    }, [config.floatingInfoBar?.buttons, selectedRow, tableDetails?.data, selectedColumns]);

    const FloatingInfoBar = useCallback(() => {
        if (!config.floatingInfoBar || !showFloatingBar || nestedLoading) return null;

        return (
            <Draggable nodeRef={floatingBarNodeRef}>
                <div
                    ref={floatingBarNodeRef}
                    className={`flex justify-between items-center gap-6 w-fit p-4 z-[70] cursor-grab text-white bg-[#00000080] backdrop-blur-xl rounded-[40px] transition-all ease-in-out ${footer ? 'mb-20' : ''}`}
                >
                    <span onClick={() => config?.floatingInfoBar?.rowSelectionOnClick && config.floatingInfoBar.rowSelectionOnClick(tableDetails?.data || [], selectedRow, selectedColumns)}>selected {selectedRow.length}</span>
                    {visibleButtons.length > 0 && (
                        <span className="flex gap-[18px]">
                            {visibleButtons.map((button, index) => (
                                <span
                                    key={`${button.label}-${index}`}
                                    className={`cursor-pointer bg-[#FDFDFD33] shadow-[0px_1px_2px_0px_#0A0D120D] py-2 px-3 rounded-3xl flex items-center gap-2 ${button.labelTw || ''
                                        }`}
                                    onClick={() => button.onClick?.(tableDetails?.data || [], selectedRow, selectedColumns)}
                                >
                                    {button.icon && (
                                        <span className="w-5 h-5">
                                            <Icon
                                                icon={button.icon}
                                                className="transition-all duration-200 ease-in-out"
                                                width={button.iconWidth ? parseInt(button.iconWidth) : 20}
                                            />
                                        </span>
                                    )}
                                    <span>{button.label}</span>
                                </span>
                            ))}
                        </span>
                    )}
                    <span className="rounded-full py-2 px-3 bg-[#FDFDFD33] bg-opacity-30 flex items-center justify-center cursor-pointer">
                        <span className="w-5 h-5">
                            <Icon icon="mdi:close" className="transition-all duration-200 ease-in-out" width={20} onClick={() => setShowFloatingBar(false)} />
                        </span>
                    </span>
                </div>
            </Draggable>
        );
    }, [config.floatingInfoBar, showFloatingBar, nestedLoading, selectedRow.length, visibleButtons, footer]);

    return (<div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 ml-2 flex justify-center bottom-1">
            <FloatingInfoBar />
        </div>
        {footer && (
            <div className="px-6 py-3 flex justify-between items-center text-[#414651]">
                <div>
                    {footer?.nextPrevBtn && (
                        <BorderIconButton
                            icon="lucide:arrow-left"
                            iconWidth={20}
                            label="Previous"
                            labelTw="text-[14px] font-semibold hidden sm:block select-none"
                            disabled={cPage === 0}
                            onClick={() => handlePageChange(cPage - 1)}
                        />
                    )}
                </div>
                <div>
                    {footer?.pagination && (
                        <div className="gap-0.5 text-[14px] hidden md:flex select-none">
                            {(() => {
                                // Build pagination elements based on totalPages and current page (cPage)
                                if (totalPages <= 6) {
                                    return (
                                        <>
                                            {[...Array(totalPages)].map((_, index) => (
                                                <PaginationBtn
                                                    key={index}
                                                    label={(index + 1).toString()}
                                                    isActive={index === cPage}
                                                    onClick={() => handlePageChange(index)}
                                                />
                                            ))}
                                        </>
                                    );
                                }

                                // totalPages > 6: show smart pagination
                                const elems: (number | string)[] = [];

                                // If near the start, show first up to five pages then ellipsis + last
                                if (cPage <= 2) {
                                    const end = Math.min(totalPages - 1, 4); // pages 0..4 (1..5)
                                    for (let i = 0; i <= end; i++) elems.push(i);
                                    if (end < totalPages - 1) elems.push("...", totalPages - 1);
                                }
                                // If near the end, show first, ellipsis, then last up to five pages
                                else if (cPage >= totalPages - 3) {
                                    const start = Math.max(0, totalPages - 5); // show last 5 pages
                                    elems.push(0);
                                    if (start > 1) elems.push("...");
                                    for (let i = start; i <= totalPages - 1; i++) elems.push(i);
                                }
                                // Middle: show first page, ellipsis, two before/after current, ellipsis, last page
                                else {
                                    elems.push(0, "...");
                                    const start = Math.max(0, cPage - 2);
                                    const end = Math.min(totalPages - 1, cPage + 2);
                                    for (let i = start; i <= end; i++) elems.push(i);
                                    elems.push("...", totalPages - 1);
                                }

                                return (
                                    <>
                                        {elems.map((p, idx) =>
                                            typeof p === "string" ? (
                                                <PaginationBtn key={`e-${idx}`} label={p} isActive={false} />
                                            ) : (
                                                <PaginationBtn
                                                    key={p}
                                                    label={(p + 1).toString()}
                                                    isActive={p === cPage}
                                                    onClick={() => handlePageChange(p)}
                                                />
                                            )
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
                <div>
                    {footer?.nextPrevBtn && (
                        <BorderIconButton
                            trailingIcon="lucide:arrow-right"
                            iconWidth={20}
                            label="Next"
                            labelTw="text-[14px] font-semibold hidden sm:block select-none"
                            disabled={cPage === totalPages - 1}
                            onClick={() => handlePageChange(cPage + 1)}
                        />
                    )}
                </div>
            </div>
        )}
    </div>
    );
}

function PaginationBtn({
    label,
    isActive,
    onClick,
}: {
    label: string;
    isActive: boolean;
    onClick?: () => void;
}) {
    return (
        <div
            className={`min-w-[40px] h-[40px] rounded-[8px] p-[12px] flex items-center justify-center ${label === '...' ? '' : 'cursor-pointer'} ${isActive
                ? "bg-[#FFF0F2] text-[#EA0A2A]"
                : "bg-tranparent text-[#717680]"
                }`}
            onClick={onClick}
        >
            {label}
        </div>
    );
}

export function FilterOptionList({
    options,
    selectedValue,
    onSelect
}: {
    options: Array<{ value: string; label: string }>;
    selectedValue: string;
    onSelect: (value: string) => void;
}) {
    return (
        <div className={selectedValue ? "pt-[35px]" : ""}>

            {options.map(opt => (
                <div
                    key={opt.value}
                    className={`w-full font-normal text-[14px] text-[#181D27] flex gap-x-[8px] py-[10px] px-[14px] hover:bg-[#FAFAFA] cursor-pointer ${selectedValue === opt.value ? 'absolute top-[55px] bg-gray-100 font-semibold mb-[20px]' : ''}`}
                    onClick={() => {
                        onSelect(selectedValue === opt.value ? "" : opt.value);
                    }}
                >
                    <span className="truncate">
                        {opt.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

// FilterBy Component for global table filtering (Top Left Corner of Table) - dropdown near search bar
function FilterBy() {
    const { config } = useContext(Config);
    const { tableDetails, setTableDetails, nestedLoading, setNestedLoading, setFilterState, initialTableData, params, setParams } = useContext(TableDetails);
    const [showDropdown, setShowDropdown] = useState(false);
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const [searchBarValue, setSearchBarValue] = useState("");
    // filters can be single string values or arrays for multi-select fields
    const [filters, setFilters] = useState<Record<string, string | string[]>>({});
    const [appliedFilters, setAppliedFilters] = useState(false);
    const hasCustomRenderer = typeof config.header?.filterRenderer === "function";
    const [customPayload, setCustomPayload] = useState<Record<string, string | number | null | (string | number)[]>>({});
    const [isApplyingCustom, setIsApplyingCustom] = useState(false);
    const [isClearingCustom, setIsClearingCustom] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    // Removed router and searchParams as we use params from useHiddenHistory

    useEffect(() => {
        // Strict Mode Check: If params says we are NOT in 'filterBy' mode (and we have a mode set),
        // we must clear our local state to avoid showing "Active Filters" from other modes or stale state.
        if (params._filterMode && params._filterMode !== 'filterBy') {
            setFilters({});
            setCustomPayload({});
            setAppliedFilters(false);
            setFilterState({ applied: false, payload: {} });
            setIsInitialized(true);
            return;
        }

        // Sync local state from global params (e.g. on load or back button)
        // Parse params into filters/customPayload
        const paramsObj: Record<string, any> = {};
        // params from context are already an object. 
        // We need to parse comma-separated strings back to arrays for UI
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (['page', 'pageSize', 'search', '_filterMode'].includes(key)) return; // distinct from filters

            if (typeof value === 'string' && value.includes(',')) {
                paramsObj[key] = value.split(',');
            } else if (value === 'all') {
                paramsObj[key] = 'all';
            } else {
                paramsObj[key] = value;
            }
        });

        if (hasCustomRenderer) {
            setCustomPayload(paramsObj);
        } else {
            const initialFilters: Record<string, string | string[]> = {};
            (config.header?.filterByFields || []).forEach((f: any) => {
                const val = paramsObj[f.key];
                if (val) {
                    initialFilters[f.key] = val;
                } else {
                    initialFilters[f.key] = f.isSingle === false ? [] : "";
                }
            });
            setFilters(initialFilters);
        }

        if (Object.keys(paramsObj).length > 0) {
            setAppliedFilters(true);
            setFilterState({
                applied: true,
                payload: toApiPayload(paramsObj)
            });
        } else {
            setAppliedFilters(false);
            setFilterState({ applied: false, payload: {} });
        }

        setIsInitialized(true);
    }, [params, hasCustomRenderer, config.header?.filterByFields]);

    // Removed URL sync effect as useHiddenHistory handles it (or we relying on hidden history)

    // initialize filters when fields change (only for built-in filterByFields)
    useEffect(() => {
        if (hasCustomRenderer) return;
        const initial: Record<string, string | string[]> = {};
        (config.header?.filterByFields || []).forEach((f: FilterField) => {
            initial[f.key] = f.isSingle === false ? [] : "";
        });
        setFilters(initial);
    }, [config.header?.filterByFields, hasCustomRenderer]);

    useEffect(() => {
        // This triggers as soon as hydration finishes
        // We can keep this if we want to force apply filters from params on init
        // BUT TableContainer already does checkData on mount/params change.
        // So this might be redundant or double-fetching?
        // Let's remove the redundancy. TableContainer handles data fetching.
        // This effect was ensuring UI sync with URL which we handle in the first useEffect now.
    }, [isInitialized, hasCustomRenderer]);

    const sourcePayload = hasCustomRenderer ? customPayload : filters;
    // Custom logic: if both from_date and to_date are set, count as 1 filter (not 2)
    const filterKeys = Object.keys(sourcePayload || {});
    let counted = new Set<string>();
    let count = 0;
    for (const k of filterKeys) {
        if (counted.has(k)) continue;
        const v = (sourcePayload as any)[k];
        const hasValue = Array.isArray(v)
            ? v.length > 0
            : String(v ?? '').trim().length > 0;
        if (!hasValue) continue;

        // Special case: from_date and to_date together count as 1
        if ((k === 'from_date' || k === 'to_date')) {
            const from = (sourcePayload as any)['from_date'];
            const to = (sourcePayload as any)['to_date'];
            const fromHas = from && String(from).trim().length > 0;
            const toHas = to && String(to).trim().length > 0;
            if (fromHas || toHas) {
                if (!counted.has('from_date') && !counted.has('to_date')) {
                    count += 1;
                    counted.add('from_date');
                    counted.add('to_date');
                }
            }
            continue;
        }

        // For built-in filters, respect applyWhen; custom renderer handles its own logic
        if (!hasCustomRenderer) {
            const field = (config.header?.filterByFields || []).find((f: FilterField) => f.key === k);
            try {
                if (field?.applyWhen && !field.applyWhen(filters)) continue;
            } catch (err) {
                continue;
            }
        }

        count += 1;
        counted.add(k);
    }
    const activeFilterCount = count;

    const toApiPayload = (payload: Record<string, any>) => {
        const payloadForApi: Record<string, string | number | null | any> = {};
        Object.keys(payload || {}).forEach((k) => {
            const v = payload[k];
            if (Array.isArray(v)) {
                payloadForApi[k] = v.length > 0 ? v.join(',') : "";
            } else {
                payloadForApi[k] = v as string;
            }
        });
        return payloadForApi;
    };
    const applyFilter = useCallback(async (overridingFilters?: Record<string, any>) => {
        const currentFilters = overridingFilters || filters;
        if (Object.keys(currentFilters).length === 0) return;

        setShowDropdown(false);
        const payloadForApi = toApiPayload(currentFilters);
        setFilterState({ applied: true, payload: payloadForApi });
        setAppliedFilters(true);

        // Update global params - this triggers data fetch in TableContainer
        // Exclusive Mode Logic: FilterBy API
        // Start fresh (clears Search and List filters)
        setParams({
            ...payloadForApi,
            page: 1,
            _filterMode: 'filterBy'
        }, { replace: true });
    }, [filters, params, setParams]);

    const applyCustomPayload = useCallback(async (payload?: Record<string, any>) => {
        const effectivePayload = payload || customPayload || {};
        if (Object.keys(effectivePayload || {}).length === 0) return;
        setIsApplyingCustom(true);
        try {
            const payloadForApi = toApiPayload(effectivePayload);
            setFilterState({ applied: true, payload: payloadForApi });
            setCustomPayload(effectivePayload);
            setAppliedFilters(true);
            setShowDropdown(false);

            // Update global params
            // Start fresh
            setParams({
                ...payloadForApi,
                page: 1,
                _filterMode: 'filterBy'
            }, { replace: true });
        } finally {
            setIsApplyingCustom(false);
        }
    }, [customPayload, params, setParams]);

    useEffect(() => {
        // Redundant sync effect removed.
    }, [isInitialized, hasCustomRenderer]);

    const clearAll = async () => {
        if (activeFilterCount === 0) return;

        // build cleared state 
        const cleared: Record<string, string | string[]> = {};
        (config.header?.filterByFields || []).forEach((f: FilterField) => {
            cleared[f.key] = f.isSingle === false ? [] : "";
        });
        setFilters(cleared);
        setAppliedFilters(false);
        try { setFilterState({ applied: false, payload: {} }); } catch (err) { }

        // Clear params (except page/size/search)
        // Actually we need to remove the filter keys from params.
        // Or set them to undefined.
        // We iterate current params and clear those that match filter keys?
        // Or better: we construct a new params object.
        // remove from params
        const newParams = { ...params };
        (config.header?.filterByFields || []).forEach((f: FilterField) => {
            delete newParams[f.key];
        });
        if (config.header?.filterRenderer) {
            // If custom renderer, we might not know keys easily unless we track them.
            // But we can just use the cleared customPayload logic if needed.
            // For now, assuming clearAll handles known fields.
        }

        // Smart History: clearing means we definitely had filters, so replace?
        // Or if user considers "No Filter" as a new state?
        // Let's use replace to minimize history clutter as requested.
        newParams.page = 1;
        // If we clear FilterBy, do we exit 'filterBy' mode?
        // Likely yes. Return to default? Or keep params but empty?
        // If we remove all keys, we are effectively in no mode.
        // If params has no mode, TableContainer defaults to 'list' (no filters).
        delete newParams._filterMode; // Reset mode

        setParams(newParams, { replace: true });
    };

    const clearAllCustom = async () => {
        if (activeFilterCount === 0) return;
        setIsClearingCustom(true);
        setCustomPayload({});
        setAppliedFilters(false);
        try { setFilterState({ applied: false, payload: {} }); } catch (err) { }

        // For custom filters, we assume all keys in customPayload are filters.
        const newParams = { ...params };
        Object.keys(customPayload).forEach(k => delete newParams[k]);
        newParams.page = 1;
        newParams._filterMode = undefined;

        setParams(newParams);
        setIsClearingCustom(false);
    };

    // Reset only local filter UI state (used when external actions like pagination change)
    const resetLocalFilters = () => {
        const cleared: Record<string, string | string[]> = {};
        (config.header?.filterByFields || []).forEach((f: FilterField) => {
            cleared[f.key] = f.isSingle === false ? [] : "";
        });
        setFilters(cleared);
        setCustomPayload({});
        setAppliedFilters(false);
    };

    // listen for global clear filter signal (e.g., page change) and reset local filters
    useEffect(() => {
        const handler = () => {
            try {
                resetLocalFilters();
                setShowDropdown(false);
            } catch (err) {
                // swallow errors from handler
                console.warn('Failed to reset filter UI state', err);
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('customTable:clearFilters', handler as EventListener);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('customTable:clearFilters', handler as EventListener);
            }
        };
    }, [config.header?.filterByFields]);

    return (
        <div className="relative">
            <DismissibleDropdown
                isOpen={showDropdown}
                setIsOpen={setShowDropdown}
                button={
                    <div ref={buttonRef}>
                        <div className="inline-flex items-center gap-2">
                            <BorderIconButton icon="lucide:filter" label={
                                <div className="flex gap-[5px] items-center">
                                    <span>Filter</span>
                                    <span>
                                        {activeFilterCount > 0 && (
                                            <span className="inline-flex text-sm items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-gray-800 rounded-full">{activeFilterCount}</span>
                                        )}
                                    </span>

                                </div>
                            } className="h-[34px]" />

                        </div>
                    </div>
                }
                dropdown={
                    <FilterDropdown
                        anchorRef={buttonRef}
                        showInternalSearch={false}
                        searchBarValue={searchBarValue}
                        setSearchBarValue={setSearchBarValue}
                        onEnterPress={applyFilter}
                        dimensions={{ width: 700 }}
                    >
                        {hasCustomRenderer && config.header?.filterRenderer ? (
                            <div className="p-4">
                                {config.header.filterRenderer({
                                    payload: customPayload,
                                    setPayload: setCustomPayload,
                                    submit: applyCustomPayload,
                                    clear: clearAllCustom,
                                    activeFilterCount,
                                    appliedFilters,
                                    close: () => setShowDropdown(false),
                                    isApplying: isApplyingCustom,
                                    isClearing: isClearingCustom,
                                })}
                            </div>
                        ) : (
                            <>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    {(config.header?.filterByFields || []).map((f: FilterField) => (
                                        <div key={f.key} className="flex flex-col gap-2">
                                            {/* Use the project's InputFields component for consistent UI */}
                                            <InputFields
                                                label={f.label || f.key}
                                                name={f.key}
                                                // pass array for multi-select fields, string for single
                                                value={filters[f.key] ?? (f.isSingle === false ? [] : "")}
                                                onChange={(e) => {
                                                    const ev = e as any;
                                                    const raw = ev && ev.target ? ev.target.value : e;
                                                    if (f.isSingle === false) {
                                                        // ensure we store an array for multi-select
                                                        if (Array.isArray(raw)) {
                                                            setFilters(prev => ({ ...prev, [f.key]: raw }));
                                                        } else if (typeof raw === 'string' && raw.length === 0) {
                                                            setFilters(prev => ({ ...prev, [f.key]: [] }));
                                                        } else {
                                                            // try to coerce comma-separated string into array
                                                            const arr = typeof raw === 'string' ? raw.split(',').filter(Boolean) : [];
                                                            setFilters(prev => ({ ...prev, [f.key]: arr }));
                                                        }
                                                    } else {
                                                        setFilters(prev => ({ ...prev, [f.key]: String(raw) }));
                                                    }
                                                }}
                                                placeholder={f.placeholder}
                                                // map type (support dateChange)
                                                type={f.type === 'dateChange' ? 'dateChange' : f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : f.type === 'select' ? 'select' : 'text'}
                                                options={f.options}
                                                width="w-full"
                                                searchable={true}
                                                isSingle={typeof f.isSingle === 'boolean' ? f.isSingle : true}
                                                multiSelectChips={!!f.multiSelectChips}
                                                filters={filters}
                                                min={f.key === 'to_date' ? (filters.from_date as string) : f.minDate}
                                                {...(f.inputProps || {})}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 flex items-center justify-end gap-4">
                                    <SidebarBtn
                                        isActive={false}
                                        type="button"
                                        onClick={() => appliedFilters === false ? resetLocalFilters() : clearAll()}
                                        label="Clear All"
                                        buttonTw="px-3 py-2 h-9"
                                        disabled={activeFilterCount === 0}
                                        className="text-sm"
                                    />
                                    <SidebarBtn
                                        isActive={true}
                                        type="button"
                                        onClick={() => applyFilter()}
                                        label="Apply Filter"
                                        buttonTw={`px-4 py-2 h-9`}
                                        disabled={activeFilterCount === 0}
                                        className="text-sm"
                                    />
                                </div>
                            </>
                        )}
                    </FilterDropdown>
                }
            />
            {/* results summary below the filter button (show only when filters active) */}
            {appliedFilters && activeFilterCount > 0 && !nestedLoading && (
                <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">{(tableDetails?.totalRecords ? tableDetails?.totalRecords + " Results Found" : tableDetails?.data?.length ?? 0 + " Records in Current Page")}</span>
                    <button
                        type="button"
                        onClick={async () => {
                            if (hasCustomRenderer) {
                                await clearAllCustom();
                            } else {
                                await clearAll();
                            }
                            if (config.api?.list) {
                                try {
                                    setNestedLoading(true);
                                    const result = await config.api.list(
                                        1,
                                        config.pageSize || defaultPageSize
                                    );
                                    const resolvedResult =
                                        result instanceof Promise ? await result : result;
                                    const { data, total, currentPage } = resolvedResult;
                                    setTableDetails({
                                        data,
                                        total,
                                        currentPage: currentPage - 1,
                                        pageSize: config.pageSize || defaultPageSize,
                                    });
                                } finally {
                                    setTimeout(() => setNestedLoading(false), 0);
                                }
                            }
                        }}
                        className="ml-2 underline text-gray-600 cursor-pointer"
                    >
                        Clear Filter
                    </button>
                </div>
            )}
        </div>
    );
}
