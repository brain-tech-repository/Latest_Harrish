"use client"
import SalesReportDashboard from '@/app/components/drag'

const page = () => {
  return (
    <div>
        <SalesReportDashboard 
          title='Load Unload Report Dashboard' 
          titleNearExport="Load Unload Report"
          apiEndpoints={{
            filters: 'http://172.16.6.205:8001/api/load-unload-filter',
            dashboard: 'http://172.16.6.205:8001/api/load-unload-dashboard',
            table: 'http://172.16.6.205:8001/api/load-unload-table',
            export: 'http://172.16.6.205:8001/api/load-unload-export'
          }}
          reportType="loadunload"
        />
    </div>
  )
}

export default page