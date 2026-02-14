"use client"
import SalesReportDashboard from '@/app/components/drag'

const page = () => {
  return (
    <div>
        <SalesReportDashboard 
          title='Attendence Report Dashboard'
          titleNearExport="Attendence Report"
          reportType="attendence"
          apiEndpoints={{
              filters: 'http://172.16.6.205:8001/api/attendance-filter',
              dashboard: '',
              table: 'http://172.16.6.205:8001/api/attendance-table',
              export: 'http://172.16.6.205:8001/api/attendance-export-xlsx'
            }}
        />
    </div>
  )
}

export default page;