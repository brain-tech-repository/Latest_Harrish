"use client";

import { Icon } from "@iconify-icon/react";

export default function SummaryCard({
    icon,
    iconWidth = 30,
    className,
    iconCircleTw,
    children,
    title,
    description,
    isVertical
}: {
    icon: string;
    iconWidth?: number;
    iconCircleTw?: string;
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    isVertical?: boolean
    children?: React.ReactNode;
}) {
    return (
        <div className={`flex ${ isVertical ? "flex-col text-center" : "flex-row"} items-center gap-[20px] ${className}`}>
            {/* icon Circle */}
            <div
                className={`rounded-full ${
                    iconCircleTw ||
                    "bg-[#EA0A2A] text-white w-[60px] h-[60px] p-[15px]"
                }`}
            >
                <Icon icon={icon} width={iconWidth} />
            </div>

            <div className={`flex flex-col ${isVertical ? "gap-[12px]" : "gap-[10px]"}`}>
                {children || (
                    <>
                        {/* title */}
                        {typeof title === "string" ? (
                            <div className="text-[24px] font-semibold" style={{ color: 'var(--summary-title, #181D27)' }}>
                                {title}
                            </div>
                        ) : (
                            title
                        )}

                        {/* description */}
                        {typeof description === "string" ? (
                            <div className="text-[16px]" style={{ color: 'var(--summary-text, #414651)' }}>
                                {description}
                            </div>
                        ) : (
                            description
                        )}
                    </>
                )}
            </div>
        </div>
    );
}