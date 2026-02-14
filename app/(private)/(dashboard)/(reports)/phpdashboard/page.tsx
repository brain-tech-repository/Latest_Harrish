"use client"
import SalesReportDashboard from '@/app/components/drag'
import React from 'react'

const page = () => {
  return (
    <div>
      <SalesReportDashboard
        title="Sales Report Dashboard"
        titleNearExport="Sales Report"
        reportType="php"
        apiEndpoints={{
          filters: "",
          dashboard:
            "http://165.227.64.72/mpldev/index.php/api/get_sales_dashboard_data",
          table: "http://165.227.64.72/mpldev/index.php/api/get_sales_dashboard_data",
          export: ""
        }}
      />

    </div>
  )
}

export default page
