"use client";

import { useEffect, useState } from "react";
import ContainerCard from "@/app/components/containerCard";
// import { getPlanogramById } from "@/app/services/merchandiserApi";
import { useSnackbar } from "@/app/services/snackbarContext";
import { useLoading } from "@/app/services/loadingContext";
import { useParams } from "next/navigation";
import Loading from "@/app/components/Loading";

type Customer = {
  uuid?: string;
  osa_code?: string;
  owner_name?: string;
  business_name?: string;
};

type Merchandiser = {
  uuid?: string;
  osa_code?: string;
  name?: string;
};

type ShelfData = {
  uuid?: string;
  id?: number;
  code?: string;
  shelf_name?: string;
  customers?: Customer[];
  merchandisers?: Merchandiser[];
};

export const CustomerData = ({ data }: { data: any }) => {
  const item = data;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <ContainerCard>
          <h1 className="text-lg font-semibold text-gray-800 mb-3">
            Merchandiser Information
          </h1>
          {item?.merchendishers && item?.merchendishers.length > 0 ? (
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-gray-700 font-semibold">
                <tr>
                  <th className="text-left px-4 py-2 border-b">Code</th>
                  <th className="text-right px-4 py-2 border-b">Name</th>
                </tr>
              </thead>
              <tbody>
                {item?.merchendishers.map((merchandiser: Merchandiser, index: number) => (
                  <tr
                    key={index}
                    className="border-b-gray-300 border-b last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 text-left py-3">{merchandiser?.osa_code || "-"}</td>
                    <td className="px-4 text-right py-3">
                      {merchandiser?.name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">
              No merchandiser data available.
            </p>
          )}
        </ContainerCard>
      </div>

      <div className="flex-1">
        <ContainerCard>
          <h1 className="text-lg font-semibold text-gray-800 mb-3">
            Customer Information
          </h1>

          {item?.customers && item.customers.length > 0 ? (
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-gray-700 font-semibold">
                <tr>

                  <th className="text-left px-4 py-2 border-b">
                    Customer Code
                  </th>

                  <th className="text-right px-4 py-2 border-b">Owner Name</th>
                </tr>
              </thead>

              <tbody>
                {item?.customers.map((customer: Customer, index: number) => (
                  <tr
                    key={index}
                    className="border-b-gray-300 border-b last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 text-left py-3">
                      {customer?.osa_code || "-"}
                    </td>
                    <td className="px-4 text-right py-3">
                      {customer?.business_name || "-"}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">No customer data available.</p>
          )}
        </ContainerCard>
      </div>
    </div>
  );
};
