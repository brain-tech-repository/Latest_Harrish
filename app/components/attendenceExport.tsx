import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@iconify-icon/react";
import { ChevronDown } from 'lucide-react';

interface CustomerExportButtonsProps {
  onExport?: () => void;
  isLoading?: boolean;
}

const AttendenceExportButtons: React.FC<CustomerExportButtonsProps> = ({ onExport, isLoading = false }) => {
  const xlsxDropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex gap-2 w-full sm:w-auto justify-start sm:justify-end">
      {/* XLSX Export Button with Dropdown */}
      <div className="relative" ref={xlsxDropdownRef}>
        <button 
          onClick={() => !isLoading && onExport && onExport()}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2 px-[10px] border border-[#D5D7DA] rounded-[8px] flex-1 sm:flex-none hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Icon icon="eos-icons:loading" width="16" height="16" />
          ) : (
            <>
              <Icon icon="bi:filetype-xlsx" width="16" height="16" />
              <span className="font-medium text-xs text-[#252B37]">XLSX</span>
              <ChevronDown size={14} className="text-gray-600" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AttendenceExportButtons;