import React, { useState, useEffect, useRef } from 'react';
import ImagePreviewModal from './ImagePreviewModal';
import { ChevronDown, Calendar, BarChart3, Table } from 'lucide-react';
import { Icon } from "@iconify-icon/react";
import axios from 'axios';
import SalesCharts, { typeofReportType } from './SalesCharts';
import ExportButtons from './ExportButtons';
import CustomerExportButtons from './CustomerExportButtons';
import AttendenceExportButtons from './attendenceExport';
import { useSnackbar } from '@/app/services/snackbarContext';
import { usePagePermissions } from '@/app/(private)/utils/usePagePermissions';
import { useLoading } from '../services/loadingContext';
import Loading from './Loading'
import toInternationalNumber from '../(private)/utils/formatNumber';
import PhpLineChart from './PhpLineChart';


// Define TypeScript interfaces
interface FilterChildItem {
  id: string;
  name: string;
}

interface Filter {
  id: string;
  name: string;
  icon: string;
  childData: FilterChildItem[];
}

interface SelectedChildItems {
  [key: string]: string[];
}

interface SearchTerms {
  [key: string]: string;
}

interface SalesReportDashboardProps {
  title: string;
  titleNearExport: string;
  apiEndpoints: {
    filters: string;
    dashboard: string;
    table: string;
    export: string;
  };
  reportType: typeofReportType; // default to 'sales'
}

