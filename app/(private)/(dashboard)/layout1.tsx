"use client";

import { initialLinkData } from "@/app/(private)/data/dashboardLinks";
import LinkDataReducer from "@/app/(private)/utils/linkDataReducer";
import { useReducer, useState } from "react";
import { AllDropdownListDataProvider } from "@/app/components/contexts/allDropdownListData";
import { LoadingProvider } from "@/app/services/loadingContext";
import Sidebar from "./sidebar1";

export default function DashboardLayout1({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Use useReducer to manage the sidebar data
    const [sidebarData, dispatch] = useReducer(
        LinkDataReducer,
        initialLinkData
    );
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Handle a link click to dispatch an action
    const handleLinkClick = (clickedHref: string) => {
        dispatch({ type: "activate", payload: clickedHref });
    };

    return (
        <div className="flex h-screen">
            <Sidebar onClickHandler={handleLinkClick} showSidebar={isOpen} setShowSidebar={setIsOpen} />

            <div className="w-full p-[20px] pb-[22px] h-screen bg-gray-50 text-black overflow-auto transition-all duration-300 ease-in-out" style={{ display: isOpen ? "none" : "block" }}>
                <AllDropdownListDataProvider>
                    <LoadingProvider >
                        {children}
                    </LoadingProvider >
                </AllDropdownListDataProvider>

            </div>
        </div>
    );
}