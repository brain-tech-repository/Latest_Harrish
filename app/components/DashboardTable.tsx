import React from 'react';
import { Table as TableIcon } from 'lucide-react';
import Loading from './Loading';

export interface DashboardTableColumn {
    header: string;
    accessor?: string;
    render?: (row: any, index: number) => React.ReactNode;
    width?: string | number;
    className?: string; // For header styling
    cellClassName?: string; // For cell styling
}

export interface DashboardTablePagination {
    currentPage: number;
    totalPages: number;
    totalRows: number;
    onPageChange: (page: number) => void;
}

interface DashboardTableProps {
    data: any[];
    columns: DashboardTableColumn[];
    isLoading: boolean;
    pagination?: DashboardTablePagination;
    onRowClick?: (row: any) => void;
    emptyMessage?: string;
}

const DashboardTable = ({
    data,
    columns,
    isLoading,
    pagination,
    onRowClick,
    emptyMessage = "No data available"
}: DashboardTableProps) => {

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center py-20 mt-5 h-80">
                <Loading style={{ zIndex: 70 }} />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center py-12 text-gray-500">
                <TableIcon size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">{emptyMessage}</p>
            </div>
        );
    }

    const { currentPage, totalPages, totalRows, onPageChange } = pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRows: data.length,
        onPageChange: () => { }
    };

    // Assuming default page size of 50 for display calculation if not provided
    const rowsPerPage = 50;
    const startIdx = ((currentPage - 1) * rowsPerPage) + 1;
    const endIdx = Math.min(currentPage * rowsPerPage, totalRows);

    return (
        <div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap ${col.className || ''}`}
                                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick && onRowClick(row)}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className={`px-4 py-3 text-sm text-gray-700 ${col.cellClassName || ''}`}>
                                        {col.render
                                            ? col.render(row, rowIdx)
                                            : col.accessor
                                                ? row[col.accessor] !== undefined && row[col.accessor] !== null
                                                    ? row[col.accessor]
                                                    : '-'
                                                : '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <div className="text-sm text-gray-600">
                        Showing {startIdx} - {endIdx} of {totalRows}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Prev
                        </button>

                        {/* Smart Pagination Logic from drag.tsx */}
                        {(() => {
                            const cPage = currentPage - 1; // Logic uses 0-based index for calculations usually, but drag.tsx mixed them. 
                            // Let's stick to 1-based for display and callbacks, consistent with drag.tsx logic which seemed to handle API 1-based.

                            // If 6 or fewer pages, show all
                            if (totalPages <= 6) {
                                return Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${currentPage === page
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ));
                            }

                            // More than 6 pages: smart pagination
                            const elems: (number | string)[] = [];

                            // Determine ranges
                            if (currentPage <= 3) {
                                // Start: 1, 2, 3, 4, 5 ... Last
                                const end = Math.min(5, totalPages);
                                for (let i = 1; i <= end; i++) elems.push(i);
                                if (end < totalPages) {
                                    if (end < totalPages - 1) elems.push("...");
                                    elems.push(totalPages);
                                }
                            } else if (currentPage >= totalPages - 2) {
                                // End: 1 ... Last-4, Last-3, Last-2, Last-1, Last
                                const start = Math.max(1, totalPages - 4);
                                elems.push(1);
                                if (start > 2) elems.push("...");
                                for (let i = start; i <= totalPages; i++) elems.push(i);
                            } else {
                                // Middle: 1 ... Curr-1, Curr, Curr+1 ... Last
                                elems.push(1);
                                if (currentPage - 1 > 2) elems.push("...");
                                const start = currentPage - 1;
                                const end = currentPage + 1;
                                for (let i = start; i <= end; i++) elems.push(i);
                                if (end < totalPages - 1) elems.push("...");
                                elems.push(totalPages);
                            }

                            return elems.map((p, idx) =>
                                typeof p === "string" ? (
                                    <span key={`e-${idx}`} className="px-2 text-gray-500">...</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => onPageChange(p)}
                                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${currentPage === p
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                )
                            );
                        })()}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardTable;
