"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import SidebarDashboardLayout from '@/app/components/sidebarDashboard';
import SidebarFilter, { FilterGroup } from '@/app/components/sidebarFilter';
import Column3DChart from '@/app/components/DashboardCharts/Column3DChart';
import Highcharts3DPie from '@/app/components/DashboardCharts/Highcharts3DPie';
import DualColumn3DChart from '@/app/components/DashboardCharts/DualColumn3DChart'; // Assuming you might use this
import MetricCard from '@/app/components/DashboardCharts/MetricCard'; // Assuming you might use this
import { Calendar, Download, Table as TableIcon, BarChart3, GripHorizontal } from 'lucide-react';
import axios from 'axios';
import { useSnackbar } from '@/app/services/snackbarContext';
import DashboardTable, { DashboardTableColumn } from '@/app/components/DashboardTable';
import toInternationalNumber from '@/app/(private)/utils/formatNumber';

const AdminDashboard = () => {
    const { showSnackbar } = useSnackbar();

    // --- State ---
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
    const [availableFilters, setAvailableFilters] = useState<FilterGroup[]>([]);
    const [viewType, setViewType] = useState<'chart' | 'table'>('chart');

    // Data Loading States
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
    const [isLoadingTable, setIsLoadingTable] = useState(false);

    // Data States
    const [dashboardData, setDashboardData] = useState<any>(null); // For Charts
    const [tableData, setTableData] = useState<any[]>([]); // For Table
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRows: 0
    });

    // --- API Configuration ---
    const textEndpoint = 'http://172.16.6.205:8001/api';
    const endpoints = {
        filters: `${textEndpoint}/attendance-filter`,
        dashboard: `${textEndpoint}/dashboard`,
        table: `${textEndpoint}/attendance-table`,
        export: `${textEndpoint}/attendance-export-xlsx`
    };

    // --- Initial Load (Filters) ---
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Example Fetch:
                // const response = await axios.get(endpoints.filters);
                // const transformed = transformFilters(response.data);

                // MOCK FILTERS
                const mockFilters: FilterGroup[] = [
                    {
                        id: 'projects',
                        title: 'Projects',
                        icon: 'mdi:briefcase',
                        options: [
                            { label: 'Kampala Infrastructure', value: '1' },
                            { label: 'Jinja Road Expansion', value: '2' },
                            { label: 'Entebbe Airport Rehab', value: '3' },
                        ]
                    },
                    {
                        id: 'salesman',
                        title: 'Salesman',
                        icon: 'mdi:account',
                        options: [
                            { label: 'John Doe', value: '101' },
                            { label: 'Jane Smith', value: '102' },
                            { label: 'Robert Fox', value: '103' },
                        ]
                    },
                    {
                        id: 'status',
                        title: 'Status',
                        icon: 'mdi:list-status',
                        options: [
                            { label: 'Active', value: 'Active' },
                            { label: 'Completed', value: 'Completed' },
                            { label: 'Pending', value: 'Pending' },
                        ]
                    }
                ];
                setAvailableFilters(mockFilters);
            } catch (error) {
                console.error("Failed to fetch filters", error);
                showSnackbar("Failed to load filters", "error");
            }
        };
        fetchFilters();
    }, []);


    // --- 1. Dashboard API Function (Charts) ---
    const fetchDashboardData = async () => {
        setIsLoadingDashboard(true);
        try {
            // 1. Construct Payload
            // Easily modify this object to send what your API expects
            const payload = {
                from_date: dateRange.start,
                to_date: dateRange.end,
                project_ids: selectedFilters['projects'] || [],
                salesman_ids: selectedFilters['salesman'] || [],
                status: selectedFilters['status']?.[0], // Example Single Select
                // Add more fields here as needed
                // search_type: 'quantity', 
                // display_quantity: 'with_free_good'
            };

            // 2. Make API Call
            // const response = await axios.post(endpoints.dashboard, payload);
            // const data = response.data;

            // 3. Simulate API Call & Response
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Expected Response Structure (Modify this to match your actual API response)
            const mockResponse = {
                metrics: {
                    total_sales: 1250000000,
                    active_projects: 12,
                    total_attendance: 450,
                    efficiency: 94
                },
                sales_by_project: [
                    { name: 'Kampala Infrastructure', value: 450000, color: '#6366f1' },
                    { name: 'Jinja Road Expansion', value: 320000, color: '#ec4899' },
                    { name: 'Entebbe Airport Rehab', value: 280000, color: '#10b981' },
                    { name: 'Northern Bypass', value: 150000, color: '#f59e0b' },
                ],
                category_distribution: [
                    { name: 'Consulting', value: 45, color: '#3b82f6' },
                    { name: 'Construction', value: 30, color: '#f59e0b' },
                    { name: 'Logistics', value: 25, color: '#8b5cf6' },
                ]
            };

            setDashboardData(mockResponse);

        } catch (err) {
            console.error(err);
            showSnackbar("Failed to load dashboard data", "error");
        } finally {
            setIsLoadingDashboard(false);
        }
    };


    // --- 2. Table API Function (Table) ---
    const fetchTableData = async (page: number = 1) => {
        setIsLoadingTable(true);
        try {
            // 1. Construct Payload
            const payload = {
                page: page,
                limit: 50, // Rows per page
                from_date: dateRange.start,
                to_date: dateRange.end,
                project_ids: selectedFilters['projects'] || [],
                salesman_ids: selectedFilters['salesman'] || [],
                status: selectedFilters['status']?.[0],
            };

            // 2. Make API Call
            // const response = await axios.post(`${endpoints.table}?page=${page}`, payload);
            // setTableData(response.data.data);
            // setPagination({ currentPage: response.data.current_page, ... });

            // 3. Simulate API Call & Response
            await new Promise(resolve => setTimeout(resolve, 800));

            const mockRows = Array.from({ length: 15 }, (_, i) => ({
                id: (page - 1) * 15 + i + 1,
                project: `Project ${['A', 'B', 'C'][i % 3]}`,
                salesman: ['John Doe', 'Jane Smith', 'Robert Fox'][i % 3],
                date: new Date().toISOString().split('T')[0],
                status: ['Active', 'Completed', 'Pending'][i % 3],
                amount: Math.floor(Math.random() * 1000000)
            }));

            setTableData(mockRows);
            setPagination({
                currentPage: page,
                totalPages: 5,
                totalRows: 75
            });

        } catch (err) {
            showSnackbar("Failed to load table data", "error");
        } finally {
            setIsLoadingTable(false);
        }
    };


    // --- Effect: Reload data on View or Filter Change ---
    // You can customize this to only load on "Apply" button if preferred
    useEffect(() => {
        // Only fetch if we have some data or it's initial load
        if (viewType === 'chart') {
            fetchDashboardData();
        } else {
            fetchTableData(1);
        }
    }, [viewType]); // Add dependencies here if you want auto-fetch on filter change: [viewType, dateRange, selectedFilters]


    // --- Table Column Configuration ---
    const columns: DashboardTableColumn[] = useMemo(() => [
        { header: 'S. No.', accessor: 'id', width: '80px' },
        { header: 'Project', accessor: 'project' },
        { header: 'Salesman', accessor: 'salesman' },
        { header: 'Date', accessor: 'date' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${row.status === 'Active' ? 'bg-green-100 text-green-700' :
                        row.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (row) => `UGX ${toInternationalNumber(row.amount)}`,
            cellClassName: 'font-mono text-right'
        },
    ], []);


    // --- Render Helpers ---

    const handleApplyFilters = () => {
        if (viewType === 'chart') fetchDashboardData();
        else fetchTableData(1);
    };

    const handleFilterChange = (filterId: string, newValues: string[]) => {
        setSelectedFilters(prev => ({ ...prev, [filterId]: newValues }));
    };

    const controls = (
        <div className="flex items-center gap-3">

            {/* <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50">
                <Calendar size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{dateRange.start} - {dateRange.end}</span>
            </div>

            <div className="h-6 w-px bg-gray-300 mx-1"></div> */}

            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                    onClick={() => setViewType('chart')}
                    className={`flex items-center gap-2 p-2 rounded-md transition-all ${viewType === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Chart View"
                >
                    <BarChart3 size={18} />
                    <span className="hidden md:inline">Dashboard</span>
                </button>
                <div className="w-px bg-gray-300 my-1"></div>
                <button
                    onClick={() => setViewType('table')}
                    className={`flex items-center gap-2 p-2 rounded-md transition-all ${viewType === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Table View"
                >
                    <TableIcon size={18} />
                    <span className="hidden md:inline">Table</span>
                </button>
            </div>

            {/* <button className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                <Download size={16} />
                <span className="text-sm font-medium">Export</span>
            </button> */}
        </div>
    );

    const sidebar = (
        <SidebarFilter
            filters={availableFilters}
            selectedValues={selectedFilters}
            onSelectionChange={handleFilterChange}
            onReset={() => setSelectedFilters({})}
            onApply={handleApplyFilters}
        />
    );

    const activeFilterCount = Object.values(selectedFilters).filter(values => values && values.length > 0).length;

    return (
        <SidebarDashboardLayout
            title="Admin Dashboard"
            sidebar={sidebar}
            controls={controls}
            activeFilterCount={activeFilterCount}
        >
            {/* View Switching Logic */}
            {viewType === 'chart' ? (
                <>
                    {/* Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <MetricCard
                            title="Total Sales"
                            value={dashboardData?.metrics?.total_sales || 0}
                            icon="mdi:currency-usd"
                            trend={{ value: 12, label: 'vs last month', isPositive: true }}
                        />
                        <MetricCard
                            title="Active Projects"
                            value={dashboardData?.metrics?.active_projects || 0}
                            icon="mdi:briefcase-outline"
                        />
                        <MetricCard
                            title="Total Attendance"
                            value={dashboardData?.metrics?.total_attendance || 0}
                            icon="mdi:account-group-outline"
                        />
                        <MetricCard
                            title="Efficiency"
                            value={dashboardData?.metrics?.efficiency || 0}
                            icon="mdi:chart-line"
                            colorClass="bg-blue-50 border-blue-100"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[450px]">
                            {isLoadingDashboard ? (
                                <div className="h-full flex items-center justify-center text-gray-400">Loading Charts...</div>
                            ) : (
                                <Column3DChart
                                    data={dashboardData?.sales_by_project || []}
                                    title="Sales by Project"
                                    height="400px"
                                />
                            )}
                        </div>
                        <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[450px]">
                            {isLoadingDashboard ? (
                                <div className="h-full flex items-center justify-center text-gray-400">Loading...</div>
                            ) : (
                                <Highcharts3DPie
                                    data={dashboardData?.category_distribution || []}
                                    title="Category Distribution"
                                    height="400px"
                                />
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* Table View */
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">Detailed Report</h3>
                        {/* Optional Table-Specific Controls */}
                    </div>
                    <DashboardTable
                        data={tableData}
                        columns={columns}
                        isLoading={isLoadingTable}
                        pagination={{
                            currentPage: pagination.currentPage,
                            totalPages: pagination.totalPages,
                            totalRows: pagination.totalRows,
                            onPageChange: (page) => fetchTableData(page)
                        }}
                    />
                </div>
            )}
        </SidebarDashboardLayout>
    );
};

export default AdminDashboard;