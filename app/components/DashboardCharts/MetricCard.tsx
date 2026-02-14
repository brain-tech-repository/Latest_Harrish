import React from 'react';
import { Icon } from "@iconify-icon/react";

interface MetricCardProps {
    title: string;
    value: number;
    icon?: string;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    colorClass?: string;
}

const MetricCard = ({ title, value, icon, trend, colorClass = "bg-white" }: MetricCardProps) => {
    return (
        <div className={`p-6 rounded-xl shadow-sm border border-gray-100 ${colorClass}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-2 text-gray-900">
                        {value.toLocaleString()}
                    </h3>
                </div>
                {icon && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <Icon icon={icon} width={24} height={24} className="text-gray-600" />
                    </div>
                )}
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.isPositive ? '+' : '-'}{trend.value}%
                    </span>
                    <span className="text-gray-400 ml-2">{trend.label}</span>
                </div>
            )}
        </div>
    );
};

export default MetricCard;
