"use client";

import { useCallback, useEffect, useState } from "react";

import { Icon } from "@iconify-icon/react";
import { useRouter } from "next/navigation";
import DismissibleDropdown from "@/app/components/dismissibleDropdown";
import CustomDropdown from "@/app/components/customDropdown";
import { useSnackbar } from "@/app/services/snackbarContext";
import BorderIconButton from "@/app/components/borderIconButton";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { useLoading } from "@/app/services/loadingContext";
//import { deletespare, vendorList } from "@/app/services/assetsApi";
import Table, { listReturnType, TableDataType } from "@/app/components/customTable";
import StatusBtn from "@/app/components/statusBtn2";
import {spareMenu,spareSubCategoryList} from "@/app/services/assetsApi";

const dropdownDataList = [
  { icon: "lucide:radio", label: "Inactive", iconWidth: 20 },
  { icon: "lucide:delete", label: "Delete", iconWidth: 20 },
];

export default function SpareList() {
   const { setLoading } = useLoading();
     const [showDropdown, setShowDropdown] = useState(false);
     const [showDeletePopup, setShowDeletePopup] = useState(false);
     const [deleteSelectedRow, setDeleteSelectedRow] = useState<string | null>(null);
     const [refreshKey, setRefreshKey] = useState(0);

     const router = useRouter();
     const { showSnackbar } = useSnackbar();
    
     const fetchsapre = useCallback(
     async (pageNo: number = 1, pageSize: number = 10): Promise<listReturnType> => {
           setLoading(true); 
            const res = await spareMenu({
             page: pageNo.toString(),
             per_page: pageSize.toString(),
           });
           setLoading(false);
           if (res.error) {
             showSnackbar(res.data.message || "failed to fetch the Spare List", "error");
             throw new Error("Unable to fetch the spare category");
           } else {
             return {
               data: res.data || [],
               currentPage: res?.pagination?.page || 0,
               pageSize: res?.pagination?.limit || 10,
               total: res?.pagination?.totalPages || 0,
             };
           }
         }, []
        )
        useEffect(() => {
    setLoading(true);
  }, [])





      return(
        <><div className="flex flex-col h-full" >
          <Table
                    refreshKey={refreshKey}
                    config={{
                      api: {
                        list: fetchsapre
                      },
                      header: {
                                    title: "Spare Menu",
                                    searchBar: false,
                                    columnFilter: true,
                                    actions: [
                                      <SidebarBtn
                                        key="name"
                                        href="/settings/manageAssets/spareMenu/add"
                                        leadingIcon="lucide:plus"
                                        label="Add"
                                        labelTw="hidden lg:block"
                                        isActive
                                      />,
                                    ],
                                  },
                                  footer: { nextPrevBtn: true, pagination: true },
                                              columns: [
                                                {
                                                  key: "osa_code", label: "Code",
                                                  render: (row: TableDataType) => (
                                                    <span className="font-semibold text-[#181D27] text-[14px]">
                                                      {row.osa_code}
                                                    </span>
                                                  ),
                                                },
                                                { key: "spare_category_name", label: "Name" },
                                               
                                                {
                                                  key: "status", label: "Status", render: (data: TableDataType) => (
                                                    <StatusBtn isActive={data.status && data.status.toString() === "1" ? true : false} />
                                                  )
                                                },
                                  
                                              ],
                                              // rowSelection: true,
                                             rowActions: [
                                          
              {
                icon: "lucide:edit-2",
                onClick: (data: TableDataType) => {
                router.push(`/settings/manageAssets/spareMenu/${data.uuid}`);
                },
              },
            ],
            pageSize: 5,
          }}
        />
            
        

        </div>
        </>
      );
    
}
