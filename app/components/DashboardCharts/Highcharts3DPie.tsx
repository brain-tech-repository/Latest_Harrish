import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface Highcharts3DPieProps {
    data: any[];
    title?: string;
    height?: string;
    innerRadius?: number;
    outerRadius?: number;
    size?: string;
    isQuantity?: boolean;
}

const Highcharts3DPie = ({
    data,
    title = '',
    height = '400px',
    innerRadius = 0,
    outerRadius = 100,
    size = '75%',
    isQuantity = false
}: Highcharts3DPieProps) => {

    useEffect(() => {
        if (typeof window !== 'undefined' && Highcharts) {
            try {
                if (!(Highcharts as any).__3dLoaded) {
                    import('highcharts/highcharts-3d').then((mod: any) => {
                        if (typeof mod.default === 'function') {
                            (mod.default as any)(Highcharts);
                        }
                        (Highcharts as any).__3dLoaded = true;
                    });
                }
            } catch (e) {
                // ignore
            }
        }
    }, []);

    const seriesData = (Array.isArray(data) ? data : []).map((d: any) => ({
        name: d.name,
        y: d.value || 0,
        color: d.color || undefined,
        sliced: !!d.sliced,
    }));

    const [hiddenNames, setHiddenNames] = useState<string[]>([]);

    const toggleLegend = (name: string) => {
        setHiddenNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    };

    const visibleSeriesData = seriesData.filter(s => !hiddenNames.includes(s.name));

    const options: Highcharts.Options = {
        chart: {
            type: 'pie',
            options3d: { enabled: true, alpha: 45, beta: 0, depth: 45 },
            backgroundColor: 'transparent',
            height: height,
            spacingTop: 20,
        },
        credits: { enabled: false },
        title: {
            text: title || undefined,
            style: { fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }
        },
        legend: { enabled: false },
        tooltip: {
            pointFormat: isQuantity ? '<b>{point.percentage:.1f}%</b><br/>{point.y:,.0f} Qty' : '<b>{point.percentage:.1f}%</b><br/> {point.y:,.0f}'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                depth: 45,
                size: size,
                innerSize: innerRadius && outerRadius ? `${Math.round((innerRadius / outerRadius) * 100)}%` : undefined,
                dataLabels: { enabled: false },
                showInLegend: true,
            },
        },
        series: [{ type: 'pie', name: title || 'Data', data: visibleSeriesData }],
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            {seriesData.length > 0 && (
                <div className="mb-4 w-full overflow-y-auto border-b border-gray-100 max-h-[80px]">
                    <div className="flex flex-wrap items-center text-[10px] text-gray-700 p-1">
                        {seriesData.map((item: any, idx: number) => {
                            const hidden = hiddenNames.includes(item.name);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => toggleLegend(item.name)}
                                    className={`inline-flex items-center gap-2 px-1 py-0.5 focus:outline-none transition-opacity`}
                                    title={item.name}
                                >
                                    <span style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: hidden ? '#9ca3af' : item.color || '#ccc',
                                        display: 'inline-block',
                                        flex: '0 0 auto'
                                    }} />
                                    <span className={`truncate max-w-[150px] ${hidden ? 'opacity-40 line-through hover:opacity-100' : 'opacity-100'}`}>{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ height: height }}>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
        </div>
    );
};

export default Highcharts3DPie;
