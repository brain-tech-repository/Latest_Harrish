"use client"
import SalesReportDashboard from '@/app/components/drag'

const page = () => {
  return (
    <div>
        <SalesReportDashboard 
          title='Item Report Dashboard' 
          titleNearExport="Item Report"
          apiEndpoints={{
            filters: 'http://172.16.6.205:8001/api/item-filters',
            dashboard: 'http://172.16.6.205:8001/api/item-report-dashboard',
            table: 'http://172.16.6.205:8001/api/item_table',
            export: 'http://172.16.6.205:8001/api/item-export'
          }}
          reportType="item"
        />
    </div>
  )
}

export default page