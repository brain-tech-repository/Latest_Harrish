import { Icon } from "@iconify-icon/react";
import { useEffect, useState } from "react";
import DismissibleDropdown from "./dismissibleDropdown";
import CustomDropdown from "./customDropdown";

export default function InputDropdown({
    label,
    defaultOption = 0,
    defaultText = "",
    options,
    onOptionSelect,
    dropdownTw = ""
}: {
    label: string;
    defaultOption?: number;
    defaultText?: string;
    options: { label: string; value: string }[];
    onOptionSelect: (option: { label: string; value: string }) => void;
    dropdownTw?: string
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOptionLabel, setSelectedOptionLabel] = useState(defaultText);

    function onSelect(option: { label: string; value: string }) {
        setSelectedOptionLabel(option.label);
        setIsOpen(false);
        onOptionSelect(option);
    }

    useEffect(() => {
        if(options[defaultOption]?.label) setSelectedOptionLabel(options[defaultOption]?.label);
    }, [options, defaultOption]);

    return (
        <DismissibleDropdown
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            button={
                <label htmlFor={label} className="w-full">
                    <div className="text-[14px] font-medium" style={{ color: 'var(--input-label, #414651)' }}>
                        {label}
                    </div>
                    <div
                        id={label}
                        className="relative h-[44px] w-full rounded-md px-[14px] py-[10px] mt-[6px] text-[16px] flex items-center justify-between"
                        style={{
                            backgroundColor: 'var(--input-bg, #FFFFFF)',
                            borderColor: 'var(--input-border, #D1D5DB)',
                            borderWidth: '1px',
                            color: 'var(--input-text, #717680)'
                        }}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="w-full overflow-hidden">
                            <div className="whitespace-nowrap">{selectedOptionLabel}</div>
                        </div>
                        <Icon
                            icon="material-symbols:expand-more-rounded"
                            className={`aboslute right-[14px] top-0 h-full ${ isOpen && "rotate-180"}`}
                            width={24}
                            style={{ color: 'var(--icon-color, #717680)' }}
                        />
                    </div>
                </label>
            }
            dropdown={
                <div className={`absolute z-20 w-full min-h-1/2 max-h-[200px] h-fit overflow-y-auto scrollbar-none ${dropdownTw}`}>
                    <CustomDropdown>
                        {options.map((option, index) => (
                            <div 
                                key={index} 
                                className="p-[10px] cursor-pointer"
                                style={{ color: 'var(--dropdown-text, #414651)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dropdown-hover-bg, #F5F5F5)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                onClick={() => onSelect(option)}
                            >
                                <div key={index + label}>{option.label}</div>
                            </div>
                        ))}
                    </CustomDropdown>
                </div>
            }
        />
    );
}
