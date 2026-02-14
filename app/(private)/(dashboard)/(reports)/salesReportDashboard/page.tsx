"use client"
import SalesReportDashboard from '@/app/components/drag'
import React from 'react'
// import Drag from '../components/dragdrop/index'

const page = () => {
  return (
    <div>
        <SalesReportDashboard 
          title='Sales Report Dashboard'
          titleNearExport="Sales Report"
          reportType="sales"
          apiEndpoints={{
              filters: 'http://172.16.6.205:8001/api/sales-report-filters',
              dashboard: 'http://172.16.6.205:8001/api/sales-dashboard',
              table: 'http://172.16.6.205:8001/api/sales-report-table',
              export: 'http://172.16.6.205:8001/api/sales-report-export'
            }}
        />
    </div>
  )
}

export default page