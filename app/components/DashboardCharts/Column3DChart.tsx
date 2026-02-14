import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface Column3DChartProps {
    data: any[];
    title?: string;
    xAxisKey?: string;
    yAxisKey?: string;
    colors?: string[];
    height?: string;
    width?: string;
    hiddenItems?: string[];
    isQuantity?: boolean;
}

const Column3DChart = ({
    data,
    title,
    xAxisKey = 'name',
    yAxisKey = 'value',
    colors = ['#6366f1', '#ff6ec7', '#29e53bff', '#c084fc', '#e879f9', '#fb7185', '#f97316', '#facc15', '#2dd4bf', '#38bdf8', '#60a5fa', '#22d3ee'],
    height = '400px',
    width = '100%',
    hiddenItems = [],
    isQuantity = false
}: Column3DChartProps) => {
    const [is3DLoaded, setIs3DLoaded] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (typeof window !== 'undefined' && Highcharts) {
            import('highcharts/highcharts-3d').then((mod: any) => {
                if (typeof mod.default === 'function') {
                    (mod.default as any)(Highcharts);
                }
                if (mounted) setIs3DLoaded(true);
            }).catch(() => {
                if (mounted) setIs3DLoaded(true);
            });
        }
        return () => { mounted = false; };
    }, []);

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                No data available
            </div>
        );
    }

    const yAxisLabel = isQuantity ? 'Quantity' : `Value`;

    const options: Highcharts.Options = {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
            options3d: {
                enabled: true,
                alpha: 5,
                beta: 5,
                depth: 50,
                viewDistance: 50
            },
            width: width,
            height: height,
            marginTop: 100,
            spacingTop: 10,
        },
        title: {
            text: title,
            style: {
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1f2937'
            }
        },
        credits: { enabled: false },
        legend: {
            enabled: true,
            align: 'center',
            verticalAlign: 'top',
            layout: 'horizontal',
            maxHeight: 80,
            margin: 30,
            navigation: {
                activeColor: '#3E576F',
                animation: true,
                arrowSize: 10,
                inactiveColor: '#CCC',
                style: {
                    align: 'right',
                    fontWeight: 'bold',
                    color: '#4b5563',
                    fontSize: '11px'
                }
            },
            itemStyle: {
                fontSize: '9px',
                fontWeight: 'normal',
                color: '#4b5563'
            },
        },
        xAxis: {
            categories: data.map((item: any) => item[xAxisKey]),
            labels: { enabled: false },
            title: { text: '' }
        },
        yAxis: {
            title: {
                text: yAxisLabel,
                style: { color: '#4b5563' }
            },
            labels: {
                formatter: function () {
                    const v = this.value as number;
                    if (isQuantity) return ` ${v.toLocaleString()}`;
                    if (v >= 100000) return ` ${(v / 100000).toFixed(2)}L`;
                    return ` ${v.toLocaleString()}`;
                },
                style: { color: '#4b5563' }
            }
        },
        tooltip: {
            formatter: function () {
                if (isQuantity) {
                    return `<b>${this.series && this.series.name ? this.series.name : this.key}</b><br/>${this.y?.toLocaleString()} Qty`;
                }
                return `<b>${this.series && this.series.name ? this.series.name : this.key}</b><br/>UGX ${this.y?.toLocaleString()}`;
            },
            style: { fontSize: '12px' }
        },
        plotOptions: {
            column: {
                depth: 40,
                borderWidth: 0,
                pointPadding: 0.1,
                groupPadding: 0.1,
                dataLabels: {
                    format: isQuantity ? '{y:,.0f} Qty' : ' {y:,.0f}',
                    style: { fontSize: '10px', textOutline: 'none' }
                }
            }
        },
        series: data.map((item: any, index: number) => ({
            type: 'column',
            name: item[xAxisKey],
            data: [item[yAxisKey]],
            color: item.color || colors[index % colors.length],
            showInLegend: true,
            visible: !(Array.isArray(hiddenItems) && hiddenItems.includes(item[xAxisKey]))
        }))
    };

    return (
        <div className="w-full h-full">
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

export default Column3DChart;
