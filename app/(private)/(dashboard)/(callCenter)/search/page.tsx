"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AutoSuggestion, { Option } from "@/app/components/autoSuggestion";
import ContainerCard from "@/app/components/containerCard";
import { Icon } from "@iconify/react";
import AutoSearch from "@/app/components/autoSearch";

const API_URL = "http://172.16.6.205:8001/api/call-center/search";

export default function SearchPage() {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  return (
    <>
      <h1 className="text-[18px] font-semibold">Search</h1>

      <ContainerCard className="mt-5 search-bar-big">
        <div className="flex justify-center search-box">
        <AutoSearch
          label="Search by name / code / phone"
          placeholder="Search"
          initialValue={searchValue}
          onSearch={async (query: string): Promise<Option[]> => {
            if (!query) return [];

            const res = await fetch(
              `${API_URL}?q=${encodeURIComponent(query)}`
            );
            const json = await res.json();
            const rows = json?.data || [];

            return rows.map((item: any) => ({
              value: item.uuid,
              label: (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm">
                      {item.code} - {item.name}
                    </div>
                    <div className="text-xs text-gray-500 type-label">
                      {item.type}
                    </div>
                  </div>
                  {item.contact_no1 ? (
                    <div className="text-sm font-medium text-black-500 phone-bl flex items-center gap-1">
                      <Icon
                        icon="lucide:phone-call"
                        width={12}
                        className="text-red-500"
                      />
                      {item.contact_no1}
                    </div>
                  ) : null}
                </div>
              ),
              original: item,
            }));
          }}
          onSelect={(opt: Option) => {
            const uuid = opt.original?.uuid;
            if (!uuid) return;
            router.push(`/fieldcustomer/details/${uuid}`);
          }}
          onClear={() => setSearchValue("")}
        />
        </div>
      </ContainerCard>
    </>
  );
}
