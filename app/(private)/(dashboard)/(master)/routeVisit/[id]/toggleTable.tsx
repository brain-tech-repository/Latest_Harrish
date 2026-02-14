"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Toggle from "@/app/components/toggle";
import Skeleton from "@mui/material/Skeleton";

const TableRowSkeleton = () => (
  <tr className="border-b-[1px] border-[#E9EAEB]">
    <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-[#E9EAEB]">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width={150} height={20} />
      </div>
    </td>
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-4 py-3 border-l border-[#E9EAEB]">
        <div className="flex justify-center">
          <Skeleton variant="circular" width={24} height={24} />
        </div>
      </td>
    ))}
  </tr>
);

// Types for customer schedule
type CustomerSchedule = {
  customer_id: number;
  days: string[];
};

type TableProps = {
  customers: any[];
  setCustomerSchedules: any;
  initialSchedules?: CustomerSchedule[];
  loading?: boolean;
  editMode?: boolean;
  visitUuid?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
};

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function Table({
  customers,
  setCustomerSchedules,
  initialSchedules = [],
  loading = false,
  editMode = false,
  visitUuid = "",
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: TableProps) {

  const transformCustomerList = (apiResponse: any[]) => {
    return apiResponse.map((item) => ({
      id: item.id,
      name: `${item.osa_code} - ${item.name.toUpperCase()}`,
    }));
  };
  const data = transformCustomerList(customers);
  const isInitialMount = useRef(true);
  const [internalLoading, setInternalLoading] = useState(false);
  const hasFetchedData = useRef(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.0,
        rootMargin: '300px'
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  // ✅ Track pre-filled customer IDs from API
  const [prefilledCustomerIds, setPrefilledCustomerIds] = useState<Set<number>>(
    new Set()
  );

  const [rowStates, setRowStates] = useState<
    Record<
      number,
      {
        Monday: boolean;
        Tuesday: boolean;
        Wednesday: boolean;
        Thursday: boolean;
        Friday: boolean;
        Saturday: boolean;
        Sunday: boolean;
      }
    >
  >({});

  // ✅ Filtered data
  const filteredData = data.filter(
    (customer) => !editMode || prefilledCustomerIds.has(customer.id) || customer.id >= 5000
  );

  // Initialize row states
  useEffect(() => {
    if (
      initialSchedules.length > 0 &&
      isInitialMount.current
    ) {
      const initialRowStates: typeof rowStates = {};
      const prefilledIds = new Set<number>();

      initialSchedules.forEach((schedule) => {
        initialRowStates[schedule.customer_id] = {
          Monday: schedule.days.includes("Monday"),
          Tuesday: schedule.days.includes("Tuesday"),
          Wednesday: schedule.days.includes("Wednesday"),
          Thursday: schedule.days.includes("Thursday"),
          Friday: schedule.days.includes("Friday"),
          Saturday: schedule.days.includes("Saturday"),
          Sunday: schedule.days.includes("Sunday"),
        };
        prefilledIds.add(schedule.customer_id);
      });

      setRowStates(initialRowStates);
      setPrefilledCustomerIds(prefilledIds);
    }

    isInitialMount.current = false;
  }, [initialSchedules, editMode]);

  // Update parent when rowStates change
  useEffect(() => {
    if (Object.keys(rowStates).length > 0) {
      setCustomerSchedules(rowStates);
    }
  }, [rowStates, setCustomerSchedules]);

  // Reset row states when customers change
  const previousCustomersLength = useRef(customers.length);
  const previousFirstCustomerId = useRef<number | null>(null);

  useEffect(() => {
    if (!editMode) {
      const currLength = customers.length;
      const firstId = customers.length > 0 ? customers[0].id : null;

      const isFreshFetch = currLength > 0 && (
        (previousFirstCustomerId.current !== null && firstId !== previousFirstCustomerId.current) ||
        (currLength < previousCustomersLength.current)
      );

      if (isFreshFetch) {
        setRowStates({});
        setPrefilledCustomerIds(new Set());
      }
      previousCustomersLength.current = currLength;
      previousFirstCustomerId.current = firstId;
    }
  }, [customers, editMode]);

  // Handle individual toggle
  const handleToggle = (
    rowId: number,
    field: keyof (typeof rowStates)[number]
  ) => {
    setRowStates((prev) => {
      const current = prev[rowId] || {
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false,
      };

      return {
        ...prev,
        [rowId]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  };

  // Handle row selection (Select All Days for a customer)
  const handleRowSelect = (rowId: number) => {
    setRowStates((prev) => {
      const current = prev[rowId] || {
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false,
      };

      const allSelected = Object.values(current).every(Boolean);

      return {
        ...prev,
        [rowId]: {
          Monday: !allSelected,
          Tuesday: !allSelected,
          Wednesday: !allSelected,
          Thursday: !allSelected,
          Friday: !allSelected,
          Saturday: !allSelected,
          Sunday: !allSelected,
        },
      };
    });
  };

  const isRowFullySelected = (rowId: number) => {
    const customerState = rowStates[rowId];
    if (!customerState) return false;
    return Object.values(customerState).every(Boolean);
  };

  return (
    <div className="w-full flex flex-col overflow-hidden">
      <div className="rounded-lg border border-[#E9EAEB] overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300"
        >
          <table className="w-full min-w-max border-collapse">
            <thead className="text-[12px] bg-[#FAFAFA] text-[#535862] sticky top-0 z-30">
              <tr className="border-b-[1px] border-[#E9EAEB]">
                <th className="px-4 py-3 font-[500] text-left min-w-[220px] sticky left-0 bg-[#FAFAFA] z-10 border-r border-[#E9EAEB]">
                  <div className="flex items-center gap-2">
                    <span>Customer List</span>
                  </div>
                </th>

                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day}
                    className="px-4 py-3 font-[500] text-center min-w-[120px] border-l border-[#E9EAEB]"
                  >
                    <span className="text-xs">{day}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="text-[14px] bg-white text-[#535862]">
              {(loading || internalLoading) ? (
                Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={`init-${i}`} />)
              ) : (
                <>
                  {filteredData.map((row) => {
                    const state = rowStates[row.id] || {
                      Monday: false,
                      Tuesday: false,
                      Wednesday: false,
                      Thursday: false,
                      Friday: false,
                      Saturday: false,
                      Sunday: false,
                    };

                    const isRowSelected = isRowFullySelected(row.id);

                    return (
                      <tr
                        className="border-b-[1px] border-[#E9EAEB] hover:bg-gray-50"
                        key={row.id}
                      >
                        <td className="px-4 py-3 text-left font-[500] sticky left-0 bg-white z-10 border-r border-[#E9EAEB] min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <Toggle
                              isChecked={isRowSelected}
                              onChange={() => handleRowSelect(row.id)}
                            />
                            <span
                              className="truncate max-w-[100%]"
                              title={row.name}
                            >
                              {row.name}
                            </span>
                          </div>
                        </td>

                        {DAYS_OF_WEEK.map((day) => (
                          <td
                            key={day}
                            className="px-4 py-3 text-center border-l border-[#E9EAEB] min-w-[120px]"
                          >
                            <div className="flex justify-center">
                              <Toggle
                                isChecked={state[day as keyof typeof state]}
                                onChange={() =>
                                  handleToggle(
                                    row.id,
                                    day as keyof (typeof rowStates)[number]
                                  )
                                }
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {isLoadingMore && (
                    Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={`more-${i}`} />)
                  )}
                </>
              )}
            </tbody>
          </table>

          {hasMore && (
            <div ref={observerRef} className="w-full flex justify-center py-2">
              <div className="h-1" />
            </div>
          )}
        </div>

        {!loading && !internalLoading && filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {editMode ? (
              <div>
                <p>No matching customers found for edit</p>
                <p className="text-sm text-gray-400 mt-2">
                  The pre-filled customer is not available in the current
                  customer type selection.
                </p>
              </div>
            ) : (
              "No customers found"
            )}
          </div>
        )}
      </div>
    </div>
  );
}