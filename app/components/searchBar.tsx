import { Icon } from "@iconify-icon/react";
import { useState } from "react";

export default function SearchBar({
    placeholder = "Search here...",
    value,
    onChange,
    onEnterPress,
    onClear,
    icon = "iconamoon:search",
    iconWidth = 20,
}: {
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEnterPress?: (e?: React.KeyboardEvent<HTMLInputElement>) => void;
    onClear?: () => void;
    icon?: string;
    iconWidth?: number;
}) {
    return (
        <div className="relative text-[14px]" tabIndex={-1} style={{ color: 'var(--table-text-color, #717680)' }}>
            <div className="absolute top-0 left-0 flex items-center h-full pl-[12px]">
                <Icon icon={icon} width={iconWidth} />
            </div>
            <input
                type="text"
                onKeyDown={(e) => e.key === "Enter" && onEnterPress && onEnterPress(e)}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="border mt-[2px] rounded-md p-2 w-full h-[36px] py-[8px] px-[40px]"
                style={{ 
                    backgroundColor: 'var(--table-bg-color, #FFFFFF)', 
                    borderColor: 'var(--table-border-color, #E9EAEB)',
                    color: 'var(--text-primary-color, #181D27)'
                }}
            />
            {value !== "" && <div className="absolute top-0 right-0 flex items-center h-full pr-[12px] cursor-pointer" onClick={onClear}>
                <Icon icon={"iconamoon:close-light"} width={iconWidth} className="cursor-pointer text-red-500" />
            </div>}
        </div>
    );
}