
import React, { useState } from 'react';
import SidebarBtn from "./dashboardSidebarBtn";
import Table from './customTable';

export default function ItemCellWithPopup({ details,title,title1 }: { details: any[],title?:string,title1?:string }) {
  const [showPopup, setShowPopup] = useState(false);
  if (!details || details.length === 0) return "-";
  const first = details[0];
  const rest = details.slice(1);
  const firstLabel = `${first.erp_code || ""}${first.erp_code && first.item_name ? " - " : ""}${first.item_name || ""}`;
  const restCount = rest.length;
    const columns = [
        {
            key: 'item',
            label: title1,
            render: (row: any) => (
                <span>{`${row.erp_code || ""}${row.erp_code && row.item_name ? " - " : ""}${row.item_name || ""}`}</span>
            ),
        },
    ];  
  return (
    <>
      <span className="mr-2">{firstLabel}</span>
      {restCount > 0 && (
        <span className="inline-flex items-center bg-gray-200 text-[#0070f3] rounded-full px-2 py-0.5 text-sm font-medium cursor-pointer hover:bg-gray-300"
          onClick={e => { e.stopPropagation(); setShowPopup(true); }}
        >
          {`+${restCount}`}
        </span>
      )}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] bg-[#f5f6fa]/80"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white rounded-lg p-4 min-w-[350px] max-h-[450px] w-fit h-fit shadow-lg flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-xl font-semibold mb-3">{title}</div>
            <Table
            config={{
                showNestedLoading:false,
                columns
            }}
            data={details}
             />
            {/* <ul
              className="flex-1 overflow-y-auto mb-0 p-0 list-none max-h-[325px]"
            >
              {rest.map((item: any, idx: number) => (
                <li className="text-base mb-2" key={idx}>
                  {`${item.erp_code || ""}${item.erp_code && item.item_name ? " - " : ""}${item.item_name || ""}`}
                </li>
              ))}
            </ul> */}
            <div className="flex justify-end mt-2">
              <SidebarBtn
                isActive
                onClick={() => setShowPopup(false)}
                label="Close"
                className="px-4 bg-[#0070f3] text-white rounded cursor-pointer"
                buttonTw="px-4 py-2"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
