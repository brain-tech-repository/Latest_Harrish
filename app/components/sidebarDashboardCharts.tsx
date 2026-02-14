import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import { Maximize2, Loader2, AlertCircle, BarChart3, X } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSnackbar } from '../services/snackbarContext';
import toInternationalNumber from '../(private)/utils/formatNumber';
import Loading from './Loading';
import { formatNumberShort } from '../(private)/utils/quantityFormat';
// import CompanySalesTrendWithLegend from './CompanySalesTrendWithLegend';
import Column3DChart from './DashboardCharts/Column3DChart';
import DualColumn3DChart from './DashboardCharts/DualColumn3DChart';
import Highcharts3DPie from './DashboardCharts/Highcharts3DPie';
import NeonTrendAreaChart from './DashboardCharts/NeonTrendAreaChart';
import SmallBarChart from './DashboardCharts/SmallBarChart';

interface ChartData {
    salesTrend: { year: string; sales: number }[];
    companies: { name: string; sales: number; color: string }[];
    region: { name: string; value: number; color: string }[];
    brand: { brand: string; sales: number }[];
}

export type typeofReportType = 'admin';

interface ChartsProps {
    chartData?: ChartData;
    dashboardData?: any;
    isLoading?: boolean;
    error?: string | null;
    searchType?: string;
    reportType?: typeofReportType; // New prop to distinguish report types
    urlSizeWarning?: boolean; // Warning flag when URL size exceeds limit
    onUrlSizeExceeded?: () => void; // Callback when URL size exceeds limit
}

