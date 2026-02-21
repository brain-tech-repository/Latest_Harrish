"use client"
import SalesReportDashboard from '@/app/components/drag'
import React from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const page = () => {
  return (
    <div>
      <SalesReportDashboard
        title="Sales Report Dashboard"
        titleNearExport="Sales Report"
        reportType="php"
        apiEndpoints={{
          filters: "",
          dashboard: `${API_BASE}/get_sales_dashboard_data`,
          table: `${API_BASE}/get_sales_dashboard_data`,
          export: ""
        }}
      />

    </div>
  )
}

export default page
