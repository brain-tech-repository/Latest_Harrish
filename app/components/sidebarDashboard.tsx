import React, { useState } from 'react';
import { Menu, X, Filter } from 'lucide-react';

interface SidebarDashboardLayoutProps {
    title: string;
    sidebar: React.ReactNode;
    children: React.ReactNode;
    controls?: React.ReactNode;
    activeFilterCount?: number;
}

const SidebarDashboardLayout = ({ title, sidebar, children, controls, activeFilterCount = 0 }: SidebarDashboardLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-full overflow-hidden bg-gray-50/50">
            {/* Sidebar */}
            <div
                className={`shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[300px]' : 'w-0 opacity-0'
                    } overflow-hidden`}
            >
                {sidebar}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-1">
                {/* Header */}
                <header className="bg-white px-6 py-4 flex items-center justify-between shrink-0 z-10 rounded-xl shadow-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors relative"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Filter size={20} />}
                            {!isSidebarOpen && activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                                    {activeFilterCount > 9 ? '9+' : activeFilterCount}
                                </span>
                            )}
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                        </div>
                    </div>

                    {/* Header Controls */}
                    <div className="flex items-center gap-3">
                        {controls}
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 overflow-auto scrollbar-none p-1 pt-6">
                    <div className="max-w-[1920px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SidebarDashboardLayout;