"use client"
import SalesReportDashboard from '@/app/components/drag'

const page = () => {
  return (
    <div>
        <SalesReportDashboard 
          title='Customer Report Dashboard' 
          titleNearExport="Customer Report"
          apiEndpoints={{
            filters: 'http://172.16.6.205:8001/api/customer-report-filters',
            dashboard: 'http://172.16.6.205:8001/api/customer-sales-dashboard',
            table: 'http://172.16.6.205:8001/api/customer-sales-table',
            export: 'http://172.16.6.205:8001/api/customer-sales-export'
          }}
          reportType="customer"
        />
    </div>
  )
}

export default page