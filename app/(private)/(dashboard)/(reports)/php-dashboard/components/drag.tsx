"use client"
import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Users,
  MapPin,
  Map,
  Building2,
  Route,
  Store,
  Tag,
  Layers,
  Package,
  Calendar,
  Filter,
  Plus,
  Check,
  X
} from "lucide-react"
import { CardTitle } from "@/components/ui/card"

interface FilterOption {
  id: number | string
  [key: string]: any
}

export interface FilterConfig {
  id: string
  name: string
  data?: FilterOption[]
  field: string
  dependsOn?: string | null
}

const iconMap: Record<string, React.ReactNode> = {
  region: <MapPin className="h-4 w-4" />,
  sub_region: <Map className="h-4 w-4" />,
  warehouse: <Building2 className="h-4 w-4" />,
  route: <Route className="h-4 w-4" />,
  trading: <Store className="h-4 w-4" />,
  customer: <Users className="h-4 w-4" />,
  mat_brand: <Tag className="h-4 w-4" />,
  mat_group: <Layers className="h-4 w-4" />,
  material: <Package className="h-4 w-4" />,
  /* Optional future filters */
  branch: <Building2 className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
}

interface Props {
  filters: FilterConfig[]
  dropped: string[]
  selected: Record<string, string[]>
  openFilter: string | null
  setOpenFilter: (val: string | null) => void
  setDropped: React.Dispatch<React.SetStateAction<string[]>>
  setSelected: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >
}

export default function SalesReportDragFilters({
  filters,
  dropped,
  selected,
  openFilter,
  setOpenFilter,
  setDropped,
  setSelected,
}: Props) {

  const [showAll, setShowAll] = useState(false)

  /* ================= DRAG ================= */
  const handleDragStart = (id: string, e: React.DragEvent) => {
    e.dataTransfer.setData("filterId", id)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("filterId")
    if (!dropped.includes(id)) {
      setDropped((prev) => [...prev, id])
    }
  }

  /* ================= TOGGLE ================= */
  const toggleItem = (filterId: string, itemId: string) => {
    setSelected((prev) => {
      const current = prev[filterId] || []
      const updated = current.includes(itemId)
        ? current.filter((i) => i !== itemId)
        : [...current, itemId]

      return { ...prev, [filterId]: updated }
    })
  }

  /* ================= SELECT ALL ================= */
  const handleSelectAll = (filterId: string) => {
    const filter = filters.find((f) => f.id === filterId)
    if (!filter?.data) return

    const allIds = filter.data.map((item) =>
      String(item.id)
    )

    const current = selected[filterId] || []
    const allSelected =
      allIds.length > 0 &&
      allIds.every((id) => current.includes(id))

    setSelected((prev) => ({
      ...prev,
      [filterId]: allSelected ? [] : allIds,
    }))
  }

  /* ================= REMOVE ================= */
  const removeFilter = (id: string) => {
    setDropped((prev) => prev.filter((f) => f !== id))
    setSelected((prev) => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }

  /* ================= SHOW MORE LOGIC ================= */
  const visibleCount = 5
  const hasOverflow = filters.length > visibleCount
  const filteredFilters = filters.filter(
    (filter) => !dropped.includes(filter.id)
  )

  const visibleFilters = showAll
    ? filteredFilters
    : filteredFilters.slice(0, visibleCount)
  return (
    <div className="space-y-4">

      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 bg-gray-300/30 py-3 px-2 rounded-lg">

        {/* TITLE COLUMN */}
        <div className="min-w-[180px]">
          <CardTitle className="text-md font-semibold mt-2">
            Drag & Drop Filter
          </CardTitle>
        </div>

        {/* FILTER COLUMN */}
        <div className="flex flex-wrap gap-3 flex-1">

          {visibleFilters.map((filter) => {
            const isDisabled =
              filter.dependsOn &&
              !selected[filter.dependsOn]?.length

            return (
              <div
                key={filter.id}
                draggable={!isDisabled}
                onDragStart={(e) =>
                  !isDisabled &&
                  handleDragStart(filter.id, e)
                }
                className={`
                  flex items-center gap-2 px-4 py-2 border-gray-50 rounded-md
                  transition-all duration-200 select-none min-w-[140px]
                  ${isDisabled
                    ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-100"
                    : "cursor-grab bg-white text-gray-700 border-gray-300 hover:shadow-md hover:border-green-400 active:cursor-grabbing"}
                `}
              >
                {iconMap[filter.id] || (
                  <Filter className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm font-medium">
                  {filter.name}
                </span>
              </div>
            )
          })}
          {/* MORE BUTTON */}
          {hasOverflow && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[140px] justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  +{filteredFilters.length - visibleCount} More
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[260px] p-2">
                <div className="space-y-2">

                  {filteredFilters.slice(visibleCount).map((filter) => {
                    const isDisabled =
                      filter.dependsOn &&
                      !selected[filter.dependsOn]?.length

                    return (
                      <div
                        key={filter.id}
                        draggable={!isDisabled}
                        onDragStart={(e) =>
                          !isDisabled &&
                          handleDragStart(filter.id, e)
                        }
                        className={`
                flex items-center justify-between
                px-3 py-2 border border-gray-300 rounded-md
                transition-all duration-200
                select-none text-sm
                ${isDisabled
                            ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400"
                            : "cursor-grab bg-white hover:border-green-400 hover:shadow-sm active:cursor-grabbing"}
              `}
                      >
                        <div className="flex items-center gap-2">
                          {iconMap[filter.id] || (
                            <Filter className="h-4 w-4 text-gray-500" />
                          )}
                          {filter.name}
                        </div>

                        <Badge className="bg-gray-100 text-gray-600 border border-gray-200">
                          {selected[filter.id]?.length || 0}
                        </Badge>
                      </div>
                    )
                  })}

                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* ================= DROP AREA ================= */}
      <div
        className="relative border border-dashed border-gray-300 p-4 rounded-lg min-h-[140px] flex items-center justify-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >

        {dropped.length === 0 && (
          <div className="flex flex-col items-center text-gray-400">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">
              Drop Filter Here
            </span>
          </div>
        )}

        {dropped.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
            {dropped.map((id) => {
              const filter = filters.find((f) => f.id === id)
              if (!filter) return null

              const totalItems =
                filter.data?.length || 0
              const selectedCount =
                selected[id]?.length || 0

              const allSelected =
                selectedCount === totalItems &&
                totalItems > 0

              return (
                <div key={id} className="flex items-center gap-2">

                  <Popover
                    open={openFilter === id}
                    onOpenChange={(open) =>
                      setOpenFilter(open ? id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {filter.name}
                        <Badge
                          className={
                            selectedCount > 0
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }
                        >
                          {selectedCount}
                        </Badge>
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[260px] p-2">
                      <Command>
                        <CommandInput
                          placeholder={`Search ${filter.name}`}
                        />
                        <CommandList>
                          <CommandEmpty>
                            No results
                          </CommandEmpty>

                          <CommandGroup>

                            <CommandItem
                              onSelect={() =>
                                handleSelectAll(id)
                              }
                              className="flex justify-between font-medium"
                            >
                              Select All
                              {allSelected && (
                                <Check className="h-4 w-4" />
                              )}
                            </CommandItem>

                            {filter.data?.map((item) => {
                              const isSelected =
                                selected[id]?.includes(
                                  String(item.id)
                                )

                              return (
                                <CommandItem
                                  key={item.id}
                                  onSelect={() =>
                                    toggleItem(
                                      id,
                                      String(item.id)
                                    )
                                  }
                                  className="flex justify-between"
                                >
                                  {item[filter.field]}
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFilter(id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}