"use client"
import SalesReportDashboard from '@/app/components/drag'

const page = () => {
  return (
    <div>
        <SalesReportDashboard 
          title='PO Order Report Dashboard'
          titleNearExport="PO Order Report"
          reportType="poOrder"
          apiEndpoints={{
              filters: 'http://172.16.6.205:8001/api/po-order-filters',
              dashboard: 'http://172.16.6.205:8001/api/pmry-ord-dashboard',
              table: 'http://172.16.6.205:8001/api/po-order-table',
              export: 'http://172.16.6.205:8001/api/po-order-export'
            }}
        />
    </div>
  )
}

export default page;