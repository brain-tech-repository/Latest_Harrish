"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import StatusBtn from "@/app/components/statusBtn2";
import { chillerByUUID } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDate } from "@/app/(private)/(dashboard)/(master)/salesTeam/details/[uuid]/page";

type OptionObj = {
  id: number;
  name: string;
  code?: string;
};

type Chiller = {
  osa_code: string;
  sap_code: string;
  serial_number: string;
  acquisition: string | any;
  assets_type: string;

  // Nested API objects
  country: OptionObj | null;
  vendor: OptionObj | null;
  assets_category: OptionObj | null;
  model_number: OptionObj | null;
  manufacturer: OptionObj | null;
  branding: OptionObj | null;

  // Other fields
  trading_partner_number: number | string;
  capacity: string;
  manufacturing_year: string;
  remarks: string;
  status: { id: number; name: string };
};

const title = "Assets Details";

export default function ViewPage() {
  const params = useParams();
  const uuid = params?.uuid as string;

  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();
  const [chiller, setChiller] = useState<Chiller | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const res = await chillerByUUID(uuid);
      setLoading(false);

      if (res.error) {
        showSnackbar(res.data?.message || "Unable to fetch Assets Details", "error");
        return;
      }

      // API returns `vendor` not `vender`
      setChiller({
        ...res.data,
        vendor: res.data.vendor,
      });
    };

    fetchDetails();
  }, []);

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/assetsMaster" back>
          <Icon icon="lucide:arrow-left" width={24} />
        </Link>
        <h1 className="text-xl font-semibold mb-1">{title}</h1>
      </div>

      <ContainerCard className="w-full flex flex-col sm:flex-row items-center justify-between gap-[10px] md:gap-0">
        {/* profile details */}
        <div className="flex flex-col sm:flex-row items-center gap-[20px]">
          <div className="w-[80px] h-[80px] flex justify-center items-center rounded-full bg-[#E9EAEB]">
            <Icon
              icon="mdi:fridge-outline"
              width={40}
              className="text-[#535862] scale-[1.5]"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-[20px] font-semibold text-[#181D27] mb-[10px]">
              {chiller?.osa_code || ""}
            </h2>
            <span className="flex items-center text-[#414651] text-[16px]">
              <Icon
                icon="mdi:location"
                width={16}
                className="text-[#EA0A2A] mr-[5px]"
              />
              <span>
                {chiller?.country?.name}
              </span>
              {/* <span className="flex justify-center p-[10px] sm:p-0 sm:inline-block mt-[10px] sm:mt-0 sm:ml-[10px]">
                                          <StatusBtn status="active" />
                                      </span> */}
            </span>
          </div>
        </div>
        {/* action buttons */}
        <div className="flex items-center gap-[10px]">
          {chiller?.status?.name ? (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
        ${chiller.status.name.toLowerCase() === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
                }`}
            >
              {chiller.status.name}
            </span>
          ) : (
            "-"
          )}
        </div>

      </ContainerCard>


      <div className="flex grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-[10px]">

        {/* ---------- Basic Information ---------- */}
        <ContainerCard className="w-full">
          <KeyValueData
            title="Assets Basic Information"
            data={[
              // { key: "OSA Code", value: chiller?.osa_code },
              { key: "SAP Code", value: chiller?.sap_code },
              { key: "Serial Number", value: chiller?.serial_number },
              { key: "Asset Category", value: chiller?.assets_category?.name },
              { key: "Model Number", value: chiller?.model_number?.name },
              { key: "Assets Type", value: chiller?.assets_type },
            ]}
          />
        </ContainerCard>

        {/* ---------- Acquisition & Vendor ---------- */}
        <ContainerCard className="w-full">
          <KeyValueData
            title="Acquisition and Vendor Information"
            data={[
              { key: "Acquisition", value: formatDate(chiller?.acquisition) },
              { key: "Vendor", value: chiller?.vendor?.name },
              { key: "Manufacturer", value: chiller?.manufacturer?.name },
              // { key: "Country", value: chiller?.country?.name },
            ]}
          />
        </ContainerCard>

        {/* ---------- Other Info ---------- */}
        <ContainerCard className="w-full">
          <KeyValueData
            title="Other Information"
            data={[
              { key: "Branding", value: chiller?.branding?.name },
              { key: "Trading Partner Number", value: chiller?.trading_partner_number },
              { key: "Capacity", value: chiller?.capacity },
              { key: "Manufacturing Year", value: chiller?.manufacturing_year },
              { key: "Remarks", value: chiller?.remarks },
            ]}
          />
        </ContainerCard>

      </div>
    </>
  );
}
