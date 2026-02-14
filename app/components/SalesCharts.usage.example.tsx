/**
 * SalesCharts Component - Usage Examples
 * 
 * This file demonstrates how to use the SalesCharts component for different report types.
 */

import SalesCharts from './SalesCharts';

// ============================================
// Example 1: Customer Report (Company Level)
// ============================================
// This shows how to use the component with the new company-level customer data

function CustomerReportExample() {
  const customerReportData = {
    level: "company",
    granularity: "monthly",
    kpis: {
      total_sales: 60580107.54100005,
      total_customers: 145687,
      active_sales_customers: 145677,
      inactive_sales_customers: 10
    },
    charts: {
      sales_trend: [
        { period: "2024-01", value: 3207852 },
        { period: "2024-02", value: 3452276 },
        // ... more data
      ],
      channel_sales: [
        { channel_name: "OC01-General Trade", value: 31383557.541000027, percentage: 52.63 },
        { channel_name: "OC06-Wholesale", value: 24248156, percentage: 40.66 },
        // ... more channels
      ],
      customer_category_sales: [
        { customer_category_name: "CT90-Retail Shop", value: 25864802.54100002, percentage: 43.42 },
        { customer_category_name: "CT91-Wholesale Shop", value: 20429050, percentage: 34.29 },
        // ... more categories
      ],
      top_items: [
        { name: "Assorted Cream 100", value: 13247348.541000012 },
        { name: "SkyView Orange 320ml x 12", value: 8819690 },
        // ... more items
      ],
      top_customers: [
        { customers_name: "AC00720701 - Godfrey retail karuguza", value: 13255320.541 },
        // ... more customers
      ],
      top_channels: [
        { channel_name: "OC01-General Trade", value: 31383557.541000027 },
        // ... more channels
      ],
      top_customer_categories: [
        { customer_category_name: "CT90-Retail Shop", value: 25864802.54100002 },
        // ... more categories
      ]
    }
  };

  return (
    <SalesCharts
      dashboardData={customerReportData}
      reportType="customer"  // Important: Set to 'customer' for customer reports
      searchType="value"     // or 'quantity' for quantity-based reports
      isLoading={false}
      error={null}
    />
  );
}

// ============================================
// Example 2: Sales Report (Original format)
// ============================================
// This shows backward compatibility with the original sales report data structure

function SalesReportExample() {
  const salesReportData = {
    level: "company",
    charts: {
      company_sales: [
        { company_name: "Company A", value: 1000000, color: "#22d3ee" },
        { company_name: "Company B", value: 800000, color: "#fb7185" },
      ],
      region_sales: [
        { region_name: "North", value: 500000, color: "#38bdf8" },
        { region_name: "South", value: 400000, color: "#facc15" },
      ],
      area_sales_bar: [
        { area_name: "Area 1", value: 300000, color: "#6366f1" },
        { area_name: "Area 2", value: 250000, color: "#ff6ec7" },
      ],
      company_sales_trend: [
        { period: "Jan-24", value: 100000 },
        { period: "Feb-24", value: 120000 },
      ]
    },
    tables: {
      top_salesmen: [
        { salesman: "John Doe", value: 50000 },
        { salesman: "Jane Smith", value: 45000 },
      ],
      top_warehouses: [
        { warehouse_name: "Warehouse 1", value: 200000 },
      ],
      top_customers: [
        { customer_name: "Customer A", contact: "123456", warehouse_name: "WH1", value: 75000 },
      ],
      top_items: [
        { item_name: "Product A", value: 30000 },
        { item_name: "Product B", value: 25000 },
      ]
    }
  };

  return (
    <SalesCharts
      dashboardData={salesReportData}
      reportType="sales"     // Default: 'sales' for original sales reports
      searchType="value"
      isLoading={false}
      error={null}
    />
  );
}

// ============================================
// Example 3: With Loading State
// ============================================

function LoadingExample() {
  return (
    <SalesCharts
      dashboardData={null}
      reportType="customer"
      isLoading={true}       // Shows loading spinner
      error={null}
    />
  );
}

// ============================================
// Example 4: With Error State
// ============================================

function ErrorExample() {
  return (
    <SalesCharts
      dashboardData={null}
      reportType="customer"
      isLoading={false}
      error="Failed to load dashboard data" // Shows error message
    />
  );
}

// ============================================
// Example 5: Real-world Integration
// ============================================

import { useState, useEffect } from 'react';

function RealWorldExample() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from your API
    fetch('/api/customer-report?level=company')
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Report Dashboard</h1>
      <SalesCharts
        dashboardData={data}
        reportType="customer"
        searchType="value"
        isLoading={loading}
        error={error}
      />
    </div>
  );
}

// ============================================
// Key Props:
// ============================================
/**
 * @prop {object} dashboardData - The data object from your API
 * @prop {string} reportType - 'sales' (default) or 'customer'
 * @prop {string} searchType - 'value' (default) or 'quantity'
 * @prop {boolean} isLoading - Whether data is loading
 * @prop {string|null} error - Error message if any
 * @prop {object} chartData - (Optional) Legacy chart data format
 */

export { 
  CustomerReportExample, 
  SalesReportExample, 
  LoadingExample, 
  ErrorExample, 
  RealWorldExample 
};
