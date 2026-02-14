"use client"
import SalesReportDashboard from '@/app/components/drag'

const page = () => {
    return (
        <div>
            <SalesReportDashboard
                title='Comparison Report Dashboard'
                titleNearExport="Comparsion Report"
                apiEndpoints={{
                    filters: 'http://172.16.6.205:8001/api/comparison-filter',
                    dashboard: 'http://172.16.6.205:8001/api/dashboard',
                    table: 'http://172.16.6.205:8001/api/comparison-table',
                    export: 'http://172.16.6.205:8001/api/comparison-export'
                }}
                reportType="comparison"
            />
        </div>
    )
}

export default page