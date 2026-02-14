import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@iconify-icon/react";
import { ChevronDown } from 'lucide-react';

interface CustomerExportButtonsProps {
  onExport?: (fileType: string, viewType: string) => void;
  isLoading?: boolean;
}

const CustomerExportButtons: React.FC<CustomerExportButtonsProps> = ({ onExport, isLoading = false }) => {
  const [showCSVDropdown, setShowCSVDropdown] = useState(false);
  const [showXLSXDropdown, setShowXLSXDropdown] = useState(false);
  const [loadingType, setLoadingType] = useState<'csv' | 'xlsx' | null>(null);
  const csvDropdownRef = useRef<HTMLDivElement>(null);
  const xlsxDropdownRef = useRef<HTMLDivElement>(null);

  const viewOptions = [
    { value: 'default', label: 'Default' },
    { value: 'detail', label: 'Detail' }
  ];

  const handleExport = (fileType: string, viewType: string) => {
    setShowCSVDropdown(false);
    setShowXLSXDropdown(false);
    setLoadingType(fileType as 'csv' | 'xlsx');
    if (onExport) {
      onExport(fileType, viewType);
    }
  };

  // Reset loading type when isLoading becomes false
  useEffect(() => {
    if (!isLoading) {
      setLoadingType(null);
    }
  }, [isLoading]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (csvDropdownRef.current && !csvDropdownRef.current.contains(event.target as Node)) {
        setShowCSVDropdown(false);
      }
      if (xlsxDropdownRef.current && !xlsxDropdownRef.current.contains(event.target as Node)) {
        setShowXLSXDropdown(false);
      }
    };

    if (showCSVDropdown || showXLSXDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCSVDropdown, showXLSXDropdown]);

  return (
    <div className="flex gap-2 w-full sm:w-auto justify-start sm:justify-end">
      {/* CSV Export Button with Dropdown */}
      <div className="relative" ref={csvDropdownRef}>
        <button 
          onClick={() => !isLoading && setShowCSVDropdown(!showCSVDropdown)}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2 px-[10px] border border-[#D5D7DA] rounded-[8px] flex-1 sm:flex-none hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading && loadingType === 'csv' ? (
            <Icon icon="eos-icons:loading" width="16" height="16" />
          ) : (
            <>
              <Icon icon="bi:filetype-csv" width="16" height="16" />
              <span className="font-medium text-xs text-[#252B37]">CSV</span>
              <ChevronDown size={14} className="text-gray-600" />
            </>
          )}
        </button>

        {showCSVDropdown && !(isLoading && loadingType === 'csv') && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleExport('csv', option.value)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* XLSX Export Button with Dropdown */}
      <div className="relative" ref={xlsxDropdownRef}>
        <button 
          onClick={() => !isLoading && setShowXLSXDropdown(!showXLSXDropdown)}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-2 px-[10px] border border-[#D5D7DA] rounded-[8px] flex-1 sm:flex-none hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && loadingType === 'xlsx' ? (
            <Icon icon="eos-icons:loading" width="16" height="16" />
          ) : (
            <>
              <Icon icon="bi:filetype-xlsx" width="16" height="16" />
              <span className="font-medium text-xs text-[#252B37]">XLSX</span>
              <ChevronDown size={14} className="text-gray-600" />
            </>
          )}
        </button>

        {showXLSXDropdown && !(isLoading && loadingType === 'xlsx') && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleExport('xlsx', option.value)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerExportButtons;
