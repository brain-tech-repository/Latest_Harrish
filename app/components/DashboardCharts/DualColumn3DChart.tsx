import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface DualColumn3DChartProps {
    data: any[];
    series1Key: string;
    series1Name: string;
    series2Key: string;
    series2Name: string;
    xAxisKey?: string;
    height?: string;
}

const DualColumn3DChart = ({
    data,
    series1Key,
    series1Name,
    series2Key,
    series2Name,
    xAxisKey = 'name',
    height = '400px'
}: DualColumn3DChartProps) => {

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                No data available
            </div>
        );
    }

    const options: Highcharts.Options = {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
            options3d: {
                enabled: true,
                alpha: 5,
                beta: 0,
                depth: 50,
                viewDistance: 25
            },
            height: height
        },
        title: {
            text: '',
            style: { fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }
        },
        credits: { enabled: false },
        xAxis: {
            categories: data.map((item: any) => item[xAxisKey]),
            labels: {
                skew3d: true,
                style: { fontSize: '11px', color: '#4b5563' }
            },
            title: { text: '' }
        },
        yAxis: {
            title: {
                text: 'Number of Customers',
                style: { color: '#4b5563' }
            },
            labels: {
                formatter: function () {
                    return this.value?.toLocaleString();
                },
                style: { color: '#4b5563' }
            }
        },
        tooltip: {
            shared: true,
            formatter: function () {
                let tooltip = `<b>${this.x}</b><br/>`;
                if (this.points) {
                    this.points.forEach((point: any) => {
                        const dataItem = point.point && point.point.index !== undefined ? data[point.point.index] : undefined;
                        if (point.series.name === series2Name && dataItem && dataItem.visited_percentage !== undefined) {
                            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y?.toLocaleString()}</b> (${dataItem.visited_percentage}% Visited)<br/>`;
                        } else {
                            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y?.toLocaleString()}</b><br/>`;
                        }
                    });
                }
                return tooltip;
            },
            style: { fontSize: '12px' }
        },
        plotOptions: {
            column: {
                depth: 15,
                borderWidth: 0,
                grouping: true,
                groupPadding: 0.25,
                pointPadding: 0.2,
                pointWidth: 15,
                dataLabels: { enabled: false }
            }
        },
        series: [{
            type: 'column',
            name: series1Name,
            data: data.map((item: any) => item[series1Key] || 0),
            color: '#4f46e5', // Indigo
            pointWidth: 25
        }, {
            type: 'column',
            name: series2Name,
            data: data.map((item: any) => item[series2Key] || 0),
            color: '#10b981', // Emerald
            pointWidth: 25
        }]
    };

    return (
        <div className="w-full h-full">
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

export default DualColumn3DChart;
