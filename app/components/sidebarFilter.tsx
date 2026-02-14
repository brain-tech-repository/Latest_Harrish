import { Icon } from "@iconify-icon/react";
import { useState, useMemo, useEffect, memo } from "react";


export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterGroup {
    id: string; // unique identifier for the group (e.g., 'company', 'region')
    title: string;
    icon?: string;
    options: FilterOption[];
}

export interface SidebarFilterProps {
    filters: FilterGroup[];
    selectedValues: Record<string, string[]>; // filterId -> array of selected values
    onSelectionChange: (filterId: string, newValues: string[]) => void;
    onApply?: () => void;
    onReset?: () => void;
    dependencies?: Record<string, string>; // childId -> parentId
    className?: string;
}

const SidebarFilter = ({
    filters,
    selectedValues,
    onSelectionChange,
    onApply,
    onReset,
    dependencies = {},
    className = ""
}: SidebarFilterProps) => {
    // State to track which sections are expanded
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    // Initialize open sections (default all open or specific logic)
    useEffect(() => {
        const initialOpenState: Record<string, boolean> = {};
        filters.forEach(f => {
            // Persist existing state if re-rendering, otherwise default to true/false
            if (openSections[f.id] === undefined) {
                initialOpenState[f.id] = true; // Default open
            }
        });
        if (Object.keys(initialOpenState).length > 0) {
            setOpenSections(prev => ({ ...prev, ...initialOpenState }));
        }
    }, [filters]); // Run when filters change

    const toggleSection = (id: string) => {
        setOpenSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Determine which filters to show based on dependencies
    const visibleFilters = useMemo(() => {
        return filters.filter(filter => {
            const parentId = dependencies[filter.id];
            if (!parentId) return true; // No dependency, always show

            // Check if parent has any selection
            const parentSelection = selectedValues[parentId];
            return parentSelection && parentSelection.length > 0;
        });
    }, [filters, selectedValues, dependencies]);

    const handleSelectAll = (group: FilterGroup) => {
        const currentSelected = selectedValues[group.id] || [];
        const allValues = group.options.map(o => o.value);

        // If all are currently selected, deselect all. Otherwise, select all.
        // We consider "all selected" if the length matches.
        const isAllSelected = currentSelected.length === allValues.length && allValues.length > 0;

        if (isAllSelected) {
            onSelectionChange(group.id, []);
        } else {
            onSelectionChange(group.id, allValues);
        }
    };

    const handleSelectOne = (group: FilterGroup, value: string) => {
        const currentSelected = selectedValues[group.id] || [];
        const isSelected = currentSelected.includes(value);

        let newSelected: string[];
        if (isSelected) {
            newSelected = currentSelected.filter(v => v !== value);
        } else {
            newSelected = [...currentSelected, value];
        }
        onSelectionChange(group.id, newSelected);
    };

    const getSelectionState = (group: FilterGroup) => {
        const currentSelected = selectedValues[group.id] || [];
        const totalOptions = group.options.length;

        if (totalOptions === 0) return { checked: false, indeterminate: false };

        const selectedCount = currentSelected.length;
        const allSelected = selectedCount === totalOptions;
        const someSelected = selectedCount > 0 && selectedCount < totalOptions;

        return { checked: allSelected, indeterminate: someSelected };
    };

    // State to track search queries for each section
    const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

    const handleSearch = (id: string, value: string) => {
        setSearchQueries(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const totalSelectedCount = Object.values(selectedValues).filter(values => values && values.length > 0).length;

    return (
        <div className={`w-[280px] h-full flex flex-col border border-[#E9EAEB] rounded-[10px] bg-white ${className}`}>
            <div className="p-3 border-b border-[#E9EAEB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-[16px] font-medium text-[#101828]">Filter By</h1>
                    {totalSelectedCount > 0 && (
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                            {totalSelectedCount}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex-1 p-3 border-b border-[#E9EAEB] max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {visibleFilters.map((item) => {
                    const isOpen = openSections[item.id];
                    const { checked: isAllChecked, indeterminate: isIndeterminate } = getSelectionState(item);
                    const searchQuery = searchQueries[item.id] || "";

                    // Filter options based on search query
                    const filteredOptions = item.options.filter(opt =>
                        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    const selectedCount = (selectedValues[item.id] || []).length;

                    return (
                        <div key={item.id} className="mb-1">
                            {/* Header / Toggle */}
                            <div
                                className={`px-3 py-2 flex gap-2 items-center justify-between cursor-pointer rounded-lg ${isOpen ? "bg-[#F5F5F5]" : ""}`}
                                onClick={() => toggleSection(item.id)}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {item.icon && <Icon icon={item.icon} width={20} height={20} className="shrink-0" />}
                                    <h2 className="text-[14px] font-medium text-[#101828] capitalize truncate select-none" title={item.title}>
                                        {item.title}
                                    </h2>
                                    {selectedCount > 0 && (
                                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                                            {selectedCount}
                                        </span>
                                    )}
                                </div>
                                <Icon icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"} width={18} height={18} className="shrink-0 text-gray-500" />
                            </div>

                            {/* Options List */}
                            {isOpen && (
                                <div className="mt-1 pl-1">
                                    {/* Search Input */}
                                    <div className="px-2 py-1 mb-1">
                                        <div className="relative">
                                            <Icon icon="lucide:search" width={14} height={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => handleSearch(item.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Select All Option - Only show if no search or search matches "select all" concept (optional, keeping simple: always show if filtering allows, or maybe hide if filtered?) 
                                        Actually, "Select All" usually applies to *visible* options in complex filters, or all options. 
                                        For now, strictly keeping Select All functionality on the *group*, but maybe we should disable it if searching?
                                        Let's keep it but it applies to ALL items in the group as per original logic, or we can make it select filtered.
                                        Original logic uses `group.options.map`. 
                                        Let's keep original logic for now to avoid complexity, but maybe hide it if search is active?
                                        Or just leave it. Let's leave it.
                                    */}
                                    {searchQuery.length === 0 && (
                                        <div
                                            className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-50 rounded"
                                            onClick={() => handleSelectAll(item)}
                                        >
                                            <div className={`w-4 h-4 mr-2 rounded-sm border-2 flex items-center justify-center transition-colors ${(isAllChecked || isIndeterminate)
                                                ? "border-[#252B37]"
                                                : "border-gray-300"
                                                }`}>
                                                {isIndeterminate && (
                                                    <Icon icon="akar-icons:minus" width={10} height={10} />
                                                )}
                                                {isAllChecked && !isIndeterminate && (
                                                    <Icon icon="mingcute:check-fill" width={10} height={10} />
                                                )}
                                            </div>
                                            <span className="text-[14px] text-[#101828] select-none">Select All</span>
                                        </div>
                                    )}

                                    {/* Individual Options - Render Filtered List */}
                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                        {filteredOptions.length > 0 ? (
                                            filteredOptions.map((option) => {
                                                const isSelected = (selectedValues[item.id] || []).includes(option.value);
                                                return (
                                                    <div
                                                        key={option.value}
                                                        className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-50 rounded"
                                                        onClick={() => handleSelectOne(item, option.value)}
                                                    >
                                                        <div className={`w-4 h-4 mr-2 rounded-sm border-2 flex items-center justify-center transition-colors ${isSelected ? "border-[#252B37]" : "border-gray-300"
                                                            }`}>
                                                            {isSelected && (
                                                                <Icon icon="mingcute:check-fill" width={10} height={10} />
                                                            )}
                                                        </div>
                                                        <span className="text-[14px] text-[#101828] truncate select-none" title={option.label}>
                                                            {option.label}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="px-2 py-2 text-xs text-gray-500 text-center">
                                                No matches found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {visibleFilters.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                        No filters available
                    </div>
                )}
            </div>

            <div className="p-3 flex gap-2">
                <button
                    onClick={onReset}
                    className="flex-1 text-[14px] font-medium px-3 py-2.5 rounded-[8px] border border-[#E9EAEB] shadow-sm text-[#414651] hover:bg-gray-50 transition-colors"
                >
                    Reset
                </button>
                <button
                    onClick={onApply}
                    className="flex-1 text-[14px] font-medium px-3 py-2.5 rounded-[8px] border border-[#252B37] shadow-sm text-white bg-[#252B37] hover:bg-[#1a1e26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Apply Filter
                </button>
            </div>
        </div>
    );
}

export default memo(SidebarFilter);