const SalesReportDashboard = (props: SalesReportDashboardProps) => {
  const { title, apiEndpoints, reportType, titleNearExport } = props;
  const { setLoading: setGlobalLoading } = useLoading();
  const { can, permissions } = usePagePermissions();
  const { showSnackbar } = useSnackbar();
  const [viewType, setViewType] = useState('');
  const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const currentDateISO = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState(`${currentDate} - ${currentDate}`);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(currentDateISO);
  const [endDate, setEndDate] = useState(currentDateISO);
  const [dateFilter, setDateFilter] = useState(currentDateISO);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [searchbyopen, setSearchbyclose] = useState(false);


  const [draggedFilter, setDraggedFilter] = useState<Filter | null>(null);
  const [droppedFilters, setDroppedFilters] = useState<Filter[]>([]);
  const [selectedChildItems, setSelectedChildItems] = useState<SelectedChildItems>({});
  const [searchTerms, setSearchTerms] = useState<SearchTerms>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // API states
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [loadingFilterIds, setLoadingFilterIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [tableData, setTableData] = useState<any>(null);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [selectedDataview, setSelectedDataview] = useState('default');
  const [searchType, setSearchType] = useState<string>();
  const [reportBy, setReportBy] = useState<string>();
  const [month, setMonth] = useState<string>(currentDateISO.substring(0, 7));
  const [year, setYear] = useState<string>(currentDateISO.substring(0, 4));
  const [displayQuantity, setDisplayQuantity] = useState<string>();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50; // pagination size

  // Dashboard API states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const lastChangedFilterRef = useRef<string | null>(null);

  const searchTypeOptions = reportType === 'attendence' ? [
    { value: 'projects', label: 'Projects' },
    { value: 'salesman', label: 'Salesman' },
    { value: 'sales executive-GT', label: 'Sales Executive-GT' }
  ]
    : reportType === 'poOrder' || reportType === 'comparison' ? []
      : [
        { value: 'quantity', label: 'Quantity' },
        { value: 'amount', label: 'Amount' },
      ];

  const reportByOptions = [
    { value: 'day', label: 'Day' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  const displayQuantityOptions = reportType === 'attendence' ? []
    : reportType === 'poOrder' ? []
      : [
        { value: 'with_free_good', label: 'With Free Good' },
        { value: 'without_free_good', label: 'Without Free Good' }
      ];

  const currentYearInt = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => {
    const y = currentYearInt - i;
    return { value: y.toString(), label: y.toString() };
  });

  useEffect(() => {
    if (reportType === 'poOrder') return;
    else if (reportType === 'comparison') {
      setSearchType('quantity');
      setReportBy('day');
      setDisplayQuantity(displayQuantityOptions[0]?.value);
      return;
    }
    setSearchType(searchTypeOptions[0]?.value);
    setDisplayQuantity(displayQuantityOptions[0]?.value);
  }, []);

  // Filter metadata (static)
  const filterMetadata: Record<string, { name: string; icon: string }> = {
    route: { name: 'Route', icon: 'mdi:routes' },
    salesman: { name: 'Salesman', icon: 'mdi:account-tie' },
    company: { name: 'Company', icon: 'mdi:company' },
    region: { name: 'Region', icon: 'mingcute:location-line' },
    warehouse: { name: 'Distributor', icon: 'hugeicons:warehouse' },
    area: { name: 'Area', icon: 'mdi:map-marker-radius' },
    'item-category': { name: 'Item Category', icon: 'mdi:category' },
    items: { name: 'Items', icon: 'mdi:package-variant' },
    item_brands: { name: 'Item Brand', icon: 'mdi:tag' },
    'channel-categories': { name: 'Customer Channel', icon: 'mdi:account-group' },
    'customer-category': { name: 'Customer Category', icon: 'mdi:account-supervisor' },
    customer: { name: 'Customer', icon: 'mdi:account' },
    'display-quantity': { name: 'Display Quantity', icon: 'mdi:numeric' },
    amount: { name: 'Amount', icon: 'mdi:currency-usd' },
    matbrand: { name: 'Material Brand', icon: 'mdi:tag' },
    matgroup: { name: 'Material Group', icon: 'mdi:shape' },
    material: { name: 'Material', icon: 'mdi:package-variant' },


    //  region: { name: 'Region', icon: 'mingcute:location-line' },
    'sub-region': { name: 'Sub Region', icon: 'mdi:map-marker' },
    // warehouse: { name: 'Warehouse', icon: 'hugeicons:warehouse' },
    // route: { name: 'Route', icon: 'mdi:routes' },
    trading: { name: 'Trading', icon: 'mdi:store' },
    // customer: { name: 'Customer', icon: 'mdi:account' }
  };

  const hierarchyOrder = [
    'company',
    'region',
    'area',
    'warehouse',
    'route',
    'salesman',
    'item-category',
    'items',
    'channel-categories',
    'customer-category',
    'customer'
  ];

  // Filter hierarchy - defines which filters should be cleared when parent changes
  const filterHierarchy: Record<string, string[]> = {
    'company': ['region', 'area', 'warehouse', 'route', 'salesman', 'item-category', 'items', 'channel-categories', 'customer-category', 'customer'],
    'region': ['area', 'warehouse', 'route', 'salesman', 'customer-category', 'customer'],
    'area': ['warehouse', 'route', 'salesman', 'customer'],
    'warehouse': ['route', 'salesman'],
    'route': ['salesman'],
    'item-category': ['items'],
    'channel-categories': ['customer'],
    'customer-category': ['customer']
  };
  const [phpReportType, setPhpReportType] = useState<string>("1");




  // Fetch dashboard data from API
  const fetchDashboardData = async () => {

    // 🔹 1️⃣ COMMON DATE VALIDATION (For All Except Comparison)
    if (reportType !== "comparison" && (!startDate || !endDate)) {
      showSnackbar('Please select a date range before loading dashboard data', 'warning');
      return;
    }

    // 🔥 2️⃣ PHP SPECIAL LOGIC
    if (reportType === "php") {

      if (!startDate || !endDate) {
        showSnackbar('Please select a date range before loading dashboard data', 'warning');
        return;
      }

      setIsLoadingDashboard(true);
      setDashboardError(null);

      try {

        const payload = {
          fromdate: startDate,
          todate: endDate,
          region_id: selectedChildItems['region']?.join(',') || "",
          sub_region_id: selectedChildItems['sub-region']?.join(',') || "",
          warehouse_id: selectedChildItems['warehouse']?.join(',') || "",
          route_id: selectedChildItems['route']?.join(',') || "",
          trading_center_id: selectedChildItems['trading']?.join(',') || "",
          customer_id: selectedChildItems['customer']?.join(',') || "",
          brand_id: selectedChildItems['matbrand']?.join(',') || "",
          material_group_id: selectedChildItems['matgroup']?.join(',') || "",
          material_id: selectedChildItems['material']?.join(',') || "",
          report_type: String(phpReportType)
        };

        console.log("FINAL PHP PAYLOAD:", payload);

        const response = await axios.post(
          apiEndpoints.dashboard,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const result = response.data?.Result;

        let formattedData: any[] = [];

        if (Array.isArray(result)) {
          formattedData = result;
        }
        else if (Array.isArray(result?.details_wiase_data)) {
          formattedData = result.details_wiase_data;
        }
        else if (Array.isArray(result?.headers_wiase_data)) {
          formattedData = result.headers_wiase_data;
        }

        setDashboardData(formattedData);


      } catch (error) {
        console.error("PHP Dashboard error:", error);
        showSnackbar("Failed to load dashboard data", "error");
      } finally {
        setIsLoadingDashboard(false);
      }

      return;
    }




    // 🔹 3️⃣ NON-PHP VALIDATIONS
    if (!["poOrder"].includes(reportType) && !searchType) {
      showSnackbar('Please select the search type (Amount or Quantity)', 'warning');
      return;
    }

    if (!["poOrder"].includes(reportType) && !displayQuantity) {
      showSnackbar('Please select the display quantity (With Free Good or Without Free Good)', 'warning');
      return;
    }

    const hasFilterSelections = Object.values(selectedChildItems)
      .some(items => items.length > 0);

    if (!hasFilterSelections) {
      showSnackbar('Please select at least one filter before loading dashboard data', 'warning');
      return;
    }

    setIsLoadingDashboard(true);
    setDashboardError(null);

    try {

      let selectedDate =
        reportBy === 'day' ? dateFilter
          : reportBy === 'month' ? (month ? `${month}-01` : null)
            : reportBy === 'year' ? (year ? `${year}-01-01` : null)
              : null;

      const payload: any = {
        ...(reportType !== 'comparison' ? {
          from_date: startDate,
          to_date: endDate,
        } : {}),

        ...(reportType === 'comparison' ? {
          report_by: reportBy,
          selected_date: selectedDate
        } : {}),

        search_type: searchType,
        display_quantity: displayQuantity,
        company_ids: selectedChildItems['company']?.map(id => parseInt(id)) || [],
        region_ids: selectedChildItems['region']?.map(id => parseInt(id)) || [],
        area_ids: selectedChildItems['area']?.map(id => parseInt(id)) || [],
        warehouse_ids: selectedChildItems['warehouse']?.map(id => parseInt(id)) || [],
        route_ids: selectedChildItems['route']?.map(id => parseInt(id)) || [],
        salesman_ids: selectedChildItems['salesman']?.map(id => parseInt(id)) || [],
        item_category_ids: selectedChildItems['item-category']?.map(id => parseInt(id)) || [],
        item_ids: selectedChildItems['items']?.map(id => parseInt(id)) || [],
        channel_category_ids: selectedChildItems['channel-categories']?.map(id => parseInt(id)) || [],
        customer_category_ids: selectedChildItems['customer-category']?.map(id => parseInt(id)) || [],
        customer_ids: selectedChildItems['customer']?.map(id => parseInt(id)) || []
      };

      const response = await axios.post(
        apiEndpoints.dashboard,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          }
        }
      );

      setDashboardData(response.data);

    } catch (error) {
      console.error('Dashboard fetch failed:', error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : 'Failed to load dashboard data';

      setDashboardError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsLoadingDashboard(false);
    }
  };


  const handleDashboardClick = () => {
    const searchByIds = ['salesman', 'route'];
    const moreFilterIds = moreFilters.map(f => f.id);
    const blockedIds = [...searchByIds, ...moreFilterIds];
    const hasBlockedSelection = blockedIds.some(id => (selectedChildItems[id] || []).length > 0);
    if (hasBlockedSelection) {
      showSnackbar('Dashboard not allowed with Search By/More filters. Clear them to view the dashboard.', 'warning');
      return;
    }

    // // Validation: Prevent Dashboard request for Item, Brand, or Category filters
    // // These levels are not supported in the Dashboard view
    // const restrictedFilters = ['items', 'item_brands', 'item-category'];
    // const hasRestrictedSelection = restrictedFilters.some(id => (selectedChildItems[id] || []).length > 0);

    // if (hasRestrictedSelection) {
    //   showSnackbar('Dashboard is not available for Item, Brand, or Category filters. Please select Company, Region, Area, or Distributor.', 'warning');
    //   return;
    // }

    setViewType('graph');
    fetchDashboardData();
  };

  // Fetch filters from API
  const fetchFiltersData = async (currentFilterId?: string, onDrop?: boolean) => {
    setFilterError(null);

    if (reportType === "php") {
      try {

        // 🔹 FIRST LOAD (Independent + Region)
        if (!currentFilterId && availableFilters.length === 0) {

          const [
            regionRes,
            brandRes,
            groupRes,
            materialRes
          ] = await Promise.all([
            fetch("http://165.227.64.72/mpldev/index.php/api/get_region_dashboard"),
            fetch("http://165.227.64.72/mpldev/index.php/api/get_matbrands_dashboard"),
            fetch("http://165.227.64.72/mpldev/index.php/api/get_matgroups_dashboard"),
            fetch("http://165.227.64.72/mpldev/index.php/api/get_materials_dashboard")
          ]);

          const regionData = (await regionRes.json())?.Result || [];
          const brandData = (await brandRes.json())?.Result || [];
          const groupData = (await groupRes.json())?.Result || [];
          const materialData = (await materialRes.json())?.Result || [];

          setAvailableFilters([
            {
              id: "region",
              name: "Region",
              icon: "mingcute:location-line",
              childData: regionData.map((r: any) => ({
                id: String(r.id),
                name: r.region_name
              }))
            },
            {
              id: "matbrand",
              name: "Material Brand",
              icon: filterMetadata["matbrand"]?.icon || "mdi:tag",
              childData: brandData.map((b: any) => ({
                id: String(b.id),
                name: b.brand_name
              }))
            },
            {
              id: "matgroup",
              name: "Material Group",
              icon: filterMetadata["matgroup"]?.icon || "mdi:shape",
              childData: groupData.map((g: any) => ({
                id: String(g.id),
                name: g.category_name
              }))
            },
            {
              id: "material",
              name: "Material",
              icon: filterMetadata["material"]?.icon || "mdi:package-variant",
              childData: materialData.map((m: any) => ({
                id: String(m.id),
                name: m.material_name
              }))
            }
          ]);

          return;
        }

        // 🔹 CASCADE ONLY FOR REGION HIERARCHY
        if (!currentFilterId) return;

        const selectedIds = selectedChildItems[currentFilterId]?.join(",");
        if (!selectedIds) return;

        const apiMap: Record<string, {
          endpoint: string;
          nextId: string;
          label: string;
          field: string;
        }> = {
          region: {
            endpoint: "get_sub_region_dashboard",
            nextId: "sub-region",
            label: "Sub Region",
            field: "sub_region_name"
          },
          "sub-region": {
            endpoint: "get_warehouse_dashboard",
            nextId: "warehouse",
            label: "Warehouse",
            field: "warehouse_name"
          },
          warehouse: {
            endpoint: "get_route_dashboard",
            nextId: "route",
            label: "Route",
            field: "route_name"
          },
          route: {
            endpoint: "get_trading_dashboard",
            nextId: "trading",
            label: "Trading",
            field: "trading_name"
          },
          trading: {
            endpoint: "get_customer_dashboard",
            nextId: "customer",
            label: "Customer",
            field: "customer_name"
          }
        };

        const config = apiMap[currentFilterId];
        if (!config) return;

        const response = await fetch(
          `http://165.227.64.72/mpldev/index.php/api/${config.endpoint}/${selectedIds}`
        );

        const json = await response.json();
        const data = json?.Result || [];

        setAvailableFilters(prev => {
          const withoutNext = prev.filter(f => f.id !== config.nextId);

          return [
            ...withoutNext,
            {
              id: config.nextId,
              name: config.label,
              icon: filterMetadata[config.nextId]?.icon || "mdi:circle",
              childData: data.map((item: any) => ({
                id: String(item.id),
                name: item[config.field]
              }))
            }
          ];
        });

        return;

      } catch (error) {
        console.error("PHP filter fetch error:", error);
      }
    }





    // Determine which filters need to be loaded based on selections
    const filtersToLoad = new Set<string>();
    let hierarchyReached = false;
    hierarchyOrder.filter((filterId, index) => {
      if (!hierarchyReached && currentFilterId && filterId === currentFilterId) {
        hierarchyReached = true;
        return false;
      }
      if (hierarchyReached) {
        if (droppedFilters.find(f => f.id === filterId)) {
          filtersToLoad.add(filterId);
        }
        return true;
      }
    });

    if (onDrop && currentFilterId) {
      filtersToLoad.add(currentFilterId);
    }

    if (availableFilters.length > 0 && filtersToLoad.size === 0) return;
    // Set loading state for specific filters
    setLoadingFilterIds(filtersToLoad);
    if (availableFilters.length <= 0) setIsLoadingFilters(true);

    try {
      // Build query params
      const params = new URLSearchParams();

      params.append(
        'company_ids',
        selectedChildItems['company']?.join(',') || ''
      );

      params.append(
        'region_ids',
        selectedChildItems['region']?.join(',') || ''
      );

      params.append(
        'area_ids',
        selectedChildItems['area']?.join(',') || ''
      );

      params.append(
        'warehouse_ids',
        selectedChildItems['warehouse']?.join(',') || ''
      );

      // Combine route + salesman
      const searchBy =
        [
          ...(selectedChildItems['route'] || []),
          ...(selectedChildItems['salesman'] || [])
        ].join(',');

      params.append('search_by', searchBy || '');

      params.append(
        'item_category_ids',
        selectedChildItems['item-category']?.join(',') || ''
      );

      const channelIds =
        selectedChildItems['channel-categories']?.join(',') || '';

      params.append('channel_category_ids', channelIds);
      params.append('customer_channel_ids', channelIds);

      params.append(
        'customer_category_ids',
        selectedChildItems['customer-category']?.join(',') || ''
      );

      params.append(
        'brand_id',
        selectedChildItems['matbrand']?.join(',') || ''
      );

      params.append(
        'material_group_id',
        selectedChildItems['matgroup']?.join(',') || ''
      );

      params.append(
        'material_id',
        selectedChildItems['material']?.join(',') || ''
      );


      const queryString = params?.toString();
      const url = `${apiEndpoints.filters}${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform API response to Filter format
      const transformedFilters: Filter[] = [];

      const apiKeyMap: Record<string, string> = {
        companies: 'company',
        regions: 'region',
        areas: 'area',
        warehouses: 'warehouse',
        item_categories: 'item-category',
        items: 'items',
        routes: 'route',
        salesmen: 'salesman',
        channel_categories: 'channel-categories',
        customer_categories: 'customer-category',
        customers: 'customer',
        item_brands: 'item_brands',
      };
      let dd: any = [];
      Object.entries(data).forEach(([apiKey, items]: [string, any]) => {
        dd.push({ apiKey });
        const filterId = apiKeyMap[apiKey] || apiKey;
        const metadata = filterMetadata[filterId];

        if (metadata && Array.isArray(items)) {
          if (apiKey === 'routes' || apiKey === 'salesmen' || apiKey === 'channel_categories') {
          }

          transformedFilters.push({
            id: filterId,
            name: metadata.name,
            icon: metadata.icon,
            childData: items.map((item: any) => {
              const id = item.company_id || item.region_id || item.area_id || item.warehouse_id ||
                item.route_id || item.salesman_id || item.item_category_id || item.item_id ||
                item.channel_category_id || item.customer_category_id || item.customer_id ||
                item.id || item.code || item.route_code || item.salesman_code;

              let name = item.company_name || item.region_name || item.area_name || item.warehouse_name ||
                item.route_name || item.route_label || item.route_title ||
                item.salesman_name || item.salesman_label || item.salesman_title ||
                item.category_name || item.item_name ||
                item.outlet_channel || item.channel_category_name || item.channel_name ||
                item.customer_category_name || item.customer_name ||
                item.name || item.label || item.title;

              if (!name && (apiKey === 'routes' || apiKey === 'salesmen' || apiKey === 'channel_categories')) {
                name = item.description || item.full_name || item.display_name;
                console.warn(`${apiKey} missing standard name field, using fallback:`, item);
              }

              return {
                id: String(id || item),
                name: String(name || id || item)
              };
            })
          });
        }
      });
      setAvailableFilters(transformedFilters);
      setLoadingFilterIds(new Set());
      if (availableFilters.length <= 0) setIsLoadingFilters(false);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
      setFilterError(error instanceof Error ? error.message : 'Failed to load filters');
      setAvailableFilters([]);
      setLoadingFilterIds(new Set());
      if (availableFilters.length <= 0) setIsLoadingFilters(false);
    }
  };

  // Debounce wrapper for fetchFiltersData to avoid rapid consecutive requests
  const filtersFetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetchFiltersData = (currentFilterId?: string, delay = 400) => {
    if (filtersFetchDebounceRef.current) {
      clearTimeout(filtersFetchDebounceRef.current);
    }
    filtersFetchDebounceRef.current = setTimeout(() => {
      fetchFiltersData(currentFilterId);
    }, delay);
  };

  // Cleanup pending debounce timer on unmount
  useEffect(() => {
    return () => {
      if (filtersFetchDebounceRef.current) {
        clearTimeout(filtersFetchDebounceRef.current);
      }
    };
  }, []);

  // Watch for selection changes and trigger debounced fetch
  useEffect(() => {
    if (droppedFilters.length > 0 && lastChangedFilterRef.current) {
      const hasSelections = Object.values(selectedChildItems).some(items => items.length > 0);
      if (hasSelections || lastChangedFilterRef.current) {
        debouncedFetchFiltersData(lastChangedFilterRef.current);
      }
      lastChangedFilterRef.current = null;
    }
  }, [selectedChildItems, droppedFilters.length]);

  // Fetch Table Data function
  const handleTableView = async (page?: number) => {
    console.log("TABLE CLICKED");
    console.log("reportType:", reportType);
    console.log("selectedChildItems:", selectedChildItems);

    if (reportType?.toLowerCase() === "php") {

      setIsLoadingTable(true);

      try {

        const payload = {
          fromdate: startDate,
          todate: endDate,

          region_id: selectedChildItems['region']?.join(',') || "",
          sub_region_id: selectedChildItems['sub-region']?.join(',') || "",
          warehouse_id: selectedChildItems['warehouse']?.join(',') || "",
          route_id: selectedChildItems['route']?.join(',') || "",
          trading_center_id: selectedChildItems['trading']?.join(',') || "",
          customer_id: selectedChildItems['customer']?.join(',') || "",
          brand_id: selectedChildItems['matbrand']?.join(',') || "",
          material_group_id: selectedChildItems['matgroup']?.join(',') || "",
          material_id: selectedChildItems['material']?.join(',') || "",

          report_type: String(phpReportType)
        };

        console.log("✅ FINAL PHP TABLE PAYLOAD:", payload);

        const response = await fetch(apiEndpoints.table, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const raw = await response.json();
        console.log("📥 RAW PHP TABLE RESPONSE:", raw);

        let formattedData = { data: [] };

        if (raw?.API_Status === 1) {

          // ✅ TYPE 1 (existing structure)
          if (Array.isArray(raw?.Result?.details_wiase_data)) {
            formattedData = {
              data: raw.Result.details_wiase_data
            };
          }

          // ✅ TYPE 2 (NEW structure example – update field name as per API)
          else if (Array.isArray(raw?.Result?.headers_wiase_data)) {
            formattedData = {
              data: raw.Result.headers_wiase_data
            };
          }

          // ✅ Direct Result Array fallback
          else if (Array.isArray(raw?.Result)) {
            formattedData = {
              data: raw.Result
            };
          }

        }


        console.log("✅ FORMATTED TABLE DATA:", formattedData);

        setTableData(formattedData);



      } catch (error) {
        console.error("❌ PHP TABLE ERROR:", error);
      } finally {
        setIsLoadingTable(false);
      }

      return;
    }


    if (droppedFilters.length === 0 || Object.values(selectedChildItems).every(items => items.length === 0)) {
      showSnackbar('Please drag and drop at least one filter with selections to view table data', 'warning');
      return;
    }

    if (!["comparison"].includes(reportType) && (!startDate || !endDate)) {
      showSnackbar('Please select a date range before loading table data', 'warning');
      return;
    }

    // Validate search type selection
    if (!["poOrder"].includes(reportType) && !searchType) {
      showSnackbar('Please select the search type (Type by Amount or Type by Quantity)', 'warning');
      return;
    }

    // Validate display quantity selection
    if (!["attendence", "poOrder"].includes(reportType) && !displayQuantity) {
      showSnackbar('Please select the display quantity (Free-Good or Without-Free-Good)', 'warning');
      return;
    }

    setIsLoadingTable(true);
    try {
      // for comparison report
      let selectedDate = reportBy === 'day' ? dateFilter
        : reportBy === 'month' ? (month ? `${month}-01` : null)
          : reportBy === 'year' ? (year ? `${year}-01-01` : null)
            : null;

      // Get only the lowest-level filter for table data
      let lowestLevelFilters;
      if (reportType !== "comparison") lowestLevelFilters = getLowestLevelFilters();

      let filters: Record<string, number[]> = {};
      if (reportType === "comparison") {
        Object.entries(selectedChildItems).forEach(([filterId, items]) => {
          if (items.length > 0) {
            const key = `${filterId}_ids`;
            filters[key] = (items as string[]).map((id: string) => parseInt(id));
          }
        });
      }
      // Build the request payload with dates and only the lowest filter
      const payload = {
        ...(reportType !== 'comparison' ? {
          from_date: startDate,
          to_date: endDate,
        } : {}),
        ...(reportType === 'comparison' ? {
          report_by: reportBy,
          selected_date: selectedDate,

        } : {}),
        search_type: searchType,
        display_quantity: displayQuantity,
        ...(reportType === "comparison" ? filters : lowestLevelFilters) // Spread only the lowest-level filter IDs
      };

      const response = await fetch(`${apiEndpoints.table}?page=${page || 1}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch table data: ${response.statusText}`);
      }

      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error('Table fetch failed:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to load table data', 'error');
    } finally {
      setIsLoadingTable(false);
    }
  };

  // Export function for customer reports with file_type and view_type
  const handleExport = async (filename: string) => {
    if (droppedFilters.length === 0 || Object.values(selectedChildItems).every(items => items.length === 0)) {
      showSnackbar('Please drag and drop at least one filter with selections to view table data', 'warning');
      return;
    }

    if (!startDate || !endDate) {
      showSnackbar('Please select a date range before exporting', 'warning');
      return;
    }

    setIsExporting(true);
    try {
      // Get only the lowest-level filter for export data
      // const lowestLevelFilters = getLowestLevelFilters();
      const filters: Record<string, number[]> = {};
      Object.entries(selectedChildItems).forEach(([filterId, items]) => {
        if (items.length > 0) {
          const key = `${filterId}_ids`;
          filters[key] = (items as string[]).map((id: string) => parseInt(id));
        }
      });

      let selectedDate = reportBy === 'day' ? dateFilter
        : reportBy === 'month' ? (month ? `${month}-01` : null)
          : reportBy === 'year' ? (year ? `${year}-01-01` : null)
            : null;

      // Build the payload with file_type and view_type
      const payload: any = reportType === "comparison" ? {
        report_by: reportBy,
        selected_date: selectedDate,
        search_type: searchType,
        display_quantity: displayQuantity,
        ...filters
      } : {
        from_date: startDate,
        to_date: endDate,
        search_type: searchType,
        ...filters
      };

      const response = await fetch(`${apiEndpoints.export}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('Export API Error:', errorData);
        throw new Error(errorData.detail || `Export failed: ${response.statusText}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = 'xlsx';
      link.download = `${filename}-${startDate}-to-${endDate}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export function for customer reports with file_type and view_type
  const handleCustomerExport = async (fileType: string, viewType: string) => {
    if (!startDate || !endDate) {
      showSnackbar('Please select a date range before exporting', 'warning');
      return;
    }

    setIsExporting(true);
    try {
      // Get only the lowest-level filter for export data
      const lowestLevelFilters = getLowestLevelFilters();

      // Build the payload with file_type and view_type
      const payload: any = {
        from_date: startDate,
        to_date: endDate,
        search_type: searchType,
        display_quantity: displayQuantity,
        file_type: fileType,
        view_type: viewType,
        ...lowestLevelFilters
      };

      const response = await fetch(`${apiEndpoints.export}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('Export API Error:', errorData);
        throw new Error(errorData.detail || `Export failed: ${response.statusText}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = fileType === 'csv' ? 'csv' : 'xlsx';
      link.download = `customer-report-${startDate}-to-${endDate}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export XLSX function
  const handleExportXLSX = async (selectedSearchType: string, selectedDisplayQuantity: string, dataview: string) => {
    if (droppedFilters.length === 0 || Object.values(selectedChildItems).every(items => items.length === 0)) {
      showSnackbar('Please drag and drop at least one filter with selections to view table data', 'warning');
      return;
    }

    if (!startDate || !endDate) {
      showSnackbar('Please select a date range before exporting', 'warning');
      return;
    }

    setIsExporting(true);
    try {
      // Get only the lowest-level filter for export data
      const lowestLevelFilters = getLowestLevelFilters();

      // Build the base payload with dates, dataview and only the lowest filter
      const payload: any = {
        from_date: startDate,
        to_date: endDate,
        search_type: selectedSearchType,
        dataview: dataview, // 'default', 'daily', 'weekly', 'monthly', 'yearly'
        display_quantity: selectedDisplayQuantity,
        ...lowestLevelFilters // Spread only the lowest-level filter IDs
      };

      // If dataview is 'default', include a `show` array that mirrors the table columns
      // so backend can return the same columns as the on-screen table export.
      if (dataview === 'default') {
        const dynamicColumn = getDynamicFilterColumn();
        const showFields: string[] = [
          'item_code',
          'item_name',
          'item_category',
          'invoice_date',
          // add dynamic columns' field names
          ...(dynamicColumn.columns || []).map((c: any) => c.field),
          'total_quantity'
        ];
        // Deduplicate while preserving order
        payload.show = Array.from(new Set(showFields));
      }


      const response = await fetch(`${apiEndpoints.export}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('Export API Error:', errorData);
        throw new Error(errorData.detail || `Export failed: ${response.statusText}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to get the dynamic column configuration for the table
  const getDynamicFilterColumn = () => {
    const hierarchyOrder = [
      'company',
      'region',
      'area',
      'warehouse',
      'route',
      'salesman',
      'item-category',
      'items',
      'channel-categories',
      'customer-category',
      'customer'
    ];

    // Find the lowest filter
    let lowestFilter = null;
    for (let i = hierarchyOrder.length - 1; i >= 0; i--) {
      const filterId = hierarchyOrder[i];
      if (selectedChildItems[filterId]?.length > 0) {
        lowestFilter = filterId;
        break;
      }
    }

    // Special handling for comparison report type
    if (reportType === 'comparison') {
      return {
        type: 'comparison',
        columns: [
          { label: 'Item Name', field: 'item_name' },
          { label: 'Current Period', field: 'current_period', width: 250 },
          { label: 'Previous Period', field: 'previous_period', width: 250 },
          { label: 'Current Sales', field: 'current_sales' },
          { label: 'Previous Sales', field: 'previous_sales' },
          { label: 'Difference', field: 'difference' },
          { label: 'Growth Percent', field: 'growth_percent' }
        ]
      };
    }

    // Special handling for customer report type - show customer-centric columns
    if (reportType === 'customer') {
      // Base columns for customer reports - only show columns that exist in server data
      const baseColumns = [
        { label: 'Customer Name', field: 'customer_name' },
        { label: 'Mobile Number', field: 'mobile_number' },
        { label: 'Warehouse', field: 'warehouse' },
        { label: 'Route', field: 'route' },
        { label: 'Customer Channel', field: 'customer_channel' },
        { label: 'Customer Category', field: 'customer_category' },
        { label: 'Value', field: 'value' }
      ];

      return {
        type: 'customer-report',
        columns: baseColumns
      };
    }

    // Special handling for customer-related filters - show only selected columns
    if (lowestFilter && ['channel-categories', 'customer-category', 'customer'].includes(lowestFilter)) {
      const columns = [];

      // Only add columns for filters that have selections
      if (selectedChildItems['channel-categories']?.length > 0) {
        // API may return channel category under several keys; prefer the explicit key used elsewhere
        columns.push({ label: 'Channel Name', field: 'channel_category_name' });
      }
      if (selectedChildItems['customer-category']?.length > 0) {
        columns.push({ label: 'Customer Category', field: 'customer_category_name' });
      }
      if (selectedChildItems['customer']?.length > 0 || selectedChildItems['customer-category']?.length > 0 || selectedChildItems['channel-categories']?.length > 0) {
        columns.push({ label: 'Customer Name', field: 'customer_name' });
      }

      return {
        type: 'customer-group',
        columns: columns
      };
    }

    // Map filter ID to column name and field name in the API response
    const filterColumnMap: Record<string, { label: string; field: string }> = {
      'company': { label: 'Company Name', field: 'company_name' },
      'region': { label: 'Region Name', field: 'region_name' },
      'area': { label: 'Area Name', field: 'area_name' },
      'warehouse': { label: 'Warehouse Name', field: 'warehouse_name' },
      'route': { label: 'Route Name', field: 'route_name' },
      'salesman': { label: 'Salesman Name', field: 'salesman_name' },
      'item-category': { label: 'Item Category', field: 'item_category' },
      'items': { label: 'Item Name', field: 'item_name' }
    };

    const singleColumn = lowestFilter ? filterColumnMap[lowestFilter] : { label: 'Filter Name', field: 'name' };
    return {
      type: 'single',
      columns: [singleColumn]
    };
  };

  // Helper function to get only the lowest-level filter for table/export APIs
  const getLowestLevelFilters = () => {
    // Define hierarchy order from highest to lowest level
    const hierarchyOrder = [
      'company',
      'region',
      'area',
      'warehouse',
      'route',
      'salesman',
      'item-category',
      'items',
      'channel-categories',
      'customer-category',
      'customer'
    ];

    // For customer reportType, send all selected filters
    if (reportType === 'customer') {
      const payload: any = {};

      if (selectedChildItems['company']?.length > 0) {
        payload.company_ids = selectedChildItems['company'].map(id => parseInt(id));
      }
      if (selectedChildItems['region']?.length > 0) {
        payload.region_ids = selectedChildItems['region'].map(id => parseInt(id));
      }
      if (selectedChildItems['area']?.length > 0) {
        payload.area_ids = selectedChildItems['area'].map(id => parseInt(id));
      }
      if (selectedChildItems['warehouse']?.length > 0) {
        payload.warehouse_ids = selectedChildItems['warehouse'].map(id => parseInt(id));
      }
      if (selectedChildItems['route']?.length > 0) {
        payload.route_ids = selectedChildItems['route'].map(id => parseInt(id));
      }
      if (selectedChildItems['channel-categories']?.length > 0) {
        payload.customer_channel_ids = selectedChildItems['channel-categories'].map(id => parseInt(id));
      }
      if (selectedChildItems['customer-category']?.length > 0) {
        payload.customer_category_ids = selectedChildItems['customer-category'].map(id => parseInt(id));
      }
      if (selectedChildItems['customer']?.length > 0) {
        payload.customer_ids = selectedChildItems['customer'].map(id => parseInt(id));
      }

      return payload;
    }

    // Find the lowest (most granular) filter that has selections for sales reportType
    let lowestFilter = null;
    for (let i = hierarchyOrder.length - 1; i >= 0; i--) {
      const filterId = hierarchyOrder[i];
      if (selectedChildItems[filterId]?.length > 0) {
        lowestFilter = filterId;
        break;
      }
    }

    // Build payload with only the lowest filter
    const payload: any = {};

    if (lowestFilter) {
      switch (lowestFilter) {
        case 'company':
          payload.company_ids = selectedChildItems['company'].map(id => parseInt(id));
          break;
        case 'region':
          payload.region_ids = selectedChildItems['region'].map(id => parseInt(id));
          break;
        case 'area':
          payload.area_ids = selectedChildItems['area'].map(id => parseInt(id));
          break;
        case 'warehouse':
          payload.warehouse_ids = selectedChildItems['warehouse'].map(id => parseInt(id));
          break;
        case 'route':
          payload.route_ids = selectedChildItems['route'].map(id => parseInt(id));
          break;
        case 'salesman':
          payload.salesman_ids = selectedChildItems['salesman'].map(id => parseInt(id));
          break;
        case 'item-category':
          payload.item_category_ids = selectedChildItems['item-category'].map(id => parseInt(id));
          break;
        case 'items':
          payload.item_ids = selectedChildItems['items'].map(id => parseInt(id));
          break;
        case 'channel-categories':
          payload.customer_channel_ids = selectedChildItems['channel-categories'].map(id => parseInt(id));
          break;
        case 'customer-category':
          payload.customer_category_ids = selectedChildItems['customer-category'].map(id => parseInt(id));
          break;
        case 'customer':
          payload.customer_channel_ids = selectedChildItems['channel-categories']?.map(id => parseInt(id));
          payload.customer_category_ids = selectedChildItems['customer-category'].map(id => parseInt(id));
          payload.customer_ids = selectedChildItems['customer'].map(id => parseInt(id));
          break;
      }
    }

    return payload;
  };

  // Resolve a value for a dynamic column from a table row, with common API field fallbacks
  const resolveRowValue = (row: any, field: string) => {
    if (!row) return undefined;
    // direct match
    if (row[field] !== undefined && row[field] !== null) return row[field];

    // common fallbacks
    const fallbacks: Record<string, string[]> = {
      channel_category_name: ['channel_category_name', 'channel_name', 'outlet_channel'],
      channel_name: ['channel_name', 'channel_category_name', 'outlet_channel'],
      customer_category_name: ['customer_category_name', 'customer_category'],
      customer_name: ['customer_name', 'customer']
    };

    const keys = fallbacks[field] || [field];
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null) return row[k];
    }

    return undefined;
  };

  // Determine display value for total column depending on selected search type
  const getTotalValue = (row: any) => {
    if (!row) return '-';
    const amountCandidates = [row.total_amount, row.total_value, row.total_quantity, row.total_qty];
    const quantityCandidates = [row.total_quantity, row.total_qty, row.total_amount, row.total_value];
    const candidates = searchType === 'amount' ? amountCandidates : quantityCandidates;
    const found = candidates.find(v => v !== undefined && v !== null && v !== '');
    return found !== undefined ? found : '-';
  };

  // Fetch on mount
  useEffect(() => {
    fetchFiltersData();
  }, []);

  // Close dropdowns when clicking outside any dropdown or trigger
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node;

      // If clicked inside any open dropdown, do nothing
      const dropdowns = document.querySelectorAll('.filter-dropdown');
      for (const d of Array.from(dropdowns)) {
        if (d.contains(target)) return;
      }

      // If clicked inside any trigger (buttons that open dropdowns), do nothing
      const triggers = document.querySelectorAll('.dropdown-trigger');
      for (const t of Array.from(triggers)) {
        if (t.contains(target)) return;
      }

      // Otherwise close all dropdowns
      setOpenDropdown(null);
      setShowMoreFilters(false);
      setSearchbyclose(false);
      setShowDatePicker(false);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [openDropdown, showMoreFilters, searchbyopen, showDatePicker]);

  // Refetch when selections change with hierarchical logic
  // useEffect(() => {
  //   if (droppedFilters.length > 0) {
  //     // Only refetch if there are actual selections
  //     const hasSelections = Object.values(selectedChildItems).some(items => items.length > 0);
  //     if (hasSelections) {
  //       const timer = setTimeout(() => fetchFiltersData(), 300);
  //       return () => clearTimeout(timer);
  //     }
  //   }
  // }, [selectedChildItems, droppedFilters.length]);

  const chartData = {
    salesTrend: Array.from({ length: 5 }, (_, i) => ({ year: `${2021 + i}`, sales: [2, 6, 3, 8, 6][i] })),
    companies: Array.from({ length: 5 }, (_, i) => ({ name: `Company ${i + 1}`, sales: [400000, 280000, 220000, 150000, 80000][i], color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i] })),
    region: Array.from({ length: 3 }, (_, i) => ({ name: `Region ${i + 1}`, value: [35, 30, 35][i], color: ['#1e3a8a', '#3b82f6', '#38bdf8'][i] })),
    brand: Array.from({ length: 5 }, (_, i) => ({ brand: `Brand ${i + 1}`, sales: [8, 7, 5, 4, 3.5][i] }))
  };

  const handleDateSelect = () => {
    if (startDate && endDate && startDate <= endDate) {
      const format = (date: string) => new Date(date).toLocaleDateString('en-GB').replace(/\//g, '-');
      // const format = (date: string) => new Date(date).toLocaleDateString();
      setDateRange(`${format(startDate)} - ${format(endDate)}`);
      setShowDatePicker(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, filter: Filter) => {
    setDraggedFilter(filter);
    e.dataTransfer.setData('text/plain', filter.id);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedFilter) {
      // setAvailableFilters(prev => prev.filter(f => f.id !== draggedFilter.id));

      setDroppedFilters(prev => [...prev, draggedFilter]);
      setSelectedChildItems(prev => ({ ...prev, [draggedFilter.id]: [] }));
      setSearchTerms(prev => ({ ...prev, [draggedFilter.id]: '' }));
      setDraggedFilter(null);

      // Close the dropdowns after dropping
      setShowMoreFilters(false);
      setSearchbyclose(false);

      // Load data for the newly dropped filter
      fetchFiltersData(draggedFilter.id, true);
    }
  };

  const handleRemoveFilter = (filterToRemove: Filter) => {
    setDroppedFilters(prev => prev.filter(f => f.id !== filterToRemove.id));
    // setAvailableFilters(prev => [...prev, filterToRemove]);

    // Clear this filter and all its dependent filters
    setSelectedChildItems(prev => {
      const newObj = { ...prev };
      delete newObj[filterToRemove.id];

      // Also clear dependent filters
      const dependentFilters = filterHierarchy[filterToRemove.id] || [];
      dependentFilters.forEach(dependentId => {
        if (newObj[dependentId]) {
          newObj[dependentId] = [];
        }
      });

      return newObj;
    });

    setSearchTerms(prev => { const newObj = { ...prev }; delete newObj[filterToRemove.id]; return newObj; });
    if (openDropdown === filterToRemove.id) setOpenDropdown(null);
  };

  const handleClearAllFilters = () => {
    // Don't add dropped filters back to available filters
    setDroppedFilters([]);
    setSelectedChildItems({});
    setSearchTerms({});
    setOpenDropdown(null);
    // Refetch filters to reset to initial state
    fetchFiltersData();
  };

  const handleChildItemToggle = (filterId: string, childItemId: string) => {


    lastChangedFilterRef.current = filterId;
    setSelectedChildItems(prev => {
      const current = prev[filterId] || [];
      const newValue = current.includes(childItemId) ? current.filter(id => id !== childItemId) : [...current, childItemId];
      // Create new state with updated filter
      let newState = { ...prev, [filterId]: newValue };

      // Custom hierarchy reset for company, region, area, warehouse
      if (filterId === 'company') {
        // Reset region, area, warehouse, route
        ['region', 'area', 'warehouse', 'route'].forEach(dep => { if (newState[dep]) newState[dep] = []; });
      } else if (filterId === 'region') {
        // Reset area, warehouse, route
        ['area', 'warehouse', 'route'].forEach(dep => { if (newState[dep]) newState[dep] = []; });
      } else if (filterId === 'area') {
        // Reset warehouse, route
        ['warehouse', 'route'].forEach(dep => { if (newState[dep]) newState[dep] = []; });
      } else if (filterId === 'warehouse') {
        // Reset route
        if (newState['route']) newState['route'] = [];
      } else if (filterId === 'item-category') {
        // Reset items
        if (newState['items']) newState['items'] = [];
      } else {
        // Default: Clear all dependent filters based on hierarchy
        const dependentFilters = filterHierarchy[filterId] || [];
        dependentFilters.forEach(dependentId => {
          if (newState[dependentId]) {
            newState[dependentId] = [];
          }
        });
      }

      return newState;
    });
  };

  const getFilterChildData = (filterId: string): FilterChildItem[] => {
    const filter = [...availableFilters, ...droppedFilters].find(f => f.id === filterId);
    return filter?.childData || [];
  };

  const getFilteredChildData = (filterId: string): FilterChildItem[] => {
    const data = getFilterChildData(filterId);
    const searchTerm = searchTerms[filterId] || '';
    return !searchTerm ? data : data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const getSelectedCount = (filterId: string): number => (selectedChildItems[filterId] || []).length;

  // Return ids of currently visible (filtered) child items for a filter
  const getVisibleChildIds = (filterId: string): string[] => {
    return getFilteredChildData(filterId).map(d => d.id);
  };

  const handleSelectAll = (filterId: string, ids: string[]) => {
    lastChangedFilterRef.current = filterId;
    setSelectedChildItems(prev => {
      const current = prev[filterId] || [];
      const allSelected = ids.length > 0 && ids.every(id => current.includes(id));
      const newState = { ...prev, [filterId]: allSelected ? [] : ids };

      // Clear dependent filters when selection changes
      const dependentFilters = filterHierarchy[filterId] || [];
      dependentFilters.forEach(dependentId => {
        if (newState[dependentId]) newState[dependentId] = [];
      });

      return newState;
    });
  };

  // Organize filters into groups
  // For customer reportType, show route directly with other visible filters
  const visibleFilters =
    reportType === 'sales'
      ? availableFilters.filter(f => ['company', 'region', 'area', 'warehouse'].includes(f.id))
      : reportType === 'customer'
        ? availableFilters.filter(f => ['company', 'region', 'area', 'warehouse', 'route'].includes(f.id))
        : reportType === 'item'
          ? availableFilters.filter(f => ['company', 'region', 'area', 'warehouse', 'route', 'items', 'item-category', 'item_brands'].includes(f.id))
          : reportType === 'attendence' || reportType === 'comparison'
            ? availableFilters.filter(f => ['warehouse', 'salesman'].includes(f.id))
            : reportType === 'poOrder'
              ? availableFilters.filter(f => ['company', 'region', 'area', 'warehouse'].includes(f.id))
              : reportType === 'php'
                ? availableFilters.filter(f =>
                  [
                    'region',
                    'sub-region',
                    'warehouse',
                    'route',
                    'trading',
                    'customer',
                    'matbrand',
                    'matgroup',
                    'material'
                  ].includes(f.id)
                )

                : [];


  // For customer reportType, don't show searchby dropdown. For sales, show both salesman and route
  const searchby = reportType === 'sales' ? availableFilters.filter(f => ['salesman', 'route'].includes(f.id)) : [];
  // const searchtype = availableFilters.filter(f => ['display-quantity', 'amount'].includes(f.id));
  // Show all moreFilters, but mark 'customer' as disabled unless 'channel-categories' or 'customer-category' is dropped
  const isCustomerEnabled = droppedFilters.some(f => f.id === 'channel-categories' || f.id === 'customer-category');
const baseHiddenFilters = [
  'company',
  'region',
  'area',
  'warehouse',
  'salesman',
  'route',
  'display-quantity',
  'amount'
];

const moreFilters =
  reportType === 'item'
    ? []
    : availableFilters.filter(f =>
        // NOT already visible in top bar
        !visibleFilters.some(vf => vf.id === f.id)

        // NOT already dropped
        && !droppedFilters.some(df => df.id === f.id)
      );

  const sidebarIcons = [
    'ri:home-smile-2-line', 'proicons:person', 'streamline:transfer-van', 'pajamas:package',
    'lucide:network', 'bx:file', 'proicons:bookmark', 'solar:dollar-broken'
  ];

  // State for image preview modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalStartIndex, setModalStartIndex] = useState(1);

  // Handler to open modal with images from row
  const handleRowImagePreview = (row: any) => {
    const images: string[] = [];
    if (row.in_img) images.push(row.in_img);
    if (row.out_img) images.push(row.out_img);
    setModalImages(images);
    setModalStartIndex(1);
    setImageModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <header className="bg-white border-b border-gray-200">
        <div className="h-[60px] flex items-center">
          <div className="w-[80px] lg:w-[80px] h-[60px] border-r border-b border-[#E9EAEB] flex items-center justify-center">
            <img src="shortLogo.png" alt="Logo" className="w-[44px] h-[44px] object-contain" />
          </div>
          <TopBar />
        </div>
      </header> */}

      {/* <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
        <section className="hidden lg:flex lg:w-[80px] h-auto lg:h-[1050px] border-r border-[#E9EAEB] bg-white border-b pt-5">
          <div className="flex flex-col items-center gap-6 w-full">
            {sidebarIcons.map((icon, i) => (
              <Icon key={i} icon={icon} width="24" height="24" style={{color: "#414651"}} />
            ))}
          </div>
        </section>

        <section className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="flex justify-around py-3">
            {sidebarIcons.slice(0, 5).map((icon, i) => (
              <Icon key={i} icon={icon} width="24" height="24" style={{color: "#414651"}} />
            ))}
          </div>
        </section> */}

      <section className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl flex gap-2 lg:gap-4 font-semibold items-center text-gray-900">
            {/* <Icon icon="lucide:arrow-left" width="20" height="20" className="lg:w-6 lg:h-6" /> */}
            {title}
          </h1>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-auto">
              {reportType !== 'comparison' && (<div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer w-full sm:w-auto" onClick={() => setShowDatePicker(!showDatePicker)}>
                <Calendar size={18} className="text-gray-600" />
                <input type="text" value={dateRange} className="border-none outline-none text-sm cursor-pointer bg-transparent w-full sm:w-auto" readOnly />
              </div>)}
              {showDatePicker && (
                <div id="date-picker-dropdown" className="filter-dropdown absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 w-full sm:w-80">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleDateSelect} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply</button>
                      <button onClick={() => setShowDatePicker(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative w-full gap-3 flex sm:w-auto">

              {reportType === "php" && (
                <div className="relative w-full sm:w-auto">
                  <select
                    value={phpReportType}
                    onChange={(e) => setPhpReportType(e.target.value)}
                    className="px-4 py-2 pr-10 bg-white border border-gray-200 rounded-lg appearance-none cursor-pointer text-sm"
                  >
                    <option value="1">Report 1</option>
                    <option value="2">Report 2</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
                  />
                </div>
              )}




              {reportByOptions.length > 0 && reportType === 'comparison' && (<div className="relative w-full sm:w-auto">
                <select
                  value={reportBy}
                  onChange={(e) => setReportBy(e.target.value)}
                  className="px-4 py-2 pr-10 bg-white border border-gray-200 rounded-lg appearance-none cursor-pointer text-sm w-full sm:w-auto"
                >
                  {reportByOptions.map((option: { value: string; label: string }, index: number) => (
                    <option key={option.value + index} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              </div>)}

              {reportType === 'comparison' && reportBy === 'day' && (<div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer w-full sm:w-fit" onClick={() => setShowDatePicker(!showDatePicker)}>
                <Calendar size={18} className="text-gray-600" />
                <span className="border-none outline-none text-sm cursor-pointer bg-transparent w-full sm:w-auto">{dateFilter}</span>
              </div>)}

              {reportByOptions.length > 0 && reportBy === 'month' && (<div className="relative w-full sm:w-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer w-full sm:w-auto">
                  <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm" />
                </div>
                {/* <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" /> */}
              </div>)}

              {reportByOptions.length > 0 && reportBy === 'year' && (<div className="relative w-full sm:w-auto">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="px-4 py-2 pr-10 bg-white border border-gray-200 rounded-lg appearance-none cursor-pointer text-sm w-full sm:w-auto"
                >
                  {yearOptions.map((option: { value: string; label: string }, index: number) => (
                    <option key={option.value + index} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              </div>)}

              {reportType !== 'php' && displayQuantityOptions.length > 0 && (
                <div className="relative w-full sm:w-auto">
                  <select
                    value={displayQuantity}
                    onChange={(e) => setDisplayQuantity(e.target.value)}
                    className="px-4 py-2 pr-10 bg-white border border-gray-200 rounded-lg appearance-none cursor-pointer text-sm w-full sm:w-auto"
                  >
                    {displayQuantityOptions.map((option: { value: string; label: string }, index: number) => (
                      <option key={option.value + index} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                </div>)}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!["attendence"].includes(reportType) && (<button
              onClick={handleDashboardClick}
              disabled={isLoadingDashboard}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg flex-1 sm:flex-none justify-center ${viewType === 'graph' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoadingDashboard ? (
                <Icon icon="eos-icons:loading" width="18" height="18" />
              ) : (
                <BarChart3 size={18} />
              )}
              <span className="text-sm">Dashboard</span>
            </button>)}
            <button
              onClick={() => {
                setViewType('table');
                handleTableView();
              }}
              disabled={isLoadingTable}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg flex-1 sm:flex-none justify-center ${viewType === 'table' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoadingTable ? (
                <Icon icon="eos-icons:loading" width="18" height="18" />
              ) : (
                <Table size={18} />
              )}
              <span className="text-sm">Table</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white w-full rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 px-4 border-b border-[#E9EAEB] gap-3">
            <h2 className="font-semibold text-lg text-[#181D27]">{titleNearExport}</h2>
            {can("export") && (
              reportType === 'customer' ? (
                <CustomerExportButtons
                  onExport={handleCustomerExport}
                  isLoading={isExporting}
                />
              )
                : ['attendence', 'poOrder', 'comparison'].includes(reportType) ? (
                  <AttendenceExportButtons
                    onExport={() => handleExport(
                      reportType === 'attendence' ? 'attendence-report'
                        : reportType === 'poOrder' ? 'po-order-report'
                          : reportType === 'comparison' ? 'comparison-report'
                            : "null"
                    )}
                    isLoading={isExporting}
                  />
                )
                  : (
                    <ExportButtons
                      onExportXLSX={handleExportXLSX}
                      isLoading={isExporting}
                      searchType={searchType}
                      displayQuantity={displayQuantity}
                    />
                  )
            )}
          </div>

          <div className="p-4 border border-[#E9EAEB]">
            {/* Loading & Error States */}


            {/* Filter Section */}
            <div>
              <div className="flex flex-wrap min-h-[44px] items-center justify-start gap-2 sm:gap-3 px-3 py-2 border rounded-[10px] bg-[#F5F5F5] border-[#E9EAEB]">
                <span className="font-semibold text-gray-800 text-sm sm:text-base whitespace-nowrap">Drag & Drop Filter</span>

                <div className="flex h-auto sm:h-[28px] justify-center items-center w-full sm:w-auto">
                  {isLoadingFilters && (
                    <div className="h-auto sm:h-[28px] px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm text-blue-700 flex items-center gap-2">
                      <div className="animate-spin w-3 h-3 rounded-full border-b-2 border-blue-700"></div>
                      <span className="whitespace-nowrap">Loading filters...</span>
                    </div>
                  )}

                  {filterError && (
                    <div className="h-auto sm:h-[28px] flex justify-center items-center px-3 py-1 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700">
                      <span className="truncate">{filterError}</span>
                      <button
                        onClick={() => fetchFiltersData()}
                        className="ml-2 underline hover:text-red-900 font-medium whitespace-nowrap"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 flex-1 w-full">
                  {visibleFilters
                    .filter(filter => !droppedFilters.some(df => df.id === filter.id))
                    .map(filter => (
                      <div key={filter.id} draggable onDragStart={(e) => handleDragStart(e, filter)} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-[#D1D5DB] rounded-[8px] cursor-grab hover:bg-gray-50">
                        <Icon icon={filter.icon} width="16" height="16" className="sm:w-[18px] sm:h-[18px]" style={{ color: '#414651' }} />
                        <span className="text-xs sm:text-sm font-medium text-[#414651] whitespace-nowrap">{filter.name}</span>
                        <Icon icon="ph:dots-six-vertical-bold" width="14" height="14" className="sm:w-4 sm:h-4" style={{ color: '#A4A7AE' }} />
                      </div>
                    ))}



                  {searchby.length > 0 && (
                    <div className="relative">
                      <button className="dropdown-trigger flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-white border border-[#D1D5DB] rounded-[8px] whitespace-nowrap" onClick={() => {
                        // Close other dropdowns when opening search by
                        setOpenDropdown(null);
                        setShowMoreFilters(false);
                        setSearchbyclose(!searchbyopen);
                      }}>
                        Search by <ChevronDown size={14} />
                      </button>
                      {searchbyopen && (
                        <div id="searchby-dropdown" className="filter-dropdown absolute top-full left-0 sm:left-auto sm:right-0 mt-1 w-[calc(100vw-2rem)] sm:w-64 max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-80 overflow-y-auto">
                          <div className="p-2">
                            {searchby.map(filter => (
                              <div key={filter.id} draggable onDragStart={(e) => handleDragStart(e, filter)} className="flex items-center gap-2 px-2 sm:px-3 py-2 justify-between rounded hover:bg-gray-50 cursor-grab">
                                <div className='flex gap-2 sm:gap-4 items-center'>
                                  <Icon icon={filter.icon} width="16" height="16" className="sm:w-[18px] sm:h-[18px]" style={{ color: '#414651' }} />
                                  <span className="text-xs sm:text-sm text-gray-700">{filter.name}</span>
                                </div>
                                <Icon icon="ph:dots-six-vertical-bold" width="14" height="14" className="sm:w-4 sm:h-4" style={{ color: '#A4A7AE' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {moreFilters.length > 0 && (
                    <div className="relative">
                      <button className="dropdown-trigger flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-white border border-[#D1D5DB] rounded-[8px] whitespace-nowrap" onClick={() => {
                        // Close other dropdowns when opening more
                        setOpenDropdown(null);
                        setSearchbyclose(false);
                        setShowMoreFilters(!showMoreFilters);
                      }}>
                        More <ChevronDown size={14} />
                      </button>
                      {showMoreFilters && (
                        <div id="morefilters-dropdown" className="filter-dropdown absolute top-full left-0 sm:left-auto sm:right-0 mt-1 w-[calc(100vw-2rem)] sm:w-64 max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-80 overflow-y-auto">
                          <div className="p-2">
                            {moreFilters.map(filter => {
                              let isUndraggable = viewType === 'table' && droppedFilters.length === 0;
                              // Disable 'customer' unless 'channel-categories' or 'customer-category' is dropped
                              if (filter.id === 'customer' && !isCustomerEnabled) {
                                isUndraggable = true;
                              }
                              return (
                                <div
                                  key={filter.id}
                                  draggable={!isUndraggable}
                                  onDragStart={!isUndraggable ? (e) => { handleDragStart(e, filter); } : undefined}
                                  className={`flex items-center gap-2 px-2 sm:px-3 py-2 justify-between rounded hover:bg-gray-50 ${isUndraggable ? 'cursor-not-allowed opacity-50' : 'cursor-grab'}`}
                                  title={filter.id === 'customer' && !isCustomerEnabled ? 'Select Customer Channel or Customer Category first' : ''}
                                >
                                  <div className='flex gap-2 sm:gap-4 items-center'>
                                    <Icon icon={filter.icon} width="16" height="16" className="sm:w-[18px] sm:h-[18px]" style={{ color: '#414651' }} />
                                    <span className="text-xs sm:text-sm text-gray-700">{filter.name}</span>
                                  </div>
                                  <Icon icon="ph:dots-six-vertical-bold" width="14" height="14" className="sm:w-4 sm:h-4" style={{ color: '#A4A7AE' }} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                </div>
              </div>

              <div className="mt-4 p-3 sm:p-4 border border-dashed border-[#D1D5DB] rounded-[10px]" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                {droppedFilters.length === 0 ? (
                  <div className="flex justify-center items-center py-6 sm:py-4">
                    <Icon icon="basil:add-outline" width="20" height="20" className="sm:w-6 sm:h-6" style={{ color: '#717680' }} />
                    <span className="text-xs sm:text-sm text-gray-400 ml-2">Drop Filter Here</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-start sm:items-center justify-between">
                      <div className="flex flex-wrap gap-2 flex-1 w-full">
                        {droppedFilters.map(filter => {
                          const selectedCount = getSelectedCount(filter.id);
                          const isLoading = loadingFilterIds.has(filter.id);
                          return (
                            <div key={filter.id} className="relative w-auto">
                              <div className="dropdown-trigger flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-[#414651] rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => {
                                // Close search by and more filters when opening a filter dropdown
                                setSearchbyclose(false);
                                setShowMoreFilters(false);
                                setOpenDropdown(openDropdown === filter.id ? null : filter.id);
                              }}>
                                {isLoading ? (
                                  <Icon icon="eos-icons:loading" width="16" height="16" className="sm:w-[18px] sm:h-[18px] text-blue-600" />
                                ) : (
                                  <Icon icon={filter.icon} width="16" height="16" className="sm:w-[18px] sm:h-[18px]" style={{ color: '#414651' }} />
                                )}
                                <span className="text-xs sm:text-sm font-medium text-[#414651] whitespace-nowrap">
                                  {filter.name}
                                  {selectedCount > 0 && <span className="bg-[#252B37] text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ml-1">{selectedCount}</span>}
                                </span>
                                <ChevronDown size={12} className={`sm:w-[14px] sm:h-[14px] text-[#414651] ${openDropdown === filter.id ? 'rotate-180' : ''}`} />
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveFilter(filter); }} className="text-[#414651] hover:text-red-600 ml-1 flex items-center">
                                  <Icon icon="mdi:close" width="14" height="14" className="sm:w-4 sm:h-4" />
                                </button>
                              </div>

                              {openDropdown === filter.id && !isLoading && (
                                <div id={`filter-dropdown-${filter.id}`} className="filter-dropdown absolute top-full left-0 mt-1 w-full min-w-[200px] sm:w-[240px] bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                                  <div className="p-3">
                                    <input type="text" placeholder="Search here..." value={searchTerms[filter.id] || ''} onChange={(e) => setSearchTerms(prev => ({ ...prev, [filter.id]: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                  </div>
                                  <div className="max-h-60 overflow-y-auto">
                                    {getFilteredChildData(filter.id).length === 0 ? (
                                      <div className="text-center text-sm text-gray-500 py-4">No items found</div>
                                    ) : (
                                      <div className="space-y-1 p-2">
                                        {/* Select All checkbox */}
                                        {(() => {
                                          const visible = getFilteredChildData(filter.id);
                                          const visibleIds = visible.map(v => v.id);
                                          const selected = selectedChildItems[filter.id] || [];
                                          const allSelected = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));
                                          const someSelected = visibleIds.length > 0 && visibleIds.some(id => selected.includes(id));
                                          return (
                                            <label key="__select_all__" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                              <input
                                                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={() => handleSelectAll(filter.id, visibleIds)}
                                                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                              />
                                              <span className="text-sm text-gray-700 font-medium">Select All</span>
                                            </label>
                                          );
                                        })()}

                                        {getFilteredChildData(filter.id).map(childItem => {
                                          const isSelected = (selectedChildItems[filter.id] || []).includes(childItem.id);
                                          return (
                                            <label key={childItem.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                              <input type="checkbox" checked={isSelected} onChange={() => { handleChildItemToggle(filter.id, childItem.id); }} className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500" />
                                              <span className="text-sm text-gray-700">{childItem.name}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {droppedFilters.length > 0 && (
                        <button onClick={handleClearAllFilters} className="cursor-pointer text-[#252B37] italic text-xs sm:text-sm underline hover:text-red-600 whitespace-nowrap mt-2 sm:mt-0 self-start sm:self-auto">Clear Filter</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Grid or Table View */}
            {/* Charts Grid or Table View */}
            {viewType === "graph" ? (

              reportType === "php" ? (

                <PhpLineChart
                  data={dashboardData}
                  isLoading={isLoadingDashboard}
                />

              ) : (

                <SalesCharts
                  chartData={chartData}
                  dashboardData={dashboardData}
                  isLoading={isLoadingDashboard}
                  error={dashboardError}
                  searchType={searchType}
                  reportType={reportType}
                />

              )

            ) : viewType === "table" ? (

              <div className="mt-4">
                {isLoadingTable ? (
                  <div className="flex flex-col justify-center items-center py-20 mt-5 h-80">
                    <Loading style={{ zIndex: 70 }} />
                  </div>
                ) : tableData && (tableData.data || tableData.rows)?.length > 0 ? (
                  (() => {
                    const dynamicColumn = getDynamicFilterColumn();
                    const rows = tableData.data || tableData.rows || [];

                    // Use server-side pagination data
                    const totalRows = tableData.total_rows || rows.length;
                    const totalPages = tableData.total_pages || Math.max(1, Math.ceil(totalRows / rowsPerPage));
                    const apiCurrentPage = tableData.current_page || currentPage;
                    const startIdx = ((apiCurrentPage - 1) * rowsPerPage) + 1;
                    const endIdx = Math.min(apiCurrentPage * rowsPerPage, totalRows);

                    const changePage = (page: number) => {
                      if (page < 1) page = 1;
                      if (page > totalPages) page = totalPages;
                      setCurrentPage(page);
                      handleTableView(page);
                    };

                    return (
                      <div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100 border-b border-gray-200">
                                {reportType === 'item' ? (
                                  <>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">S. No.</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                                  </>
                                ) : reportType === 'attendence' ? (
                                  <>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Salesman Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Salesman Type Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Warehouse Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time In</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time Out</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">In Img</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Out Img</th>
                                  </>
                                ) : reportType === 'poOrder' ? (
                                  <>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Delivery No</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invoice No</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order Code</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order Number</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SAP No</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Amount</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Items</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Distributor</th>
                                  </>
                                ) : reportType === 'php' ? (
                                  <>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invoice No</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invoice Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer Code</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Route</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Warehouse</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trading</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Net Amount</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">VAT</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                                  </>

                                ) : reportType === 'comparison' ? (
                                  dynamicColumn.columns.map((col: any, idx: number) => (
                                    <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-gray-700" style={col.width ? { width: Number(col.width), minWidth: Number(col.width) } : undefined}>{col.label}</th>
                                  ))
                                ) : dynamicColumn.type === 'customer-report' ? (
                                  dynamicColumn.columns.map((col: any, idx: number) => (
                                    <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{col.label}</th>
                                  ))
                                ) : (
                                  <>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item Code</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item Category</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invoice Date</th>
                                    {dynamicColumn.columns.map((col: any, idx: number) => (
                                      <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{col.label}</th>
                                    ))}
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Quantity</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row: any, rowIdx: number) => (
                                <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                                  {reportType === 'item' ? (
                                    <>
                                      <td className="px-4 py-3 text-sm text-gray-700">{rowIdx + 1}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.item_name || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.value !== undefined ? toInternationalNumber(row.value) : '-'}</td>
                                    </>
                                  ) : reportType === 'attendence' ? (
                                    <>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.salesman_name || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.salesman_type_name || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.warehouse_name || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.time_in || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.time_out || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700 cursor-pointer" onClick={() => handleRowImagePreview(row)}>{row.in_img ? <span className="underline text-blue-600">View</span> : '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700 cursor-pointer" onClick={() => handleRowImagePreview(row)}>{row.out_img ? <span className="underline text-blue-600">View</span> : '-'}</td>
                                    </>
                                  ) : reportType === 'poOrder' ? (
                                    <>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.delivery_sap_id || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.invoice_sap_id || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.order_code || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.order_id || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.order_sap_id || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{toInternationalNumber(row.total, { minimumFractionDigits: 0 }) || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.unique_item_count || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.warehouse_name || '-'}</td>
                                    </>

                                  ) : reportType === 'php' ? (
                                    <>
                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.invoice_number || '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.invoice_date || '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.customer_code || '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.customer_name || '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.route_name || '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.warehouse_name || '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.trading_name || '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.net_amount
                                          ? `${row.currency_notation} ${toInternationalNumber(row.net_amount, { minimumFractionDigits: 0 })}`
                                          : '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {row.vat
                                          ? `${row.currency_notation} ${toInternationalNumber(row.vat, { minimumFractionDigits: 0 })}`
                                          : '-'}
                                      </td>

                                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                        {row.total
                                          ? `${row.currency_notation} ${toInternationalNumber(row.total, { minimumFractionDigits: 0 })}`
                                          : '-'}
                                      </td>
                                    </>



                                  ) : reportType === 'comparison' ? (
                                    dynamicColumn.columns.map((col: any, idx: number) => {
                                      let value = row[col.field];
                                      if (['current_sales', 'previous_sales', 'difference'].includes(col.field)) {
                                        value = value !== undefined ? toInternationalNumber(value) : '-';
                                      } else if (col.field === 'growth_percent') {
                                        value = value !== undefined ? `${Number(value).toFixed(2)}%` : '-';
                                      } else {
                                        value = value || '-';
                                      }
                                      return <td key={idx} className="px-4 py-3 text-sm text-gray-700">{value}</td>
                                    })
                                  ) : dynamicColumn.type === 'customer-report' ? (
                                    dynamicColumn.columns.map((col: any, idx: number) => (
                                      <td key={idx} className="px-4 py-3 text-sm text-gray-700">{resolveRowValue(row, col.field) || '-'}</td>
                                    ))
                                  ) : (
                                    <>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.item_code || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.item_name || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.item_category || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-700">{row.invoice_date || '-'}</td>
                                      {dynamicColumn.columns.map((col: any, idx: number) => (
                                        <td key={idx} className="px-4 py-3 text-sm text-gray-700">{resolveRowValue(row, col.field) || '-'}</td>
                                      ))}
                                      <td className="px-4 py-3 text-sm text-gray-700">{getTotalValue(row)}</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination controls */}
                        <div className="flex items-center justify-between mt-3 px-2">
                          <div className="text-sm text-gray-600">Showing {startIdx} - {endIdx} of {totalRows}</div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => changePage(apiCurrentPage - 1)}
                              disabled={!tableData.previous_page || apiCurrentPage === 1}
                              className="px-3 py-1 bg-white border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Prev
                            </button>

                            {/* Smart pagination with groups of 5 */}
                            {(() => {
                              // Adjust to 0-indexed for logic (API returns 1-indexed)
                              const cPage = apiCurrentPage - 1;
                              const pages = [];

                              // If 6 or fewer pages, show all
                              if (totalPages <= 6) {
                                for (let i = 1; i <= totalPages; i++) {
                                  pages.push(
                                    <button
                                      key={i}
                                      onClick={() => changePage(i)}
                                      className={`px-3 py-1 border rounded cursor-pointer ${apiCurrentPage === i ? 'bg-gray-900 text-white' : 'bg-white'}`}
                                    >
                                      {i}
                                    </button>
                                  );
                                }
                                return pages;
                              }

                              // More than 6 pages: smart pagination
                              const elems: (number | string)[] = [];

                              // If near the start, show first up to five pages then ellipsis + last
                              if (cPage <= 2) {
                                const end = Math.min(totalPages - 1, 4); // pages 0..4 (display 1..5)
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

                              return elems.map((p, idx) =>
                                typeof p === "string" ? (
                                  <span key={`e-${idx}`} className="px-2 text-gray-500">{p}</span>
                                ) : (
                                  <button
                                    key={p}
                                    onClick={() => changePage(p + 1)}
                                    className={`px-3 py-1 border cursor-pointer rounded ${apiCurrentPage === p + 1 ? 'bg-gray-900 text-white' : 'bg-white'}`}
                                  >
                                    {p + 1}
                                  </button>
                                )
                              );
                            })()}

                            <button
                              onClick={() => changePage(apiCurrentPage + 1)}
                              disabled={!tableData.next_page || apiCurrentPage === totalPages}
                              className="px-3 py-1 bg-white border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col justify-center items-center py-12 text-gray-500">
                    <Table size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-medium">No table data available</p>
                    <p className="text-sm mt-2">Select filters and date range, then click the Table button</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center py-12 text-gray-500">
                <p className="text-lg font-medium">Select a view</p>
                <p className="text-sm mt-2">Click Dashboard or Table button to view data</p>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* </div> */}
      {/* Image Preview Modal for attendence images */}
      <ImagePreviewModal
        images={modalImages}
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        startIndex={1}
      />
    </div>
  );
};

export default SalesReportDashboard;










