"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart2, TableIcon } from "lucide-react";
import DateRangePicker from "@/app/components/DateRangePicker";
import InputDropdown from "@/app/components/inputDropdown";

interface SalesReportFiltersProps {
  fromDate?: Date;
  toDate?: Date;
  reportType: string;
  setFromDate: (date?: Date) => void;
  setToDate: (date?: Date) => void;
  setReportType: (value: string) => void;
  onSubmit: (type: "table" | "graph") => void;
  loading: boolean;
  view: "table" | "graph";
  setView: (value: "table" | "graph") => void;
}

export default function SalesReportFilters({
  fromDate,
  toDate,
  reportType,
  setFromDate,
  setToDate,
  setReportType,
  onSubmit,
  loading,
  view,
  setView,
}: SalesReportFiltersProps) {

  // Convert Date → yyyy-mm-dd
  const formatToInput = (date?: Date) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Handle DateRangePicker Change
  const handleDateChange = (e: { target: { value: string } }) => {
    const value = e.target.value;
    const [from, to] = value.split("|");

    setFromDate(from ? new Date(from) : undefined);
    setToDate(to ? new Date(to) : undefined);
  };

  return (
    <div className="flex flex-wrap items-end justify-between gap-6  py-3 rounded-lg">

      {/* LEFT SIDE */}
      <div className="flex flex-wrap items-end gap-6">

        {/* Custom Date Range Picker */}
        <div className="w-[250px]">
          <DateRangePicker
            value={`${formatToInput(fromDate)}|${formatToInput(toDate)}`}
            onChange={handleDateChange}
            placeholder="Select Date Range"
          />
        </div>

        {/* Report Type */}
        <div className="w-[250px]">
          <InputDropdown
            label=""
            options={[
              { label: "Header Wise", value: "1" },
              { label: "Details Wise", value: "2" },
            ]}
            defaultOption={
              reportType === "1" ? 0 : reportType === "2" ? 1 : 0
            }
            onOptionSelect={(option) => {
              setReportType(option.value);
            }}
          />
        </div>
      </div>

      {/* RIGHT SIDE BUTTONS */}
      <div className="flex gap-3">

        <Button
          variant={view === "table" ? "default" : "outline"}
          onClick={() => {
            setView("table");
            onSubmit("table");
          }}
          disabled={loading}
          className="min-w-[110px] py-5"
        >
          <TableIcon className="mr-2 h-4 w-4" />
          {loading && view === "table" ? "Loading..." : "Table"}
        </Button>

        <Button
          variant={view === "graph" ? "default" : "outline"}
          onClick={() => {
            setView("graph");
            onSubmit("graph");
          }}
          disabled={loading}
          className="min-w-[110px] py-5"
        >
          <BarChart2 className="mr-2 h-4 w-4" />
          {loading && view === "graph" ? "Loading..." : "Graph"}
        </Button>

      </div>
    </div>
  );
}