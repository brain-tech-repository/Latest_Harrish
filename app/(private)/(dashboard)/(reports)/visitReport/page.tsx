"use client"
import SalesReportDashboard from '@/app/components/drag'
import React from 'react'

const page = () => {
    return (
        <div>
            <SalesReportDashboard
                title='Visit Report Dashboard'
                titleNearExport="Visit Report"
                reportType="visit"
                apiEndpoints={{
                    filters: 'http://172.16.6.205:8001/api/visit-filter',
                    dashboard: 'http://172.16.6.205:8001/api/visit-dashboard',
                    table: 'http://172.16.6.205:8001/api/visit-table',
                    export: 'http://172.16.6.205:8001/api/visit-export'
                }}
            />
        </div>
    )
}

export default page