const Charts: React.FC<ChartsProps> = ({
    chartData,
    dashboardData,
    isLoading,
    error,
    searchType,
    reportType = 'sales',
    urlSizeWarning = false,
    onUrlSizeExceeded
}) => {
    const { showSnackbar } = useSnackbar();
    const [selectedMaxView, setSelectedMaxView] = useState<string | null>(null);
    const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
    const [is3DLoaded, setIs3DLoaded] = useState(false);
    const [hiddenWarehouses, setHiddenWarehouses] = useState<string[]>([]);
    const [hiddenPoOrderLines, setHiddenPoOrderLines] = useState<string[]>([]);
    const [urlWarningShown, setUrlWarningShown] = useState(false);
    const CURRENCY = localStorage.getItem('country') + " " || ' ';

    // Show snackbar when URL size exceeds limit
    useEffect(() => {
        if (urlSizeWarning && !urlWarningShown) {
            showSnackbar('URL size limit exceeded! Please reduce your selection to avoid data loading issues.', 'error');
            setUrlWarningShown(true);
            if (onUrlSizeExceeded) {
                onUrlSizeExceeded();
            }
        }
        // Reset warning flag when urlSizeWarning becomes false
        if (!urlSizeWarning && urlWarningShown) {
            setUrlWarningShown(false);
        }
    }, [urlSizeWarning, urlWarningShown, showSnackbar, onUrlSizeExceeded]);

    const normalNumberFormatter = (value: number) => value.toLocaleString();

    // Load Highcharts 3D module
    useEffect(() => {
        let mounted = true;

        if (typeof window !== 'undefined' && Highcharts) {
            import('highcharts/highcharts-3d').then((mod: any) => {
                if (typeof mod.default === 'function') {
                    (mod.default as any)(Highcharts);
                }
                if (mounted) {
                    setIs3DLoaded(true);
                }
            }).catch(() => {
                if (mounted) setIs3DLoaded(true);
            });
        }

        return () => {
            mounted = false;
        };
    }, []);

    // 🌟 Dark theme neon-inspired color palettes for trend charts
    const neonColors = [
        '#00f2fe', // Electric Cyan
        '#4facfe', // Neon Blue
        '#00ff9d', // Neon Green
        '#ff2e63', // Neon Pink
        '#ff9a00', // Neon Orange
        '#aa00ff', // Neon Purple
        '#00e5ff', // Bright Cyan
        '#f4d03f', // Neon Yellow
        '#1cefff', // Bright Teal
        '#ff4081', // Hot Pink
        '#18dcff', // Sky Blue
        '#ff4d8d'  // Magenta Pink
    ];

    const neonAreaColors = [
        { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)', glow: 'rgba(59, 130, 246, 0.3)' }, // Blue
        { line: '#10b981', fill: 'rgba(16, 185, 129, 0.15)', glow: 'rgba(16, 185, 129, 0.3)' }, // Green
        { line: '#ec4899', fill: 'rgba(236, 72, 153, 0.15)', glow: 'rgba(236, 72, 153, 0.3)' }, // Pink
        { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)', glow: 'rgba(139, 92, 246, 0.3)' }, // Purple
        { line: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)', glow: 'rgba(6, 182, 212, 0.3)' }, // Cyan
        { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', glow: 'rgba(245, 158, 11, 0.3)' }, // Amber
        { line: '#6366f1', fill: 'rgba(99, 102, 241, 0.15)', glow: 'rgba(99, 102, 241, 0.3)' }, // Indigo
        { line: '#14b8a6', fill: 'rgba(20, 184, 166, 0.15)', glow: 'rgba(20, 184, 166, 0.3)' }, // Teal
        { line: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)', glow: 'rgba(244, 63, 94, 0.3)' }, // Rose
        { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.15)', glow: 'rgba(34, 197, 94, 0.3)' }, // Emerald
        { line: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)', glow: 'rgba(168, 85, 247, 0.3)' }, // Violet
        { line: '#0ea5e9', fill: 'rgba(14, 165, 233, 0.15)', glow: 'rgba(14, 165, 233, 0.3)' }  // Sky Blue
    ];

    // Original color palettes for other charts
    const companyColors = [
        '#22d3ee', // cyan
        '#fb7185', // rose
        '#fbbf24', // yellow
        '#60a5fa', // blue
        '#818cf8', // indigo
        '#a78bfa', // violet
        '#f472b6', // pink
        // amber
        '#34d399'  // emerald
    ];

    const regionColors = [
        '#38bdf8',
        '#facc15', // sky blue
        '#4f46e5', // indigo
        '#22c55e', // green
        // yellow
        '#f97316'  // orange
    ];

    const areaColors = [
        '#6366f1', '#ff6ec7', '#29e53bff', '#c084fc', '#e879f9', '#fb7185', '#f97316', '#facc15', '#2dd4bf', '#38bdf8', '#60a5fa', '#22d3ee'
    ];

    // Dedicated palette for Area Performance to avoid clashing with Area Contribution
    const areaPerformanceColors = ['#ff6b6b', '#5df07dff', '#7678ffff', '#e317f2ff', '#14649aff', '#f94144', '#f783ac', '#9b5de5', '#7b2cbf', '#4cc9f0'];

    const warehouseColors = [
        '#00ff33ff', '#fe5305ff', '#7c07d5ff', '#00c2ff', '#fc0511ff', '#e5f904ff', '#2802ffff', '#eb0a85ff'
    ];

    const salesmanColors = [
        '#f60a0aff', '#fa7406ff', '#facc15', '#08f760ff', '#07d5f5ff', '#1f4068ff', '#a78bfa', '#c20b6aff'
    ];

    // Color palettes for channels and customer categories
    const channelColors = [
        '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
    ];

    const customerCategoryColors = [
        '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316',
        '#06b6d4', '#a855f7', '#22c55e', '#eab308', '#ef4444', '#0ea5e9', '#84cc16', '#f43f5e'
    ];





    // Transform API data for charts
    const companyData = dashboardData?.charts?.company_sales?.map((item: any, idx: number) => ({
        name: item.company_name,
        value: item.value || 0,
        color: companyColors[idx % companyColors.length]
    })) || [];

    const regionData = dashboardData?.charts?.region_sales?.map((item: any, idx: number) => ({
        name: item.region_name,
        value: item.value || 0,
        color: regionColors[idx % regionColors.length]
    })) || [];

    const salesareaData = dashboardData?.charts?.area_sales?.map((item: any, idx: number) => ({
        name: item.area_name,
        value: item.value || 0,
        color: areaColors[idx % areaColors.length]
    })) || [];

    const areaData = dashboardData?.charts?.area_sales_bar?.map((item: any, idx: number) => ({
        name: item.area_name,
        value: item.value || 0,
        color: areaColors[idx % areaColors.length]
    })) || [];

    const warehouseData = dashboardData?.charts?.warehouse_sales_bar?.map((item: any, idx: number) => ({
        name: item.warehouse_name,
        value: item.value || 0,
        color: warehouseColors[idx % warehouseColors.length]
    })) || [];

    const salesmanData = dashboardData?.charts?.salesman_sales_bar?.map((item: any, idx: number) => ({
        name: item.salesman_name,
        value: item.value || 0,
        color: salesmanColors[idx % salesmanColors.length]
    })) || [];

    // Region-specific charts
    const regionContributionData = dashboardData?.charts?.region_contribution_top_item?.map((item: any, idx: number) => ({
        regionName: item.region_name,
        itemName: item.item_name,
        value: item.value || 0,
        color: regionColors[idx % regionColors.length]
    })) || [];

    const regionVisitedCustomerData = dashboardData?.charts?.region_visited_customer_trend || [];

    const totalVisitedByRegion = (regionVisitedCustomerData || []).reduce((s: number, r: any) => s + (r.visited_customers || 0), 0);
    const totalCustomersByRegion = (regionVisitedCustomerData || []).reduce((s: number, r: any) => s + (r.total_customers || 0), 0);

    // New data transformations for company-level customer report
    const channelSalesData = dashboardData?.charts?.channel_sales?.map((item: any, idx: number) => ({
        name: item.channel_name,
        value: item.value || 0,
        percentage: item.percentage || 0,
        color: channelColors[idx % channelColors.length]
    })) || [];

    const customerCategorySalesData = dashboardData?.charts?.customer_category_sales?.map((item: any, idx: number) => ({
        name: item.customer_category_name,
        value: item.value || 0,
        percentage: item.percentage || 0,
        color: customerCategoryColors[idx % customerCategoryColors.length]
    })) || [];

    const topChannelsData = dashboardData?.charts?.top_channels?.map((item: any, idx: number) => ({
        name: item.channel_name,
        value: item.value || 0,
        color: channelColors[idx % channelColors.length]
    })) || [];

    const topCustomerCategoriesData = dashboardData?.charts?.top_customer_categories?.map((item: any, idx: number) => ({
        name: item.customer_category_name,
        value: item.value || 0,
        color: customerCategoryColors[idx % customerCategoryColors.length]
    })) || [];

    // Sales trend data - handle both old format (company_sales_trend) and new format (sales_trend)
    const salesTrendData = dashboardData?.charts?.sales_trend || dashboardData?.charts?.company_sales_trend || [];

    // Area-specific charts
    const areaContributionData = dashboardData?.charts?.area_contribution_top_item?.map((item: any, idx: number) => ({
        areaName: item.area_name,
        itemName: item.item_name,
        value: item.value || 0,
        color: areaColors[idx % areaColors.length]
    })) || [];

    const areaVisitedCustomerData = dashboardData?.charts?.area_visited_customer_trend || [];

    // Company sales trend data - sorted chronologically
    const companySalesTrend = dashboardData?.charts?.company_sales_trend
        ? [...dashboardData.charts.company_sales_trend].sort((a: any, b: any) => {
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const aMonth = monthOrder.indexOf(a.period.split('-')[0]);
            const bMonth = monthOrder.indexOf(b.period.split('-')[0]);
            return aMonth - bMonth;
        })
        : [];

    // Region sales trend data
    const regionSalesTrend = dashboardData?.charts?.region_sales_trend
        ? [...dashboardData.charts.region_sales_trend].sort((a: any, b: any) => {
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const aMonth = monthOrder.indexOf(a.period.split('-')[0]);
            const bMonth = monthOrder.indexOf(b.period.split('-')[0]);
            return aMonth - bMonth;
        })
        : [];

    // Area sales trend data
    const areaSalesTrend = dashboardData?.charts?.area_sales_trend
        ? [...dashboardData.charts.area_sales_trend].sort((a: any, b: any) => {
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const aMonth = monthOrder.indexOf(a.period.split('-')[0]);
            const bMonth = monthOrder.indexOf(b.period.split('-')[0]);
            return aMonth - bMonth;
        })
        : [];

    // Top salesmen data from tables (take top 10)
    const topSalesmenData = dashboardData?.tables?.top_salesmen?.slice(0, 10).map((item: any, idx: number) => ({
        name: item.salesman,
        value: item.value || 0,
        color: salesmanColors[idx % salesmanColors.length]
    })) || [];

    // Top warehouses data from tables (take top 10)
    const topWarehousesData = dashboardData?.tables?.top_warehouses?.slice(0, 10).map((item: any, idx: number) => ({
        name: item['?column?'] || item.warehouse_name,
        value: item.value || 0,
        color: warehouseColors[idx % warehouseColors.length]
    })) || [];

    // Get the data level from API response
    const dataLevel = dashboardData?.level || 'company';

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center py-20 mt-5 h-80">
                <Loading />
                {/* <Icon icon="eos-icons:loading" width="48" height="48" className="text-blue-600 mb-4" />
        <p className="text-lg font-medium text-gray-700">Loading dashboard data...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p> */}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col justify-center items-center py-20 mt-5">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p className="text-lg font-medium text-gray-700">Failed to load dashboard</p>
                <p className="text-sm text-red-600 mt-2">{error}</p>
            </div>
        );
    }

    // Empty state
    if (!dashboardData) {
        return (
            <div className="flex flex-col justify-center items-center py-20 mt-5">
                <BarChart3 size={48} className="text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">No data available</p>
                <p className="text-sm text-gray-500 mt-2">Select filters and date range, then click the Dashboard button</p>
            </div>
        );
    }

    // // Validation: Only show graphs for company, region, area, or warehouse levels
    // const validDataLevels = ['company', 'region', 'area', 'warehouse'];
    // if (!validDataLevels.includes(dataLevel)) {
    //   // Show snackbar message
    //   if (typeof window !== 'undefined') {
    //     showSnackbar('Dashboard is not available for Item, Brand, or Category filters. Please select Company, Region, Area, or Distributor.', 'warning');
    //   }

    //   return null;
    // }

    const totalCompany = companyData.reduce((sum: number, item: any) => sum + item.value, 0);
    const totalRegion = regionData.reduce((sum: number, item: any) => sum + item.value, 0);

    // Table data transformations - Handle both sales reports (from tables) and customer reports (from charts)
    const topSalesmenTable = dashboardData?.tables?.top_salesmen?.slice(0, 10) || [];
    const topWarehousesTable = dashboardData?.tables?.top_warehouses?.slice(0, 10) || [];

    // For customers: try charts first (customer report), fallback to tables (sales report)
    const topCustomersTable = (dashboardData?.charts?.top_customers || dashboardData?.tables?.top_customers)?.slice(0, 10).map((customer: any) => ({
        name: customer.customers_name || customer.customer_name,
        contact: customer.contact,
        warehouse: customer.warehouse_name,
        value: customer.value
    })) || [];

    // For items: try charts first (customer report), fallback to tables (sales report)
    const topItemsTable = (dashboardData?.charts?.top_items || dashboardData?.tables?.top_items)?.slice(0, 10).map((item: any) => ({
        name: item.name || item.item_name,
        value: item.value
    })) || [];

    // Pie chart data transformations
    const topSalesmenChartData = topSalesmenTable.slice(0, 10).map((salesman: any, idx: number) => ({
        name: salesman.salesman,
        value: salesman.value || 0,
        color: salesmanColors[idx % salesmanColors.length]
    }));

    const topWarehousesChartData = topWarehousesTable.slice(0, 10).map((warehouse: any, idx: number) => ({
        name: warehouse.warehouse_label || warehouse.warehouse_name,
        value: warehouse.value || 0,
        color: warehouseColors[idx % warehouseColors.length]
    }));

    const topCustomersChartData = topCustomersTable.slice(0, 10).map((customer: any, idx: number) => ({
        name: customer.name,
        value: customer.value || 0,
        color: ['#f43f5e', '#08fa35ff', '#facc15', '#4113c9ff', '#22d3ee', '#ee06d3ff', '#f472b6', '#fb7185', '#fdba74', '#fde047'][idx % 10]
    }));

    const topItemsChartData = topItemsTable.slice(0, 10).map((item: any, idx: number) => ({
        name: item.name,
        value: item.value || 0,
        color: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899'][idx % 10]
    }));

    // Full top items dataset (no slice) — used for maximized view/table so chart and table match
    // Handle both customer reports (charts) and sales reports (tables)
    const topItemsFull = (dashboardData?.charts?.top_items || dashboardData?.tables?.top_items || []).map((item: any, idx: number) => ({
        name: item.name || item.item_name,
        value: item.value || 0,
        color: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899'][idx % 10]
    })) || [];

    // Comparison Data
    const topCategoriesCurrent = dashboardData?.top_categories_current || [];
    const topCategoriesPrevious = dashboardData?.top_categories_previous || [];
    const topItemsCurrent = dashboardData?.top_items_current || [];
    const topItemsPrevious = dashboardData?.top_items_previous || [];
    const comparisonTrend = dashboardData?.trend || [];

    const totalSalesmen = topSalesmenChartData.reduce((sum: number, item: any) => sum + item.value, 0);
    const totalWarehouses = topWarehousesChartData.reduce((sum: number, item: any) => sum + item.value, 0);
    const totalCustomers = topCustomersChartData.reduce((sum: number, item: any) => sum + item.value, 0);
    const totalItems = topItemsChartData.reduce((sum: number, item: any) => sum + item.value, 0);

    // Custom Pie Chart component with 3D exploded style
    const ExplodedPieChart = ({ data, innerRadius = 0, outerRadius = 80, labelType = 'percentage' }: any) => {
        // Always use 100% for size and enforce a square aspect ratio on the container
        const chartData = Array.isArray(data) ? data : [];
        if (chartData.length === 0) {
            return (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No data available
                </div>
            );
        }
        return (
            <div
                className="w-full h-full relative"
                style={{
                    aspectRatio: '1 / 1',
                    minHeight: 220,
                    maxHeight: 500,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ width: '100%', height: '100%', maxWidth: 500, maxHeight: 500 }}>
                    <Highcharts3DPie data={chartData} innerRadius={innerRadius} outerRadius={outerRadius} size={'100%'} height="100%" />
                </div>
            </div>
        );
    };

    // Donut Chart with exploded effect
    const ExplodedDonutChart = ({ data, innerRadius = 60, outerRadius = 100, labelType = 'percentage', size = '100%' }: any) => {
        // Always use 100% for size and enforce a square aspect ratio on the container
        const chartData = Array.isArray(data) ? data : [];
        if (chartData.length === 0) {
            return (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No data available
                </div>
            );
        }
        return (
            <div
                className="w-full h-full relative"
                style={{
                    aspectRatio: '1 / 1',
                    minHeight: 220,
                    maxHeight: 500,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ width: '100%', height: '100%', maxWidth: 500, maxHeight: 500 }}>
                    <Highcharts3DPie data={chartData} innerRadius={innerRadius} outerRadius={outerRadius} size={'100%'} height="100%" />
                </div>
            </div>
        );
    };





    // Maximized Modal Component
    const MaximizedView = (props: any = {}) => {
        if (!selectedMaxView) return null;

        // Maximized view versions of the charts
        const MaximizedExplodedPieChart = ({ data, title, innerRadius = 0, outerRadius = 150 }: any) => {
            const chartData = Array.isArray(data) ? data : [];

            if (chartData.length === 0) {
                return (
                    <div className="w-full h-[500px] flex items-center justify-center text-gray-500">
                        No data available
                    </div>
                );
            }

            return (
                <div className="relative w-full h-[500px]">
                    <Highcharts3DPie data={chartData} title={title} height="400px" innerRadius={innerRadius} outerRadius={outerRadius} />
                </div>
            );
        };

        // Determine which trend data to use based on data level
        let trendData = [];
        let trendTitle = '';

        if (selectedMaxView === 'trend') {
            if (dataLevel === 'company') {
                // For customer reports, use salesTrendData; for sales reports, use companySalesTrend
                trendData = reportType === 'customer' && salesTrendData.length > 0 ? salesTrendData : companySalesTrend;
                trendTitle = 'Company Sales Trend';
            } else if (dataLevel === 'region') {
                // For customer reports, use salesTrendData; for sales reports, use regionSalesTrend
                trendData = reportType === 'customer' && salesTrendData.length > 0 ? salesTrendData : regionSalesTrend;
                trendTitle = 'Region Sales Trend';
            } else if (dataLevel === 'area') {
                // For customer reports, use salesTrendData; for sales reports, use areaSalesTrend
                trendData = reportType === 'customer' && salesTrendData.length > 0 ? salesTrendData : areaSalesTrend;
                trendTitle = 'Area Sales Trend';
            } else if (dataLevel === 'warehouse') {
                // For customer reports, use salesTrendData; for sales reports, use warehouse_trend
                if (reportType === 'customer' && salesTrendData.length > 0) {
                    trendData = salesTrendData;
                    trendTitle = 'Distributor Sales Trend';
                } else {
                    const wh = dashboardData?.charts?.warehouse_trend || [];
                    const periods = Array.from(new Set(wh.map((r: any) => r.period))) as string[];
                    trendData = (periods as string[]).map((p: string) => ({
                        period: p,
                        value: wh.filter((x: any) => x.period === p).reduce((s: number, x: any) => s + (x.value || 0), 0)
                    }));
                    trendTitle = 'Distributor Sales Trend';
                }
            }
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] overflow-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {selectedMaxView === 'company' && 'Company Sales Details'}
                            {selectedMaxView === 'region' && 'Region Sales Details'}
                            {selectedMaxView === 'regionItems' && 'Region Sales Details'}
                            {selectedMaxView === 'regionVisited' && 'Visit Customer Trend - Region Details'}
                            {selectedMaxView === 'warehouseSales' && 'Distributor Sales Details'}
                            {selectedMaxView === 'area' && 'Area Sales Details'}
                            {selectedMaxView === 'areaSales' && 'Area Sales Details'}
                            {selectedMaxView === 'areaItems' && 'Area Contribution'}
                            {selectedMaxView === 'areaPerformance' && 'Area Performance Details'}
                            {selectedMaxView === 'areaVisited' && 'Area Visited Customers Details'}
                            {selectedMaxView === 'areaTrend' && 'Area Sales Trend Details'}
                            {selectedMaxView === 'trend' && `${trendTitle} Details`}
                            {selectedMaxView === 'salesmen' && 'Salesmen Details'}
                            {selectedMaxView === 'warehouses' && 'Distributors Details'}
                            {selectedMaxView === 'customers' && 'Customers Details'}
                            {selectedMaxView === 'items' && 'Items Details'}
                            {selectedMaxView === 'channels' && 'Channel Sales Details'}
                            {selectedMaxView === 'customerCategories' && 'Customer Category Sales Details'}
                            {selectedMaxView === 'topChannels' && 'Channels Details'}
                            {selectedMaxView === 'topCustomerCategories' && 'Customer Categories Details'}
                            {selectedMaxView === 'regionItemPerformance' && 'Region Wise Item Performance Details'}
                            {selectedMaxView === 'areaItemPerformance' && 'Area Wise Item Performance Details'}
                            {selectedMaxView === 'purchaseTrend' && 'Purchase Trend Details'}
                            {selectedMaxView === 'returnTrend' && 'Return Trend Details'}
                            {selectedMaxView === 'salesTrend' && 'Sales Trend Details'}
                            {selectedMaxView === 'mostSold' && 'Most Sold Item Details'}
                            {selectedMaxView === 'mostPurchased' && 'Most Purchased Item Details'}
                            {selectedMaxView === 'leastSold' && 'Least Selling Item Details'}
                            {selectedMaxView === 'leastPurchased' && 'Least Purchased Item Details'}
                            {selectedMaxView === 'poOrderOverTime' && 'PO Order Over Time Details'}
                            {selectedMaxView === 'comparisonTopCategoriesCurrent' && 'Current Top Categories'}
                            {selectedMaxView === 'comparisonTopItemsCurrent' && 'Current Top Items'}
                            {selectedMaxView === 'comparisonTopItemsPrevious' && 'Previous Top Items'}
                            {selectedMaxView === 'comparisonTopCategoriesPrevious' && 'Previous Top Categories'}
                            {selectedMaxView === 'comparisonTrend' && 'Comparison Trend Details'}
                            {selectedMaxView === 'loadKpi' && 'Load vs Unload vs Sales Details'}
                            {selectedMaxView === 'salesmanLoadUnload' && 'Salesman Summary Details'}
                            {selectedMaxView === 'loadUnloadTrend' && 'Load/Unload Trend Details'}
                            {selectedMaxView === 'openClosedShopsTrend' && 'Open/Closed Trend Details'}
                        </h2>
                        <button
                            onClick={() => setSelectedMaxView(null)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} className="text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Company View */}
                        {selectedMaxView === 'company' && companyData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Company Sales Distribution</h3>
                                    <MaximizedExplodedPieChart data={companyData} outerRadius={200} />
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Company Sales Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Company Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {companyData.map((company: any, index: number) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{company.name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                        {company.value?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-600">
                                                        {((company.value / totalCompany) * 100).toFixed(2)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Region Visited Customers View (detailed) */}
                        {selectedMaxView === 'regionVisited' && (regionVisitedCustomerData.length > 0) && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Visit Customer Trend by Region (Detailed)</h3>
                                    <div className="w-full h-[600px]">
                                        <DualColumn3DChart
                                            data={regionVisitedCustomerData}
                                            xAxisKey="region_name"
                                            series1Key="total_customers"
                                            series1Name="Total Customers"
                                            series2Key="visited_customers"
                                            series2Name="Visited Customers"
                                            height="500px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Visit Customer Trend Data Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Region</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Visited Customers</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Total Customers</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Visited Contribution (%)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {regionVisitedCustomerData.map((r: any, i: number) => (
                                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-800">{r.region_name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{(r.visited_customers || 0).toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800">{(r.total_customers || 0).toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800">{(r.visited_percentage || 0).toLocaleString()}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Region View */}
                        {selectedMaxView === 'region' && (
                            ((regionData.length > 0) || ((dashboardData?.tables?.region_performance || []).length > 0)) && (
                                ((dashboardData?.tables?.region_performance || []).length > 0) ? (
                                    <>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Region Performance</h3>
                                            <MaximizedExplodedPieChart
                                                data={dashboardData.tables.region_performance.map((r: any, i: number) => ({
                                                    name: r.region_name,
                                                    value: r.value || 0,
                                                    color: regionColors[i % regionColors.length]
                                                }))}
                                                // title="Region Performance"
                                                innerRadius={100}
                                                outerRadius={200}
                                            />
                                        </div>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Region Performance Table</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                        <tr>
                                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Region Name</th>
                                                            <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(dashboardData?.tables?.region_performance || []).map((row: any, index: number) => (
                                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                                <td className="px-6 py-4 text-gray-800 font-medium">{row.region_name}</td>
                                                                <td className="px-6 py-4 text-right text-gray-800 font-semibold">{(row.value || 0).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Region Sales Distribution</h3>
                                            <MaximizedExplodedPieChart data={regionData} innerRadius={100} outerRadius={200} />
                                        </div>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Region Sales Table</h3>
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Region Name</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {regionData.map((region: any, index: number) => (
                                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                            <td className="px-6 py-4 text-gray-800 font-medium">{region.name}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                                {region.value?.toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-gray-600">
                                                                {((region.value / totalRegion) * 100).toFixed(2)}%
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )
                            ))}

                        {/* Region Contribution (Top Items) Maximized View */}
                        {selectedMaxView === 'regionItems' && (
                            (() => {
                                const source = props.regionContributionData || (dashboardData?.charts?.region_contribution_top_item || []);
                                const chartData = (Array.isArray(source) ? source : []).map((it: any, i: number) => ({
                                    name: `${it.region_name || it.region_label || it.name}`,
                                    value: it.value || 0,
                                    color: areaColors[i % areaColors.length]
                                }));

                                if (!chartData || chartData.length === 0) {
                                    return null;
                                }

                                return (
                                    <>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Region Contribution</h3>
                                            <MaximizedExplodedPieChart data={chartData} outerRadius={200} />
                                        </div>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Region Contribution Table</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                        <tr>
                                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Region</th>
                                                            <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {chartData.map((row: any, index: number) => (
                                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                                <td className="px-6 py-4 text-gray-800 font-medium">{row.name}</td>
                                                                <td className="px-6 py-4 text-right text-gray-800 font-semibold">{(row.value || 0).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()
                        )}

                        {/* Trend View - Shows both Graph and Table */}
                        {selectedMaxView === 'trend' && (
                            (() => {
                                // For region level we want a multi-series line chart (one line per region)
                                if (dataLevel === 'region' && Array.isArray(regionSalesTrend) && regionSalesTrend.length > 0) {
                                    const periods = Array.from(new Set(regionSalesTrend.map((r: any) => r.period)));
                                    const regionNames = Array.from(new Set(regionSalesTrend.map((r: any) => r.region_name)));
                                    const trendSeries = periods.map((p: string) => {
                                        const obj: any = { period: p };
                                        regionNames.forEach((rn: string) => {
                                            const item = regionSalesTrend.find((x: any) => x.period === p && x.region_name === rn);
                                            obj[rn] = item ? (item.value || 0) : 0;
                                        });
                                        return obj;
                                    });

                                    return (
                                        <>
                                            <div className="bg-white p-6 border rounded-lg shadow-sm">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Region Sales Trend</h3>
                                                <div className="w-full h-[500px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={trendSeries} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                            <XAxis
                                                                dataKey="period"
                                                                tick={(props) => {
                                                                    const { x, y, payload } = props;
                                                                    return (
                                                                        <g transform={`translate(${x},${y}) rotate(-45)`}>
                                                                            <text
                                                                                x={0}
                                                                                y={0}
                                                                                dy={10}
                                                                                textAnchor="end"
                                                                                fill="#4b5563"
                                                                                fontSize={11}
                                                                            >
                                                                                {payload.value}
                                                                            </text>
                                                                        </g>
                                                                    );
                                                                }}
                                                                textAnchor="end"
                                                                height={80}
                                                            />
                                                            <YAxis tickFormatter={(value) => `${formatNumberShort(value)}`} tick={{ fontSize: 13 }} />
                                                            <Tooltip formatter={(value: any) => `${value.toLocaleString()}`} />
                                                            {/* <Legend /> */}
                                                            {regionNames.map((rn: string, idx: number) => (
                                                                <Line
                                                                    key={rn}
                                                                    type="monotone"
                                                                    dataKey={rn}
                                                                    stroke={neonAreaColors[idx % neonAreaColors.length]?.line || regionColors[idx % regionColors.length]}
                                                                    strokeWidth={2}
                                                                    dot={{ r: 3 }}
                                                                    activeDot={{ r: 5 }}
                                                                />
                                                            ))}
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="bg-white p-6 border rounded-lg shadow-sm">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Trend Data Table</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                            <tr>
                                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                                {regionNames.map((rn: string, i: number) => (
                                                                    <th key={i} className="px-6 py-4 text-right font-semibold text-gray-700">{rn}</th>
                                                                ))}
                                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {trendSeries.map((row: any, idx: number) => {
                                                                const total = regionNames.reduce((s: number, rn: string) => s + (row[rn] || 0), 0);
                                                                return (
                                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                                        <td className="px-6 py-4 text-gray-800 font-medium">{row.period}</td>
                                                                        {regionNames.map((rn: string, i: number) => (
                                                                            <td key={i} className="px-6 py-4 text-right text-gray-800 font-semibold">{(row[rn] || 0).toLocaleString()}</td>
                                                                        ))}
                                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{total.toLocaleString()}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    );
                                }

                                // Fallback for company/area/warehouse: keep single-series area chart + simple table
                                // For area level render multi-series line chart (one line per area)
                                if (dataLevel === 'area' && Array.isArray(areaSalesTrend) && areaSalesTrend.length > 0) {
                                    const periods = Array.from(new Set(areaSalesTrend.map((r: any) => r.period)));
                                    const areaNames = Array.from(new Set(areaSalesTrend.map((r: any) => r.area_name)));
                                    const trendSeries = periods.map((p: string) => {
                                        const obj: any = { period: p };
                                        areaNames.forEach((an: string) => {
                                            const item = areaSalesTrend.find((x: any) => x.period === p && x.area_name === an);
                                            obj[an] = item ? (item.value || 0) : 0;
                                        });
                                        return obj;
                                    });

                                    return (
                                        <>
                                            <div className="bg-white p-6 border rounded-lg shadow-sm">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Sales Trend</h3>

                                                {/* Interactive legend to toggle warehouse lines */}
                                                <div className="mb-4">
                                                    <div className="flex flex-wrap h-10 overflow-auto gap-2 text-[12px]">
                                                        {areaNames.map((an: string, i: number) => {
                                                            const hidden = hiddenWarehouses.includes(an);
                                                            return (
                                                                <button
                                                                    key={i}
                                                                    type="button"
                                                                    onClick={() => setHiddenWarehouses(prev => prev.includes(an) ? prev.filter(x => x !== an) : [...prev, an])}
                                                                    className={`inline-flex items-center gap-2 px-2 py-1 rounded ${hidden ? 'opacity-40' : ''}`}
                                                                >
                                                                    <span style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: neonAreaColors[i % neonAreaColors.length].line }} />
                                                                    <span className="text-gray-700">{an}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="w-full h-[500px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={trendSeries} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                            <XAxis
                                                                dataKey="period"
                                                                tick={(props) => {
                                                                    const { x, y, payload } = props;
                                                                    return (
                                                                        <g transform={`translate(${x},${y}) rotate(-45)`}>
                                                                            <text
                                                                                x={0}
                                                                                y={0}
                                                                                dy={10}
                                                                                textAnchor="end"
                                                                                fill="#4b5563"
                                                                                fontSize={11}
                                                                            >
                                                                                {payload.value}
                                                                            </text>
                                                                        </g>
                                                                    );
                                                                }}
                                                                textAnchor="end"
                                                                height={80}
                                                            />
                                                            <YAxis tickFormatter={(value) => ` ${formatNumberShort(value)}`} tick={{ fontSize: 13 }} />
                                                            <Tooltip formatter={(value: any) => ` ${value.toLocaleString()}`} />
                                                            {/* <Legend /> */}
                                                            {areaNames.map((an: string, idx: number) => (
                                                                <Line
                                                                    key={an}
                                                                    type="monotone"
                                                                    dataKey={an}
                                                                    stroke={neonAreaColors[idx % neonAreaColors.length].line}
                                                                    strokeWidth={2}
                                                                    dot={{ r: 3 }}
                                                                    activeDot={{ r: 5 }}
                                                                />
                                                            ))}
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="bg-white p-6 border rounded-lg shadow-sm">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Trend Data Table</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                            <tr>
                                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                                {areaNames.map((an: string, i: number) => (
                                                                    <th key={i} className="px-6 py-4 text-right font-semibold text-gray-700">{an}</th>
                                                                ))}
                                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {trendSeries.map((row: any, idx: number) => {
                                                                const total = areaNames.reduce((s: number, an: string) => s + (row[an] || 0), 0);
                                                                return (
                                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                                        <td className="px-6 py-4 text-gray-800 font-medium">{row.period}</td>
                                                                        {areaNames.map((an: string, i: number) => (
                                                                            <td key={i} className="px-6 py-4 text-right text-gray-800 font-semibold">{(row[an] || 0).toLocaleString()}</td>
                                                                        ))}
                                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{total.toLocaleString()}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    );
                                }

                                // For warehouse level: render multi-series (one line per warehouse) and table
                                if (dataLevel === 'warehouse') {
                                    const wh = dashboardData?.charts?.warehouse_trend || [];
                                    if (Array.isArray(wh) && wh.length > 0) {
                                        const periods = Array.from(new Set(wh.map((r: any) => r.period)));
                                        const warehouseNames = Array.from(new Set(wh.map((r: any) => r.warehouse_label)));
                                        const trendSeries = periods.map((p: string) => {
                                            const obj: any = { period: p };
                                            warehouseNames.forEach((wn: string) => {
                                                const item = wh.find((x: any) => x.period === p && x.warehouse_label === wn);
                                                obj[wn] = item ? (item.value || 0) : 0;
                                            });
                                            return obj;
                                        });

                                        return (
                                            <>
                                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Distributor Sales Trend</h3>

                                                    {/* Interactive legend to toggle warehouse lines */}
                                                    <div className="mb-4">
                                                        <div className="flex flex-wrap h-10 overflow-auto gap-2 text-[12px]">
                                                            {warehouseNames.map((wn: string, i: number) => {
                                                                const hidden = hiddenWarehouses.includes(wn);
                                                                return (
                                                                    <button
                                                                        key={i}
                                                                        type="button"
                                                                        onClick={() => setHiddenWarehouses(prev => prev.includes(wn) ? prev.filter(x => x !== wn) : [...prev, wn])}
                                                                        className={`inline-flex items-center gap-2 px-2 py-1 rounded ${hidden ? 'opacity-40' : ''}`}
                                                                    >
                                                                        <span style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: warehouseColors[i % warehouseColors.length] }} />
                                                                        <span className="text-gray-700">{wn}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="w-full h-[500px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={trendSeries} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                                <XAxis dataKey="period" tick={(props) => {
                                                                    const { x, y, payload } = props;
                                                                    return (
                                                                        <g transform={`translate(${x},${y}) rotate(-45)`}>
                                                                            <text
                                                                                x={0}
                                                                                y={0}
                                                                                dy={10}
                                                                                textAnchor="end"
                                                                                fill="#4b5563"
                                                                                fontSize={11}
                                                                            >
                                                                                {payload.value}
                                                                            </text>
                                                                        </g>
                                                                    );
                                                                }} textAnchor="end" height={80} />
                                                                <YAxis tickFormatter={(value) => ` ${formatNumberShort(value)}`} tick={{ fontSize: 13 }} />
                                                                <Tooltip formatter={(value: any) => ` ${value.toLocaleString()}`} />
                                                                {/* <Legend /> */}
                                                                {warehouseNames.map((wn: string, idx: number) => (
                                                                    <Line
                                                                        key={wn}
                                                                        type="monotone"
                                                                        dataKey={wn}
                                                                        stroke={warehouseColors[idx % warehouseColors.length]}
                                                                        strokeWidth={2}
                                                                        dot={{ r: 3 }}
                                                                        activeDot={{ r: 5 }}
                                                                        hide={hiddenWarehouses.includes(wn)}
                                                                    />
                                                                ))}
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Trend Data Table</h3>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                                <tr>
                                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                                    {warehouseNames.map((wn: string, i: number) => (
                                                                        <th key={i} className="px-6 py-4 text-right font-semibold text-gray-700">{wn}</th>
                                                                    ))}
                                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {trendSeries.map((row: any, idx: number) => {
                                                                    const total = warehouseNames.reduce((s: number, wn: string) => s + (row[wn] || 0), 0);
                                                                    return (
                                                                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                                            <td className="px-6 py-4 text-gray-800 font-medium">{row.period}</td>
                                                                            {warehouseNames.map((wn: string, i: number) => (
                                                                                <td key={i} className="px-6 py-4 text-right text-gray-800 font-semibold">{(row[wn] || 0).toLocaleString()}</td>
                                                                            ))}
                                                                            <td className="px-6 py-4 text-right text-gray-800 font-semibold">{total.toLocaleString()}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    }
                                }

                                if (trendData && trendData.length > 0) {
                                    return (
                                        <>
                                            <div className="bg-white p-6 border rounded-lg shadow-sm">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-4">{trendTitle}</h3>
                                                <div className="w-full h-[500px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={trendData}>
                                                            <defs>
                                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                            <XAxis dataKey="period" tick={(props) => {
                                                                const { x, y, payload } = props;
                                                                return (
                                                                    <g transform={`translate(${x},${y}) rotate(-45)`}>
                                                                        <text
                                                                            x={0}
                                                                            y={0}
                                                                            dy={10}
                                                                            textAnchor="end"
                                                                            fill="#4b5563"
                                                                            fontSize={11}
                                                                        >
                                                                            {payload.value}
                                                                        </text>
                                                                    </g>
                                                                );
                                                            }} textAnchor="end" height={80} />
                                                            <YAxis tickFormatter={(value) => ` ${formatNumberShort(value)}`} tick={{ fontSize: 13 }} />
                                                            <Tooltip formatter={(value: any) => ` ${value.toLocaleString()}`} />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="value"
                                                                stroke="#3b82f6"
                                                                strokeWidth={2}
                                                                fillOpacity={1}
                                                                fill="url(#colorValue)"
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 border rounded-lg shadow-sm">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Trend Data Table</h3>
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                        <tr>
                                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                            <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {trendData.map((item: any, index: number) => (
                                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-gray-800 font-medium">{item.period}</td>
                                                                <td className="px-6 py-4 text-right text-gray-800 font-semibold">{item.value?.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    );
                                }

                                return (
                                    <div className="w-full p-6">
                                        <div className="w-full h-40 flex items-center justify-center text-gray-500">No trend data available</div>
                                    </div>
                                );
                            })()
                        )}

                        {/* Area Contribution (Top Items) Maximized View */}
                        {selectedMaxView === 'areaItems' && (areaContributionData.length > 0) && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Contribution</h3>
                                    <MaximizedExplodedPieChart
                                        data={areaContributionData.map((r: any) => ({ name: `${r.areaName} - ${r.itemName}`, value: r.value || 0, color: r.color }))}

                                        outerRadius={200}
                                    />
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Contribution Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Area</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Item</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {areaContributionData.map((row: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{row.areaName}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{row.itemName}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{(row.value || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Salesmen View */}
                        {selectedMaxView === 'salesmen' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Salesmen Distribution</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart data={topSalesmenChartData} xAxisKey="name" yAxisKey="value" colors={salesmanColors} height="480px" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Salesmen Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Salesman Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">{searchType === 'quantity' ? 'Quantity' : 'Quantity'}</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topSalesmenChartData.map((salesman: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{salesman.name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {searchType === 'quantity' ? `${salesman.value?.toLocaleString()}` : `${salesman.value?.toLocaleString()}`}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600">
                                                            {((salesman.value / totalSalesmen) * 100).toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Warehouses View */}
                        {selectedMaxView === 'warehouses' && topWarehousesChartData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Distributors Distribution</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart data={topWarehousesChartData} xAxisKey="name" yAxisKey="value" colors={warehouseColors} height="480px" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Distributors Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Distributor Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">{searchType === 'quantity' ? 'Quantity' : 'Quantity'}</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topWarehousesChartData.map((warehouse: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{warehouse.name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {searchType === 'quantity' ? `${warehouse.value?.toLocaleString()}` : `${warehouse.value?.toLocaleString()}`}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600">
                                                            {((warehouse.value / totalWarehouses) * 100).toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Customers View */}
                        {selectedMaxView === 'customers' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Customers Distribution</h3>
                                    <div className="w-full h-[500px]">
                                        <Column3DChart data={topCustomersChartData} xAxisKey="name" yAxisKey="value" colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']} height="480px" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Customers Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Customer Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">{searchType === 'quantity' ? 'Quantity' : 'Quantity'}</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topCustomersChartData.map((customer: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{customer.name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {searchType === 'quantity' ? `${customer.value?.toLocaleString()}` : `${customer.value?.toLocaleString()}`}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600">
                                                            {((customer.value / totalCustomers) * 100).toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Items View */}
                        {selectedMaxView === 'items' && topItemsChartData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Items Distribution</h3>
                                    <div className="w-full h-[500px]">
                                        {
                                            // At warehouse level prefer a Column3DChart instead of pie
                                            dataLevel === 'warehouse' ? (
                                                <Column3DChart data={topItemsFull.length > 0 ? topItemsFull : topItemsChartData} xAxisKey="name" yAxisKey="value" colors={areaColors} height="480px" />
                                            ) : (
                                                dashboardData?.charts?.region_contribution && dashboardData.charts.region_contribution.length > 0 ? (
                                                    <MaximizedExplodedPieChart
                                                        data={dashboardData.charts.region_contribution.map((r: any, i: number) => ({
                                                            name: r.region_name || r.region_label || 'Unknown',
                                                            value: r.value || 0,
                                                            color: regionColors[i % regionColors.length]
                                                        }))}
                                                        outerRadius={200}
                                                    />
                                                ) : regionContributionData && regionContributionData.length > 0 ? (
                                                    <MaximizedExplodedPieChart
                                                        data={regionContributionData.map((r: any) => ({ name: `${r.regionName} - ${r.itemName}`, value: r.value || 0, color: r.color }))}
                                                        title="Region Contribution"
                                                        outerRadius={200}
                                                    />
                                                ) : (
                                                    <Column3DChart data={topItemsChartData} xAxisKey="name" yAxisKey="value" colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']} height="480px" />
                                                )
                                            )
                                        }
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Items Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Item / Region</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">{searchType === 'quantity' ? 'Quantity' : 'Quantity'}</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    // If we're at warehouse level and API provided full top_items, prefer that so chart and table match
                                                    if (dataLevel === 'warehouse' && (dashboardData?.tables?.top_items || []).length > 0) {
                                                        const rows = dashboardData.tables.top_items;
                                                        const total = rows.reduce((s: number, r: any) => s + (r.value || 0), 0) || 1;
                                                        return rows.map((r: any, index: number) => (
                                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                                <td className="px-6 py-4 text-gray-800 font-medium">{r.item_name || r.name}</td>
                                                                <td className="px-6 py-4 text-right text-gray-800 font-semibold">{searchType === 'quantity' ? `${(r.value || 0).toLocaleString()}` : `${(r.value || 0).toLocaleString()}`}</td>
                                                                <td className="px-6 py-4 text-right text-gray-600">{(((r.value || 0) / total) * 100).toFixed(2)}%</td>
                                                            </tr>
                                                        ));
                                                    }

                                                    // Prefer API region_contribution if present
                                                    if (dashboardData?.charts?.region_contribution && dashboardData.charts.region_contribution.length > 0) {
                                                        const rows = dashboardData.charts.region_contribution;
                                                        const total = rows.reduce((s: number, r: any) => s + (r.value || 0), 0) || 1;
                                                        return rows.map((r: any, index: number) => (
                                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                                <td className="px-6 py-4 text-gray-800 font-medium">{r.region_name || r.region_label || 'Unknown'}</td>
                                                                <td className="px-6 py-4 text-right text-gray-800 font-semibold">{(r.value || 0).toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right text-gray-600">{(((r.value || 0) / total) * 100).toFixed(2)}%</td>
                                                            </tr>
                                                        ));
                                                    }

                                                    // Next prefer regionContributionData if available
                                                    if (regionContributionData && regionContributionData.length > 0) {
                                                        const rows = regionContributionData;
                                                        const total = rows.reduce((s: number, r: any) => s + (r.value || 0), 0) || 1;
                                                        return rows.map((row: any, index: number) => (
                                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                                <td className="px-6 py-4 text-gray-800 font-medium">{`${row.regionName} - ${row.itemName}`}</td>
                                                                <td className="px-6 py-4 text-right text-gray-800 font-semibold">{(row.value || 0).toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right text-gray-600">{(((row.value || 0) / total) * 100).toFixed(2)}%</td>
                                                            </tr>
                                                        ));
                                                    }

                                                    // Fallback to topItemsChartData
                                                    const rows = topItemsChartData;
                                                    const total = rows.reduce((s: number, r: any) => s + (r.value || 0), 0) || 1;
                                                    return rows.map((item: any, index: number) => (
                                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                            <td className="px-6 py-4 text-gray-800 font-medium">{item.name}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800 font-semibold">{searchType === 'quantity' ? `${item.value?.toLocaleString()}` : `${item.value?.toLocaleString()}`}</td>
                                                            <td className="px-6 py-4 text-right text-gray-600">{(((item.value || 0) / total) * 100).toFixed(2)}%</td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Area Performance View */}
                        {selectedMaxView === 'areaPerformance' && props.areaPerformanceData && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Performance Distribution</h3>
                                    <div className="w-full h-[550px]">
                                        <ExplodedDonutChart
                                            data={props.areaPerformanceData}
                                            innerRadius={30}
                                            outerRadius={60}
                                            size="60%"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Performance Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Area Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Performance</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {props.areaPerformanceData.map((area: any, index: number) => {
                                                const totalPerformance = props.areaPerformanceData.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{area.name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {area.value?.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600">
                                                            {((area.value / totalPerformance) * 100).toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Area Visited Customers View */}
                        {selectedMaxView === 'areaVisited' && props.areaVisitedCustomerData && props.areaVisitedCustomerData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Visited Customers Trend</h3>
                                    <div className="w-full h-[400px]">
                                        <DualColumn3DChart
                                            data={props.areaVisitedCustomerData}
                                            xAxisKey="area_name"
                                            series1Key="total_customers"
                                            series1Name="Total Customers"
                                            series2Key="visited_customers"
                                            series2Name="Visited Customers"
                                            height="350px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Visited Customers Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Area Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Total Customers</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Visited Customers</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Visit Rate (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {props.areaVisitedCustomerData.map((area: any, index: number) => {
                                                const visitRate = area.total_customers > 0 ? ((area.visited_customers / area.total_customers) * 100).toFixed(2) : 0;
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{area.area_name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{area.total_customers?.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{area.visited_customers?.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{visitRate}%</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Warehouse Level - Area Contribution View */}
                        {selectedMaxView === 'area' && dataLevel === 'warehouse' && props.warehouseAreaContributionData && props.warehouseAreaContributionData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Contribution Distribution</h3>
                                    <div className="w-full h-[400px]">
                                        <MaximizedExplodedPieChart data={props.warehouseAreaContributionData} outerRadius={150} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Contribution Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Area Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution Value</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {props.warehouseAreaContributionData.map((area: any, index: number) => {
                                                const totalContribution = props.warehouseAreaContributionData.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{area.name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {area.value?.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600">
                                                            {((area.value / totalContribution) * 100).toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'areaSales' && dataLevel === 'company' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Sales Distribution</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart data={salesareaData} xAxisKey="name" yAxisKey="value" colors={channelColors} height="480px" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Sales Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Area Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesareaData.map((area: any, index: number) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{area.name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                        {area.value?.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Channels View */}
                        {selectedMaxView === 'channels' && channelSalesData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Channel Sales Distribution</h3>
                                    <MaximizedExplodedPieChart data={channelSalesData} outerRadius={200} />
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Channel Sales Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Channel Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {channelSalesData.map((channel: any, index: number) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{channel.name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                        {channel.value?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-600">
                                                        {channel.percentage?.toFixed(2)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Customer Categories View */}
                        {selectedMaxView === 'customerCategories' && customerCategorySalesData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Customer Category Sales Distribution</h3>
                                    <MaximizedExplodedPieChart data={customerCategorySalesData} innerRadius={100} outerRadius={200} />
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Customer Category Sales Table</h3>
                                    <div className="overflow-x-auto max-h-[600px]">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Customer Category</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customerCategorySalesData.map((category: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{category.name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {category.value?.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-600">
                                                            {category.percentage?.toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Top Channels View */}
                        {selectedMaxView === 'topChannels' && topChannelsData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Channels Distribution</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart data={topChannelsData} xAxisKey="name" yAxisKey="value" colors={channelColors} height="480px" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Channels Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Channel Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topChannelsData.map((channel: any, index: number) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{channel.name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                        {channel.value?.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Top Customer Categories View */}
                        {selectedMaxView === 'topCustomerCategories' && topCustomerCategoriesData.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Customer Categories Distribution</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart data={topCustomerCategoriesData} xAxisKey="name" yAxisKey="value" colors={customerCategoryColors} height="480px" />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Customer Categories Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Customer Category</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topCustomerCategoriesData.map((category: any, index: number) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{category.name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                        {category.value?.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                        {/* Item Report Views */}

                        {selectedMaxView === 'regionItemPerformance' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Region Wise Item Performance</h3>
                                    <MaximizedExplodedPieChart
                                        data={(dashboardData?.region_wise_item_performance || []).map((item: any, idx: number) => ({
                                            name: item.region_name,
                                            value: item.total_sales || 0,
                                            color: regionColors[idx % regionColors.length]
                                        }))}
                                        outerRadius={200}
                                    />
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm mt-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Region Wise Item Performance Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">S. No.</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Region Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Total Sales</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(dashboardData?.region_wise_item_performance || []).map((item: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{idx + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{item.region_name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{toInternationalNumber(item.total_sales || 0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}


                        {selectedMaxView === 'areaItemPerformance' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Area Wise Item Performance</h3>
                                    <MaximizedExplodedPieChart
                                        data={(dashboardData?.area_wise_item_performance || []).map((item: any, idx: number) => ({
                                            name: item.area_name,
                                            value: item.total_sales || 0,
                                            color: areaColors[idx % areaColors.length]
                                        }))}
                                        outerRadius={200}
                                    />
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm mt-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Area Wise Item Performance Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">S. No.</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Area Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Total Sales</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(dashboardData?.area_wise_item_performance || []).map((item: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{idx + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{item.area_name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{toInternationalNumber(item.total_sales || 0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Comparison Charts Maximized Views */}
                        {selectedMaxView === 'comparisonTopCategoriesCurrent' && topCategoriesCurrent.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Top Categories</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart
                                            data={topCategoriesCurrent.map((i: any) => ({ name: i.item_category_name, value: i.current_sales }))}
                                            xAxisKey="name"
                                            yAxisKey="value"
                                            colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']}
                                            height="480px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Top Categories Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Category Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Sales</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topCategoriesCurrent.map((item: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{item.item_category_name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {item.current_sales?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'comparisonTopItemsCurrent' && topItemsCurrent.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Top Items</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart
                                            data={topItemsCurrent.map((i: any) => ({ name: i.item_name, value: i.current_sales }))}
                                            xAxisKey="name"
                                            yAxisKey="value"
                                            colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                            height="480px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Top Items Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Item Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Sales</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topItemsCurrent.map((item: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{item.item_name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {item.current_sales?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'comparisonTopItemsPrevious' && topItemsPrevious.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Previous Top Items</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart
                                            data={topItemsPrevious.map((i: any) => ({ name: i.item_name, value: i.previous_sales }))}
                                            xAxisKey="name"
                                            yAxisKey="value"
                                            colors={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#14b8a6', '#0ea5e9', '#06b6d4', '#f59e0b', '#f97316']}
                                            height="480px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Previous Top Items Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Item Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Sales</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topItemsPrevious.map((item: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{item.item_name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {item.previous_sales?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'comparisonTopCategoriesPrevious' && topCategoriesPrevious.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Previous Top Categories</h3>
                                    <div className="w-full h-[520px]">
                                        <Column3DChart
                                            data={topCategoriesPrevious.map((i: any) => ({ name: i.item_category_name, value: i.previous_sales }))}
                                            xAxisKey="name"
                                            yAxisKey="value"
                                            colors={['#8b5cf6', '#a78bfa', '#c084fc', '#d8b4fe', '#f3e8ff', '#818cf8', '#6366f1', '#4f46e5', '#3730a3', '#312e81']}
                                            height="480px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Previous Top Categories Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Category Name</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Sales</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topCategoriesPrevious.map((item: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{item.item_category_name}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                            {item.previous_sales?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'comparisonTrend' && comparisonTrend.length > 0 && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Comparison Trend</h3>
                                    <div className="w-full h-[500px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={comparisonTrend} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="period" tick={(props) => {
                                                    const { x, y, payload } = props;
                                                    return (
                                                        <g transform={`translate(${x},${y}) rotate(-45)`}>
                                                            <text
                                                                x={0}
                                                                y={0}
                                                                dy={10}
                                                                textAnchor="end"
                                                                fill="#4b5563"
                                                                fontSize={11}
                                                            >
                                                                {payload.value}
                                                            </text>
                                                        </g>
                                                    );
                                                }} textAnchor="end" height={80} />
                                                <YAxis tickFormatter={(value) => `${formatNumberShort(value)}`} tick={{ fontSize: 13 }} />
                                                <Tooltip formatter={(value: any) => `${value.toLocaleString()}`} />
                                                <Legend verticalAlign="top" height={36} />
                                                <Line name="Current" type="monotone" dataKey="current_sales" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                <Line name="Previous" type="monotone" dataKey="previous_sales" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Comparison Trend Table</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Current Sales</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Previous Sales</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {comparisonTrend.map((item: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{item.period}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{item.current_sales?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{item.previous_sales?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'purchaseTrend' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Purchase Trend</h3>
                                    <div className="w-full h-[500px]">
                                        <NeonTrendAreaChart
                                            data={(dashboardData?.trend?.purchase || []).map((d: any) => ({ period: d.period, Purchase: d.total_purchase }))}
                                            areas={['Purchase']}
                                            title="Purchase Trend"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Purchase Trend Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Purchase Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboardData?.trend?.purchase || []).map((d: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{d.period}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">{d.total_purchase?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'returnTrend' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Return Trend</h3>
                                    <div className="w-full h-[500px]">
                                        <NeonTrendAreaChart
                                            data={(dashboardData?.trend?.return || []).map((d: any) => ({ period: d.period, Return: d.total_return }))}
                                            areas={['Return']}
                                            title="Return Trend"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Return Trend Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Return Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboardData?.trend?.return || []).map((d: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{d.period}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">{d.total_return?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'salesTrend' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Sales Trend</h3>
                                    <div className="w-full h-[500px]">
                                        <NeonTrendAreaChart
                                            data={(dashboardData?.trend?.sales || []).map((d: any) => ({ period: d.period, Sales: d.total_sales }))}
                                            areas={['Sales']}
                                            title="Sales Trend"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Sales Trend Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboardData?.trend?.sales || []).map((d: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{d.period}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">{d.total_sales?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Ranking Maximized Views */}
                        {selectedMaxView === 'mostSold' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Most Sold Item</h3>
                                    <div className="w-full h-[500px]">
                                        <Column3DChart
                                            data={(dashboardData?.item_ranking?.top_10_sales || []).map((i: any) => ({ name: i.item_name, value: i.value }))}
                                            xAxisKey="name"
                                            yAxisKey="value"
                                            colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                            height="500px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Most Sold Item Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Item Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboardData?.item_ranking?.top_10_sales || []).map((item: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{i + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{item.item_name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">{item.value?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'mostPurchased' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Most Purchased Item</h3>
                                    <div className="w-full h-[500px]">
                                        <Column3DChart
                                            data={(dashboardData?.item_ranking?.top_10_purchase || []).map((i: any) => ({ name: i.item_name, value: i.value }))}
                                            xAxisKey="name"
                                            yAxisKey="value"
                                            colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                            height="500px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Most Purchased Item Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Item Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboardData?.item_ranking?.top_10_purchase || []).map((item: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{i + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{item.item_name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">{item.value?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'leastSold' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Least Selling Item</h3>
                                    <div className="w-full h-[500px]">
                                        <Column3DChart
                                            data={(dashboardData?.item_ranking?.least_10_sales || []).map((i: any) => ({ name: i.item_name, value: i.value }))}
                                            xAxisKey="name"
                                            yAxisKey="value"
                                            colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                            height="500px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Least Selling Item Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Item Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboardData?.item_ranking?.least_10_sales || []).map((item: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{i + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{item.item_name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">{item.value?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'leastPurchased' && (
                            <>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Least Purchased Item</h3>
                                    <div className="w-full h-[500px]">
                                        <Column3DChart
                                            data={(dashboardData?.item_ranking?.least_10_purchase || []).map((i: any) => ({ name: i.item_name, value: i.value }))}
                                            xAxisKey="name"
                                            yAxisKey="value"
                                            colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                            height="500px"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white p-6 border rounded-lg shadow-sm">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Least Purchased Item Table</h3>
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Item Name</th>
                                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dashboardData?.item_ranking?.least_10_purchase || []).map((item: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{i + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{item.item_name}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">{item.value?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {selectedMaxView === 'poOrderOverTime' && (() => {
                            const ordersTrendRaw = dashboardData?.data?.trend_line?.orders_over_time || [];
                            const trendChartData = ordersTrendRaw.map((d: any) => ({
                                period: d.period,
                                'Total Orders': d.total_orders ?? 0,
                                'Order Pending': d.order_pending ?? 0,
                                'Delivery Pending': d.delivery_pending ?? 0,
                            }));
                            return (
                                <>
                                    <div className="bg-white p-6 border rounded-lg shadow-sm">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Orders Over Time Trend</h3>
                                        <div className="w-full h-[500px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={trendChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="period" tick={{ fontSize: 12, dy: 5 }} angle={-45} textAnchor="end" height={80} />
                                                    <YAxis tickFormatter={(value) => `${value}`} tick={{ fontSize: 13 }} />
                                                    <Tooltip formatter={(value: any) => `${value}`} />
                                                    <Legend
                                                        verticalAlign="top"
                                                        align="right"
                                                        wrapperStyle={{
                                                            paddingBottom: '20px',
                                                            color: '#1f2937',
                                                            height: '80px',
                                                            overflowY: 'auto',
                                                            fontSize: '11px',
                                                        }}
                                                    />
                                                    <Line type="monotone" dataKey="Total Orders" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                    <Line type="monotone" dataKey="Order Pending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                    <Line type="monotone" dataKey="Delivery Pending" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 border rounded-lg shadow-sm">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Orders Over Time Trend Table</h3>
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Total Orders</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Order Pending</th>
                                                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Delivery Pending</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trendChartData.map((d: any, i: number) => (
                                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-800 font-medium">{d.period}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{d['Total Orders']?.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{d['Order Pending']?.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">{d['Delivery Pending']?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            );
                        })()}

                        {/* Load Unload Views */}
                        {selectedMaxView === 'loadKpi' && (
                            (() => {
                                const kpis = dashboardData?.kpi || { total_load: 0, total_unload: 0, total_sales: 0 };
                                const data = [
                                    { name: 'Load', value: kpis.total_load || 0, color: '#facc15' },
                                    { name: 'Unload', value: kpis.total_unload || 0, color: '#f43f5e' },
                                    { name: 'Sales', value: kpis.total_sales || 0, color: '#10b981' }
                                ];

                                if (data.length === 0) return <div className="p-6 text-center text-gray-500">No data available</div>;

                                return (
                                    <>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">KPI Distribution</h3>
                                            <MaximizedExplodedPieChart data={data} outerRadius={200} />
                                        </div>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">KPI Table</h3>
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Metric</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.map((d, i) => (
                                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-gray-800 font-medium">{d.name}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800 font-semibold">{toInternationalNumber(d.value)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                );
                            })()
                        )}

                        {selectedMaxView === 'salesmanLoadUnload' && (
                            (() => {
                                const salesmen = (dashboardData?.salesman_summary || []).slice(0, 20); // Limit to top 20 for modal
                                const chartData = salesmen.map((s: any) => ({
                                    salesman_name: s.salesman_name,
                                    Sales: s.sales || 0,
                                    Load: s.load || 0,
                                    Unload: s.unload || 0
                                }));
                                const areas = ['Sales', 'Load', 'Unload'];
                                const normalNumberFormatter = (value: number) => value.toLocaleString();

                                return (
                                    <>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Salesman Sales Performance</h3>
                                            <div className="w-full h-[500px]">
                                                <NeonTrendAreaChart
                                                    data={chartData}
                                                    areas={areas}
                                                    title="Salesman Performance Trend"
                                                    yAxisFormatter={normalNumberFormatter}
                                                    xAxisKey="salesman_name"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Salesman Table</h3>
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Salesman</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Sales</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Load</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Unload</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {salesmen.map((s: any, i: number) => (
                                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-gray-800 font-medium">{s.salesman_name}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800 font-semibold">{toInternationalNumber(s.sales)}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800">{toInternationalNumber(s.load)}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800">{toInternationalNumber(s.unload)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                );
                            })()
                        )}

                        {selectedMaxView === 'openClosedShopsTrend' && (
                            (() => {
                                const trend = dashboardData["trend-line"]?.data || {};
                                const trendChartData = trend.map((d: any) => ({
                                    "Period": d.period_label,
                                    'Open Shops': d.open_shops ?? 0,
                                    'Closed Shops': d.closed_shops ?? 0,
                                }));
                                const areas = ["Open Shops", "Closed Shops"];
                                const normalNumberFormatter = (value: number) => value.toLocaleString();

                                return (
                                    <>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Open Closed Shops Distribution</h3>
                                            <div className="w-full h-[500px]">
                                                <NeonTrendAreaChart data={trendChartData} areas={areas} title="Open/Closed Shops Trend" xAxisKey="Period" yAxisFormatter={normalNumberFormatter} />
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Open Closed Shops Table</h3>
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Open Shops</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Closed Shops</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trend.map((t: any, i: number) => (
                                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-gray-800 font-medium">{t.period_label}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800">{t.open_shops?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800">{t.closed_shops?.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                );
                            })()
                        )}

                        {selectedMaxView === 'loadUnloadTrend' && (
                            (() => {
                                const trend = dashboardData?.trend || [];
                                const chartData = trend.map((t: any) => ({
                                    period: t.period,
                                    Load: t.load || 0,
                                    Unload: t.unload || 0,
                                    Sales: t.sales || 0
                                }));
                                const areas = ['Load', 'Unload', 'Sales'];

                                return (
                                    <>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Trend Chart</h3>
                                            <div className="w-full h-[500px]">
                                                <NeonTrendAreaChart data={chartData} areas={areas} title="Load/Unload/Sales Trend" yAxisFormatter={normalNumberFormatter} />
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 border rounded-lg shadow-sm">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Trend Table</h3>
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Period</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Sales</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Load</th>
                                                        <th className="px-6 py-4 text-right font-semibold text-gray-700">Unload</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {chartData.map((t: any, i: number) => (
                                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-gray-800 font-medium">{t.period}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800 font-semibold">{toInternationalNumber(t.Sales)}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800">{toInternationalNumber(t.Load)}</td>
                                                            <td className="px-6 py-4 text-right text-gray-800">{toInternationalNumber(t.Unload)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                );
                            })()
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Company-level sales report layout
    if (dataLevel === 'company' && reportType === 'sales') {
        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />

                {/* Row 1: Company Pie Chart + Region Donut Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Company Sales - Pie Chart */}
                    {companyData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Company Sales</h3>
                                <button
                                    onClick={() => setSelectedMaxView('company')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedPieChart data={companyData} outerRadius={80} />
                            </div>
                        </div>
                    )}

                    {/* Region Sales - Donut Chart */}
                    {regionData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Region Sales</h3>
                                <button
                                    onClick={() => setSelectedMaxView('region')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedDonutChart data={regionData} innerRadius={50} outerRadius={80} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 2: Area 3D Column Graph (Full Width) */}
                {salesareaData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Area Sales</h3>
                            <button
                                onClick={() => setSelectedMaxView('areaSales')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[400px]">
                            <Column3DChart
                                data={salesareaData}
                                // title="Area Sales"
                                xAxisKey="name"
                                yAxisKey="value"
                                colors={areaColors}
                                height="350px"
                            />
                        </div>
                    </div>
                )}

                <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Company Sales Trend</h3>
                        <button
                            onClick={() => setSelectedMaxView('trend')}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <Maximize2 size={16} className="text-gray-600" />
                        </button>
                    </div>
                    <div className="w-full h-[380px]">
                        {companySalesTrend.length === 0 ? (
                            <div className="flex items-center justify-center text-gray-500 text-sm">
                                <AlertCircle size={16} className="mr-2" /> No data available
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={companySalesTrend}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="period"
                                        stroke="#6b7280"
                                        tick={(props) => {
                                            const { x, y, payload } = props;
                                            return (
                                                <g transform={`translate(${x},${y}) rotate(-45)`}>
                                                    <text
                                                        x={0}
                                                        y={0}
                                                        dy={10}
                                                        textAnchor="end"
                                                        fill="#4b5563"
                                                        fontSize={11}
                                                    >
                                                        {payload.value}
                                                    </text>
                                                </g>
                                            );
                                        }}
                                        angle={-45} textAnchor="end" height={80}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px' }}
                                        tickFormatter={(value) => `${formatNumberShort(value)}`}
                                    // tickFormatter={(value: number) => {
                                    //   // Use formatNumberShort for units, then localize the number part
                                    //   if (typeof value !== 'number') return value;
                                    //   if (value < 1000) {
                                    //     return value.toLocaleString();
                                    //   };
                                    //   if (value >= 100000) return ` ${(value / 100000).toFixed(2)}L`;
                                    //   return ` ${value.toLocaleString()}`;
                                    // }}
                                    />
                                    <Tooltip formatter={(value: any) => ` ${value.toLocaleString()}`} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Row 2 - Top Performers: Salesmen and Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Salesmen Chart */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Salesmen</h3>
                            <button onClick={() => setSelectedMaxView('salesmen')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topSalesmenChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topSalesmenChartData} xAxisKey="name" yAxisKey="value" colors={salesmanColors} height="420px" />
                            )}
                        </div>
                    </div>

                    {/* Top Customers Chart */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                            <button onClick={() => setSelectedMaxView('customers')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topCustomersChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topCustomersChartData} xAxisKey="name" yAxisKey="value" colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']} height="420px" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 3 - Top Items + Top Warehouses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Items */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                            <button onClick={() => setSelectedMaxView('items')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topItemsChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart
                                    data={topItemsChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={areaColors}
                                    height="420px"
                                />
                            )}
                        </div>
                    </div>

                    {/* Top Warehouses */}
                    <div className="bg-white p-5 border w-full rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Distributors</h3>
                            <button onClick={() => setSelectedMaxView('warehouses')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topWarehousesChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topWarehousesChartData} xAxisKey="name" yAxisKey="value" colors={warehouseColors} height="420px" width="100%" />
                            )}
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    // If API returned region-level data, render the region-specific 4-row layout (sales reports only)
    if (dataLevel === 'region' && reportType === 'sales') {
        // Prepare region contribution data for pie chart (use region + item labels)
        const regionContributionPieData = (dashboardData?.charts?.region_contribution_top_item || []).map((it: any, i: number) => ({
            name: `${it.region_name || 'Unknown'}`,
            value: it.value || 0,
            color: areaColors[i % areaColors.length]
        }));

        // Prepare region performance data
        const regionPerformanceData = (dashboardData?.tables?.region_performance || []).map((r: any, i: number) => ({
            name: r.region_name,
            value: r.value || 0,
            color: regionColors[i % regionColors.length]
        }));

        // Row3 pivot: build time-series per region
        const periods = Array.from(new Set(regionSalesTrend.map((r: any) => r.period)));
        const regionNames = Array.from(new Set(regionSalesTrend.map((r: any) => r.region_name)));
        const trendSeries = periods.map((p: string) => {
            const obj: any = { period: p };
            regionNames.forEach((rn: string) => {
                const item = regionSalesTrend.find((x: any) => x.period === p && x.region_name === rn);
                obj[rn] = item ? item.value || 0 : 0;
            });
            return obj;
        });

        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />

                {/* Row 1 - Overview: Left Pie (region contribution by item), Right Donut (region performance) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Region Contribution by Top Item (aggregate by region) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Region Contribution</h3>
                            <button onClick={() => setSelectedMaxView('regionItems')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            <ExplodedPieChart
                                data={regionContributionPieData}
                                outerRadius={90}
                            />
                        </div>
                    </div>

                    {/* Right: Region Performance (donut) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Region Performance</h3>
                            <button onClick={() => setSelectedMaxView('region')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-full">
                            <ExplodedDonutChart
                                data={regionPerformanceData}
                                innerRadius={60}
                                outerRadius={100}
                            />
                        </div>
                    </div>
                </div>


                {/* Row 2 - Sales Trend: Neon Area Chart split by region_name */}
                <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Region Sales Trend</h3>
                        <button onClick={() => setSelectedMaxView('trend')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                    </div>
                    <div className="w-full h-[380px]">
                        <NeonTrendAreaChart data={trendSeries} areas={regionNames} title="Region Sales Trend" />
                    </div>
                </div>

                {/* Row 3 - Customer Coverage: 3D Column Chart */}
                <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Visit Customer Trend by Region</h3>
                        <button onClick={() => setSelectedMaxView('regionVisited')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                    </div>
                    <div className="w-full h-[360px]">
                        {regionVisitedCustomerData.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                No data available
                            </div>
                        ) : (
                            <DualColumn3DChart
                                data={regionVisitedCustomerData}
                                xAxisKey="region_name"
                                series1Key="total_customers"
                                series1Name="Total Customers"
                                series2Key="visited_customers"
                                series2Name="Visited Customers"
                                height="320px"
                            />
                        )}
                    </div>
                </div>

                {/* Row 4 - Top Performers: Salesmen and Customers (Charts) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Salesmen Chart (Pie) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Salesmen</h3>
                            <button onClick={() => setSelectedMaxView('salesmen')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topSalesmenChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topSalesmenChartData} xAxisKey="name" yAxisKey="value" colors={salesmanColors} height="420px" />
                            )}
                        </div>
                    </div>

                    {/* Top Customers Chart (Bar) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                            <button onClick={() => setSelectedMaxView('customers')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topCustomersChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topCustomersChartData} xAxisKey="name" yAxisKey="value" colors={regionColors} height="420px" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 5 - Top Items + Top Warehouses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Items */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                            <button onClick={() => setSelectedMaxView('items')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topItemsChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topItemsChartData} xAxisKey="name" yAxisKey="value" colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']} height="420px" />
                            )}
                        </div>
                    </div>

                    {/* Top Warehouses */}
                    <div className="bg-white  border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg p-5 font-semibold text-gray-800">Top Distributors</h3>
                            <button onClick={() => setSelectedMaxView('warehouses')} className="p-1 pr-5 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topWarehousesChartData.length === 0 ? (
                                <div className="flex items-center  justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topWarehousesChartData} xAxisKey="name" yAxisKey="value" colors={warehouseColors} height="420px" />
                            )}
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    // If API returned warehouse-level data, render the warehouse-specific 4-row layout (sales reports only)
    if (dataLevel === 'warehouse' && reportType === 'sales') {
        const warehouseTrend = dashboardData?.charts?.warehouse_trend || [];
        const warehouseSales = dashboardData?.charts?.warehouse_sales || [];
        const regionContribution = dashboardData?.charts?.region_contribution || [];
        const areaContribution = dashboardData?.charts?.area_contribution || [];

        // Warehouse multi-select dropdown
        const WarehouseSelector = () => {
            const [isOpen, setIsOpen] = useState(false);
            const dropdownRef = useRef<HTMLDivElement>(null);

            useEffect(() => {
                const handleClickOutside = (event: MouseEvent) => {
                    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                        setIsOpen(false);
                    }
                };
                document.addEventListener('mousedown', handleClickOutside);
                return () => document.removeEventListener('mousedown', handleClickOutside);
            }, []);

            const handleToggleWarehouse = (warehouseLabel: string) => {
                setSelectedWarehouses(prev => {
                    const isSelected = prev.includes(warehouseLabel);
                    return isSelected
                        ? prev.filter(w => w !== warehouseLabel)
                        : [...prev, warehouseLabel];
                });
            };

            const handleSelectAll = () => {
                setSelectedWarehouses(warehouseSales.map((w: any) => w.warehouse_label));
            };

            const handleClearAll = () => {
                setSelectedWarehouses([]);
            };

            const displayText = selectedWarehouses.length === 0
                ? `All Distributors (${warehouseSales.length})`
                : `${selectedWarehouses.length} Distributor${selectedWarehouses.length > 1 ? 's' : ''} selected`;

            return (
                <div className="relative inline-block" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    >
                        <span>{displayText}</span>
                        <Icon icon="mdi:chevron-down" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} width={16} />
                    </button>

                    {isOpen && (
                        <div className="absolute z-50 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 flex justify-between">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="py-1">
                                {warehouseSales.map((warehouse: any, idx: number) => (
                                    <label
                                        key={idx}
                                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedWarehouses.includes(warehouse.warehouse_label)}
                                            onChange={() => handleToggleWarehouse(warehouse.warehouse_label)}
                                            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 truncate flex-1">{warehouse.warehouse_label}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {((warehouse.value || 0) / 1000000).toFixed(1)}M
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        // Filter warehouse sales based on selection
        const getFilteredWarehouses = () => {
            if (selectedWarehouses.length === 0) {
                return warehouseSales;
            }
            return warehouseSales.filter((w: any) => selectedWarehouses.includes(w.warehouse_label));
        };

        const filteredWarehouses = getFilteredWarehouses();

        // Prepare region contribution data for pie chart
        const regionContributionPieData = (() => {
            const data = regionContribution.reduce((acc: any, it: any) => {
                const key = it.region_name || it.region_label || 'Unknown';
                acc[key] = (acc[key] || 0) + (it.value || 0);
                return acc;
            }, {} as Record<string, number>);

            // Convert object to array for pie chart
            return Object.entries(data).map(([name, value], i) => ({
                name,
                value,
                color: regionColors[i % regionColors.length]
            }));
        })();

        // Prepare area contribution data for donut chart
        const areaContributionPieData = areaContribution.map((r: any, i: number) => ({
            name: r.area_name || r.area_label,
            value: r.value || 0,
            color: areaColors[i % areaColors.length]
        }));

        const periods = Array.from(new Set(warehouseTrend.map((r: any) => r.period))) as string[];
        const warehouseNames = Array.from(new Set(warehouseTrend.map((r: any) => r.warehouse_label))) as string[];
        const trendSeries: any[] = periods.map((p: string) => {
            const obj: any = { period: p };
            warehouseNames.forEach((wn: string) => {
                const item = warehouseTrend.find((x: any) => x.period === p && x.warehouse_label === wn);
                obj[wn] = item ? item.value || 0 : 0;
            });
            return obj;
        });

        return (
            <div className="mt-5 space-y-6">
                <MaximizedView warehouseAreaContributionData={areaContributionPieData} regionContributionData={regionContributionPieData} />

                {/* Row 1 - Overview: Left Pie (region contribution), Right Donut (area contribution) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Region Contribution</h3>
                            <button onClick={() => setSelectedMaxView('regionItems')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-full">
                            {regionContributionPieData.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <ExplodedPieChart
                                    data={regionContributionPieData}
                                    outerRadius={90}
                                />
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Area Contribution</h3>
                            <button onClick={() => setSelectedMaxView('area')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full">
                            {areaContributionPieData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <ExplodedDonutChart
                                    data={areaContributionPieData}
                                    innerRadius={60}
                                    outerRadius={100}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2 - Warehouse Sales: Show both chart and table if >= 10 selected, only table if < 10 */}
                {filteredWarehouses.length >= 10 ? (
                    <>
                        {/* 3D Column Chart for 10+ warehouses */}
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-gray-800">Distributor Sales</h3>
                                    <WarehouseSelector />
                                </div>
                                <button onClick={() => setSelectedMaxView('warehouseSales')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                            </div>
                            <div className="w-full h-[360px]">
                                {filteredWarehouses.length === 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                        <AlertCircle size={16} className="mr-2" /> No data available
                                    </div>
                                ) : (
                                    <Column3DChart
                                        data={filteredWarehouses}
                                        title="Distributor Sales"
                                        xAxisKey="warehouse_label"
                                        yAxisKey="value"
                                        colors={warehouseColors}
                                        height="320px"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Table for 10+ warehouses */}
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Distributor Sales Table</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Distributor Name</th>
                                            <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                                            <th className="px-6 py-4 text-right font-semibold text-gray-700">Contribution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredWarehouses.map((warehouse: any, index: number) => {
                                            const totalSales = filteredWarehouses.reduce((sum: number, w: any) => sum + (w.value || 0), 0);
                                            return (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{warehouse.warehouse_label}</td>
                                                    <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                                                        {(warehouse.value || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-gray-600">
                                                        {((warehouse.value / totalSales) * 100).toFixed(2)}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : filteredWarehouses.length > 0 ? (
                    /* Table only for < 10 warehouses */
                    <>
                        {/* <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-800">Warehouse Sales</h3>
                <WarehouseSelector />
              </div>
              <button onClick={() => setSelectedMaxView('warehouseSales')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700"></th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Quantity</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-700">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarehouses.map((warehouse: any, index: number) => {
                    const totalSales = filteredWarehouses.reduce((sum: number, w: any) => sum + (w.value || 0), 0);
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                        <td className="px-6 py-4 text-gray-800 font-medium">{warehouse.warehouse_label}</td>
                        <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                          {(warehouse.value || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {((warehouse.value / totalSales) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div> */}
                    </>
                ) : null}

                {/* Row 3 - Sales Trend: Neon Area Chart split by warehouse_label */}
                <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Distributor Sales Trend</h3>
                        <button onClick={() => setSelectedMaxView('trend')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                    </div>
                    <div className="w-full h-[500px]">
                        {trendSeries.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                <AlertCircle size={16} className="mr-2" /> No data available
                            </div>
                        ) : (
                            <NeonTrendAreaChart data={trendSeries} areas={warehouseNames} title="Distributor Sales Trend" />
                        )}
                    </div>
                </div>

                {/* Row 4 - Top Items + Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                            <button onClick={() => setSelectedMaxView('items')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {(dashboardData?.tables?.top_items || []).length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart
                                    data={(dashboardData?.tables?.top_items || []).map((t: any, i: number) => ({
                                        name: t.item_name || t.name,
                                        value: t.value || 0,
                                        color: areaColors[i % areaColors.length]
                                    }))}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={areaColors}
                                    height="420px"
                                />
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                            <button onClick={() => setSelectedMaxView('customers')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {(dashboardData?.tables?.top_customers || []).length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart
                                    data={(dashboardData?.tables?.top_customers || []).map((t: any, i: number) => ({
                                        name: t.customer_name || t.name,
                                        value: t.value || 0,
                                        color: regionColors[i % regionColors.length]
                                    }))}
                                    title=""
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={regionColors}
                                    height="420px"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 5 - Top Warehouses and Top Salesman (Full width) */}
                <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
                    {/* Top Warehouses Chart */}
                    {topWarehousesChartData.length > 0 ?
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Distributors</h3>
                                <button onClick={() => setSelectedMaxView('warehouses')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                            </div>
                            <div className="w-full h-[420px]">

                                <Column3DChart data={topWarehousesChartData} xAxisKey="name" yAxisKey="value" colors={warehouseColors} height="420px" />

                            </div>
                            {/* If more than 10 warehouses, show a message or scroll */}
                            {topWarehousesChartData.length > 10 && (
                                <div className="mt-2 text-xs text-gray-500">Showing top 10 Distributors. Use filters to see more.</div>
                            )}
                        </div> : null
                    }

                    {/* Top Salesman Chart */}
                    {topSalesmenChartData.length > 0 ?
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Salesman</h3>
                                <button onClick={() => setSelectedMaxView('salesmen')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                            </div>
                            <div className="w-full h-[420px]">

                                <Column3DChart data={topSalesmenChartData} xAxisKey="name" yAxisKey="value" colors={salesmanColors} height="420px" />

                            </div>
                            {/* If more than 10 salesmen, show a message or scroll */}
                            {topSalesmenChartData.length > 10 && (
                                <div className="mt-2 text-xs text-gray-500">Showing top 10 salesmen. Use filters to see more.</div>
                            )}
                        </div>
                        : null
                    }
                </div>
            </div>
        );
    }

    // If API returned area-level data, render the area-specific 4-row layout (sales reports only)
    if (dataLevel === 'area' && reportType === 'sales') {
        // Prepare area contribution data for pie chart
        const areaContributionPieData = (() => {
            const data = areaContributionData.reduce((acc: any, it: any) => {
                const key = it.areaName || it.area_name || 'Unknown';
                acc[key] = (acc[key] || 0) + (it.value || 0);
                return acc;
            }, {} as Record<string, number>);

            // Convert object to array for pie chart
            return Object.entries(data).map(([name, value], i) => ({
                name,
                value,
                color: areaColors[i % areaColors.length]
            }));
        })();

        // Prepare area performance data
        const areaPerformanceData = (dashboardData?.tables?.area_performance || []).map((r: any, i: number) => ({
            name: r.area_name,
            value: r.value || 0,
            color: areaPerformanceColors[i % areaPerformanceColors.length]
        }));

        // Row 3 pivot: build time-series per area
        const areaPeriods = Array.from(new Set(areaSalesTrend.map((r: any) => r.period)));
        const areaNames = Array.from(new Set(areaSalesTrend.map((r: any) => r.area_name)));
        const areaTrendSeries = areaPeriods.map((p: string) => {
            const obj: any = { period: p };
            areaNames.forEach((an: string) => {
                const item = areaSalesTrend.find((x: any) => x.period === p && x.area_name === an);
                obj[an] = item ? item.value || 0 : 0;
            });
            return obj;
        });

        return (
            <div className="mt-5 space-y-6">
                <MaximizedView areaPerformanceData={areaPerformanceData} areaVisitedCustomerData={areaVisitedCustomerData} />

                {/* Row 1 - Overview: Left Pie (area contribution by item), Right Donut (area performance) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Area Contribution by Top Item (aggregate by area) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Area Contribution</h3>
                            <button onClick={() => setSelectedMaxView('areaItems')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full">
                            {areaContributionPieData.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <ExplodedPieChart
                                    data={areaContributionPieData}
                                    outerRadius={90}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right: Area Performance (donut) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Area Performance</h3>
                            <button onClick={() => setSelectedMaxView('areaPerformance')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full">
                            {areaPerformanceData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <ExplodedDonutChart
                                    data={areaPerformanceData}
                                    innerRadius={60}
                                    outerRadius={100}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2 - Sales Trend: Neon Area Chart split by area_name */}
                <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Area Sales Trend</h3>
                        <button
                            onClick={() => setSelectedMaxView('trend')}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <Maximize2 size={16} className="text-gray-600" />
                        </button>
                    </div>
                    <div className="w-full h-[380px]">
                        {areaTrendSeries.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                No data available
                            </div>
                        ) : (
                            <NeonTrendAreaChart data={areaTrendSeries} areas={areaNames} title="Area Sales Trend" />
                        )}
                    </div>
                </div>

                {/* Row 3 - Customer Coverage: 3D Column Chart */}
                <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Visited Customer Trend by Area</h3>
                        <button onClick={() => setSelectedMaxView('areaVisited')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                    </div>
                    <div className="w-full h-[360px]">
                        {areaVisitedCustomerData.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                <AlertCircle size={16} className="mr-2" /> No data available
                            </div>
                        ) : (
                            <DualColumn3DChart
                                data={areaVisitedCustomerData}
                                xAxisKey="area_name"
                                series1Key="total_customers"
                                series1Name="Total Customers"
                                series2Key="visited_customers"
                                series2Name="Visited Customers"
                                height="320px"
                            />
                        )}
                    </div>
                </div>


                {/* Row 4 - Top Performers: Salesmen and Customers (Charts) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Salesmen Chart (Pie) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Salesmen</h3>
                            <button onClick={() => setSelectedMaxView('salesmen')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topSalesmenChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topSalesmenChartData} xAxisKey="name" yAxisKey="value" colors={salesmanColors} height="420px" />
                            )}
                        </div>
                    </div>

                    {/* Top Customers Chart (Bar) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                            <button onClick={() => setSelectedMaxView('customers')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topCustomersChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topCustomersChartData} title="" xAxisKey="name" yAxisKey="value" colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']} height="420px" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 5 - Top Items + Top Warehouses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Items */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                            <button onClick={() => setSelectedMaxView('items')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full h-[420px]">
                            {topItemsChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart
                                    data={topItemsChartData}
                                    // title="Top Items"
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={areaColors}
                                    height="420px"
                                />
                            )}
                        </div>
                    </div>

                    {/* Top Warehouses */}
                    <div className="bg-white p-5 border w-full rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Distributors</h3>
                            <button onClick={() => setSelectedMaxView('warehouses')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>
                        <div className="w-full  flex flex-wrap h-[420px]">
                            {topWarehousesChartData.length === 0 ? (
                                <div className="flex items-center justify-center text-gray-500 text-sm">
                                    <AlertCircle size={16} className="mr-2" /> No data available
                                </div>
                            ) : (
                                <Column3DChart data={topWarehousesChartData} xAxisKey="name" yAxisKey="value" colors={warehouseColors} height="420px" width="100%" />
                            )}
                        </div>
                    </div>
                </div>

            </div>
        );
    }


    // Item-level KPIs for item report type (company level)
    // Item-level KPIs for item report type
    if (reportType === 'item') {
        const kpisData = dashboardData?.kpis || {};

        // Determine which level we are at to decide what charts to show
        // The user wants "Item Performance Chart (area wise)" and "Top performance Item - region wise"
        // We check if data exists in dashboardData
        const regionWiseData = dashboardData?.region_wise_item_performance || [];
        const areaWiseData = dashboardData?.area_wise_item_performance || [];
        const trendData = dashboardData?.trend || {};
        const itemRanking = dashboardData?.item_ranking || {};

        const kpiCards = [
            {
                title: 'Total Items',
                value: Math.floor((kpisData.total_items ?? 0)).toLocaleString(),
                icon: 'mdi:package-variant',
                color: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)",
            },
            {
                title: 'Total Sales',
                value: Math.floor((kpisData.total_sales ?? 0)).toLocaleString(),
                icon: 'mdi:currency-usd',
                color: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            },
            {
                title: 'Total Purchase',
                value: Math.floor((kpisData.total_purchase ?? 0)).toLocaleString(),
                icon: 'mdi:cart-arrow-down',
                color: "linear-gradient(135deg, #22d3ee 0%, #4ade80 100%)",
            },
            {
                title: 'Total Return',
                value: Math.floor((kpisData.total_return ?? 0)).toLocaleString(),
                icon: 'mdi:backup-restore',
                color: "linear-gradient(135deg, #64748b 0%, #a1a1aa 100%)",
            },
        ];

        // Transform data for charts
        const regionChartData = regionWiseData.map((item: any, idx: number) => ({
            name: item.region_name,
            value: item.total_sales || 0,
            color: regionColors[idx % regionColors.length]
        }));

        const areaChartData = areaWiseData.map((item: any, idx: number) => ({
            name: item.area_name,
            value: item.total_sales || 0,
            color: areaColors[idx % areaColors.length]
        }));

        // Trend data
        const salesTrendRaw = trendData.sales || [];
        const purchaseTrendRaw = trendData.purchase || [];

        // Combine for trend chart if needed, or just show sales trend
        // The user asked for "trend" in the list but didn't specify chart type exactly, assuming Area/Line like others.
        // However, the JSON has "trend": { "sales": [], "purchase": [], "return": [] }
        // Let's format it for the AreaChart/LineChart
        // We need to merge them by period? The periods logic in component handles sorting.

        // For now, let's just map the sales trend as that's consistent with other views
        const itemSalesTrend = salesTrendRaw.map((d: any) => ({
            period: d.period,
            value: d.total_sales
        }));

        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((card, index) => (
                        <div
                            key={index}
                            className="flex items-center rounded-xl shadow-lg border border-gray-100 p-3"
                            style={{
                                background: card.color,
                                color: '#fff',
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                minHeight: 80,
                            }}
                        >
                            <div className="p-3 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Icon icon={card.icon} width="32" height="32" color="#fff" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-xs font-medium opacity-90" style={{ color: '#fff' }}>{card.title}</p>
                                <p className="mt-1 font-bold text-xl" style={{ color: '#fff' }}>{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Region & Area Pie Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Region wise Item Performance */}
                    {regionChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Region Wise Item Performance</h3>
                                <button
                                    onClick={() => setSelectedMaxView('regionItemPerformance')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedPieChart data={regionChartData} outerRadius={80} />
                            </div>
                        </div>
                    )}

                    {/* Area Wise Item Performance */}
                    {areaChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Area Wise Item Performance</h3>
                                <button
                                    onClick={() => setSelectedMaxView('areaItemPerformance')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedPieChart data={areaChartData} outerRadius={80} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Item Performance Trend */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Item Performance Trend</h2>

                    {/* Purchase Trend */}
                    {purchaseTrendRaw.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Purchase Trend</h3>
                                <button
                                    onClick={() => setSelectedMaxView('purchaseTrend')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[350px]">
                                <NeonTrendAreaChart
                                    data={purchaseTrendRaw.map((d: any) => ({ period: d.period, Purchase: d.total_purchase }))}
                                    areas={['Purchase']}
                                    title="Purchase Trend"
                                />
                            </div>
                        </div>
                    )}

                    {/* Return Trend */}
                    {(trendData.return || []).length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Return Trend</h3>
                                <button
                                    onClick={() => setSelectedMaxView('returnTrend')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[350px]">
                                <NeonTrendAreaChart
                                    data={(trendData.return || []).map((d: any) => ({ period: d.period, Return: d.total_return }))}
                                    areas={['Return']}
                                    title="Return Trend"
                                />
                            </div>
                        </div>
                    )}

                    {/* Sales Trend */}
                    {salesTrendRaw.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Sales Trend</h3>
                                <button
                                    onClick={() => setSelectedMaxView('salesTrend')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[350px]">
                                <NeonTrendAreaChart
                                    data={salesTrendRaw.map((d: any) => ({ period: d.period, Sales: d.total_sales }))}
                                    areas={['Sales']}
                                    title="Sales Trend"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Item Rankings */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Item Ranking</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Most Sold Item */}
                        {itemRanking.top_10_sales && itemRanking.top_10_sales.length > 5 && (
                            <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Most Sold Item</h3>
                                    <button
                                        onClick={() => setSelectedMaxView('mostSold')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                                <div className="w-full h-[400px]">
                                    <Column3DChart
                                        data={itemRanking.top_10_sales.map((i: any) => ({ name: i.item_name, value: i.value }))}
                                        xAxisKey="name"
                                        yAxisKey="value"
                                        colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Most Purchase Item */}
                        {itemRanking.top_10_purchase && itemRanking.top_10_purchase.length > 5 && (
                            <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Most Purchased Item</h3>
                                    <button
                                        onClick={() => setSelectedMaxView('mostPurchased')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                                <div className="w-full h-[400px]">
                                    <Column3DChart
                                        data={itemRanking.top_10_purchase.map((i: any) => ({ name: i.item_name, value: i.value }))}
                                        xAxisKey="name"
                                        yAxisKey="value"
                                        colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Least Selling Item */}
                        {itemRanking.least_10_sales && itemRanking.least_10_sales.length > 5 && (
                            <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Least Selling Item</h3>
                                    <button
                                        onClick={() => setSelectedMaxView('leastSold')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                                <div className="w-full h-[400px]">
                                    <Column3DChart
                                        data={itemRanking.least_10_sales.map((i: any) => ({ name: i.item_name, value: i.value }))}
                                        xAxisKey="name"
                                        yAxisKey="value"
                                        colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Least Purchase Item */}
                        {itemRanking.least_10_purchase && itemRanking.least_10_purchase.length > 5 && (
                            <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Least Purchased Item</h3>
                                    <button
                                        onClick={() => setSelectedMaxView('leastPurchased')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                                <div className="w-full h-[400px]">
                                    <Column3DChart
                                        data={itemRanking.least_10_purchase.map((i: any) => ({ name: i.item_name, value: i.value }))}
                                        xAxisKey="name"
                                        yAxisKey="value"
                                        colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        )}

                        {/* for Item level */}
                        {/* Most Sold Item */}
                        {itemRanking.top_5_sales && itemRanking.top_5_sales.length >= 5 && (
                            <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Most Sold Item</h3>
                                    <button
                                        onClick={() => setSelectedMaxView('mostSold')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                                <div className="w-full h-[400px]">
                                    <Column3DChart
                                        data={itemRanking.top_5_sales.map((i: any) => ({ name: i.item_name, value: i.value }))}
                                        xAxisKey="name"
                                        yAxisKey="value"
                                        colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Most Purchase Item */}
                        {itemRanking.top_5_purchase && itemRanking.top_5_purchase.length >= 5 && (
                            <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Most Purchased Item</h3>
                                    <button
                                        onClick={() => setSelectedMaxView('mostPurchased')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                                <div className="w-full h-[400px]">
                                    <Column3DChart
                                        data={itemRanking.top_5_purchase.map((i: any) => ({ name: i.item_name, value: i.value }))}
                                        xAxisKey="name"
                                        yAxisKey="value"
                                        colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Least Selling Item */}
                        {itemRanking.least_5_sales && itemRanking.least_5_sales.length >= 5 && (
                            <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Least Selling Item</h3>
                                    <button
                                        onClick={() => setSelectedMaxView('leastSold')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                                <div className="w-full h-[400px]">
                                    <Column3DChart
                                        data={itemRanking.least_5_sales.map((i: any) => ({ name: i.item_name, value: i.value }))}
                                        xAxisKey="name"
                                        yAxisKey="value"
                                        colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Least Purchase Item */}
                        {itemRanking.least_5_purchase && itemRanking.least_5_purchase.length >= 5 && (
                            <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Least Purchased Item</h3>
                                    <button
                                        onClick={() => setSelectedMaxView('leastPurchased')}
                                        className="p-1 hover:bg-gray-100 rounded"
                                    >
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                                <div className="w-full h-[400px]">
                                    <Column3DChart
                                        data={itemRanking.least_5_purchase.map((i: any) => ({ name: i.item_name, value: i.value }))}
                                        xAxisKey="name"
                                        yAxisKey="value"
                                        colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // KPIs for Po Order report type
    if (reportType === 'poOrder') {
        const kpisData = dashboardData?.data?.kpis || {};
        const trendData = dashboardData?.data?.trend_line || {};
        const kpiCards = [
            {
                title: 'Pending Delivery',
                value: Math.floor((kpisData.delivery_pending ?? 0)).toLocaleString(),
                icon: 'mdi:package-variant',
                color: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)",
            },
            {
                title: 'Pending Order',
                value: Math.floor((kpisData.order_pending ?? 0)).toLocaleString(),
                icon: 'mdi:currency-usd',
                color: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            },
            {
                title: 'Total Orders',
                value: Math.floor((kpisData.total_orders ?? 0)).toLocaleString(),
                icon: 'mdi:cart-arrow-down',
                color: "linear-gradient(135deg, #22d3ee 0%, #4ade80 100%)",
            },
        ];

        // Trend data
        const ordersTrendRaw = trendData.orders_over_time || [];
        // Prepare data for multi-series line chart
        // Each object: { period, total_orders, order_pending, delivery_pending }
        const trendChartData = ordersTrendRaw.map((d: any) => ({
            period: d.period,
            'Total Orders': d.total_orders ?? 0,
            'Order Pending': d.order_pending ?? 0,
            'Delivery Pending': d.delivery_pending ?? 0,
        }));

        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kpiCards.map((card, index) => (
                        <div
                            key={index}
                            className="flex items-center rounded-xl shadow-lg border border-gray-100 p-3"
                            style={{
                                background: card.color,
                                color: '#fff',
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                minHeight: 80,
                            }}
                        >
                            <div className="p-3 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Icon icon={card.icon} width="32" height="32" color="#fff" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-xs font-medium opacity-90" style={{ color: '#fff' }}>{card.title}</p>
                                <p className="mt-1 font-bold text-xl" style={{ color: '#fff' }}>{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Orders Over Time Trend (Multi-series LineChart) */}
                {trendChartData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Orders Over Time Trend</h3>
                            <button
                                onClick={() => setSelectedMaxView('poOrderOverTime')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="period" tick={{ fontSize: 12, dy: 5 }} angle={-45} textAnchor="end" height={80} />
                                    <YAxis tickFormatter={(value) => `${value}`} tick={{ fontSize: 13 }} />
                                    <Tooltip formatter={(value: any) => `${value}`} />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        wrapperStyle={{
                                            paddingBottom: '20px',
                                            color: '#1f2937',
                                            height: '80px',
                                            overflowY: 'auto',
                                            fontSize: '13px',
                                        }}
                                    // onClick={(e: any) => {
                                    //   if (!e || !e.dataKey) return;
                                    //   setHiddenPoOrderLines((prev: string[]) => prev.includes(e.dataKey) ? prev.filter((k) => k !== e.dataKey) : [...prev, e.dataKey]);
                                    // }}
                                    // formatter={(value) => (
                                    //   <span style={{
                                    //     color: hiddenPoOrderLines.includes(value) ? '#000000' : '#1f2937',
                                    //     fontSize: '12px',
                                    //     cursor: 'pointer',
                                    //     textDecoration: hiddenPoOrderLines.includes(value) ? 'line-through' : 'none'
                                    //   }}>
                                    //     {value}
                                    //   </span>
                                    // )}
                                    />
                                    {/* {!hiddenPoOrderLines.includes('Total Orders') && (
                    <Line type="monotone" dataKey="Total Orders" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  )}
                  {!hiddenPoOrderLines.includes('Order Pending') && (
                    <Line type="monotone" dataKey="Order Pending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  )}
                  {!hiddenPoOrderLines.includes('Delivery Pending') && (
                    <Line type="monotone" dataKey="Delivery Pending" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  )} */}
                                    <Line type="monotone" dataKey="Total Orders" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    <Line type="monotone" dataKey="Order Pending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    <Line type="monotone" dataKey="Delivery Pending" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Comparison Report Type Logic
    if (reportType === 'comparison') {
        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />

                {/* Current Top Categires & Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {topCategoriesCurrent.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Current Top Categories</h3>
                                <button
                                    onClick={() => setSelectedMaxView('comparisonTopCategoriesCurrent')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[400px]">
                                <Column3DChart
                                    data={topCategoriesCurrent.map((i: any) => ({ name: i.item_category_name, value: i.current_sales }))}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']}
                                    height="400px"
                                />
                            </div>
                        </div>
                    )}

                    {topItemsCurrent.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Current Top Items</h3>
                                <button
                                    onClick={() => setSelectedMaxView('comparisonTopItemsCurrent')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[400px]">
                                <Column3DChart
                                    data={topItemsCurrent.map((i: any) => ({ name: i.item_name, value: i.current_sales }))}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                    height="400px"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Previous Top Categires & Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {topItemsPrevious.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Previous Top Items</h3>
                                <button
                                    onClick={() => setSelectedMaxView('comparisonTopItemsPrevious')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[400px]">
                                <Column3DChart
                                    data={topItemsPrevious.map((i: any) => ({ name: i.item_name, value: i.previous_sales }))}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#14b8a6', '#0ea5e9', '#06b6d4', '#f59e0b', '#f97316']}
                                    height="400px"
                                />
                            </div>
                        </div>
                    )}

                    {topCategoriesPrevious.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Previous Top Categories</h3>
                                <button
                                    onClick={() => setSelectedMaxView('comparisonTopCategoriesPrevious')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[400px]">
                                <Column3DChart
                                    data={topCategoriesPrevious.map((i: any) => ({ name: i.item_category_name, value: i.previous_sales }))}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#8b5cf6', '#a78bfa', '#c084fc', '#d8b4fe', '#f3e8ff', '#818cf8', '#6366f1', '#4f46e5', '#3730a3', '#312e81']}
                                    height="400px"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Trend Chart */}
                {comparisonTrend.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Comparison Trend</h3>
                            <button
                                onClick={() => setSelectedMaxView('comparisonTrend')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={comparisonTrend} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="period" tick={(props) => {
                                        const { x, y, payload } = props;
                                        return (
                                            <g transform={`translate(${x},${y}) rotate(-45)`}>
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={10}
                                                    textAnchor="end"
                                                    fill="#4b5563"
                                                    fontSize={11}
                                                >
                                                    {payload.value}
                                                </text>
                                            </g>
                                        );
                                    }} textAnchor="end" height={80} />
                                    <YAxis tickFormatter={(value) => `${formatNumberShort(value)}`} tick={{ fontSize: 13 }} />
                                    <Tooltip formatter={(value: any) => `${value.toLocaleString()}`} />
                                    <Legend verticalAlign="top" height={36} />
                                    <Line name="Current" type="monotone" dataKey="current_sales" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    <Line name="Previous" type="monotone" dataKey="previous_sales" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    // load unload Report Type Logic
    if (reportType === 'loadunload') {
        const kpis = dashboardData?.kpi || { total_load: 0, total_unload: 0, total_sales: 0 };
        const salesmanSummary = dashboardData?.salesman_summary || [];
        const trend = dashboardData?.trend || [];

        // Prepare KPI Pie Data
        const kpiData = [
            { name: 'Load', value: kpis.total_load || 0, color: '#facc15' },   // Yellow
            { name: 'Unload', value: kpis.total_unload || 0, color: '#f43f5e' }, // Red
            { name: 'Sales', value: kpis.total_sales || 0, color: '#10b981' }  // Green
        ];

        // Prepare Salesman Chart Data (Top 10 by sales for trend lines)
        // We need to map it nicely for LineChart: { salesman_name, sales, load, unload }
        const salesmanChartData = [...salesmanSummary]
            // .sort((a, b) => (b.sales || 0) - (a.sales || 0))
            .slice(0, 10)
            .map((s: any) => ({
                salesman_name: s.salesman_name,
                Sales: s.sales || 0,
                Load: s.load || 0,
                Unload: s.unload || 0
            }));

        // Prepare Trend Data
        const trendChartData = trend.map((t: any) => ({
            period: t.period,
            Load: t.load || 0,
            Unload: t.unload || 0,
            Sales: t.sales || 0
        }));

        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />

                {/* Row 1: KPI Pie + Salesman Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* KPI Pie Chart */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Load Unload Sales Distribution</h3>
                            <button
                                onClick={() => setSelectedMaxView('loadKpi')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-full">
                            {kpiData.length > 0 ? (
                                <ExplodedPieChart data={kpiData} outerRadius={80} />
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-gray-500">No KPI Data</div>
                            )}
                        </div>
                    </div>

                    {/* Salesman Summary Chart (Line Chart) */}
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Salesman Summary</h3>
                            <button
                                onClick={() => setSelectedMaxView('salesmanLoadUnload')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[420px]">
                            {salesmanChartData.length > 0 ? (
                                <NeonTrendAreaChart
                                    data={salesmanChartData}
                                    areas={['Sales', 'Load', 'Unload']}
                                    title="Salesman Performance Trend"
                                    yAxisFormatter={normalNumberFormatter}
                                    xAxisKey="salesman_name"
                                />
                            ) : (
                                <div className="flex items-center justify-center z-100 h-full text-gray-500">No Salesman Data</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Load Unload Trend */}
                {trendChartData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Load Unload Trend</h3>
                            <button
                                onClick={() => setSelectedMaxView('loadUnloadTrend')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[350px]">
                            <NeonTrendAreaChart
                                data={trendChartData}
                                areas={['Load', 'Unload', 'Sales']}
                                title="Load Unload Trend"
                                yAxisFormatter={normalNumberFormatter}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // KPIs for Po Order report type
    if (reportType === 'visit') {
        const kpisData = dashboardData?.kpis || {};
        const trendData = dashboardData["trend-line"] || {};
        const tableData = dashboardData["table"]?.data || {};
        console.log(trendData);
        const kpiCards = [
            {
                title: 'Total Customer Visit',
                value: Math.floor((kpisData.total_visits_customers ?? 0)).toLocaleString(),
                icon: 'lucide:user-check',
                color: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)",
            },
            {
                title: 'Total Customers',
                value: Math.floor((kpisData.total_customers ?? 0)).toLocaleString(),
                icon: 'lucide:users',
                color: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
            },
            {
                title: 'Total Open Shops',
                value: Math.floor((kpisData.total_open_shops ?? 0)).toLocaleString(),
                icon: 'lucide:store',
                color: "linear-gradient(135deg, #22d3ee 0%, #4ade80 100%)",
            },
            {
                title: 'Total Close Shops',
                value: Math.floor((kpisData.total_close_shops ?? 0)).toLocaleString(),
                icon: 'lucide:lock',
                color: "linear-gradient(135deg, #64748b 0%, #a1a1aa 100%)",
            },
        ];

        // Trend data
        const trend = trendData.data || [];
        // Each object: { period_label, open_shops, closed_shops }
        const trendChartData = trend.map((d: any) => ({
            "Period": d.period_label,
            'Open Shops': d.open_shops ?? 0,
            'Closed Shops': d.closed_shops ?? 0,
        }));

        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kpiCards.map((card, index) => (
                        <div
                            key={index}
                            className="flex items-center rounded-xl shadow-lg p-3"
                            style={{
                                background: card.color,
                                color: '#fff',
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                minHeight: 80,
                            }}
                        >
                            <div className="p-3 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Icon icon={card.icon} width="32" height="32" color="#fff" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-xs font-medium opacity-90" style={{ color: '#fff' }}>{card.title}</p>
                                <p className="mt-1 font-bold text-xl" style={{ color: '#fff' }}>{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Orders Over Time Trend (Multi-series LineChart) */}
                {trendChartData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Open/Closed Shops Trend</h3>
                            <button
                                onClick={() => setSelectedMaxView('openClosedShopsTrend')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[350px]">
                            <NeonTrendAreaChart
                                data={trendChartData}
                                areas={["Open Shops", "Closed Shops"]}
                                title="Open/Closed Shops Trend"
                                yAxisFormatter={normalNumberFormatter}
                                xAxisKey="Period"
                            />
                        </div>
                    </div>
                )}

                {tableData.length > 0 && (<div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Open Closed Shops Table</h3>
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Salesman Name</th>
                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Customer Visits</th>
                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Open Shops</th>
                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Closed Shops</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((t: any, i: number) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-800 font-medium">{t.salesman_name}</td>
                                    <td className="px-6 py-4 text-right text-gray-800">{t.total_visits_customers?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-gray-800">{t.open_shops?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-gray-800">{t.closed_shops?.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>)}
            </div>
        );
    }


    let kpisData = dashboardData?.kpis || {};
    let totalSales = kpisData.total_sales || 0;
    let companyTotalCustomers = kpisData.total_customers || 0;
    let activeSalesCustomers = kpisData.active_sales_customers || 0;
    let inactiveSalesCustomers = kpisData.inactive_sales_customers || 0;

    const kpiCards = [
        {
            title: "Total Sales",
            value: toInternationalNumber(totalSales, { maximumFractionDigits: 0 }),
            icon: "carbon:currency",
            color: "linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)",
        },
        {
            title: "Total Customers",
            value: toInternationalNumber(companyTotalCustomers, { maximumFractionDigits: 0 }),
            icon: "mdi:account-group",
            color: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
        },
        {
            title: "Active Customers",
            value: toInternationalNumber(activeSalesCustomers, { maximumFractionDigits: 0 }),
            icon: "mdi:account-check",
            color: "linear-gradient(135deg, #22d3ee 0%, #4ade80 100%)",
        },
        {
            title: "Inactive Customers",
            value: toInternationalNumber(inactiveSalesCustomers, { maximumFractionDigits: 0 }),
            icon: "mdi:account-off",
            color: "linear-gradient(135deg, #64748b 0%, #a1a1aa 100%)",
        },
    ];

    // Company-level layout for customer reports (new data structure)
    if (dataLevel === 'company' && reportType === 'customer') {
        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((card, index) => (
                        <div
                            key={index}
                            className="flex items-center rounded-xl shadow-lg border border-gray-100 p-3"
                            style={{
                                background: card.color,
                                color: '#fff',
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                minHeight: 80,
                            }}
                        >
                            <div className="p-3 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Icon icon={card.icon} width="32" height="32" color="#fff" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-xs font-medium opacity-90" style={{ color: '#fff' }}>{card.title}</p>
                                <p className="mt-1 font-bold text-xl" style={{ color: '#fff' }}>{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 1: Sales Trend Line Graph (Full Width) */}
                {salesTrendData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Sales Trend</h3>
                            <button
                                onClick={() => setSelectedMaxView('trend')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesTrendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="companyTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="period" tick={{ fontSize: 12, dy: 5 }} angle={-45} textAnchor="end" height={80} />
                                    <YAxis tickFormatter={(value) => `${(value / 100000).toFixed(2)}L`} tick={{ fontSize: 13 }} />
                                    <Tooltip formatter={(value: any) => `${value.toLocaleString()}`} />
                                    <Area type="monotone" dataKey="value" name="Sales" stroke="#8b5cf6" strokeWidth={2} fill="url(#companyTrendGradient)" dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 3 }} activeDot={{ r: 5, fill: '#6d28d9' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Row 2: Channel Sales Distribution + Customer Category Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Channel Sales - Pie Chart */}
                    {channelSalesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Channel Sales Distribution</h3>
                                <button
                                    onClick={() => setSelectedMaxView('channels')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedPieChart data={channelSalesData} outerRadius={80} />
                            </div>
                        </div>
                    )}

                    {/* Customer Category Sales - Donut Chart */}
                    {customerCategorySalesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Customer Category Sales</h3>
                                <button
                                    onClick={() => setSelectedMaxView('customerCategories')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedDonutChart data={customerCategorySalesData.slice(0, 10)} innerRadius={50} outerRadius={80} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 3: Top Items + Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Items */}
                    {topItemsChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                                <button
                                    onClick={() => setSelectedMaxView('items')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topItemsChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Top Customers */}
                    {topCustomersChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                                <button
                                    onClick={() => setSelectedMaxView('customers')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topCustomersChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 4: Top Customer Categories + Top Channels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Customer Categories Chart */}
                    {topCustomerCategoriesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Customer Categories</h3>
                                <button
                                    onClick={() => setSelectedMaxView('topCustomerCategories')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topCustomerCategoriesData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={customerCategoryColors}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Top Channels Chart */}
                    {topChannelsData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Channels</h3>
                                <button
                                    onClick={() => setSelectedMaxView('topChannels')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topChannelsData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={channelColors}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }


    // Region-level layout for customer reports
    if (dataLevel === 'region' && reportType === 'customer') {
        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((card, index) => (
                        <div
                            key={index}
                            className="flex items-center rounded-xl shadow-lg border border-gray-100 p-3"
                            style={{
                                background: card.color,
                                color: '#fff',
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                minHeight: 80,
                            }}
                        >
                            <div className="p-3 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Icon icon={card.icon} width="32" height="32" color="#fff" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-xs font-medium opacity-90" style={{ color: '#fff' }}>{card.title}</p>
                                <p className="mt-1 font-bold text-xl" style={{ color: '#fff' }}>{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 1: Sales Trend Line Graph (Full Width) */}
                {salesTrendData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Sales Trend</h3>
                            <button
                                onClick={() => setSelectedMaxView('trend')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesTrendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="regionTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="period" tick={{ fontSize: 12, dy: 5 }} angle={-45} textAnchor="end" height={80} />
                                    <YAxis tickFormatter={(value) => `${(value / 100000).toFixed(2)}L`} tick={{ fontSize: 13 }} />
                                    <Tooltip formatter={(value: any) => `${value.toLocaleString()}`} />
                                    <Area type="monotone" dataKey="value" name="Sales" stroke="#8b5cf6" strokeWidth={2} fill="url(#regionTrendGradient)" dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 3 }} activeDot={{ r: 5, fill: '#6d28d9' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Row 2: Channel Sales Distribution + Customer Category Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Channel Sales - Pie Chart */}
                    {channelSalesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Channel Sales Distribution</h3>
                                <button
                                    onClick={() => setSelectedMaxView('channels')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedPieChart data={channelSalesData} outerRadius={80} />
                            </div>
                        </div>
                    )}

                    {/* Customer Category Sales - Donut Chart */}
                    {customerCategorySalesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Customer Category Sales</h3>
                                <button
                                    onClick={() => setSelectedMaxView('customerCategories')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedDonutChart data={customerCategorySalesData.slice(0, 10)} innerRadius={50} outerRadius={80} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 3: Top Items + Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Items */}
                    {topItemsChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                                <button
                                    onClick={() => setSelectedMaxView('items')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topItemsChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Top Customers */}
                    {topCustomersChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                                <button
                                    onClick={() => setSelectedMaxView('customers')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topCustomersChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 4: Top Customer Categories + Top Channels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Customer Categories Chart */}
                    {topCustomerCategoriesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Customer Categories</h3>
                                <button
                                    onClick={() => setSelectedMaxView('topCustomerCategories')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topCustomerCategoriesData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={customerCategoryColors}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Top Channels Chart */}
                    {topChannelsData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Channels</h3>
                                <button
                                    onClick={() => setSelectedMaxView('topChannels')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topChannelsData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={channelColors}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Area-level layout for customer reports
    if (dataLevel === 'area' && reportType === 'customer') {
        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((card, index) => (
                        <div
                            key={index}
                            className="flex items-center rounded-xl shadow-lg border border-gray-100 p-3"
                            style={{
                                background: card.color,
                                color: '#fff',
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                minHeight: 80,
                            }}
                        >
                            <div className="p-3 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Icon icon={card.icon} width="32" height="32" color="#fff" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-xs font-medium opacity-90" style={{ color: '#fff' }}>{card.title}</p>
                                <p className="mt-1 font-bold text-xl" style={{ color: '#fff' }}>{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 1: Sales Trend Line Graph (Full Width) */}
                {salesTrendData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Sales Trend</h3>
                            <button
                                onClick={() => setSelectedMaxView('trend')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesTrendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="areaTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="period" tick={{ fontSize: 12, dy: 5 }} angle={-45} textAnchor="end" height={80} />
                                    <YAxis tickFormatter={(value) => `${(value / 100000).toFixed(2)}L`} tick={{ fontSize: 13 }} />
                                    <Tooltip formatter={(value: any) => `${value.toLocaleString()}`} />
                                    <Area type="monotone" dataKey="value" name="Sales" stroke="#8b5cf6" strokeWidth={2} fill="url(#areaTrendGradient)" dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 3 }} activeDot={{ r: 5, fill: '#6d28d9' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Row 2: Channel Sales Distribution + Customer Category Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Channel Sales - Pie Chart */}
                    {channelSalesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Channel Sales Distribution</h3>
                                <button
                                    onClick={() => setSelectedMaxView('channels')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedPieChart data={channelSalesData} outerRadius={80} />
                            </div>
                        </div>
                    )}

                    {/* Customer Category Sales - Donut Chart */}
                    {customerCategorySalesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Customer Category Sales</h3>
                                <button
                                    onClick={() => setSelectedMaxView('customerCategories')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedDonutChart data={customerCategorySalesData.slice(0, 10)} innerRadius={50} outerRadius={80} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 3: Top Items + Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Items */}
                    {topItemsChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                                <button
                                    onClick={() => setSelectedMaxView('items')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topItemsChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Top Customers */}
                    {topCustomersChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                                <button
                                    onClick={() => setSelectedMaxView('customers')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topCustomersChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 4: Top Customer Categories + Top Channels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Customer Categories Chart */}
                    {topCustomerCategoriesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Customer Categories</h3>
                                <button
                                    onClick={() => setSelectedMaxView('topCustomerCategories')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topCustomerCategoriesData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={customerCategoryColors}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Top Channels Chart */}
                    {topChannelsData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Channels</h3>
                                <button
                                    onClick={() => setSelectedMaxView('topChannels')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topChannelsData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={channelColors}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Warehouse-level layout for customer reports
    if (dataLevel === 'warehouse' && reportType === 'customer') {
        return (
            <div className="mt-5 space-y-6">
                <MaximizedView />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((card, index) => (
                        <div
                            key={index}
                            className="flex items-center rounded-xl shadow-lg border border-gray-100 p-3"
                            style={{
                                background: card.color,
                                color: '#fff',
                                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                                minHeight: 80,
                            }}
                        >
                            <div className="p-3 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Icon icon={card.icon} width="32" height="32" color="#fff" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-xs font-medium opacity-90" style={{ color: '#fff' }}>{card.title}</p>
                                <p className="mt-1 font-bold text-xl" style={{ color: '#fff' }}>{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 1: Sales Trend Line Graph (Full Width) */}
                {salesTrendData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Sales Trend</h3>
                            <button
                                onClick={() => setSelectedMaxView('trend')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesTrendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="warehouseTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="period" tick={{ fontSize: 12, dy: 5 }} angle={-45} textAnchor="end" height={80} />
                                    <YAxis tickFormatter={(value) => `${(value / 100000).toFixed(2)}L`} tick={{ fontSize: 13 }} />
                                    <Tooltip formatter={(value: any) => `${value.toLocaleString()}`} />
                                    <Area type="monotone" dataKey="value" name="Sales" stroke="#8b5cf6" strokeWidth={2} fill="url(#warehouseTrendGradient)" dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 3 }} activeDot={{ r: 5, fill: '#6d28d9' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Row 2: Channel Sales Distribution + Customer Category Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Channel Sales - Pie Chart */}
                    {channelSalesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Channel Sales Distribution</h3>
                                <button
                                    onClick={() => setSelectedMaxView('channels')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedPieChart data={channelSalesData} outerRadius={80} />
                            </div>
                        </div>
                    )}

                    {/* Customer Category Sales - Donut Chart */}
                    {customerCategorySalesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Customer Category Sales</h3>
                                <button
                                    onClick={() => setSelectedMaxView('customerCategories')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-full">
                                <ExplodedDonutChart data={customerCategorySalesData.slice(0, 10)} innerRadius={50} outerRadius={80} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 3: Top Items + Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Items */}
                    {topItemsChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                                <button
                                    onClick={() => setSelectedMaxView('items')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topItemsChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Top Customers */}
                    {topCustomersChartData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                                <button
                                    onClick={() => setSelectedMaxView('customers')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topCustomersChartData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Row 4: Top Customer Categories + Top Channels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Customer Categories Chart */}
                    {topCustomerCategoriesData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Customer Categories</h3>
                                <button
                                    onClick={() => setSelectedMaxView('topCustomerCategories')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topCustomerCategoriesData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={customerCategoryColors}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Top Channels Chart */}
                    {topChannelsData.length > 0 && (
                        <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Top Channels</h3>
                                <button
                                    onClick={() => setSelectedMaxView('topChannels')}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="w-full h-[420px]">
                                <Column3DChart
                                    data={topChannelsData}
                                    xAxisKey="name"
                                    yAxisKey="value"
                                    colors={channelColors}
                                    height="420px"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-5 space-y-6">
            {/* Maximized View Modal */}
            <MaximizedView />

            {/* Row 1: Company Pie Chart + Region Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Sales - Pie Chart */}
                {companyData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Company Sales</h3>
                            <button
                                onClick={() => setSelectedMaxView('company')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-full">
                            <ExplodedPieChart data={companyData} outerRadius={80} />
                        </div>
                    </div>
                )}

                {/* Region Sales - Donut Chart */}
                {regionData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Region Sales</h3>
                            <button
                                onClick={() => setSelectedMaxView('region')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-full">
                            <ExplodedDonutChart data={regionData} innerRadius={50} outerRadius={80} />
                        </div>
                    </div>
                )}
            </div>

            {/* Row 2: Area 3D Column Graph (Full Width) */}
            {areaData.length > 0 && (
                <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Area Sales</h3>
                        <button
                            onClick={() => setSelectedMaxView('area')}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <Maximize2 size={16} />
                        </button>
                    </div>
                    <div className="w-full h-[400px]">
                        <Column3DChart
                            data={areaData}
                            title="Area Sales"
                            xAxisKey="name"
                            yAxisKey="value"
                            colors={areaColors}
                            height="350px"
                        />
                    </div>
                </div>
            )}

            {/* Row 3: Trend Line Graph (Full Width) */}
            {(companySalesTrend.length > 0 || regionSalesTrend.length > 0 || areaSalesTrend.length > 0) && (
                <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {dataLevel === 'company' ? 'Company Sales Trend' :
                                dataLevel === 'region' ? 'Region Sales Trend' :
                                    'Area Sales Trend'}
                        </h3>
                        <button
                            onClick={() => setSelectedMaxView('trend')}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <Maximize2 size={16} />
                        </button>
                    </div>
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={
                                dataLevel === 'company' ? companySalesTrend :
                                    dataLevel === 'region' ? regionSalesTrend :
                                        areaSalesTrend
                            }>
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="period"
                                    tick={{ fontSize: 11 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={70}
                                />
                                <YAxis
                                    tickFormatter={(value) => `${(value / 100000).toFixed(2)}L`}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={(value: any) => `${value.toLocaleString()}`}
                                    labelFormatter={(label) => `${label}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="url(#trendGradient)"
                                    dot={{ fill: '#8b5cf6', strokeWidth: 1, r: 3 }}
                                    activeDot={{ r: 5, fill: '#6d28d9' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Row 4: Top Salesman + Top Warehouse Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Salesmen Chart */}
                {topSalesmenChartData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Salesmen</h3>
                            <button
                                onClick={() => setSelectedMaxView('salesmen')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[420px]">
                            <Column3DChart data={topSalesmenChartData} xAxisKey="name" yAxisKey="value" colors={salesmanColors} height="420px" />
                        </div>
                    </div>
                )}

                {/* Top Warehouses Chart (with legend/toggles shown on top) */}
                {topWarehousesChartData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Distributors</h3>
                            <button onClick={() => setSelectedMaxView('warehouses')} className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={16} /></button>
                        </div>

                        {/* Legend / Scale (top) - hidden at company level to keep UI simple */}
                        {topWarehousesChartData.length > 0 && dataLevel !== 'company' && (
                            <div className="mb-3 text-[11px] text-gray-600">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 items-start">
                                    {topWarehousesChartData.slice(0, 10).map((w: any, i: number) => {
                                        const hidden = hiddenWarehouses.includes(w.name);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setHiddenWarehouses(prev => prev.includes(w.name) ? prev.filter((x: string) => x !== w.name) : [...prev, w.name])}
                                                className={`flex items-start  gap-3 text-left w-full hover:bg-gray-50 p-1 rounded ${hidden ? 'opacity-40' : ''}`}
                                                title={`Toggle ${w.name}`}
                                                type="button"
                                            >
                                                <span style={{ width: 12, height: 12, borderRadius: 12, backgroundColor: w.color || warehouseColors[i % warehouseColors.length], display: 'inline-block', flex: '0 0 auto', marginTop: 3 }} />
                                                <div className="leading-tight text-left">
                                                    <div className="text-[11px] text-gray-800">{w.name}</div>
                                                    <div className="text-[11px] text-gray-500">{searchType === 'quantity' ? `x ${w.value?.toLocaleString()}` : ` ${(w.value || 0).toLocaleString()}`}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="w-full h-[420px]">
                            <Column3DChart data={topWarehousesChartData} xAxisKey="name" yAxisKey="value" colors={warehouseColors} height="420px" hiddenItems={hiddenWarehouses} />
                        </div>
                    </div>
                )}
            </div>

            {/* Row 5: Top Customer + Top Item Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Customer Bar Chart */}
                {topCustomersChartData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Customers</h3>
                            <button
                                onClick={() => setSelectedMaxView('customers')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[420px]">
                            <Column3DChart data={topCustomersChartData} title="" xAxisKey="name" yAxisKey="value" colors={['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb7185', '#fdba74', '#fde047']} height="420px" />
                        </div>
                    </div>
                )}

                {/* Top Item Bar Chart */}
                {topItemsChartData.length > 0 && (
                    <div className="bg-white p-5 border rounded-lg shadow-sm border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Top Items</h3>
                            <button
                                onClick={() => setSelectedMaxView('items')}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="w-full h-[420px]">
                            <Column3DChart data={topItemsChartData} xAxisKey="name" yAxisKey="value" colors={['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#ec4899']} height="420px" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(Charts, (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
        prevProps.dashboardData === nextProps.dashboardData &&
        prevProps.isLoading === nextProps.isLoading &&
        prevProps.error === nextProps.error &&
        prevProps.searchType === nextProps.searchType &&
        prevProps.reportType === nextProps.reportType &&
        prevProps.urlSizeWarning === nextProps.urlSizeWarning
    );
});